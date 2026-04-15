/**
 * AI-powered Features API Tests — Briefing, Suggestions, Analytics
 *
 * Rule-based intelligence that aggregates building data into
 * actionable briefings, smart suggestions, and health analytics.
 * No actual AI/ML — uses database aggregations and heuristics.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma mock — every model the AI routes query
// ---------------------------------------------------------------------------

const mockPackageCount = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageGroupBy = vi.fn();
const mockVisitorCount = vi.fn();
const mockMaintenanceCount = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockBookingCount = vi.fn();
const mockShiftHandoffFindFirst = vi.fn();
const mockAIBriefingFindFirst = vi.fn();
const mockAIBriefingCreate = vi.fn();
const mockBuildingHealthScoreFindFirst = vi.fn();
const mockBuildingHealthScoreCreate = vi.fn();
const mockAnnouncementCount = vi.fn();
const mockEventCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      count: (...args: unknown[]) => mockPackageCount(...args),
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      groupBy: (...args: unknown[]) => mockPackageGroupBy(...args),
    },
    visitorEntry: {
      count: (...args: unknown[]) => mockVisitorCount(...args),
    },
    maintenanceRequest: {
      count: (...args: unknown[]) => mockMaintenanceCount(...args),
      findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args),
    },
    booking: {
      count: (...args: unknown[]) => mockBookingCount(...args),
    },
    shiftHandoff: {
      findFirst: (...args: unknown[]) => mockShiftHandoffFindFirst(...args),
    },
    aIBriefing: {
      findFirst: (...args: unknown[]) => mockAIBriefingFindFirst(...args),
      create: (...args: unknown[]) => mockAIBriefingCreate(...args),
    },
    buildingHealthScore: {
      findFirst: (...args: unknown[]) => mockBuildingHealthScoreFindFirst(...args),
      create: (...args: unknown[]) => mockBuildingHealthScoreCreate(...args),
    },
    announcement: {
      count: (...args: unknown[]) => mockAnnouncementCount(...args),
    },
    event: {
      count: (...args: unknown[]) => mockEventCount(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Auth mock — configurable per test via setAuth
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers AFTER mocks are set up
import { GET as getBriefing, POST as postBriefing } from '../../ai/briefing/route';
import { GET as getSuggestions } from '../../ai/suggestions/route';
import { GET as getAnalytics } from '../../ai/analytics/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const USER_ID = 'user-staff-1';
const ROLE_ID = 'role-front-desk';

interface BriefingResponse {
  data: {
    briefing: {
      summary: string;
      sections: {
        packages: { unreleasedCount: number };
        visitors: { activeCount: number };
        maintenance: { openCount: number };
        approvals: { pendingCount: number };
        weather: { description: string };
        alerts: { count: number };
        handoff: { notes: string | null; flaggedItems: unknown[] };
      };
      generatedAt: string;
      cached: boolean;
    };
  };
}

interface SuggestionsResponse {
  data: {
    suggestions: Array<{
      type: string;
      priority: string;
      message: string;
      actionable: boolean;
    }>;
  };
}

interface AnalyticsResponse {
  data: {
    healthScore: number;
    trend: string;
    factors: Array<{
      name: string;
      score: number;
      weight: number;
    }>;
    packageDeliveryTrend: Array<{
      period: string;
      count: number;
      avgDeliveryHours: number;
    }>;
    maintenanceSlaCompliance: number;
  };
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: USER_ID,
      propertyId: PROPERTY_A,
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
      ...overrides,
    },
    error: null,
  });
}

function defaultMocks() {
  mockPackageCount.mockResolvedValue(0);
  mockPackageFindMany.mockResolvedValue([]);
  mockPackageGroupBy.mockResolvedValue([]);
  mockVisitorCount.mockResolvedValue(0);
  mockMaintenanceCount.mockResolvedValue(0);
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockBookingCount.mockResolvedValue(0);
  mockShiftHandoffFindFirst.mockResolvedValue(null);
  mockAIBriefingFindFirst.mockResolvedValue(null);
  mockAIBriefingCreate.mockResolvedValue({ id: 'briefing-1' });
  mockBuildingHealthScoreFindFirst.mockResolvedValue(null);
  mockBuildingHealthScoreCreate.mockResolvedValue({ id: 'health-1' });
  mockAnnouncementCount.mockResolvedValue(0);
  mockEventCount.mockResolvedValue(0);
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
  defaultMocks();
});

// ===========================================================================
// 1. GET /ai/briefing — generates a shift briefing summary
// ===========================================================================

describe('GET /ai/briefing — shift briefing summary', () => {
  it('returns a structured briefing with summary text', async () => {
    mockPackageCount.mockResolvedValue(5);
    mockVisitorCount.mockResolvedValue(3);
    mockMaintenanceCount.mockResolvedValue(2);
    mockBookingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<BriefingResponse>(res);
    expect(body.data.briefing).toBeDefined();
    expect(body.data.briefing.summary).toBeTruthy();
    expect(typeof body.data.briefing.summary).toBe('string');
    expect(body.data.briefing.generatedAt).toBeDefined();
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/ai/briefing');
    const res = await getBriefing(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// 2. Briefing includes: unreleased packages, active visitors, open
//    maintenance, pending approvals
// ===========================================================================

describe('Briefing data sections — operational metrics', () => {
  it('includes unreleased packages count', async () => {
    mockPackageCount.mockResolvedValue(12);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.packages.unreleasedCount).toBe(12);
  });

  it('includes active visitors count', async () => {
    mockVisitorCount.mockResolvedValue(8);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.visitors.activeCount).toBe(8);
  });

  it('includes open maintenance requests count', async () => {
    mockMaintenanceCount.mockResolvedValue(4);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.maintenance.openCount).toBe(4);
  });

  it('includes pending approvals count', async () => {
    mockBookingCount.mockResolvedValue(6);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.approvals.pendingCount).toBe(6);
  });
});

// ===========================================================================
// 3. Briefing includes: weather (placeholder), building alerts,
//    handoff notes from previous shift
// ===========================================================================

describe('Briefing data sections — contextual information', () => {
  it('includes weather placeholder', async () => {
    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.weather).toBeDefined();
    expect(body.data.briefing.sections.weather.description).toBeTruthy();
  });

  it('includes building alerts count', async () => {
    mockEventCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.alerts.count).toBe(2);
  });

  it('includes handoff notes from previous shift', async () => {
    mockShiftHandoffFindFirst.mockResolvedValue({
      notes: 'Elevator B is out of service. Repair scheduled for tomorrow.',
      flaggedItems: [{ description: 'Elevator B down', priority: 'high', unitNumber: null }],
      shiftType: 'morning',
      shiftDate: new Date(),
    });

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.handoff.notes).toBe(
      'Elevator B is out of service. Repair scheduled for tomorrow.',
    );
    expect(body.data.briefing.sections.handoff.flaggedItems).toHaveLength(1);
  });

  it('returns null handoff notes when no previous shift handoff exists', async () => {
    mockShiftHandoffFindFirst.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.sections.handoff.notes).toBeNull();
    expect(body.data.briefing.sections.handoff.flaggedItems).toEqual([]);
  });
});

// ===========================================================================
// 4. Briefing is role-aware: front desk vs security vs manager see
//    different summaries
// ===========================================================================

describe('Briefing is role-aware', () => {
  it('front desk briefing emphasizes packages and visitors', async () => {
    setAuth({ role: 'front_desk' });
    mockPackageCount.mockResolvedValue(15);
    mockVisitorCount.mockResolvedValue(7);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    // Front desk summary should mention packages and visitors
    expect(body.data.briefing.summary).toContain('package');
    expect(body.data.briefing.summary).toContain('visitor');
  });

  it('security briefing emphasizes alerts and incidents', async () => {
    setAuth({ role: 'security_guard' });
    mockEventCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    // Security summary should mention alerts/security
    expect(body.data.briefing.summary).toContain('alert');
  });

  it('manager briefing emphasizes maintenance SLA and approvals', async () => {
    setAuth({ role: 'property_manager' });
    mockMaintenanceCount.mockResolvedValue(10);
    mockBookingCount.mockResolvedValue(4);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    // Manager summary should mention maintenance and approvals
    expect(body.data.briefing.summary).toContain('maintenance');
    expect(body.data.briefing.summary).toContain('approval');
  });
});

// ===========================================================================
// 5. POST /ai/briefing/generate — force-regenerate the briefing
// ===========================================================================

describe('POST /ai/briefing — force regenerate', () => {
  it('generates a fresh briefing and stores it', async () => {
    mockPackageCount.mockResolvedValue(3);
    mockVisitorCount.mockResolvedValue(1);
    mockMaintenanceCount.mockResolvedValue(0);
    mockBookingCount.mockResolvedValue(0);

    mockAIBriefingCreate.mockResolvedValue({
      id: 'briefing-new',
      generatedAt: new Date(),
    });

    const req = createPostRequest('/api/v1/ai/briefing', {
      propertyId: PROPERTY_A,
    });
    const res = await postBriefing(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<BriefingResponse>(res);
    expect(body.data.briefing.cached).toBe(false);

    // Verify the briefing was persisted
    expect(mockAIBriefingCreate).toHaveBeenCalledTimes(1);
    const createArgs = mockAIBriefingCreate.mock.calls[0]![0];
    expect(createArgs.data.propertyId).toBe(PROPERTY_A);
    expect(createArgs.data.userId).toBe(USER_ID);
  });

  it('rejects POST without propertyId', async () => {
    const req = createPostRequest('/api/v1/ai/briefing', {});
    const res = await postBriefing(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 6. Briefing caching: returns cached version if less than 15 min old
// ===========================================================================

describe('Briefing caching', () => {
  it('returns cached briefing if less than 15 minutes old', async () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    mockAIBriefingFindFirst.mockResolvedValue({
      id: 'briefing-cached',
      content: JSON.stringify({
        summary: 'Cached briefing summary',
        sections: {
          packages: { unreleasedCount: 5 },
          visitors: { activeCount: 2 },
          maintenance: { openCount: 1 },
          approvals: { pendingCount: 0 },
          weather: { description: 'Sunny, 22C' },
          alerts: { count: 0 },
          handoff: { notes: null, flaggedItems: [] },
        },
      }),
      generatedAt: tenMinAgo,
      expiresAt: new Date(tenMinAgo.getTime() + 15 * 60 * 1000),
    });

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.cached).toBe(true);
    expect(body.data.briefing.summary).toBe('Cached briefing summary');

    // Should NOT have queried the operational data
    expect(mockPackageCount).not.toHaveBeenCalled();
    expect(mockVisitorCount).not.toHaveBeenCalled();
  });

  it('generates fresh briefing if cache is older than 15 minutes', async () => {
    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000);
    mockAIBriefingFindFirst.mockResolvedValue({
      id: 'briefing-stale',
      content: JSON.stringify({ summary: 'Stale briefing' }),
      generatedAt: twentyMinAgo,
      expiresAt: new Date(twentyMinAgo.getTime() + 15 * 60 * 1000),
    });

    mockPackageCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/ai/briefing', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getBriefing(req);
    const body = await parseResponse<BriefingResponse>(res);

    expect(body.data.briefing.cached).toBe(false);
    // Should have queried fresh data
    expect(mockPackageCount).toHaveBeenCalled();
  });
});

// ===========================================================================
// 7. Smart suggestions: GET /ai/suggestions — actionable recommendations
// ===========================================================================

describe('GET /ai/suggestions — actionable recommendations', () => {
  it('returns an array of suggestions', async () => {
    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<SuggestionsResponse>(res);
    expect(Array.isArray(body.data.suggestions)).toBe(true);
  });

  it('each suggestion has type, priority, message, and actionable flag', async () => {
    mockPackageGroupBy.mockResolvedValue([{ unitId: 'unit-302', _count: { id: 3 } }]);
    mockMaintenanceCount.mockResolvedValue(0);
    mockPackageCount.mockResolvedValue(10);

    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    const body = await parseResponse<SuggestionsResponse>(res);

    for (const suggestion of body.data.suggestions) {
      expect(suggestion.type).toBeTruthy();
      expect(suggestion.priority).toBeTruthy();
      expect(suggestion.message).toBeTruthy();
      expect(typeof suggestion.actionable).toBe('boolean');
    }
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/ai/suggestions');
    const res = await getSuggestions(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 8. Suggestions based on patterns: "3 packages for unit 302,
//    consider sending bulk reminder"
// ===========================================================================

describe('Suggestions — pattern-based bulk package reminder', () => {
  it('suggests bulk reminder when a unit has 3+ unreleased packages', async () => {
    mockPackageGroupBy.mockResolvedValue([
      { unitId: 'unit-302', _count: { id: 3 } },
      { unitId: 'unit-101', _count: { id: 1 } },
    ]);
    mockMaintenanceCount.mockResolvedValue(0);
    mockPackageCount.mockResolvedValue(4);

    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    const body = await parseResponse<SuggestionsResponse>(res);

    const bulkSuggestion = body.data.suggestions.find((s) => s.type === 'bulk_package_reminder');
    expect(bulkSuggestion).toBeDefined();
    expect(bulkSuggestion!.message).toContain('3');
    expect(bulkSuggestion!.message.toLowerCase()).toContain('unit');
    expect(bulkSuggestion!.actionable).toBe(true);
  });

  it('does not suggest bulk reminder when no unit has 3+ packages', async () => {
    mockPackageGroupBy.mockResolvedValue([
      { unitId: 'unit-302', _count: { id: 2 } },
      { unitId: 'unit-101', _count: { id: 1 } },
    ]);
    mockMaintenanceCount.mockResolvedValue(0);
    mockPackageCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    const body = await parseResponse<SuggestionsResponse>(res);

    const bulkSuggestion = body.data.suggestions.find((s) => s.type === 'bulk_package_reminder');
    expect(bulkSuggestion).toBeUndefined();
  });
});

// ===========================================================================
// 9. Anomaly detection: unusually high package volume flagged
// ===========================================================================

describe('Suggestions — anomaly detection', () => {
  it('flags unusually high package volume compared to daily average', async () => {
    // Today's count is 50, but 30-day daily average is only 15
    // 50 > 15 * 2 = anomaly
    mockPackageCount
      .mockResolvedValueOnce(50) // today's packages
      .mockResolvedValueOnce(450); // last 30 days total (avg = 15/day)
    mockPackageGroupBy.mockResolvedValue([]);
    mockMaintenanceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    const body = await parseResponse<SuggestionsResponse>(res);

    const anomaly = body.data.suggestions.find((s) => s.type === 'package_volume_anomaly');
    expect(anomaly).toBeDefined();
    expect(anomaly!.priority).toBe('high');
    expect(anomaly!.message.toLowerCase()).toContain('unusually high');
    expect(anomaly!.actionable).toBe(true);
  });

  it('does not flag normal package volume', async () => {
    // Today's count is 15, 30-day daily average is also 15
    mockPackageCount
      .mockResolvedValueOnce(15) // today
      .mockResolvedValueOnce(450); // last 30 days total (avg = 15/day)
    mockPackageGroupBy.mockResolvedValue([]);
    mockMaintenanceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/ai/suggestions', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getSuggestions(req);
    const body = await parseResponse<SuggestionsResponse>(res);

    const anomaly = body.data.suggestions.find((s) => s.type === 'package_volume_anomaly');
    expect(anomaly).toBeUndefined();
  });
});

// ===========================================================================
// 10. GET /ai/analytics — building health score calculation
// ===========================================================================

describe('GET /ai/analytics — building health score', () => {
  it('returns null health score when no operational data exists', async () => {
    mockMaintenanceCount.mockResolvedValue(0);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<AnalyticsResponse>(res);
    // When no operational data exists, the route short-circuits with null score
    expect(body.data.healthScore).toBeNull();
  });

  it('returns trend direction (up, down, or flat)', async () => {
    mockMaintenanceCount.mockResolvedValue(0);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    const body = await parseResponse<AnalyticsResponse>(res);

    expect(['up', 'down', 'flat']).toContain(body.data.trend);
  });

  it('returns weighted factors that comprise the health score', async () => {
    mockMaintenanceCount.mockResolvedValue(2);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(5);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    const body = await parseResponse<AnalyticsResponse>(res);

    expect(body.data.factors.length).toBeGreaterThan(0);
    for (const factor of body.data.factors) {
      expect(factor.name).toBeTruthy();
      expect(typeof factor.score).toBe('number');
      expect(typeof factor.weight).toBe('number');
    }
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/ai/analytics');
    const res = await getAnalytics(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// 11. Analytics: package delivery time trends, maintenance SLA compliance %
// ===========================================================================

describe('Analytics — delivery trends and SLA compliance', () => {
  it('returns package delivery time trends', async () => {
    mockPackageFindMany.mockResolvedValue([
      { createdAt: new Date('2026-03-01'), releasedAt: new Date('2026-03-01T04:00:00Z') },
      { createdAt: new Date('2026-03-08'), releasedAt: new Date('2026-03-08T02:00:00Z') },
    ]);
    mockMaintenanceCount.mockResolvedValue(0);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    const body = await parseResponse<AnalyticsResponse>(res);

    expect(Array.isArray(body.data.packageDeliveryTrend)).toBe(true);
    for (const entry of body.data.packageDeliveryTrend) {
      expect(entry.period).toBeTruthy();
      expect(typeof entry.count).toBe('number');
      expect(typeof entry.avgDeliveryHours).toBe('number');
    }
  });

  it('returns maintenance SLA compliance percentage', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // 2 out of 3 closed within 72h SLA = 66.7%
    mockMaintenanceFindMany.mockResolvedValue([
      {
        createdAt: twoDaysAgo,
        completedDate: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000),
      }, // 24h — within SLA
      {
        createdAt: twoDaysAgo,
        completedDate: new Date(twoDaysAgo.getTime() + 48 * 60 * 60 * 1000),
      }, // 48h — within SLA
      {
        createdAt: fiveDaysAgo,
        completedDate: new Date(fiveDaysAgo.getTime() + 96 * 60 * 60 * 1000),
      }, // 96h — over SLA
    ]);
    mockMaintenanceCount.mockResolvedValue(1);
    mockPackageCount.mockResolvedValue(0);
    mockPackageFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    const body = await parseResponse<AnalyticsResponse>(res);

    // 2/3 within SLA ≈ 67%
    expect(body.data.maintenanceSlaCompliance).toBeGreaterThanOrEqual(66);
    expect(body.data.maintenanceSlaCompliance).toBeLessThanOrEqual(67);
  });

  it('returns null SLA compliance when no operational data exists', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockMaintenanceCount.mockResolvedValue(0);
    mockPackageCount.mockResolvedValue(0);
    mockPackageFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await getAnalytics(req);
    const body = await parseResponse<AnalyticsResponse>(res);

    // When no operational data, the route short-circuits with null
    expect(body.data.maintenanceSlaCompliance).toBeNull();
  });
});

// ===========================================================================
// 12. Analytics data is tenant-isolated
// ===========================================================================

describe('Analytics — tenant isolation', () => {
  it('all queries are scoped to the requested propertyId', async () => {
    setAuth({ propertyId: PROPERTY_A });
    mockMaintenanceCount.mockResolvedValue(0);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);
    mockPackageFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await getAnalytics(req);

    // Every maintenance query must include propertyId
    for (const call of mockMaintenanceCount.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_A);
    }
    for (const call of mockMaintenanceFindMany.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_A);
    }
    // Package queries must include propertyId
    for (const call of mockPackageCount.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_A);
    }
  });

  it('never returns data from another property', async () => {
    setAuth({ propertyId: PROPERTY_A });
    mockMaintenanceCount.mockResolvedValue(5);
    mockMaintenanceFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(3);
    mockPackageFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/ai/analytics', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await getAnalytics(req);

    // Verify no query was made with PROPERTY_B
    const allCalls = [
      ...mockMaintenanceCount.mock.calls,
      ...mockMaintenanceFindMany.mock.calls,
      ...mockPackageCount.mock.calls,
    ];
    for (const call of allCalls) {
      expect(call[0].where.propertyId).not.toBe(PROPERTY_B);
    }
  });
});
