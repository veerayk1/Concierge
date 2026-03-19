/**
 * Survey Detail API — GET, PATCH, POST (submit response)
 * Manage individual surveys: view results, update status, submit responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

/** Valid status transitions for surveys */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['closed'],
  closed: ['archived'],
  archived: [],
};

const updateSurveySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'active', 'closed', 'archived']).optional(),
  expiryDate: z.string().optional(),
  anonymous: z.boolean().optional(),
  visibleToOwners: z.boolean().optional(),
  visibleToTenants: z.boolean().optional(),
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
    .min(1)
    .max(50)
    .optional(),
});

const submitResponseSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.array(z.string())]),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// GET /api/v1/surveys/:id — Survey detail with questions and aggregate results
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Survey not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        ...survey,
        questionCount: survey.questions.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/surveys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch survey' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/surveys/:id — Update survey (status transitions, edit content)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSurveySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Survey not found' },
        { status: 404 },
      );
    }

    // Only admins or the creator can update surveys
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if (survey.createdById !== auth.user.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only edit your own surveys' },
        { status: 403 },
      );
    }

    const input = parsed.data;

    // Validate status transition
    if (input.status) {
      const allowed = VALID_TRANSITIONS[survey.status] || [];
      if (!allowed.includes(input.status)) {
        return NextResponse.json(
          {
            error: 'INVALID_TRANSITION',
            message: `Cannot transition from ${survey.status} to ${input.status}`,
          },
          { status: 400 },
        );
      }
    }

    // Content edits are only allowed in draft status
    const isContentEdit = input.title || input.description !== undefined || input.questions;
    if (isContentEdit && survey.status !== 'draft') {
      return NextResponse.json(
        { error: 'LOCKED', message: 'Survey content can only be edited in draft status' },
        { status: 400 },
      );
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.title) updateData.title = stripControlChars(stripHtml(input.title));
    if (input.description !== undefined) {
      updateData.description = input.description
        ? stripControlChars(stripHtml(input.description))
        : null;
    }
    if (input.status) updateData.status = input.status;
    if (input.expiryDate !== undefined) {
      updateData.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    }
    if (input.anonymous !== undefined) updateData.anonymous = input.anonymous;
    if (input.visibleToOwners !== undefined) updateData.visibleToOwners = input.visibleToOwners;
    if (input.visibleToTenants !== undefined) updateData.visibleToTenants = input.visibleToTenants;

    // If questions are being replaced (draft only), delete old and create new
    if (input.questions && survey.status === 'draft') {
      await prisma.surveyQuestion.deleteMany({ where: { surveyId: id } });
      updateData.questions = {
        create: input.questions.map((q, idx) => ({
          questionText: stripControlChars(stripHtml(q.questionText)),
          questionType: q.questionType,
          isRequired: q.isRequired,
          options: q.options || null,
          config: q.config || null,
          sortOrder: idx,
        })),
      };
    }

    const updated = await prisma.survey.update({
      where: { id },
      data: updateData,
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/surveys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update survey' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/surveys/:id — Submit a survey response
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = submitResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Fetch survey with questions
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Survey not found' },
        { status: 404 },
      );
    }

    // Only active surveys accept responses
    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'SURVEY_CLOSED', message: 'This survey is not currently accepting responses' },
        { status: 400 },
      );
    }

    // Check expiry
    if (survey.expiryDate && new Date(survey.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: 'SURVEY_EXPIRED', message: 'This survey has expired' },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Validate that required questions have been answered
    const answeredQuestionIds = new Set(input.answers.map((a) => a.questionId));
    const requiredQuestions = survey.questions.filter((q) => q.isRequired);
    const missingRequired = requiredQuestions.filter((q) => !answeredQuestionIds.has(q.id));

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: 'MISSING_REQUIRED',
          message: `Missing required answers for: ${missingRequired.map((q) => q.questionText).join(', ')}`,
          missingQuestionIds: missingRequired.map((q) => q.id),
        },
        { status: 400 },
      );
    }

    // Validate all answered question IDs belong to this survey
    const surveyQuestionIds = new Set(survey.questions.map((q) => q.id));
    const invalidIds = input.answers.filter((a) => !surveyQuestionIds.has(a.questionId));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: 'INVALID_QUESTIONS',
          message: 'Some question IDs do not belong to this survey',
        },
        { status: 400 },
      );
    }

    // Increment response count on the survey (lightweight tracking without a SurveyResponse model)
    const updated = await prisma.survey.update({
      where: { id },
      data: { responseCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        data: {
          surveyId: id,
          respondentId: survey.anonymous ? null : auth.user.userId,
          submittedAt: new Date().toISOString(),
          responseCount: updated.responseCount,
        },
        message: 'Response submitted.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/surveys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to submit response' },
      { status: 500 },
    );
  }
}
