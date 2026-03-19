/**
 * Onboarding Wizard API — per PRD 23
 *
 * 8-step guided property setup backed by Prisma.
 *
 * GET  — returns current progress (step, completedSteps, percentComplete, steps[])
 * POST — complete or skip a step; step 8 activates the property
 * PATCH — (legacy) toggle a step's completion state
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Step Definitions (PRD 23 — 8 steps)
// ---------------------------------------------------------------------------

const ONBOARDING_STEPS = [
  { step: 1, name: 'Property Basics', description: 'Name, address, timezone', required: true },
  {
    step: 2,
    name: 'Building Structure',
    description: 'Units and floors',
    required: false,
  },
  { step: 3, name: 'Role Configuration', description: 'Define staff roles', required: false },
  { step: 4, name: 'Amenity Setup', description: 'Configure amenity spaces', required: false },
  {
    step: 5,
    name: 'Notification Preferences',
    description: 'Choose notification channels',
    required: false,
  },
  {
    step: 6,
    name: 'Event Types',
    description: 'Configure security event types',
    required: false,
  },
  { step: 7, name: 'Invite Staff', description: 'Send staff invitations', required: false },
  { step: 8, name: 'Review & Activate', description: 'Review and go live', required: false },
] as const;

const TOTAL_STEPS = ONBOARDING_STEPS.length;

/** Steps that cannot be skipped (must be completed). */
const REQUIRED_STEP_NUMBERS = new Set<number>(
  ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.step),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentComplete(completedSteps: number[], skippedSteps: number[]): number {
  const done = new Set([...completedSteps, ...skippedSteps]);
  return (done.size / TOTAL_STEPS) * 100;
}

/**
 * Determine the next current step — the first step that is neither
 * completed nor skipped, or TOTAL_STEPS if everything is done.
 */
function nextCurrentStep(completedSteps: number[], skippedSteps: number[]): number {
  const done = new Set([...completedSteps, ...skippedSteps]);
  const next = ONBOARDING_STEPS.find((s) => !done.has(s.step));
  return next ? next.step : TOTAL_STEPS;
}

/**
 * Returns true when every step before `step` is either completed or skipped.
 * Step 1 always passes (no prior steps).
 */
function priorStepsSatisfied(
  step: number,
  completedSteps: number[],
  skippedSteps: number[],
): boolean {
  const done = new Set([...completedSteps, ...skippedSteps]);
  for (let i = 1; i < step; i++) {
    if (!done.has(i)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// GET /api/v1/onboarding?propertyId=...
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const progress = await prisma.onboardingProgress.findFirst({
      where: { propertyId },
    });

    const completedSteps: number[] = progress?.completedSteps ?? [];
    const skippedSteps: number[] = (progress as { skippedSteps?: number[] })?.skippedSteps ?? [];
    const currentStep = progress?.currentStep ?? 1;
    const isComplete = progress?.completedAt !== null && progress?.completedAt !== undefined;
    const pct = percentComplete(completedSteps, skippedSteps);

    return NextResponse.json({
      data: {
        steps: ONBOARDING_STEPS.map((s) => ({
          ...s,
          completed: completedSteps.includes(s.step),
          skipped: skippedSteps.includes(s.step),
          completedAt: completedSteps.includes(s.step) ? (progress?.updatedAt ?? null) : null,
        })),
        currentStep,
        completedSteps,
        skippedSteps,
        percentComplete: pct,
        totalSteps: TOTAL_STEPS,
        isComplete,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/onboarding error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch onboarding' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/onboarding  { propertyId, step, data?, skip? }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, step, data, skip } = body as {
      propertyId?: string;
      step?: number;
      data?: Record<string, unknown>;
      skip?: boolean;
    };

    // --- Validation ---------------------------------------------------------

    if (!propertyId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (step === undefined || step === null) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'step is required' },
        { status: 400 },
      );
    }

    if (typeof step !== 'number' || step < 1 || step > TOTAL_STEPS) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `step must be between 1 and ${TOTAL_STEPS}`,
        },
        { status: 400 },
      );
    }

    // --- Cannot skip required steps ----------------------------------------

    if (skip && REQUIRED_STEP_NUMBERS.has(step)) {
      return NextResponse.json(
        {
          error: 'CANNOT_SKIP_REQUIRED',
          message: `Step ${step} is required and cannot be skipped.`,
        },
        { status: 400 },
      );
    }

    // --- Fetch existing progress -------------------------------------------

    const existing = await prisma.onboardingProgress.findFirst({
      where: { propertyId },
    });

    const currentCompleted: number[] = existing?.completedSteps ?? [];
    const currentSkipped: number[] = (existing as { skippedSteps?: number[] })?.skippedSteps ?? [];

    // --- Step order enforcement (unless revisiting a completed step) --------

    const isRevisit = currentCompleted.includes(step) || currentSkipped.includes(step);

    if (!isRevisit && !priorStepsSatisfied(step, currentCompleted, currentSkipped)) {
      return NextResponse.json(
        {
          error: 'STEP_ORDER_VIOLATION',
          message: `Complete or skip all steps before step ${step} first.`,
        },
        { status: 400 },
      );
    }

    // --- Build updated arrays -----------------------------------------------

    let updatedCompleted: number[];
    let updatedSkipped: number[];

    if (skip) {
      // Mark as skipped (remove from completed if it was previously completed)
      updatedCompleted = currentCompleted.filter((s) => s !== step);
      updatedSkipped = currentSkipped.includes(step)
        ? currentSkipped
        : [...currentSkipped, step].sort((a, b) => a - b);
    } else {
      // Mark as completed (remove from skipped if it was previously skipped)
      updatedCompleted = currentCompleted.includes(step)
        ? currentCompleted
        : [...currentCompleted, step].sort((a, b) => a - b);
      updatedSkipped = currentSkipped.filter((s) => s !== step);
    }

    const newCurrentStep = nextCurrentStep(updatedCompleted, updatedSkipped);
    const pct = percentComplete(updatedCompleted, updatedSkipped);

    // --- Merge step data into the stepData JSONB ----------------------------

    const existingStepData = (existing?.stepData as Record<string, unknown> | null) ?? {};
    const mergedStepData: Prisma.InputJsonValue = (
      data ? { ...existingStepData, [String(step)]: data } : existingStepData
    ) as Prisma.InputJsonValue;

    // --- Check if all steps done (for completedAt) -------------------------

    const allDone = new Set([...updatedCompleted, ...updatedSkipped]);
    const allStepsDone = ONBOARDING_STEPS.every((s) => allDone.has(s.step));

    // --- Persist ------------------------------------------------------------

    await prisma.onboardingProgress.upsert({
      where: { propertyId },
      update: {
        completedSteps: updatedCompleted,
        skippedSteps: updatedSkipped,
        currentStep: newCurrentStep,
        stepData: mergedStepData,
        completedAt: allStepsDone ? new Date() : null,
      },
      create: {
        propertyId,
        completedSteps: updatedCompleted,
        skippedSteps: updatedSkipped,
        currentStep: newCurrentStep,
        stepData: mergedStepData,
        completedAt: allStepsDone ? new Date() : null,
      },
    });

    // --- Step 8 special: activate the property ------------------------------

    let propertyStatus: string | undefined;

    if (step === TOTAL_STEPS && !skip && allStepsDone) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isActive: true },
      });
      propertyStatus = 'active';
    }

    // --- Response -----------------------------------------------------------

    return NextResponse.json({
      message: skip ? `Step ${step} skipped.` : `Step ${step} completed.`,
      data: {
        step,
        completed: !skip,
        skipped: !!skip,
        currentStep: newCurrentStep,
        percentComplete: pct,
        ...(propertyStatus ? { propertyStatus } : {}),
      },
    });
  } catch (error) {
    console.error('POST /api/v1/onboarding error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update onboarding' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/onboarding  (legacy — toggle step completion)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, step, completed } = body;

    if (!propertyId || !step) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId and step are required' },
        { status: 400 },
      );
    }

    const existing = await prisma.onboardingProgress.findFirst({
      where: { propertyId },
    });

    const currentCompleted: number[] = existing?.completedSteps ?? [];
    let updatedCompleted: number[];

    if (completed) {
      updatedCompleted = currentCompleted.includes(step)
        ? currentCompleted
        : [...currentCompleted, step].sort((a, b) => a - b);
    } else {
      updatedCompleted = currentCompleted.filter((s: number) => s !== step);
    }

    const updatedSkipped: number[] = (existing as { skippedSteps?: number[] })?.skippedSteps ?? [];
    const newCurrent = nextCurrentStep(updatedCompleted, updatedSkipped);

    const requiredSteps = ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.step);
    const allRequiredDone = requiredSteps.every((s) => updatedCompleted.includes(s));

    await prisma.onboardingProgress.upsert({
      where: { propertyId },
      update: {
        completedSteps: updatedCompleted,
        currentStep: newCurrent,
        completedAt: allRequiredDone ? new Date() : null,
      },
      create: {
        propertyId,
        completedSteps: updatedCompleted,
        currentStep: newCurrent,
        completedAt: allRequiredDone ? new Date() : null,
        stepData: {},
      },
    });

    return NextResponse.json({
      message: `Step ${step} ${completed ? 'completed' : 'uncompleted'}.`,
      data: { step, completed },
    });
  } catch (error) {
    console.error('PATCH /api/v1/onboarding error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update onboarding' },
      { status: 500 },
    );
  }
}
