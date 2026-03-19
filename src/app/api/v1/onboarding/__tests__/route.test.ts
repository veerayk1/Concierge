/**
 * Onboarding Wizard API Route Tests — per PRD 23
 *
 * 8-step guided property setup. The first screen any paying customer sees.
 * Every step must be tested: property basics, building structure, roles,
 * amenities, notifications, event types, staff invites, and go-live activation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindFirst = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    onboardingProgress: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    property: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: 'prop-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST } from '../route';

const PROPERTY_ID = 'prop-001';
const TOTAL_STEPS = 8;

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no existing progress
  mockFindFirst.mockResolvedValue(null);
  mockUpsert.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgress(propertyId = PROPERTY_ID) {
  return GET(createGetRequest('/api/v1/onboarding', { searchParams: { propertyId } }));
}

function postStep(step: number, data: Record<string, unknown> = {}, propertyId = PROPERTY_ID) {
  return POST(createPostRequest('/api/v1/onboarding', { propertyId, step, data }));
}

// ---------------------------------------------------------------------------
// 1. GET returns current onboarding progress
// ---------------------------------------------------------------------------

describe('GET /api/v1/onboarding — Progress Retrieval', () => {
  it('returns current onboarding progress (step, completedSteps, percentComplete)', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 3,
      completedSteps: [1, 2],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
      updatedAt: new Date(),
    });

    const res = await getProgress();
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        currentStep: number;
        completedSteps: number[];
        percentComplete: number;
      };
    }>(res);

    expect(body.data.currentStep).toBe(3);
    expect(body.data.completedSteps).toEqual([1, 2]);
    expect(body.data.percentComplete).toBe(25); // 2/8 * 100 = 25
  });

  // ---------------------------------------------------------------------------
  // 2. New property starts at step 1 with 0% completion
  // ---------------------------------------------------------------------------

  it('new property starts at step 1 with 0% completion', async () => {
    mockFindFirst.mockResolvedValue(null);

    const res = await getProgress();
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        currentStep: number;
        completedSteps: number[];
        percentComplete: number;
        totalSteps: number;
      };
    }>(res);

    expect(body.data.currentStep).toBe(1);
    expect(body.data.completedSteps).toEqual([]);
    expect(body.data.percentComplete).toBe(0);
    expect(body.data.totalSteps).toBe(TOTAL_STEPS);
  });

  it('requires propertyId query parameter', async () => {
    const res = await GET(createGetRequest('/api/v1/onboarding'));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 3–9. POST step completions (steps 1–7)
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding — Step Completion', () => {
  // 3. POST step 1: property basics (name, address)
  it('step 1: property basics (name, address) marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 1,
      completedSteps: [],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(1, { name: 'Maple Tower', address: '123 King St W' });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean; currentStep: number; percentComplete: number };
    }>(res);

    expect(body.data.step).toBe(1);
    expect(body.data.completed).toBe(true);
    expect(body.data.currentStep).toBe(2);
    expect(body.data.percentComplete).toBeCloseTo(12.5); // 1/8 * 100
  });

  // 4. POST step 2: building structure (units, floors)
  it('step 2: building structure (units, floors) marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 2,
      completedSteps: [1],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(2, { units: 150, floors: 30 });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean; currentStep: number };
    }>(res);

    expect(body.data.step).toBe(2);
    expect(body.data.completed).toBe(true);
    expect(body.data.currentStep).toBe(3);
  });

  // 5. POST step 3: role configuration
  it('step 3: role configuration marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 3,
      completedSteps: [1, 2],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(3, { roles: ['security_guard', 'front_desk'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(3);
    expect(body.data.completed).toBe(true);
  });

  // 6. POST step 4: amenity setup
  it('step 4: amenity setup marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 4,
      completedSteps: [1, 2, 3],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(4, { amenities: ['gym', 'pool', 'party_room'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(4);
    expect(body.data.completed).toBe(true);
  });

  // 7. POST step 5: notification preferences
  it('step 5: notification preferences marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(5, { channels: ['email', 'push'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(5);
    expect(body.data.completed).toBe(true);
  });

  // 8. POST step 6: event types configuration
  it('step 6: event types configuration marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 6,
      completedSteps: [1, 2, 3, 4, 5],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(6, { eventTypes: ['visitor', 'package', 'incident'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(6);
    expect(body.data.completed).toBe(true);
  });

  // 9. POST step 7: invite staff users
  it('step 7: invite staff users marks step complete', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 7,
      completedSteps: [1, 2, 3, 4, 5, 6],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(7, {
      staff: [{ email: 'guard@building.com', role: 'security_guard' }],
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(7);
    expect(body.data.completed).toBe(true);
  });

  // 10. POST step 8: review and activate → property status=active
  it('step 8: review and activate marks all complete, property status=active', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 8,
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await postStep(8, { confirmed: true });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        step: number;
        completed: boolean;
        propertyStatus: string;
        percentComplete: number;
      };
    }>(res);

    expect(body.data.step).toBe(8);
    expect(body.data.completed).toBe(true);
    expect(body.data.propertyStatus).toBe('active');
    expect(body.data.percentComplete).toBe(100);

    // Verify property was activated via prisma update
    expect(mockUpdate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 11. Can revisit completed steps (not locked)
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding — Revisit Completed Steps', () => {
  it('can revisit completed steps (not locked)', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 5,
      completedSteps: [1, 2, 3, 4],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    // Revisit step 2 which is already complete
    const res = await postStep(2, { units: 200, floors: 40 });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(2);
    expect(body.data.completed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12. Progress percentage calculated correctly
// ---------------------------------------------------------------------------

describe('GET /api/v1/onboarding — Percentage Calculation', () => {
  it('progress percentage calculated correctly (completedSteps/totalSteps * 100)', async () => {
    const testCases = [
      { completedSteps: [], expected: 0 },
      { completedSteps: [1], expected: 12.5 },
      { completedSteps: [1, 2], expected: 25 },
      { completedSteps: [1, 2, 3], expected: 37.5 },
      { completedSteps: [1, 2, 3, 4], expected: 50 },
      { completedSteps: [1, 2, 3, 4, 5, 6, 7, 8], expected: 100 },
    ];

    for (const { completedSteps, expected } of testCases) {
      mockFindFirst.mockResolvedValue({
        propertyId: PROPERTY_ID,
        currentStep: completedSteps.length + 1,
        completedSteps,
        skippedSteps: [],
        stepData: {},
        completedAt: completedSteps.length === 8 ? new Date() : null,
        updatedAt: new Date(),
      });

      const res = await getProgress();
      const body = await parseResponse<{ data: { percentComplete: number } }>(res);
      expect(body.data.percentComplete).toBeCloseTo(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Cannot skip steps (must complete in order, or mark as skipped)
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding — Step Order Enforcement', () => {
  it('cannot skip steps — must complete in order', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 1,
      completedSteps: [],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    // Try to complete step 3 without completing steps 1 and 2
    const res = await postStep(3, { roles: ['security_guard'] });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('STEP_ORDER_VIOLATION');
  });

  it('allows completing step if all prior steps are completed or skipped', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 3,
      completedSteps: [1],
      skippedSteps: [2],
      stepData: {},
      completedAt: null,
    });

    // Step 2 was skipped, so step 3 should be allowed
    const res = await postStep(3, { roles: ['security_guard'] });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 14. Skipped steps count as complete for progress but are flagged
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding — Skipped Steps', () => {
  it('skipped steps count as complete for progress but are flagged', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 2,
      completedSteps: [1],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    // Skip step 2 by posting with skip flag
    const res = await POST(
      createPostRequest('/api/v1/onboarding', {
        propertyId: PROPERTY_ID,
        step: 2,
        skip: true,
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        step: number;
        skipped: boolean;
        currentStep: number;
        percentComplete: number;
      };
    }>(res);

    expect(body.data.step).toBe(2);
    expect(body.data.skipped).toBe(true);
    expect(body.data.currentStep).toBe(3);
    // Skipped counts toward progress: 2/8 = 25% (step 1 completed + step 2 skipped)
    expect(body.data.percentComplete).toBe(25);
  });

  it('skipped steps appear in GET response with skipped flag', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 4,
      completedSteps: [1, 3],
      skippedSteps: [2],
      stepData: {},
      completedAt: null,
      updatedAt: new Date(),
    });

    const res = await getProgress();
    const body = await parseResponse<{
      data: {
        steps: Array<{ step: number; completed: boolean; skipped: boolean }>;
        skippedSteps: number[];
      };
    }>(res);

    // Step 2 should be flagged as skipped
    const step2 = body.data.steps.find((s) => s.step === 2);
    expect(step2?.skipped).toBe(true);
    expect(body.data.skippedSteps).toContain(2);
  });

  it('step 1 cannot be skipped — it is required', async () => {
    mockFindFirst.mockResolvedValue({
      propertyId: PROPERTY_ID,
      currentStep: 1,
      completedSteps: [],
      skippedSteps: [],
      stepData: {},
      completedAt: null,
    });

    const res = await POST(
      createPostRequest('/api/v1/onboarding', {
        propertyId: PROPERTY_ID,
        step: 1,
        skip: true,
      }),
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CANNOT_SKIP_REQUIRED');
  });
});

// ---------------------------------------------------------------------------
// Edge cases and validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/onboarding — Validation', () => {
  it('rejects missing propertyId', async () => {
    const res = await POST(createPostRequest('/api/v1/onboarding', { step: 1, data: {} }));
    expect(res.status).toBe(400);
  });

  it('rejects missing step number', async () => {
    const res = await POST(
      createPostRequest('/api/v1/onboarding', { propertyId: PROPERTY_ID, data: {} }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid step number (0)', async () => {
    const res = await postStep(0, {});
    expect(res.status).toBe(400);
  });

  it('rejects invalid step number (9)', async () => {
    const res = await postStep(9, {});
    expect(res.status).toBe(400);
  });

  it('handles database errors without leaking internals', async () => {
    mockFindFirst.mockRejectedValue(new Error('Connection refused'));

    const res = await getProgress();
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });
});
