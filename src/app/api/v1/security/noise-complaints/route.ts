/**
 * Noise Complaint API — Investigation & Tracking
 * Per GAP 3.2 — Noise complaint specialized fields with 14 nature types
 *
 * GET  /api/v1/security/noise-complaints — List complaints with unit/floor filtering
 * POST /api/v1/security/noise-complaints — Create complaint with nature types and investigation fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// The 14 nature-of-complaint types from P1 research
const NOISE_NATURES = [
  'Drop on Floor',
  'Loud Music',
  'Smoking Hallways',
  'Smoking in Suite',
  'Hallway Noise',
  'Piano Playing',
  'Dog Barking',
  'Cooking Odors',
  'Children Playing',
  'Walking/Banging',
  'Party',
  'Talking',
  'Construction',
  'Other',
];

// ---------------------------------------------------------------------------
// GET /api/v1/security/noise-complaints
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['security_guard', 'front_desk', 'property_admin', 'property_manager', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const offset = (page - 1) * pageSize;

    const complaints = await prisma.$queryRaw<any[]>`
      SELECT * FROM noise_complaints
      WHERE "propertyId" = ${propertyId}::uuid AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM noise_complaints
      WHERE "propertyId" = ${propertyId}::uuid AND "deletedAt" IS NULL
    `;

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      data: complaints,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/security/noise-complaints error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch noise complaints' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/security/noise-complaints — Create complaint
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['security_guard', 'front_desk', 'property_admin', 'property_manager', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      propertyId,
      complainantFloor,
      suspectFloor,
      noiseDuration,
      noiseVolume,
      natureOfComplaint,
      suspectContactMethod,
      counselingNotes,
      resolutionStatus,
    } = body;

    if (!propertyId || !natureOfComplaint || !Array.isArray(natureOfComplaint) || natureOfComplaint.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'propertyId and natureOfComplaint (array) are required',
        },
        { status: 400 },
      );
    }

    // Validate nature types
    const validNatures = natureOfComplaint.filter((n: string) => NOISE_NATURES.includes(n));
    if (validNatures.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid complaint natures. Valid types: ${NOISE_NATURES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const sanitizedFloor1 = complainantFloor ? stripControlChars(stripHtml(complainantFloor)) : null;
    const sanitizedFloor2 = suspectFloor ? stripControlChars(stripHtml(suspectFloor)) : null;
    const sanitizedDuration = noiseDuration ? stripControlChars(stripHtml(noiseDuration)) : null;
    const sanitizedMethod = suspectContactMethod ? stripControlChars(stripHtml(suspectContactMethod)) : null;
    const sanitizedNotes = counselingNotes ? stripControlChars(stripHtml(counselingNotes)) : null;
    const vol = noiseVolume ? parseInt(String(noiseVolume), 10) : null;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO noise_complaints (
        id, "propertyId", "complainantFloor", "suspectFloor",
        "noiseDuration", "noiseVolume", "natureOfComplaint",
        "suspectContactMethod", "counselingNotes", "resolutionStatus",
        "createdById", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${propertyId}::uuid,
        ${sanitizedFloor1},
        ${sanitizedFloor2},
        ${sanitizedDuration},
        ${vol},
        ${validNatures},
        ${sanitizedMethod},
        ${sanitizedNotes},
        ${resolutionStatus || 'pending'},
        ${auth.user.userId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        data: result[0],
        message: 'Noise complaint created successfully.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/security/noise-complaints error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create noise complaint', detail: String(error) },
      { status: 500 },
    );
  }
}
