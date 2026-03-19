/**
 * Community API — Classified Ads and Community Events
 * Per PRD 12 Community + Condo Control unique features
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createAdSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  categoryId: z.string().uuid().optional(),
  category: z.string().max(50).optional(),
  price: z.number().min(0).optional(),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'contact']).default('fixed'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'not_applicable']).optional(),
  contactMethod: z.array(z.enum(['in_app', 'phone', 'email'])).default(['in_app']),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().max(254).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const category = searchParams.get('category');
    const cursor = searchParams.get('cursor');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, status: 'active' };
    if (categoryId) where.categoryId = categoryId;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build findMany options with cursor or offset pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findOptions: Record<string, any> = {
      where,
      include: {
        images: { select: { id: true, filePath: true, sortOrder: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
    };

    if (cursor) {
      findOptions.cursor = { id: cursor };
      findOptions.skip = 1; // skip the cursor item itself
    } else {
      findOptions.skip = (page - 1) * pageSize;
    }

    const [ads, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.classifiedAd.findMany as any)(findOptions),
      prisma.classifiedAd.count({ where } as Parameters<typeof prisma.classifiedAd.count>[0]),
    ]);

    // Determine next cursor
    const lastAd = ads[ads.length - 1] as { id: string } | undefined;
    const hasMore = cursor ? ads.length === pageSize : page * pageSize < total;
    const nextCursor = hasMore && lastAd ? lastAd.id : null;

    return NextResponse.json({
      data: ads,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        nextCursor,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/community error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch ads' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createAdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // GAP 12.2 — Auto-set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ad = await (prisma.classifiedAd.create as any)({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        description: stripControlChars(stripHtml(input.description)),
        categoryId: input.categoryId || null,
        category: input.category || null,
        price: input.price ?? null,
        priceType: input.priceType,
        condition: input.condition || null,
        contactMethod: input.contactMethod,
        contactPhone: input.contactPhone || null,
        contactEmail: input.contactEmail || null,
        userId: auth.user.userId,
        status: 'active',
        expirationDate: expiresAt,
      },
    });

    return NextResponse.json({ data: ad, message: 'Ad posted.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/community error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to post ad' },
      { status: 500 },
    );
  }
}
