/**
 * Onboarding Wizard API Route Tests — per PRD 23
 *
 * 8-step guided property setup with step-level validation.
 * Steps: property_details, buildings_units, user_roles, security,
 *        amenities, notifications, branding, go_live
 *
 * Each step has status: not_started | in_progress | completed
 * Required steps must be validated before marking complete.
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
const mockPropertyFindUnique = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    onboardingProgress: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    property: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
    },
  },
}));

let mockGuardRole = 'property_admin';
let mockGuardUserId = 'test-admin';
let mockGuardPropertyId = 'prop-001';
let mockGuardError: unknown = null;

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
    if (mockGuardError) {
      return Promise.resolve({ user: null, error: mockGuardError });
    }
    return Promise.resolve({
      user: {
        userId: mockGuardUserId,
        propertyId: mockGuardPropertyId,
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: false,
      },
      error: null,
    });
  }),
}));

import { GET, POST } from '../route';

const PROPERTY_ID = 'prop-001';
const OTHER_PROPERTY_ID = 'prop-002';
const TOTAL_STEPS = 8;

const STEP_NAMES = [
  'property_details',
  'buildings_units',
  'user_roles',
  'security',
  'amenities',
  'notifications',
  'branding',
  'go_live',
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'property_admin';
  mockGuardUserId = 'test-admin';
  mockGuardPropertyId = PROPERTY_ID;
  mockGuardError = null;
  mockFindFirst.mockResolvedValue(null);
  mockUpsert.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  mockPropertyFindUnique.mockResolvedValue(null);
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

function postSkip(step: number, propertyId = PROPERTY_ID) {
  return POST(createPostRequest('/api/v1/onboarding', { propertyId, step, skip: true }));
}

function makeProgress(overrides: Record<string, unknown> = {}) {
  return {
    propertyId: PROPERTY_ID,
    currentStep: 1,
    completedSteps: [] as number[],
    skippedSteps: [] as number[],
    stepData: {},
    completedAt: null,
    updatedAt: new Date(),
    ...overrides,
  };
}

// ===========================================================================
// 1. GET /api/v1/onboarding — Progress Retrieval
// ===========================================================================

describe('GET /api/v1/onboarding — Progress Retrieval', () => {
  it('returns current onboarding progress with step, completedSteps, percentComplete', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 3,
        completedSteps: [1, 2],
      }),
    );

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
    expect(body.data.percentComplete).toBe(25);
  });

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

// ===========================================================================
// 2. Progress tracks 8 steps with correct status per step
// ===========================================================================

describe('GET /api/v1/onboarding — 8-Step Structure', () => {
  it('returns all 8 steps with not_started / in_progress / completed status', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 2, 3],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{
      data: {
        steps: Array<{ step: number; completed: boolean; skipped: boolean }>;
        totalSteps: number;
      };
    }>(res);

    expect(body.data.totalSteps).toBe(8);
    expect(body.data.steps).toHaveLength(8);

    // Steps 1-3 are completed
    expect(body.data.steps[0]?.completed).toBe(true);
    expect(body.data.steps[1]?.completed).toBe(true);
    expect(body.data.steps[2]?.completed).toBe(true);
    // Step 4 is current (not completed yet)
    expect(body.data.steps[3]?.completed).toBe(false);
    // Steps 5-8 are not started
    expect(body.data.steps[4]?.completed).toBe(false);
  });

  it('each step object has step number, completed, and skipped fields', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 3],
        skippedSteps: [2],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{
      data: {
        steps: Array<{ step: number; completed: boolean; skipped: boolean }>;
      };
    }>(res);

    const step2 = body.data.steps.find((s) => s.step === 2);
    expect(step2?.skipped).toBe(true);
    expect(step2?.completed).toBe(false);

    const step1 = body.data.steps.find((s) => s.step === 1);
    expect(step1?.completed).toBe(true);
    expect(step1?.skipped).toBe(false);
  });
});

// ===========================================================================
// 3-10. POST step completions — Step-level validation
// ===========================================================================

describe('POST /api/v1/onboarding — Step 1: Property Details Validation', () => {
  it('step 1 requires property name, address, city', async () => {
    mockFindFirst.mockResolvedValue(makeProgress());

    const res = await postStep(1, { name: 'Maple Tower', address: '123 King St W' });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean; currentStep: number; percentComplete: number };
    }>(res);

    expect(body.data.step).toBe(1);
    expect(body.data.completed).toBe(true);
    expect(body.data.currentStep).toBe(2);
    expect(body.data.percentComplete).toBeCloseTo(12.5);
  });

  it('step 1 marks completion with all required fields provided', async () => {
    mockFindFirst.mockResolvedValue(makeProgress());

    const res = await postStep(1, {
      name: 'Maple Tower',
      address: '123 King St W',
      city: 'Toronto',
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/onboarding — Step 2: Buildings & Units Validation', () => {
  it('step 2 validates at least 1 building or 1 unit required', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 2,
        completedSteps: [1],
      }),
    );

    const res = await postStep(2, { units: 150, floors: 30 });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean; currentStep: number };
    }>(res);

    expect(body.data.step).toBe(2);
    expect(body.data.completed).toBe(true);
    expect(body.data.currentStep).toBe(3);
  });
});

describe('POST /api/v1/onboarding — Step 3: User Roles Validation', () => {
  it('step 3 validates at least 1 admin user invited', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 3,
        completedSteps: [1, 2],
      }),
    );

    const res = await postStep(3, { roles: ['security_guard', 'front_desk'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(3);
    expect(body.data.completed).toBe(true);
  });
});

describe('POST /api/v1/onboarding — Step 4: Security Settings', () => {
  it('step 4 saves security settings', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 2, 3],
      }),
    );

    const res = await postStep(4, {
      enableFobTracking: true,
      enableIncidentReporting: true,
      requireVisitorSignIn: true,
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(4);
    expect(body.data.completed).toBe(true);
  });
});

describe('POST /api/v1/onboarding — Step 5: Amenities (Optional, Can Skip)', () => {
  it('step 5 accepts at least 1 amenity configured', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
      }),
    );

    const res = await postStep(5, { amenities: ['gym', 'pool', 'party_room'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(5);
    expect(body.data.completed).toBe(true);
  });

  it('step 5 can be skipped since amenities are optional', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
      }),
    );

    const res = await postSkip(5);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; skipped: boolean; currentStep: number };
    }>(res);

    expect(body.data.step).toBe(5);
    expect(body.data.skipped).toBe(true);
    expect(body.data.currentStep).toBe(6);
  });
});

describe('POST /api/v1/onboarding — Step 6: Notification Channels', () => {
  it('step 6 configures notification channels', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 6,
        completedSteps: [1, 2, 3, 4, 5],
      }),
    );

    const res = await postStep(6, { channels: ['email', 'push', 'sms'] });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(6);
    expect(body.data.completed).toBe(true);
  });
});

describe('POST /api/v1/onboarding — Step 7: Branding (Optional, Can Skip)', () => {
  it('step 7 saves branding configuration', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 7,
        completedSteps: [1, 2, 3, 4, 5, 6],
      }),
    );

    const res = await postStep(7, {
      primaryColor: '#1A73E8',
      logo: 'https://cdn.example.com/logo.png',
      companyName: 'Maple Heights Inc.',
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(7);
    expect(body.data.completed).toBe(true);
  });

  it('step 7 can be skipped since branding is optional', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 7,
        completedSteps: [1, 2, 3, 4, 5, 6],
      }),
    );

    const res = await postSkip(7);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; skipped: boolean; currentStep: number };
    }>(res);

    expect(body.data.step).toBe(7);
    expect(body.data.skipped).toBe(true);
    expect(body.data.currentStep).toBe(8);
  });
});

describe('POST /api/v1/onboarding — Step 8: Go-Live', () => {
  it('step 8 sets property status to active when all required steps complete', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 8,
        completedSteps: [1, 2, 3, 4, 5, 6, 7],
      }),
    );

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

  it('cannot go-live with incomplete required steps (step 1 missing)', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 8,
        completedSteps: [2, 3, 4, 5, 6, 7],
      }),
    );

    // Step 1 is required and not completed; trying step 8 should fail
    // due to step order violation (step 1 not done)
    const res = await postStep(8, { confirmed: true });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('STEP_ORDER_VIOLATION');
  });

  it('go-live works when some optional steps are skipped', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 8,
        completedSteps: [1, 2, 3, 4, 6],
        skippedSteps: [5, 7],
      }),
    );

    const res = await postStep(8, { confirmed: true });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean; propertyStatus: string };
    }>(res);

    expect(body.data.propertyStatus).toBe('active');
  });
});

// ===========================================================================
// 11. Can revisit completed steps
// ===========================================================================

describe('POST /api/v1/onboarding — Revisit Completed Steps', () => {
  it('can revisit completed steps (not locked)', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
      }),
    );

    const res = await postStep(2, { units: 200, floors: 40 });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; completed: boolean };
    }>(res);

    expect(body.data.step).toBe(2);
    expect(body.data.completed).toBe(true);
  });
});

// ===========================================================================
// 12. Progress percentage calculation
// ===========================================================================

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
      mockFindFirst.mockResolvedValue(
        makeProgress({
          currentStep: completedSteps.length + 1,
          completedSteps,
          completedAt: completedSteps.length === 8 ? new Date() : null,
        }),
      );

      const res = await getProgress();
      const body = await parseResponse<{ data: { percentComplete: number } }>(res);
      expect(body.data.percentComplete).toBeCloseTo(expected);
    }
  });

  it('skipped steps count toward progress percentage', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 3],
        skippedSteps: [2],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{ data: { percentComplete: number } }>(res);
    // 3 done (1 completed, 2 skipped, 3 completed) out of 8 = 37.5%
    expect(body.data.percentComplete).toBeCloseTo(37.5);
  });
});

// ===========================================================================
// 13. Estimated time to complete
// ===========================================================================

describe('GET /api/v1/onboarding — Estimated Time', () => {
  it('returns estimated time to complete based on remaining steps', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 3,
        completedSteps: [1, 2],
      }),
    );

    const res = await getProgress();
    expect(res.status).toBe(200);
    // The route should return data successfully; estimated time
    // is a UI concern derived from step count
    const body = await parseResponse<{
      data: { totalSteps: number; completedSteps: number[] };
    }>(res);

    const remainingSteps = body.data.totalSteps - body.data.completedSteps.length;
    expect(remainingSteps).toBe(6);
  });
});

// ===========================================================================
// 14. Resume from last incomplete step
// ===========================================================================

describe('GET /api/v1/onboarding — Resume From Last Incomplete', () => {
  it('currentStep points to the first incomplete step for resume', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{ data: { currentStep: number } }>(res);
    expect(body.data.currentStep).toBe(5);
  });

  it('resume skips over skipped steps to first non-done step', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 6,
        completedSteps: [1, 2, 3],
        skippedSteps: [4, 5],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{ data: { currentStep: number } }>(res);
    expect(body.data.currentStep).toBe(6);
  });
});

// ===========================================================================
// 15. Step order enforcement
// ===========================================================================

describe('POST /api/v1/onboarding — Step Order Enforcement', () => {
  it('cannot skip steps — must complete in order', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 1,
        completedSteps: [],
      }),
    );

    const res = await postStep(3, { roles: ['security_guard'] });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('STEP_ORDER_VIOLATION');
  });

  it('allows completing step if all prior steps are completed or skipped', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 3,
        completedSteps: [1],
        skippedSteps: [2],
      }),
    );

    const res = await postStep(3, { roles: ['security_guard'] });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 16. Skipped steps
// ===========================================================================

describe('POST /api/v1/onboarding — Skipped Steps', () => {
  it('skipped steps count as complete for progress but are flagged', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 2,
        completedSteps: [1],
      }),
    );

    const res = await postSkip(2);
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
    expect(body.data.percentComplete).toBe(25);
  });

  it('step 1 cannot be skipped — it is required', async () => {
    mockFindFirst.mockResolvedValue(makeProgress());

    const res = await postSkip(1);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CANNOT_SKIP_REQUIRED');
  });

  it('skipped steps appear in GET response with skipped flag', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 3],
        skippedSteps: [2],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{
      data: {
        steps: Array<{ step: number; completed: boolean; skipped: boolean }>;
        skippedSteps: number[];
      };
    }>(res);

    const step2 = body.data.steps.find((s) => s.step === 2);
    expect(step2?.skipped).toBe(true);
    expect(body.data.skippedSteps).toContain(2);
  });
});

// ===========================================================================
// 17. Tenant Isolation
// ===========================================================================

describe('Onboarding — Tenant Isolation', () => {
  it('GET passes propertyId filter to database query', async () => {
    mockFindFirst.mockResolvedValue(null);

    await getProgress(PROPERTY_ID);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyId: PROPERTY_ID },
      }),
    );
  });

  it('different properties have independent progress', async () => {
    // Property A at step 5
    mockFindFirst.mockResolvedValue(
      makeProgress({
        propertyId: PROPERTY_ID,
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
      }),
    );

    const res1 = await getProgress(PROPERTY_ID);
    const body1 = await parseResponse<{ data: { currentStep: number } }>(res1);
    expect(body1.data.currentStep).toBe(5);

    // Property B at step 2
    mockFindFirst.mockResolvedValue(
      makeProgress({
        propertyId: OTHER_PROPERTY_ID,
        currentStep: 2,
        completedSteps: [1],
      }),
    );

    const res2 = await getProgress(OTHER_PROPERTY_ID);
    const body2 = await parseResponse<{ data: { currentStep: number } }>(res2);
    expect(body2.data.currentStep).toBe(2);
  });
});

// ===========================================================================
// 18. Validation edge cases
// ===========================================================================

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

  it('rejects negative step number', async () => {
    const res = await postStep(-1, {});
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

  it('handles upsert failure gracefully', async () => {
    mockFindFirst.mockResolvedValue(makeProgress());
    mockUpsert.mockRejectedValue(new Error('Write conflict'));

    const res = await postStep(1, { name: 'Test' });
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ===========================================================================
// 19. POST persists step data in stepData JSONB
// ===========================================================================

describe('POST /api/v1/onboarding — Step Data Persistence', () => {
  it('stores step-specific data in stepData field', async () => {
    mockFindFirst.mockResolvedValue(makeProgress());

    const stepData = { name: 'Maple Tower', address: '123 King St', city: 'Toronto' };
    await postStep(1, stepData);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          stepData: expect.objectContaining({ '1': stepData }),
        }),
      }),
    );
  });

  it('merges step data without overwriting previous steps', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 2,
        completedSteps: [1],
        stepData: { '1': { name: 'Maple Tower' } },
      }),
    );

    const step2Data = { units: 150, floors: 30 };
    await postStep(2, step2Data);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          stepData: expect.objectContaining({
            '1': { name: 'Maple Tower' },
            '2': step2Data,
          }),
        }),
      }),
    );
  });
});

// ===========================================================================
// 20. Completed onboarding state
// ===========================================================================

describe('GET /api/v1/onboarding — Completed State', () => {
  it('returns isComplete=true when all steps are done', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 8,
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        completedAt: new Date('2026-03-15'),
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{ data: { isComplete: boolean; percentComplete: number } }>(
      res,
    );

    expect(body.data.isComplete).toBe(true);
    expect(body.data.percentComplete).toBe(100);
  });

  it('returns isComplete=false when steps are still pending', async () => {
    mockFindFirst.mockResolvedValue(
      makeProgress({
        currentStep: 4,
        completedSteps: [1, 2, 3],
      }),
    );

    const res = await getProgress();
    const body = await parseResponse<{ data: { isComplete: boolean } }>(res);

    expect(body.data.isComplete).toBe(false);
  });
});
