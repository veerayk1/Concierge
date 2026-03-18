/**
 * Surveys API — per Condo Control research
 * Create and manage resident surveys
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createSurveySchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1).max(500),
        type: z.enum(['text', 'rating', 'multiple_choice', 'yes_no', 'scale']),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      }),
    )
    .min(1, 'At least one question is required')
    .max(50),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const surveys = await prisma.survey.findMany({
      where: { propertyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: surveys });
  } catch (error) {
    console.error('GET /api/v1/surveys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch surveys' },
      { status: 500 },
    );
  }
}

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
        questions: input.questions.map((q) => ({
          ...q,
          text: stripControlChars(stripHtml(q.text)),
          options: q.options?.map((o) => stripControlChars(stripHtml(o))),
        })),
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        isAnonymous: input.isAnonymous,
        status: 'draft',
        createdById: auth.user.userId,
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
