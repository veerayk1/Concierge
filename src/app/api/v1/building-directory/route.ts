/**
 * Building Directory API — List & Create
 * Centralized directory of management, security, maintenance, amenities,
 * emergency contacts, utilities, and common areas for a property.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const DIRECTORY_CATEGORIES = [
  'management',
  'security',
  'maintenance',
  'amenity',
  'emergency',
  'utility',
  'common_area',
] as const;

const createEntrySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.enum(DIRECTORY_CATEGORIES),
  phone: z.string().min(1).max(50),
  email: z.string().email().max(254).optional(),
  location: z.string().max(200).optional(),
  hours: z.string().max(200).optional(),
  contactPerson: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

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
    const category = searchParams.get('category');
    const query = searchParams.get('query') || searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 100);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };

    if (type) where.type = type;
    if (role) where.role = role;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (category) where.department = { contains: category, mode: 'insensitive' };
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
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
    const parsed = createEntrySchema.safeParse(body);

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
        type: input.category === 'emergency' ? 'vendor' : 'staff',
        firstName: stripControlChars(stripHtml(input.name)),
        lastName: '',
        role: input.category,
        department: input.category,
        email: input.email || null,
        phone: input.phone,
        bio: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        scheduleNotes: input.hours ? stripControlChars(stripHtml(input.hours)) : null,
        specialty: input.location ? stripControlChars(stripHtml(input.location)) : null,
        isActive: true,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json({ data: entry, message: 'Directory entry created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/building-directory error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create directory entry' },
      { status: 500 },
    );
  }
}
