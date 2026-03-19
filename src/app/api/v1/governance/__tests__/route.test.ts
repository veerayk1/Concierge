/**
 * Board Governance API Tests
 *
 * Covers meetings, voting, financial reports, budget tracking,
 * resolution tracking, document sharing, board member directory,
 * and term tracking. Board members get reports, financial views,
 * and governance tools.
 *
 * Tests:
 * 1. GET /governance/meetings — sorted by date
 * 2. GET /governance/meetings — filtered by type (regular, special, agm, emergency)
 * 3. GET /governance/meetings — filtered by status (scheduled, in_progress, completed, cancelled)
 * 4. POST /governance/meetings — creates meeting with required fields
 * 5. POST /governance/meetings — validates meeting type enum
 * 6. PATCH updates meeting status
 * 7. PATCH adds minutes availability flag
 * 8. GET /governance/resolutions — sorted by proposed date
 * 9. GET /governance/resolutions — filtered by status (proposed, voting, passed, failed, tabled)
 * 10. POST /governance/resolutions — creates resolution with auto-generated number
 * 11. POST /governance/resolutions — validates required fields
 * 12. PATCH records votes (for, against, abstain)
 * 13. PATCH changes resolution status based on vote outcome
 * 14. Resolution linked to meeting
 * 15. Governance document upload (metadata)
 * 16. Tenant isolation
 * 17. Meeting agenda items
 * 18. Meeting minutes
 * 19. Vote counting and majority rules
 * 20. Board member directory with roles
 * 21. Term tracking
 * 22. Financial reports
 * 23. Budget tracking
 * 24. Role-based access control
 * 25. Pagination
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMeetingFindMany = vi.fn();
const mockMeetingCount = vi.fn();
const mockMeetingCreate = vi.fn();
const mockMeetingFindUnique = vi.fn();
const mockMeetingUpdate = vi.fn();

const mockAgendaItemFindMany = vi.fn();
const mockAgendaItemCreate = vi.fn();
const mockAgendaItemUpdate = vi.fn();

const mockVoteCreate = vi.fn();
const mockVoteFindMany = vi.fn();
const mockVoteCount = vi.fn();
const mockVoteFindFirst = vi.fn();

const mockMinutesCreate = vi.fn();
const mockMinutesFindFirst = vi.fn();

const mockFinancialFindMany = vi.fn();
const mockBudgetFindMany = vi.fn();

const mockResolutionFindMany = vi.fn();
const mockResolutionCount = vi.fn();
const mockResolutionCreate = vi.fn();
const mockResolutionUpdate = vi.fn();

const mockDocumentFindMany = vi.fn();
const mockDocumentCount = vi.fn();
const mockDocumentCreate = vi.fn();

const mockBoardMemberFindMany = vi.fn();
const mockBoardMemberCount = vi.fn();
const mockBoardMemberCreate = vi.fn();
const mockBoardMemberFindUnique = vi.fn();
const mockBoardMemberUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    boardMeeting: {
      findMany: (...args: unknown[]) => mockMeetingFindMany(...args),
      count: (...args: unknown[]) => mockMeetingCount(...args),
      create: (...args: unknown[]) => mockMeetingCreate(...args),
      findUnique: (...args: unknown[]) => mockMeetingFindUnique(...args),
      update: (...args: unknown[]) => mockMeetingUpdate(...args),
    },
    agendaItem: {
      findMany: (...args: unknown[]) => mockAgendaItemFindMany(...args),
      create: (...args: unknown[]) => mockAgendaItemCreate(...args),
      update: (...args: unknown[]) => mockAgendaItemUpdate(...args),
    },
    boardVote: {
      create: (...args: unknown[]) => mockVoteCreate(...args),
      findMany: (...args: unknown[]) => mockVoteFindMany(...args),
      count: (...args: unknown[]) => mockVoteCount(...args),
      findFirst: (...args: unknown[]) => mockVoteFindFirst(...args),
    },
    meetingMinutes: {
      create: (...args: unknown[]) => mockMinutesCreate(...args),
      findFirst: (...args: unknown[]) => mockMinutesFindFirst(...args),
    },
    financialReport: {
      findMany: (...args: unknown[]) => mockFinancialFindMany(...args),
    },
    budgetLineItem: {
      findMany: (...args: unknown[]) => mockBudgetFindMany(...args),
    },
    boardResolution: {
      findMany: (...args: unknown[]) => mockResolutionFindMany(...args),
      count: (...args: unknown[]) => mockResolutionCount(...args),
      create: (...args: unknown[]) => mockResolutionCreate(...args),
      update: (...args: unknown[]) => mockResolutionUpdate(...args),
    },
    governanceDocument: {
      findMany: (...args: unknown[]) => mockDocumentFindMany(...args),
      count: (...args: unknown[]) => mockDocumentCount(...args),
      create: (...args: unknown[]) => mockDocumentCreate(...args),
    },
    boardMemberRecord: {
      findMany: (...args: unknown[]) => mockBoardMemberFindMany(...args),
      count: (...args: unknown[]) => mockBoardMemberCount(...args),
      create: (...args: unknown[]) => mockBoardMemberCreate(...args),
      findUnique: (...args: unknown[]) => mockBoardMemberFindUnique(...args),
      update: (...args: unknown[]) => mockBoardMemberUpdate(...args),
    },
  },
}));

// Mock guardRoute — default board_member
const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers AFTER mocks
import { GET as MeetingsGET, POST as MeetingsPOST } from '../../governance/meetings/route';
import { POST as MinutesPOST } from '../../governance/meetings/minutes/route';
import { POST as VotesPOST, GET as VotesGET } from '../../governance/meetings/votes/route';
import { GET as FinancialsGET } from '../../governance/financials/route';
import { GET as ResolutionsGET, POST as ResolutionsPOST } from '../../governance/resolutions/route';
import { GET as DocumentsGET, POST as DocumentsPOST } from '../../governance/documents/route';
import { GET as MembersGET, POST as MembersPOST } from '../../governance/members/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const BOARD_USER_ID = 'board-member-001';
const ADMIN_USER_ID = 'admin-user-001';
const RESIDENT_USER_ID = 'resident-user-001';

const boardMemberAuth = {
  user: {
    userId: BOARD_USER_ID,
    propertyId: PROPERTY_ID,
    role: 'board_member',
    permissions: ['*'],
    mfaVerified: false,
  },
  error: null,
};

const adminAuth = {
  user: {
    userId: ADMIN_USER_ID,
    propertyId: PROPERTY_ID,
    role: 'property_admin',
    permissions: ['*'],
    mfaVerified: false,
  },
  error: null,
};

const residentAuth = {
  user: {
    userId: RESIDENT_USER_ID,
    propertyId: PROPERTY_ID,
    role: 'resident_tenant',
    permissions: [],
    mfaVerified: false,
  },
  error: null,
};

const MOCK_MEETING = {
  id: 'meeting-001',
  propertyId: PROPERTY_ID,
  title: 'Q1 2026 Board Meeting',
  description: 'Quarterly review of property finances and operations',
  scheduledAt: new Date('2026-04-15T18:00:00Z'),
  location: 'Party Room A',
  status: 'scheduled',
  type: 'regular',
  createdBy: ADMIN_USER_ID,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  agendaItems: [],
};

const MOCK_PAST_MEETING = {
  id: 'meeting-002',
  propertyId: PROPERTY_ID,
  title: 'Q4 2025 Board Meeting',
  description: 'Year-end review',
  scheduledAt: new Date('2025-12-15T18:00:00Z'),
  location: 'Party Room A',
  status: 'completed',
  type: 'regular',
  createdBy: ADMIN_USER_ID,
  createdAt: new Date('2025-11-15'),
  updatedAt: new Date('2025-12-15'),
  agendaItems: [],
};

const MOCK_AGENDA_ITEM = {
  id: 'agenda-001',
  meetingId: 'meeting-001',
  title: 'Approve 2026 Budget',
  description: 'Review and vote on proposed budget for fiscal year 2026',
  sortOrder: 1,
  requiresVote: true,
  status: 'pending',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRoute.mockResolvedValue(boardMemberAuth);
  mockMeetingFindMany.mockResolvedValue([]);
  mockMeetingCount.mockResolvedValue(0);
  mockMeetingFindUnique.mockResolvedValue(null);
  mockAgendaItemFindMany.mockResolvedValue([]);
  mockVoteFindMany.mockResolvedValue([]);
  mockVoteCount.mockResolvedValue(0);
  mockVoteFindFirst.mockResolvedValue(null);
  mockMinutesFindFirst.mockResolvedValue(null);
  mockFinancialFindMany.mockResolvedValue([]);
  mockBudgetFindMany.mockResolvedValue([]);
  mockResolutionFindMany.mockResolvedValue([]);
  mockResolutionCount.mockResolvedValue(0);
  mockDocumentFindMany.mockResolvedValue([]);
  mockDocumentCount.mockResolvedValue(0);
  mockBoardMemberFindMany.mockResolvedValue([]);
  mockBoardMemberCount.mockResolvedValue(0);
  mockBoardMemberFindUnique.mockResolvedValue(null);
});

// ===========================================================================
// 1. GET /governance/meetings — sorted by date
// ===========================================================================

describe('GET /api/v1/governance/meetings — List Board Meetings', () => {
  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/meetings');
    const res = await MeetingsGET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('returns empty array when no meetings exist', async () => {
    mockMeetingFindMany.mockResolvedValue([]);
    mockMeetingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MeetingsGET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('returns both upcoming and past meetings', async () => {
    mockMeetingFindMany.mockResolvedValue([MOCK_MEETING, MOCK_PAST_MEETING]);
    mockMeetingCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MeetingsGET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ id: string; status: string }> }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('orders by scheduledAt descending', async () => {
    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await MeetingsGET(req);

    expect(mockMeetingFindMany.mock.calls[0]![0].orderBy).toEqual({ scheduledAt: 'desc' });
  });
});

// ===========================================================================
// 2. GET /governance/meetings — filtered by type (regular, special, agm, emergency)
// ===========================================================================

describe('GET /api/v1/governance/meetings — Meeting Type Filtering', () => {
  it('accepts type=regular meetings', async () => {
    mockMeetingFindMany.mockResolvedValue([{ ...MOCK_MEETING, type: 'regular' }]);
    mockMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MeetingsGET(req);
    const body = await parseResponse<{ data: Array<{ type: string }> }>(res);
    expect(body.data[0]!.type).toBe('regular');
  });

  it('creates meeting with type=agm', async () => {
    mockMeetingCreate.mockResolvedValue({
      id: 'meeting-agm',
      type: 'agm',
      status: 'scheduled',
    });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Annual General Meeting 2026',
      scheduledAt: '2026-05-20T18:00:00Z',
      type: 'agm',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
  });

  it('creates meeting with type=emergency', async () => {
    mockMeetingCreate.mockResolvedValue({
      id: 'meeting-emergency',
      type: 'emergency',
      status: 'scheduled',
    });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Emergency Board Session',
      scheduledAt: '2026-04-01T10:00:00Z',
      type: 'emergency',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
  });

  it('creates meeting with type=special', async () => {
    mockMeetingCreate.mockResolvedValue({
      id: 'meeting-special',
      type: 'special',
      status: 'scheduled',
    });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Special Session: Budget Review',
      scheduledAt: '2026-04-10T15:00:00Z',
      type: 'special',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 3. GET /governance/meetings — filtered by status
// ===========================================================================

describe('GET /api/v1/governance/meetings — Status Filtering', () => {
  it('filters meetings by status=scheduled', async () => {
    mockMeetingFindMany.mockResolvedValue([MOCK_MEETING]);
    mockMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID, status: 'scheduled' },
    });
    await MeetingsGET(req);

    const where = mockMeetingFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('scheduled');
  });

  it('filters meetings by status=completed', async () => {
    mockMeetingFindMany.mockResolvedValue([MOCK_PAST_MEETING]);
    mockMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID, status: 'completed' },
    });
    await MeetingsGET(req);

    const where = mockMeetingFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('completed');
  });

  it('returns all statuses when no status filter', async () => {
    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await MeetingsGET(req);

    const where = mockMeetingFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });
});

// ===========================================================================
// 4. POST /governance/meetings — creates meeting with required fields
// ===========================================================================

describe('POST /api/v1/governance/meetings — Create Meeting', () => {
  const validMeeting = {
    propertyId: PROPERTY_ID,
    title: 'Annual General Meeting 2026',
    description: 'Annual meeting for all owners',
    scheduledAt: '2026-05-20T18:00:00Z',
    location: 'Main Lobby Conference Room',
    type: 'agm',
  };

  it('creates a meeting as board_member', async () => {
    mockMeetingCreate.mockResolvedValue({
      id: 'meeting-new',
      ...validMeeting,
      status: 'scheduled',
    });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('meeting-new');
    expect(body.message).toContain('created');
  });

  it('creates a meeting as property_admin', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);
    mockMeetingCreate.mockResolvedValue({
      id: 'meeting-admin',
      ...validMeeting,
      status: 'scheduled',
    });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
  });

  it('rejects meeting creation by resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(403);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      scheduledAt: '2026-05-20T18:00:00Z',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing scheduledAt', async () => {
    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Board Meeting',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/governance/meetings', {
      ...validMeeting,
      propertyId: 'not-a-uuid',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(400);
  });

  it('sets status to scheduled on creation', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-new', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    await MeetingsPOST(req);

    const createData = mockMeetingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('scheduled');
  });

  it('sets createdBy from authenticated user', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-new', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    await MeetingsPOST(req);

    expect(mockMeetingCreate.mock.calls[0]![0].data.createdBy).toBe(BOARD_USER_ID);
  });

  it('stores location when provided', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-new', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    await MeetingsPOST(req);

    expect(mockMeetingCreate.mock.calls[0]![0].data.location).toBe('Main Lobby Conference Room');
  });

  it('stores description when provided', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-new', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', validMeeting);
    await MeetingsPOST(req);

    expect(mockMeetingCreate.mock.calls[0]![0].data.description).toBe(
      'Annual meeting for all owners',
    );
  });
});

// ===========================================================================
// 5. POST /governance/meetings — validates meeting type enum
// ===========================================================================

describe('POST /api/v1/governance/meetings — Meeting Type Validation', () => {
  it('rejects invalid meeting type', async () => {
    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Invalid Type Meeting',
      scheduledAt: '2026-05-20T18:00:00Z',
      type: 'casual_hangout',
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(400);
  });

  it('defaults to regular type when not specified', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-default', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Default Type Meeting',
      scheduledAt: '2026-05-20T18:00:00Z',
    });
    await MeetingsPOST(req);

    expect(mockMeetingCreate.mock.calls[0]![0].data.type).toBe('regular');
  });

  it.each(['regular', 'special', 'agm', 'emergency'])('accepts type=%s', async (type) => {
    vi.clearAllMocks();
    mockGuardRoute.mockResolvedValue(boardMemberAuth);
    mockMeetingCreate.mockResolvedValue({ id: `meeting-${type}`, status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: `Meeting type ${type}`,
      scheduledAt: '2026-05-20T18:00:00Z',
      type,
    });
    const res = await MeetingsPOST(req);
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 6-7. Meeting agenda items with voting
// ===========================================================================

describe('Meeting Agenda Items', () => {
  it('returns agenda items with meeting', async () => {
    mockMeetingFindMany.mockResolvedValue([{ ...MOCK_MEETING, agendaItems: [MOCK_AGENDA_ITEM] }]);
    mockMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MeetingsGET(req);
    const body = await parseResponse<{
      data: Array<{ agendaItems: Array<{ id: string; requiresVote: boolean }> }>;
    }>(res);

    expect(body.data[0]!.agendaItems).toHaveLength(1);
    expect(body.data[0]!.agendaItems[0]!.requiresVote).toBe(true);
  });

  it('includes agenda items ordered by sortOrder', async () => {
    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await MeetingsGET(req);

    const includeOpts = mockMeetingFindMany.mock.calls[0]![0].include;
    expect(includeOpts.agendaItems).toBeDefined();
    expect(includeOpts.agendaItems.orderBy).toEqual({ sortOrder: 'asc' });
  });
});

// ===========================================================================
// 8. Meeting minutes: POST /governance/meetings/:id/minutes
// ===========================================================================

describe('POST /api/v1/governance/meetings/:id/minutes — Record Minutes', () => {
  const validMinutes = {
    meetingId: 'meeting-001',
    propertyId: PROPERTY_ID,
    content:
      'Meeting called to order at 6:00 PM. Quorum confirmed with 5 of 7 board members present.',
    attendees: ['board-member-001', 'board-member-002', 'board-member-003'],
  };

  beforeEach(() => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
  });

  it('creates meeting minutes as board_member', async () => {
    mockMinutesCreate.mockResolvedValue({ id: 'minutes-001', ...validMinutes });

    const req = createPostRequest('/api/v1/governance/meetings/minutes', validMinutes);
    const res = await MinutesPOST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('minutes-001');
    expect(body.message).toContain('recorded');
  });

  it('rejects minutes creation by resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/meetings/minutes', validMinutes);
    const res = await MinutesPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects missing meetingId', async () => {
    const req = createPostRequest('/api/v1/governance/meetings/minutes', {
      propertyId: PROPERTY_ID,
      content: 'Some minutes content here',
    });
    const res = await MinutesPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing content', async () => {
    const req = createPostRequest('/api/v1/governance/meetings/minutes', {
      meetingId: 'meeting-001',
      propertyId: PROPERTY_ID,
    });
    const res = await MinutesPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent meeting', async () => {
    mockMeetingFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/governance/meetings/minutes', validMinutes);
    const res = await MinutesPOST(req);
    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MEETING_NOT_FOUND');
  });

  it('stores recordedBy from authenticated user', async () => {
    mockMinutesCreate.mockResolvedValue({ id: 'minutes-001' });

    const req = createPostRequest('/api/v1/governance/meetings/minutes', validMinutes);
    await MinutesPOST(req);

    expect(mockMinutesCreate.mock.calls[0]![0].data.recordedBy).toBe(BOARD_USER_ID);
  });
});

// ===========================================================================
// 9. GET /governance/resolutions — sorted by proposed date, filtered by status
// ===========================================================================

describe('GET /api/v1/governance/resolutions — Resolution Tracking', () => {
  const MOCK_RESOLUTIONS = [
    {
      id: 'res-001',
      propertyId: PROPERTY_ID,
      title: 'Approve HVAC Replacement',
      description: 'Replace building HVAC system with energy-efficient units',
      status: 'approved',
      meetingId: 'meeting-001',
      approvedAt: new Date('2026-03-15'),
      implementationDeadline: new Date('2026-09-01'),
      createdAt: new Date('2026-03-01'),
    },
    {
      id: 'res-002',
      propertyId: PROPERTY_ID,
      title: 'Lobby Renovation',
      description: 'Complete renovation of main lobby area',
      status: 'pending',
      meetingId: 'meeting-001',
      approvedAt: null,
      implementationDeadline: null,
      createdAt: new Date('2026-03-10'),
    },
    {
      id: 'res-003',
      propertyId: PROPERTY_ID,
      title: 'Update Visitor Policy',
      description: 'New visitor registration requirements',
      status: 'implemented',
      meetingId: 'meeting-002',
      approvedAt: new Date('2025-12-15'),
      implementationDeadline: new Date('2026-01-15'),
      createdAt: new Date('2025-12-01'),
    },
  ];

  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/resolutions');
    const res = await ResolutionsGET(req);
    expect(res.status).toBe(400);
  });

  it('lists all resolutions for a property', async () => {
    mockResolutionFindMany.mockResolvedValue(MOCK_RESOLUTIONS);
    mockResolutionCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await ResolutionsGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ id: string; status: string }> }>(res);
    expect(body.data).toHaveLength(3);
  });

  it('filters by status', async () => {
    mockResolutionFindMany.mockResolvedValue([MOCK_RESOLUTIONS[0]]);
    mockResolutionCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_ID, status: 'approved' },
    });
    await ResolutionsGET(req);

    expect(mockResolutionFindMany.mock.calls[0]![0].where.status).toBe('approved');
  });

  it('orders resolutions by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await ResolutionsGET(req);

    expect(mockResolutionFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('supports pagination', async () => {
    mockResolutionCount.mockResolvedValue(30);
    mockResolutionFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await ResolutionsGET(req);
    const body = await parseResponse<{ meta: { page: number; totalPages: number } }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.totalPages).toBe(3);
  });

  it('scopes query to propertyId for tenant isolation', async () => {
    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await ResolutionsGET(req);

    expect(mockResolutionFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });
});

// ===========================================================================
// 10-11. POST /governance/resolutions — Create Resolution with validation
// ===========================================================================

describe('POST /api/v1/governance/resolutions — Create Resolution', () => {
  const validResolution = {
    propertyId: PROPERTY_ID,
    title: 'Approve Pool Renovation',
    description: 'Complete renovation of outdoor pool area for summer 2026',
    meetingId: 'meeting-001',
    implementationDeadline: '2026-08-01',
  };

  it('creates a resolution as board_member', async () => {
    mockResolutionCreate.mockResolvedValue({
      id: 'res-new',
      ...validResolution,
      status: 'pending',
    });

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    const res = await ResolutionsPOST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBe('res-new');
  });

  it('rejects resolution creation by resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    const res = await ResolutionsPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/governance/resolutions', {
      propertyId: PROPERTY_ID,
      description: 'Some description text',
    });
    const res = await ResolutionsPOST(req);
    expect(res.status).toBe(400);
  });

  it('sets initial status to pending', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    await ResolutionsPOST(req);

    expect(mockResolutionCreate.mock.calls[0]![0].data.status).toBe('pending');
  });

  it('stores createdBy from authenticated user', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    await ResolutionsPOST(req);

    expect(mockResolutionCreate.mock.calls[0]![0].data.createdBy).toBe(BOARD_USER_ID);
  });

  it('links resolution to meeting via meetingId', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    await ResolutionsPOST(req);

    expect(mockResolutionCreate.mock.calls[0]![0].data.meetingId).toBe('meeting-001');
  });

  it('sets meetingId to null when not provided', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', {
      propertyId: PROPERTY_ID,
      title: 'Standalone Resolution',
      description: 'Not linked to a meeting',
    });
    await ResolutionsPOST(req);

    expect(mockResolutionCreate.mock.calls[0]![0].data.meetingId).toBeNull();
  });

  it('stores implementationDeadline as Date', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', validResolution);
    await ResolutionsPOST(req);

    const deadline = mockResolutionCreate.mock.calls[0]![0].data.implementationDeadline;
    expect(deadline).toBeInstanceOf(Date);
  });

  it('sets implementationDeadline to null when not provided', async () => {
    mockResolutionCreate.mockResolvedValue({ id: 'res-new', status: 'pending' });

    const req = createPostRequest('/api/v1/governance/resolutions', {
      propertyId: PROPERTY_ID,
      title: 'No deadline resolution',
    });
    await ResolutionsPOST(req);

    expect(mockResolutionCreate.mock.calls[0]![0].data.implementationDeadline).toBeNull();
  });
});

// ===========================================================================
// 12-13. Voting: POST /governance/meetings/votes — board members cast votes
// ===========================================================================

describe('POST /api/v1/governance/meetings/votes — Cast Vote', () => {
  const validVote = {
    meetingId: 'meeting-001',
    agendaItemId: 'agenda-001',
    propertyId: PROPERTY_ID,
    vote: 'approve',
  };

  beforeEach(() => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockAgendaItemFindMany.mockResolvedValue([MOCK_AGENDA_ITEM]);
  });

  it('allows board member to cast a vote', async () => {
    mockVoteFindFirst.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({ id: 'vote-001', ...validVote, voterId: BOARD_USER_ID });

    const req = createPostRequest('/api/v1/governance/meetings/votes', validVote);
    const res = await VotesPOST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('vote-001');
    expect(body.message).toContain('recorded');
  });

  it('rejects vote from resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/meetings/votes', validVote);
    const res = await VotesPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects duplicate vote by same member', async () => {
    mockVoteFindFirst.mockResolvedValue({ id: 'vote-existing', voterId: BOARD_USER_ID });

    const req = createPostRequest('/api/v1/governance/meetings/votes', validVote);
    const res = await VotesPOST(req);
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('DUPLICATE_VOTE');
  });

  it('accepts approve, reject, and abstain votes', async () => {
    for (const vote of ['approve', 'reject', 'abstain']) {
      vi.clearAllMocks();
      mockGuardRoute.mockResolvedValue(boardMemberAuth);
      mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
      mockVoteFindFirst.mockResolvedValue(null);
      mockVoteCreate.mockResolvedValue({ id: `vote-${vote}`, vote, voterId: BOARD_USER_ID });

      const req = createPostRequest('/api/v1/governance/meetings/votes', {
        ...validVote,
        vote,
      });
      const res = await VotesPOST(req);
      expect(res.status).toBe(201);
    }
  });

  it('rejects invalid vote value', async () => {
    const req = createPostRequest('/api/v1/governance/meetings/votes', {
      ...validVote,
      vote: 'maybe',
    });
    const res = await VotesPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent meeting', async () => {
    mockMeetingFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/governance/meetings/votes', validVote);
    const res = await VotesPOST(req);
    expect(res.status).toBe(404);
  });

  it('stores voterId from authenticated user', async () => {
    mockVoteFindFirst.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({ id: 'vote-001' });

    const req = createPostRequest('/api/v1/governance/meetings/votes', validVote);
    await VotesPOST(req);

    expect(mockVoteCreate.mock.calls[0]![0].data.voterId).toBe(BOARD_USER_ID);
  });
});

// ===========================================================================
// Vote counting and majority rules
// ===========================================================================

describe('GET /api/v1/governance/meetings/votes — Vote Counting & Majority', () => {
  it('returns vote tally for an agenda item', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'member-1' },
      { id: 'v2', vote: 'approve', voterId: 'member-2' },
      { id: 'v3', vote: 'approve', voterId: 'member-3' },
      { id: 'v4', vote: 'reject', voterId: 'member-4' },
      { id: 'v5', vote: 'abstain', voterId: 'member-5' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        votes: unknown[];
        tally: { approve: number; reject: number; abstain: number; total: number };
        result: string;
      };
    }>(res);

    expect(body.data.tally.approve).toBe(3);
    expect(body.data.tally.reject).toBe(1);
    expect(body.data.tally.abstain).toBe(1);
    expect(body.data.tally.total).toBe(5);
  });

  it('declares passed when majority approves', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'member-1' },
      { id: 'v2', vote: 'approve', voterId: 'member-2' },
      { id: 'v3', vote: 'reject', voterId: 'member-3' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    const body = await parseResponse<{ data: { result: string } }>(res);
    expect(body.data.result).toBe('passed');
  });

  it('declares failed when majority rejects', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'reject', voterId: 'member-1' },
      { id: 'v2', vote: 'reject', voterId: 'member-2' },
      { id: 'v3', vote: 'approve', voterId: 'member-3' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    const body = await parseResponse<{ data: { result: string } }>(res);
    expect(body.data.result).toBe('failed');
  });

  it('declares tie when votes are equal', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'member-1' },
      { id: 'v2', vote: 'reject', voterId: 'member-2' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    const body = await parseResponse<{ data: { result: string } }>(res);
    expect(body.data.result).toBe('tie');
  });

  it('excludes abstentions from majority calculation', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'member-1' },
      { id: 'v2', vote: 'reject', voterId: 'member-2' },
      { id: 'v3', vote: 'abstain', voterId: 'member-3' },
      { id: 'v4', vote: 'abstain', voterId: 'member-4' },
      { id: 'v5', vote: 'abstain', voterId: 'member-5' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    const body = await parseResponse<{ data: { result: string } }>(res);
    // 1 approve vs 1 reject (abstains excluded) = tie
    expect(body.data.result).toBe('tie');
  });

  it('returns 400 without meetingId', async () => {
    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: { propertyId: PROPERTY_ID, agendaItemId: 'agenda-001' },
    });
    const res = await VotesGET(req);
    expect(res.status).toBe(400);
  });

  it('handles unanimous approval', async () => {
    mockMeetingFindUnique.mockResolvedValue(MOCK_MEETING);
    mockVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'member-1' },
      { id: 'v2', vote: 'approve', voterId: 'member-2' },
      { id: 'v3', vote: 'approve', voterId: 'member-3' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: 'meeting-001',
        agendaItemId: 'agenda-001',
      },
    });
    const res = await VotesGET(req);
    const body = await parseResponse<{ data: { result: string; tally: { reject: number } } }>(res);
    expect(body.data.result).toBe('passed');
    expect(body.data.tally.reject).toBe(0);
  });
});

// ===========================================================================
// Financial reports
// ===========================================================================

describe('GET /api/v1/governance/financials — Financial Reports', () => {
  const MOCK_FINANCIALS = [
    {
      id: 'fin-001',
      propertyId: PROPERTY_ID,
      period: '2026-Q1',
      totalRevenue: 125000_00,
      totalExpenses: 95000_00,
      netIncome: 30000_00,
      categories: [
        { name: 'Maintenance Fees', amount: 100000_00, type: 'revenue' },
        { name: 'Parking Revenue', amount: 25000_00, type: 'revenue' },
        { name: 'Utilities', amount: 35000_00, type: 'expense' },
        { name: 'Maintenance', amount: 20000_00, type: 'expense' },
        { name: 'Insurance', amount: 15000_00, type: 'expense' },
        { name: 'Management Fees', amount: 25000_00, type: 'expense' },
      ],
      createdAt: new Date('2026-03-31'),
    },
  ];

  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/financials');
    const res = await FinancialsGET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('returns P&L summary for the property', async () => {
    mockFinancialFindMany.mockResolvedValue(MOCK_FINANCIALS);

    const req = createGetRequest('/api/v1/governance/financials', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await FinancialsGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{
        totalRevenue: number;
        totalExpenses: number;
        netIncome: number;
        categories: unknown[];
      }>;
    }>(res);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.totalRevenue).toBe(125000_00);
    expect(body.data[0]!.totalExpenses).toBe(95000_00);
    expect(body.data[0]!.netIncome).toBe(30000_00);
    expect(body.data[0]!.categories).toHaveLength(6);
  });

  it('filters by period', async () => {
    mockFinancialFindMany.mockResolvedValue(MOCK_FINANCIALS);

    const req = createGetRequest('/api/v1/governance/financials', {
      searchParams: { propertyId: PROPERTY_ID, period: '2026-Q1' },
    });
    await FinancialsGET(req);

    const where = mockFinancialFindMany.mock.calls[0]![0].where;
    expect(where.period).toBe('2026-Q1');
  });

  it('returns empty data when no financials exist', async () => {
    mockFinancialFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/governance/financials', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await FinancialsGET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(0);
  });
});

// ===========================================================================
// Budget tracking: planned vs actual spending
// ===========================================================================

describe('GET /api/v1/governance/financials — Budget Tracking', () => {
  const MOCK_BUDGET_ITEMS = [
    {
      id: 'budget-001',
      propertyId: PROPERTY_ID,
      category: 'Maintenance',
      plannedAmount: 50000_00,
      actualAmount: 42000_00,
      period: '2026',
      variance: 8000_00,
      variancePercent: 16.0,
    },
    {
      id: 'budget-002',
      propertyId: PROPERTY_ID,
      category: 'Utilities',
      plannedAmount: 40000_00,
      actualAmount: 45000_00,
      period: '2026',
      variance: -5000_00,
      variancePercent: -12.5,
    },
    {
      id: 'budget-003',
      propertyId: PROPERTY_ID,
      category: 'Insurance',
      plannedAmount: 15000_00,
      actualAmount: 15000_00,
      period: '2026',
      variance: 0,
      variancePercent: 0,
    },
  ];

  it('returns budget items with planned vs actual', async () => {
    mockFinancialFindMany.mockResolvedValue([]);
    mockBudgetFindMany.mockResolvedValue(MOCK_BUDGET_ITEMS);

    const req = createGetRequest('/api/v1/governance/financials', {
      searchParams: { propertyId: PROPERTY_ID, includeBudget: 'true' },
    });
    const res = await FinancialsGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: unknown[];
      budget: Array<{
        category: string;
        plannedAmount: number;
        actualAmount: number;
        variance: number;
      }>;
    }>(res);

    expect(body.budget).toHaveLength(3);
    expect(body.budget[0]!.plannedAmount).toBe(50000_00);
    expect(body.budget[0]!.actualAmount).toBe(42000_00);
    expect(body.budget[0]!.variance).toBe(8000_00);
  });

  it('identifies over-budget categories with negative variance', async () => {
    mockFinancialFindMany.mockResolvedValue([]);
    mockBudgetFindMany.mockResolvedValue(MOCK_BUDGET_ITEMS);

    const req = createGetRequest('/api/v1/governance/financials', {
      searchParams: { propertyId: PROPERTY_ID, includeBudget: 'true' },
    });
    const res = await FinancialsGET(req);
    const body = await parseResponse<{
      budget: Array<{ category: string; variance: number }>;
    }>(res);

    const overBudget = body.budget.filter((b) => b.variance < 0);
    expect(overBudget).toHaveLength(1);
    expect(overBudget[0]!.category).toBe('Utilities');
  });
});

// ===========================================================================
// Document sharing
// ===========================================================================

describe('GET /api/v1/governance/documents — Document Sharing', () => {
  const MOCK_DOCUMENTS = [
    {
      id: 'doc-001',
      propertyId: PROPERTY_ID,
      title: 'Q1 2026 Board Meeting Minutes',
      type: 'meeting_minutes',
      filePath: '/documents/governance/meeting-001-minutes.pdf',
      uploadedBy: ADMIN_USER_ID,
      meetingId: 'meeting-001',
      createdAt: new Date('2026-03-20'),
    },
    {
      id: 'doc-002',
      propertyId: PROPERTY_ID,
      title: '2025 Annual Financial Statement',
      type: 'financial_statement',
      filePath: '/documents/governance/2025-financial-statement.pdf',
      uploadedBy: ADMIN_USER_ID,
      meetingId: null,
      createdAt: new Date('2026-02-15'),
    },
    {
      id: 'doc-003',
      propertyId: PROPERTY_ID,
      title: 'Board Resolution - HVAC Replacement',
      type: 'resolution',
      filePath: '/documents/governance/res-hvac.pdf',
      uploadedBy: BOARD_USER_ID,
      meetingId: 'meeting-001',
      createdAt: new Date('2026-03-16'),
    },
  ];

  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/documents');
    const res = await DocumentsGET(req);
    expect(res.status).toBe(400);
  });

  it('lists all governance documents', async () => {
    mockDocumentFindMany.mockResolvedValue(MOCK_DOCUMENTS);
    mockDocumentCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/governance/documents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await DocumentsGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ id: string; type: string; filePath: string }>;
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('filters by document type', async () => {
    mockDocumentFindMany.mockResolvedValue([MOCK_DOCUMENTS[0]]);
    mockDocumentCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/documents', {
      searchParams: { propertyId: PROPERTY_ID, type: 'meeting_minutes' },
    });
    await DocumentsGET(req);

    expect(mockDocumentFindMany.mock.calls[0]![0].where.type).toBe('meeting_minutes');
  });

  it('filters by meetingId', async () => {
    mockDocumentFindMany.mockResolvedValue([MOCK_DOCUMENTS[0], MOCK_DOCUMENTS[2]]);
    mockDocumentCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/governance/documents', {
      searchParams: { propertyId: PROPERTY_ID, meetingId: 'meeting-001' },
    });
    await DocumentsGET(req);

    expect(mockDocumentFindMany.mock.calls[0]![0].where.meetingId).toBe('meeting-001');
  });

  it('orders by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/governance/documents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await DocumentsGET(req);

    expect(mockDocumentFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });
});

describe('POST /api/v1/governance/documents — Upload Document', () => {
  const validDoc = {
    propertyId: PROPERTY_ID,
    title: 'February Financial Report',
    type: 'financial_statement',
    filePath: '/uploads/governance/feb-2026-report.pdf',
    meetingId: 'meeting-001',
  };

  it('creates a document as board_member', async () => {
    mockDocumentCreate.mockResolvedValue({ id: 'doc-new', ...validDoc });

    const req = createPostRequest('/api/v1/governance/documents', validDoc);
    const res = await DocumentsPOST(req);
    expect(res.status).toBe(201);
  });

  it('creates a document as property_admin', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);
    mockDocumentCreate.mockResolvedValue({ id: 'doc-new', ...validDoc });

    const req = createPostRequest('/api/v1/governance/documents', validDoc);
    const res = await DocumentsPOST(req);
    expect(res.status).toBe(201);
  });

  it('rejects document upload by resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/documents', validDoc);
    const res = await DocumentsPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/governance/documents', {
      propertyId: PROPERTY_ID,
      type: 'financial_statement',
      filePath: '/uploads/report.pdf',
    });
    const res = await DocumentsPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid document type', async () => {
    const req = createPostRequest('/api/v1/governance/documents', {
      ...validDoc,
      type: 'selfie',
    });
    const res = await DocumentsPOST(req);
    expect(res.status).toBe(400);
  });

  it('stores uploadedBy from authenticated user', async () => {
    mockDocumentCreate.mockResolvedValue({ id: 'doc-new' });

    const req = createPostRequest('/api/v1/governance/documents', validDoc);
    await DocumentsPOST(req);

    expect(mockDocumentCreate.mock.calls[0]![0].data.uploadedBy).toBe(BOARD_USER_ID);
  });
});

// ===========================================================================
// Board member directory with roles
// ===========================================================================

describe('GET /api/v1/governance/members — Board Member Directory', () => {
  const MOCK_MEMBERS = [
    {
      id: 'bm-001',
      propertyId: PROPERTY_ID,
      userId: 'user-001',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      boardRole: 'president',
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2027-06-01'),
      status: 'active',
    },
    {
      id: 'bm-002',
      propertyId: PROPERTY_ID,
      userId: 'user-002',
      name: 'John Doe',
      email: 'john.doe@example.com',
      boardRole: 'treasurer',
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2027-06-01'),
      status: 'active',
    },
    {
      id: 'bm-003',
      propertyId: PROPERTY_ID,
      userId: 'user-003',
      name: 'Alice Lee',
      email: 'alice.lee@example.com',
      boardRole: 'secretary',
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2027-06-01'),
      status: 'active',
    },
    {
      id: 'bm-004',
      propertyId: PROPERTY_ID,
      userId: 'user-004',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      boardRole: 'director',
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2027-06-01'),
      status: 'active',
    },
    {
      id: 'bm-005',
      propertyId: PROPERTY_ID,
      userId: 'user-005',
      name: 'Carol White',
      email: 'carol.white@example.com',
      boardRole: 'director',
      termStart: new Date('2024-06-01'),
      termEnd: new Date('2025-06-01'),
      status: 'expired',
    },
  ];

  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/members');
    const res = await MembersGET(req);
    expect(res.status).toBe(400);
  });

  it('lists all board members', async () => {
    mockBoardMemberFindMany.mockResolvedValue(MOCK_MEMBERS);
    mockBoardMemberCount.mockResolvedValue(5);

    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MembersGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ boardRole: string; name: string }>;
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(5);
    expect(body.meta.total).toBe(5);
  });

  it('includes all role types: president, secretary, treasurer, director', async () => {
    mockBoardMemberFindMany.mockResolvedValue(MOCK_MEMBERS);
    mockBoardMemberCount.mockResolvedValue(5);

    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MembersGET(req);
    const body = await parseResponse<{ data: Array<{ boardRole: string }> }>(res);

    const roles = body.data.map((m) => m.boardRole);
    expect(roles).toContain('president');
    expect(roles).toContain('secretary');
    expect(roles).toContain('treasurer');
    expect(roles).toContain('director');
  });

  it('filters by status', async () => {
    mockBoardMemberFindMany.mockResolvedValue(MOCK_MEMBERS.filter((m) => m.status === 'active'));
    mockBoardMemberCount.mockResolvedValue(4);

    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });
    await MembersGET(req);

    expect(mockBoardMemberFindMany.mock.calls[0]![0].where.status).toBe('active');
  });

  it('filters by boardRole', async () => {
    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID, boardRole: 'director' },
    });
    await MembersGET(req);

    expect(mockBoardMemberFindMany.mock.calls[0]![0].where.boardRole).toBe('director');
  });
});

describe('POST /api/v1/governance/members — Add Board Member', () => {
  const validMember = {
    propertyId: PROPERTY_ID,
    userId: 'user-006',
    name: 'David Park',
    email: 'david.park@example.com',
    boardRole: 'director',
    termStart: '2026-06-01',
    termEnd: '2028-06-01',
  };

  it('creates a board member as property_admin', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);
    mockBoardMemberCreate.mockResolvedValue({ id: 'bm-new', ...validMember, status: 'active' });

    const req = createPostRequest('/api/v1/governance/members', validMember);
    const res = await MembersPOST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('bm-new');
    expect(body.message).toContain('added');
  });

  it('rejects board member creation by resident', async () => {
    mockGuardRoute.mockResolvedValue(residentAuth);

    const req = createPostRequest('/api/v1/governance/members', validMember);
    const res = await MembersPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects invalid boardRole', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);

    const req = createPostRequest('/api/v1/governance/members', {
      ...validMember,
      boardRole: 'ceo',
    });
    const res = await MembersPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing name', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);

    const req = createPostRequest('/api/v1/governance/members', {
      propertyId: PROPERTY_ID,
      userId: 'user-006',
      boardRole: 'director',
      termStart: '2026-06-01',
      termEnd: '2028-06-01',
    });
    const res = await MembersPOST(req);
    expect(res.status).toBe(400);
  });

  it('sets status to active on creation', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);
    mockBoardMemberCreate.mockResolvedValue({ id: 'bm-new', status: 'active' });

    const req = createPostRequest('/api/v1/governance/members', validMember);
    await MembersPOST(req);

    expect(mockBoardMemberCreate.mock.calls[0]![0].data.status).toBe('active');
  });

  it('accepts all valid board roles', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);

    for (const boardRole of ['president', 'vice_president', 'secretary', 'treasurer', 'director']) {
      vi.clearAllMocks();
      mockGuardRoute.mockResolvedValue(adminAuth);
      mockBoardMemberCreate.mockResolvedValue({ id: `bm-${boardRole}`, status: 'active' });

      const req = createPostRequest('/api/v1/governance/members', { ...validMember, boardRole });
      const res = await MembersPOST(req);
      expect(res.status).toBe(201);
    }
  });
});

// ===========================================================================
// Term tracking: start/end dates for board positions
// ===========================================================================

describe('Board Member Term Tracking', () => {
  it('returns term start and end dates', async () => {
    const memberWithTerm = {
      id: 'bm-001',
      propertyId: PROPERTY_ID,
      userId: 'user-001',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      boardRole: 'president',
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2027-06-01'),
      status: 'active',
    };
    mockBoardMemberFindMany.mockResolvedValue([memberWithTerm]);
    mockBoardMemberCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await MembersGET(req);
    const body = await parseResponse<{
      data: Array<{ termStart: string; termEnd: string }>;
    }>(res);

    expect(body.data[0]!.termStart).toBeDefined();
    expect(body.data[0]!.termEnd).toBeDefined();
  });

  it('identifies expired terms via status', async () => {
    const expiredMember = {
      id: 'bm-expired',
      propertyId: PROPERTY_ID,
      userId: 'user-expired',
      name: 'Past Member',
      email: 'past@example.com',
      boardRole: 'director',
      termStart: new Date('2023-06-01'),
      termEnd: new Date('2025-06-01'),
      status: 'expired',
    };
    mockBoardMemberFindMany.mockResolvedValue([expiredMember]);
    mockBoardMemberCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_ID, status: 'expired' },
    });
    const res = await MembersGET(req);
    const body = await parseResponse<{
      data: Array<{ status: string; termEnd: string }>;
    }>(res);

    expect(body.data[0]!.status).toBe('expired');
  });

  it('requires termStart and termEnd when creating a board member', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);

    const req = createPostRequest('/api/v1/governance/members', {
      propertyId: PROPERTY_ID,
      userId: 'user-006',
      name: 'David Park',
      email: 'david@example.com',
      boardRole: 'director',
      // Missing termStart and termEnd
    });
    const res = await MembersPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects termEnd before termStart', async () => {
    mockGuardRoute.mockResolvedValue(adminAuth);

    const req = createPostRequest('/api/v1/governance/members', {
      propertyId: PROPERTY_ID,
      userId: 'user-006',
      name: 'David Park',
      email: 'david@example.com',
      boardRole: 'director',
      termStart: '2028-06-01',
      termEnd: '2026-06-01',
    });
    const res = await MembersPOST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// Tenant isolation
// ===========================================================================

describe('Tenant Isolation — Governance', () => {
  it('scopes meetings to propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await MeetingsGET(req);

    expect(mockMeetingFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });

  it('stores propertyId on new meeting', async () => {
    mockMeetingCreate.mockResolvedValue({ id: 'meeting-new', status: 'scheduled' });

    const req = createPostRequest('/api/v1/governance/meetings', {
      propertyId: PROPERTY_ID,
      title: 'Tenant test meeting',
      scheduledAt: '2026-05-20T18:00:00Z',
    });
    await MeetingsPOST(req);

    expect(mockMeetingCreate.mock.calls[0]![0].data.propertyId).toBe(PROPERTY_ID);
  });

  it('scopes documents to propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/documents', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await DocumentsGET(req);

    expect(mockDocumentFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });

  it('scopes board members to propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/members', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await MembersGET(req);

    expect(mockBoardMemberFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });
});

// ===========================================================================
// Pagination
// ===========================================================================

describe('Pagination — Governance', () => {
  it('supports pagination on meetings', async () => {
    mockMeetingCount.mockResolvedValue(25);
    mockMeetingFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await MeetingsGET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalPages).toBe(3);
  });

  it('defaults meetings to page 1 with 20 items', async () => {
    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await MeetingsGET(req);

    const call = mockMeetingFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(0);
    expect(call.take).toBe(20);
  });

  it('computes correct skip for resolutions page 3', async () => {
    mockResolutionCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/governance/resolutions', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '10' },
    });
    await ResolutionsGET(req);

    const call = mockResolutionFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
  });
});
