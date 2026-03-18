/**
 * Announcements API — List & Create
 * Per PRD 09 Communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
  priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  channels: z.array(z.enum(['web', 'email', 'sms', 'push'])).min(1, 'Select at least one channel'),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  scheduledFor: z.string().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      data: announcements,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/announcements error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch announcements' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        body: input.body,
        priority: input.priority,
        channels: input.channels,
        status: input.status,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        categoryId: input.categoryId || null,
        authorId: 'demo-user',
        publishedAt: input.status === 'published' ? new Date() : null,
      },
    });

    return NextResponse.json(
      { data: announcement, message: 'Announcement created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/announcements error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create announcement' },
      { status: 500 },
    );
  }
}
