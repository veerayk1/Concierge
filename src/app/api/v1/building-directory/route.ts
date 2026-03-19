/**
 * Building Directory API — List & Create
 * Centralized directory of staff, vendors, and their contact information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createStaffProfileSchema } from '@/schemas/building-directory';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/building-directory — List directory entries
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type');
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId };

    if (type) where.type = type;
    if (role) where.role = role;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      (prisma as any).directoryEntry.findMany({
        where,
        orderBy: { firstName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (prisma as any).directoryEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/building-directory error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch directory' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/building-directory — Create directory entry
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createStaffProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const entry = await (prisma as any).directoryEntry.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId,
        type: 'staff',
        role: input.role,
        department: stripControlChars(stripHtml(input.department)),
        email: input.email,
        phone: input.phone || null,
        bio: input.bio ? stripControlChars(stripHtml(input.bio)) : null,
        photoUrl: input.photoUrl || null,
        scheduleNotes: input.scheduleNotes
          ? stripControlChars(stripHtml(input.scheduleNotes))
          : null,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json({ data: entry, message: `Directory entry created.` }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/building-directory error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create directory entry' },
      { status: 500 },
    );
  }
}
