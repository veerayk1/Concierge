/**
 * Classified Ads API — List & Create
 * Resident marketplace for buying, selling, and giving away items
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createAdSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().uuid().optional(),
  category: z.string().max(50).optional(),
  price: z.number().min(0).default(0),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'contact']).default('fixed'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'not_applicable']).optional(),
  contactMethod: z.array(z.enum(['in_app', 'phone', 'email'])).default(['in_app']),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().max(254).optional(),
  /** GAP 12.1 — Residents must accept marketplace terms before posting */
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the marketplace terms' }),
  }),
});

// ---------------------------------------------------------------------------
// GET /api/v1/classifieds — List classified ads with filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const freeOnly = searchParams.get('freeOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId };

    // Default to active ads unless explicitly filtered
    where.status = status || 'active';

    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (freeOnly) where.priceType = 'free';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [ads, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.classifiedAd.findMany as any)({
        where,
        include: {
          images: { select: { id: true, filePath: true, sortOrder: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.classifiedAd.count({ where } as Parameters<typeof prisma.classifiedAd.count>[0]),
    ]);

    // Enrich with photo count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = (ads as any[]).map((ad: any) => ({
      ...ad,
      photoCount: ad.images?.length ?? 0,
    }));

    return NextResponse.json({
      data: enriched,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/classifieds error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch classified ads' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/classifieds — Create a classified ad
// ---------------------------------------------------------------------------

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

    // Auto-set expiration to 30 days from now
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
        price: input.price,
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
    console.error('POST /api/v1/classifieds error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to post classified ad' },
      { status: 500 },
    );
  }
}
