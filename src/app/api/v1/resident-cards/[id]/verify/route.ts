/**
 * Resident Card QR Verification — Security Quick Lookup
 *
 * When security scans a resident's QR code, this endpoint instantly
 * confirms identity and access level. A failed verification means
 * the card is invalid, expired, or revoked — security must deny entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const verifySchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
});

// ---------------------------------------------------------------------------
// POST /api/v1/resident-cards/:id/verify — Verify QR code
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const card = await prisma.residentCard.findUnique({ where: { id } });

    if (!card) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Resident card not found' },
        { status: 404 },
      );
    }

    // Check card is active
    if (card.status !== 'active') {
      return NextResponse.json(
        {
          data: {
            verified: false,
            reason: 'CARD_NOT_ACTIVE',
            cardStatus: card.status,
          },
        },
        { status: 401 },
      );
    }

    // Check QR code matches
    if (card.qrCode !== parsed.data.qrCode) {
      return NextResponse.json(
        {
          data: {
            verified: false,
            reason: 'QR_MISMATCH',
          },
        },
        { status: 401 },
      );
    }

    // Check expiry
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          data: {
            verified: false,
            reason: 'CARD_EXPIRED',
          },
        },
        { status: 401 },
      );
    }

    // All checks passed
    return NextResponse.json({
      data: {
        verified: true,
        residentName: card.residentName,
        accessLevel: card.accessLevel,
        unitId: card.unitId,
        propertyId: card.propertyId,
        photoUrl: card.photoUrl,
        expiresAt: card.expiresAt,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/resident-cards/:id/verify error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to verify resident card' },
      { status: 500 },
    );
  }
}
