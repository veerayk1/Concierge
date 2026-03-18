/**
 * Onboarding Wizard API — per PRD 23
 * 8-step guided property setup
 */

import { NextRequest, NextResponse } from 'next/server';

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
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // In production, track completion per property
    return NextResponse.json({
      data: {
        steps: ONBOARDING_STEPS.map((s) => ({
          ...s,
          completed: false,
          completedAt: null,
        })),
        currentStep: 1,
        isComplete: false,
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
    const body = await request.json();
    const { propertyId, step, completed } = body;

    if (!propertyId || !step) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId and step are required' },
        { status: 400 },
      );
    }

    // TODO: Store progress in database
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
