/**
 * Community API — Classified Ads and Community Events
 * Per PRD 12 Community
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createAdSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().min(1).max(50),
  price: z.number().min(0).optional(),
  isFree: z.boolean().default(false),
  contactMethod: z.enum(['message', 'phone', 'email']).default('message'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null, status: 'active' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [ads, total] = await Promise.all([
      prisma.classifiedAd.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.classifiedAd.count({ where }),
    ]);

    return NextResponse.json({
      data: ads,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
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

    const ad = await prisma.classifiedAd.create({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        description: input.description,
        category: input.category,
        price: input.isFree ? null : (input.price ?? null),
        isFree: input.isFree,
        contactMethod: input.contactMethod,
        authorId: auth.user.userId,
        status: 'active',
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
