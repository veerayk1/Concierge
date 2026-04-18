/**
 * Noise Complaint API — Investigation & Tracking
 * Per GAP 3.2 — Complete noise complaint with all investigation fields
 *
 * GET  /api/v1/security/noise-complaints — List complaints with unit/floor filtering
 * POST /api/v1/security/noise-complaints — Create complaint with full investigation fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';

const NOISE_NATURES_LIST = [
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
] as const;

const SUSPECT_CONTACT_LIST = [
  'Home Phone',
  'Work Phone',
  'Other Phone',
  'At the door',
  'No one home',
] as const;

const createNoiseComplaintSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().max(500).nullable().optional(),
  complainantFloor: z.string().max(100).nullable().optional(),
  suspectFloor: z.string().max(100).nullable().optional(),
  natureOfComplaint: z.array(z.string()).min(1),
  complainantFloorNoticeable: z.string().nullable().optional(),
  suspectFloorNoticeable: z.string().nullable().optional(),
  noiseDuration: z.string().max(200).nullable().optional(),
  noiseDurationAssessment: z.string().nullable().optional(),
  noiseDegreeAssessment: z.string().nullable().optional(),
  suspectContactedBy: z.array(z.string()).optional(),
  complainantAdvised: z.string().nullable().optional(),
  noiseLogDetails: z.string().max(5000).nullable().optional(),
  resolutionStatus: z.string().max(50).optional(),
});

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

const SUSPECT_CONTACT_OPTIONS = [
  'Home Phone',
  'Work Phone',
  'Other Phone',
  'At the door',
  'No one home',
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
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
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

    const parsed = createNoiseComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const {
      propertyId,
      title,
      complainantFloor,
      suspectFloor,
      natureOfComplaint,
      complainantFloorNoticeable,
      suspectFloorNoticeable,
      noiseDuration,
      noiseDurationAssessment,
      noiseDegreeAssessment,
      suspectContactedBy,
      complainantAdvised,
      noiseLogDetails,
      resolutionStatus,
    } = parsed.data;

    const validNatures = natureOfComplaint.filter((n: string) => NOISE_NATURES.includes(n));
    if (validNatures.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid complaint natures. Valid: ${NOISE_NATURES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const sanitize = (s: string | null | undefined) => (s ? stripControlChars(stripHtml(s)) : null);

    const sanitizedTitle = sanitize(title);
    const sanitizedFloor1 = sanitize(complainantFloor);
    const sanitizedFloor2 = sanitize(suspectFloor);
    const sanitizedDuration = sanitize(noiseDuration);
    const sanitizedDetails = sanitize(noiseLogDetails);

    const contactedBy: string[] = Array.isArray(suspectContactedBy)
      ? suspectContactedBy.filter((c: string) => SUSPECT_CONTACT_OPTIONS.includes(c))
      : [];

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO noise_complaints (
        id, "propertyId", title,
        "complainantFloor", "suspectFloor",
        "natureOfComplaint",
        "complainantFloorNoticeable", "suspectFloorNoticeable",
        "noiseDuration", "noiseDurationAssessment", "noiseDegreeAssessment",
        "suspectContactedBy", "complainantAdvised",
        "noiseLogDetails", "resolutionStatus",
        "createdById", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${propertyId}::uuid,
        ${sanitizedTitle},
        ${sanitizedFloor1},
        ${sanitizedFloor2},
        ${validNatures},
        ${complainantFloorNoticeable || null},
        ${suspectFloorNoticeable || null},
        ${sanitizedDuration},
        ${noiseDurationAssessment || null},
        ${noiseDegreeAssessment || null},
        ${contactedBy},
        ${complainantAdvised || null},
        ${sanitizedDetails},
        ${resolutionStatus || 'pending'},
        ${auth.user.userId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      { data: result[0], message: 'Noise complaint created successfully.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/security/noise-complaints error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create noise complaint',
        detail: String(error),
      },
      { status: 500 },
    );
  }
}
