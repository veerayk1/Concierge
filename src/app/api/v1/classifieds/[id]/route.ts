/**
 * Classified Ad Detail API — GET, PATCH, DELETE
 * View, update, mark as sold, renew, or remove a classified ad
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

const updateAdSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  price: z.number().min(0).optional(),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'contact']).optional(),
  category: z.string().max(50).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'not_applicable']).optional(),
  contactMethod: z.array(z.enum(['in_app', 'phone', 'email'])).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().max(254).optional(),
  // Status actions
  status: z.enum(['active', 'sold', 'expired', 'archived']).optional(),
  // Renew flag — extends expiration by 30 days
  renew: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/classifieds/:id — Ad detail with images
// ---------------------------------------------------------------------------

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

    // Increment view count
    await prisma.classifiedAd.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      data: {
        ...ad,
        photoCount: ad.images?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/classifieds/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch ad' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/classifieds/:id — Update ad, mark as sold, or renew
// ---------------------------------------------------------------------------

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

    // Ownership check: only author or admin can edit
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if ((ad as { userId: string }).userId !== auth.user.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only edit your own ads' },
        { status: 403 },
      );
    }

    const input = parsed.data;

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

    // Renew: extend expiration by 30 days and increment renewal count
    if (input.renew) {
      const currentStatus = (ad as { status: string }).status;
      if (currentStatus !== 'active' && currentStatus !== 'expired') {
        return NextResponse.json(
          { error: 'INVALID_RENEW', message: 'Only active or expired ads can be renewed' },
          { status: 400 },
        );
      }
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      updateData.expirationDate = newExpiry;
      updateData.renewalCount = { increment: 1 };
      updateData.status = 'active';
    }

    const updated = await prisma.classifiedAd.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/classifieds/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update ad' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/classifieds/:id — Soft-delete (archive) ad
// ---------------------------------------------------------------------------

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

    // Ownership check: only author or admin can delete
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if ((ad as { userId: string }).userId !== auth.user.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only delete your own ads' },
        { status: 403 },
      );
    }

    // Parse optional removal reason from body
    let reason: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') {
        reason = stripControlChars(stripHtml(body.reason));
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
    console.error('DELETE /api/v1/classifieds/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete ad' },
      { status: 500 },
    );
  }
}
