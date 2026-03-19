/**
 * Onboarding Wizard API — per PRD 23
 * 8-step guided property setup backed by Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

const ONBOARDING_STEPS = [
  { step: 1, name: 'Property Details', description: 'Name, address, timezone', required: true },
  {
    step: 2,
    name: 'Buildings & Units',
    description: 'Add buildings and import units',
    required: true,
  },
  { step: 3, name: 'Roles & Staff', description: 'Create staff accounts', required: true },
  { step: 4, name: 'Event Types', description: 'Configure security event types', required: false },
  { step: 5, name: 'Amenities', description: 'Set up amenity booking', required: false },
  {
    step: 6,
    name: 'Notification Templates',
    description: 'Customize email and push templates',
    required: false,
  },
  { step: 7, name: 'Branding', description: 'Logo and color scheme', required: false },
  { step: 8, name: 'Go Live', description: 'Review and activate', required: true },
];

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

    // Fetch persisted progress for this property
    const progress = await prisma.onboardingProgress.findFirst({
      where: { propertyId },
    });

    const completedSteps = progress?.completedSteps ?? [];
    const currentStep = progress?.currentStep ?? 1;
    const isComplete = progress?.completedAt !== null && progress?.completedAt !== undefined;

    return NextResponse.json({
      data: {
        steps: ONBOARDING_STEPS.map((s) => ({
          ...s,
          completed: completedSteps.includes(s.step),
          completedAt: completedSteps.includes(s.step) ? (progress?.updatedAt ?? null) : null,
        })),
        currentStep,
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

    // Fetch existing progress to merge completedSteps
    const existing = await prisma.onboardingProgress.findFirst({
      where: { propertyId },
    });

    const currentCompleted = existing?.completedSteps ?? [];
    let updatedCompleted: number[];

    if (completed) {
      // Add step if not already present
      updatedCompleted = currentCompleted.includes(step)
        ? currentCompleted
        : [...currentCompleted, step].sort((a, b) => a - b);
    } else {
      // Remove step
      updatedCompleted = currentCompleted.filter((s) => s !== step);
    }

    // Determine next current step (first incomplete step, or last step)
    const nextCurrentStep =
      ONBOARDING_STEPS.find((s) => !updatedCompleted.includes(s.step))?.step ??
      ONBOARDING_STEPS.length;

    // Check if all required steps are done
    const requiredSteps = ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.step);
    const allRequiredDone = requiredSteps.every((s) => updatedCompleted.includes(s));

    await prisma.onboardingProgress.upsert({
      where: { propertyId },
      update: {
        completedSteps: updatedCompleted,
        currentStep: nextCurrentStep,
        completedAt: allRequiredDone ? new Date() : null,
      },
      create: {
        propertyId,
        completedSteps: updatedCompleted,
        currentStep: nextCurrentStep,
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
