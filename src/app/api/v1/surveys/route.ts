/**
 * Surveys API — List & Create
 * Create and manage resident surveys, polls, and feedback forms
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createSurveySchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['poll', 'survey', 'feedback']).default('survey'),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1).max(500),
        questionType: z.enum([
          'multiple_choice',
          'checkbox',
          'rating',
          'free_text',
          'ranking',
          'yes_no',
        ]),
        isRequired: z.boolean().default(false),
        options: z.any().optional(),
        config: z.any().optional(),
      }),
    )
    .min(1, 'At least one question is required')
    .max(50),
  expiryDate: z.string().optional(),
  anonymous: z.boolean().default(false),
  visibleToOwners: z.boolean().default(true),
  visibleToTenants: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// GET /api/v1/surveys — List surveys with filtering and pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
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
    if (type) where.status = { not: undefined }; // type filter mapped below
    if (status) where.status = status;

    // The Prisma schema doesn't have a `type` column — store type in description prefix
    // or use a convention. For now, filter by status only since type isn't in the schema.
    // Type filtering can be extended when the schema supports it.

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        include: {
          questions: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.survey.count({ where }),
    ]);

    // Enrich with question count and response count
    const enriched = surveys.map((s) => ({
      ...s,
      questionCount: s.questions.length,
    }));

    return NextResponse.json({
      data: enriched,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/surveys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch surveys' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/surveys — Create survey
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createSurveySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const survey = await prisma.survey.create({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        anonymous: input.anonymous,
        visibleToOwners: input.visibleToOwners,
        visibleToTenants: input.visibleToTenants,
        status: 'draft',
        createdById: auth.user.userId,
        questions: {
          create: input.questions.map((q, idx) => ({
            questionText: stripControlChars(stripHtml(q.questionText)),
            questionType: q.questionType,
            isRequired: q.isRequired,
            options: q.options || null,
            config: q.config || null,
            sortOrder: idx,
          })),
        },
      },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ data: survey, message: 'Survey created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/surveys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create survey' },
      { status: 500 },
    );
  }
}
