/**
 * Resident Card Detail — Get, Update status, Delete (revoke)
 *
 * Handles individual card lookups (with optional passport mode
 * for comprehensive resident profile) and status changes
 * (suspend, reactivate, report lost with replacement, revoke).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCardNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RC-${code}`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const patchCardSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked', 'lost', 'expired']).optional(),
  action: z.enum(['suspend', 'reactivate', 'report_lost', 'replace']).optional(),
  revokedReason: z.string().max(500).optional(),
  replaceLost: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/resident-cards/:id — Card detail or passport
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isPassport = searchParams.get('passport') === 'true';

    const card = (await prisma.residentCard.findUnique({
      where: { id },
      include: {
        property: {
          select: { name: true },
        },
      },
    })) as Record<string, unknown> | null;

    if (!card || card.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Resident card not found' },
        { status: 404 },
      );
    }

    // In passport mode, include the resident name, unit, and card type
    const responseData: Record<string, unknown> = {
      ...card,
      cardNumber: card.qrCode,
      cardType: card.designTemplate,
    };

    // Passport mode enriches with additional resident data
    if (isPassport) {
      responseData.isPassportView = true;
      // Additional resident data (emergency contacts, vehicles, pets)
      // would be resolved via resident lookup in production
    }

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('GET /api/v1/resident-cards/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch resident card' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/resident-cards/:id — Update card status
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = patchCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const card = await prisma.residentCard.findUnique({ where: { id } });
    if (!card || card.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Resident card not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;

    // Handle action-based updates
    if (input.action === 'suspend') {
      if (card.status !== 'active') {
        return NextResponse.json(
          { error: 'INVALID_STATE', message: 'Only active cards can be suspended' },
          { status: 400 },
        );
      }
      const updated = await prisma.residentCard.update({
        where: { id },
        data: { status: 'revoked', revokedReason: input.revokedReason || 'suspended' },
      });
      return NextResponse.json({
        data: updated,
        message: 'Card suspended.',
      });
    }

    if (input.action === 'reactivate') {
      if (card.status === 'active') {
        return NextResponse.json(
          { error: 'ALREADY_ACTIVE', message: 'Card is already active' },
          { status: 400 },
        );
      }
      const updated = await prisma.residentCard.update({
        where: { id },
        data: { status: 'active', revokedAt: null, revokedReason: null },
      });
      return NextResponse.json({
        data: updated,
        message: 'Card reactivated.',
      });
    }

    if (input.action === 'report_lost' || (input.status === 'lost' && !input.replaceLost)) {
      const updated = await prisma.residentCard.update({
        where: { id },
        data: {
          status: 'lost',
          revokedAt: new Date(),
          revokedReason: input.revokedReason || 'reported lost',
        },
      });
      return NextResponse.json({
        data: updated,
        message: 'Card reported as lost.',
      });
    }

    // Prevent double-revoke
    if (input.status === 'revoked' && card.status === 'revoked') {
      return NextResponse.json(
        { error: 'ALREADY_REVOKED', message: 'Card is already revoked' },
        { status: 400 },
      );
    }

    // Replace lost card: deactivate old, generate new in a transaction
    if ((input.status === 'lost' || input.action === 'replace') && input.replaceLost) {
      const result = await prisma.$transaction(async (tx) => {
        const oldCard = await tx.residentCard.update({
          where: { id },
          data: {
            status: 'lost',
            revokedAt: new Date(),
            revokedReason: input.revokedReason || 'lost — replacement issued',
          },
        });

        const now = new Date();
        const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        const newCardNumber = generateCardNumber();

        const newCard = await tx.residentCard.create({
          data: {
            propertyId: card.propertyId,
            residentId: card.residentId,
            unitId: card.unitId,
            residentName: card.residentName,
            photoUrl: card.photoUrl,
            accessLevel: card.accessLevel,
            designTemplate: card.designTemplate,
            status: 'active',
            qrCode: newCardNumber,
            expiresAt,
            replacesCardId: id,
            issuedById: auth.user.userId,
          },
        });

        return { oldCard, newCard: { ...newCard, cardNumber: newCardNumber } };
      });

      return NextResponse.json({
        data: result,
        message: 'Card marked as lost. Replacement card issued.',
      });
    }

    // Standard status update (revoke, expire)
    const updated = await prisma.residentCard.update({
      where: { id },
      data: {
        status: input.status,
        revokedReason: input.revokedReason,
        revokedAt:
          input.status && ['revoked', 'lost'].includes(input.status) ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      data: updated,
      message: `Card status updated to ${input.status}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/resident-cards/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update resident card' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/resident-cards/:id — Revoke and soft-delete card
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const card = await prisma.residentCard.findUnique({ where: { id } });
    if (!card || card.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Resident card not found' },
        { status: 404 },
      );
    }

    await prisma.residentCard.update({
      where: { id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: 'Card revoked and deleted',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: { id },
      message: 'Resident card revoked successfully.',
    });
  } catch (error) {
    console.error('DELETE /api/v1/resident-cards/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to revoke resident card' },
      { status: 500 },
    );
  }
}
