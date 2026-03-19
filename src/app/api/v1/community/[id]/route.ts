/**
 * Community Classified Ad Detail — GET, PATCH, DELETE
 * Per PRD 12 Community + Condo Control features
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

/** Valid status transitions for classified ads */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['sold', 'expired', 'archived'],
  sold: ['archived'],
  expired: ['archived'],
  archived: [],
};

const updateAdSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(5000).optional(),
  price: z.number().min(0).optional(),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'contact']).optional(),
  category: z.string().max(50).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'not_applicable']).optional(),
  contactMethod: z.array(z.enum(['in_app', 'phone', 'email'])).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().max(254).optional(),
  status: z.enum(['draft', 'active', 'sold', 'expired', 'archived']).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const ad = await prisma.classifiedAd.findUnique({
      where: { id },
      include: {
        images: { select: { id: true, filePath: true, sortOrder: true } },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json({ data: ad });
  } catch (error) {
    console.error('GET /api/v1/community/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch ad' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateAdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const ad = await prisma.classifiedAd.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Ad not found' }, { status: 404 });
    }

    // Ownership check: only owner or admin can edit
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if ((ad as { userId: string }).userId !== auth.user.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only edit your own ads' },
        { status: 403 },
      );
    }

    // Validate status transition if status is being changed
    const input = parsed.data;
    if (input.status) {
      const currentStatus = (ad as { status: string }).status;
      const allowed = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(input.status)) {
        return NextResponse.json(
          {
            error: 'INVALID_TRANSITION',
            message: `Cannot transition from ${currentStatus} to ${input.status}`,
          },
          { status: 400 },
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.title) updateData.title = stripControlChars(stripHtml(input.title));
    if (input.description) updateData.description = stripControlChars(stripHtml(input.description));
    if (input.price !== undefined) updateData.price = input.price;
    if (input.priceType) updateData.priceType = input.priceType;
    if (input.category) updateData.category = input.category;
    if (input.condition) updateData.condition = input.condition;
    if (input.contactMethod) updateData.contactMethod = input.contactMethod;
    if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
    if (input.status) updateData.status = input.status;

    const updated = await prisma.classifiedAd.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/community/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update ad' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const ad = await prisma.classifiedAd.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Ad not found' }, { status: 404 });
    }

    // Ownership check: only owner or admin can delete
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if ((ad as { userId: string }).userId !== auth.user.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only delete your own ads' },
        { status: 403 },
      );
    }

    // Parse body for admin removal reason
    let reason: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') {
        reason = body.reason;
      }
    } catch {
      // No body is fine for regular deletes
    }

    // Soft-delete by archiving
    const updated = await prisma.classifiedAd.update({
      where: { id },
      data: {
        status: 'archived',
        ...(reason ? { rejectionReason: reason } : {}),
      },
    });

    return NextResponse.json({ data: updated, message: 'Ad removed.' });
  } catch (error) {
    console.error('DELETE /api/v1/community/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete ad' },
      { status: 500 },
    );
  }
}
