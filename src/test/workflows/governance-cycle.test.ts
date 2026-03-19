/**
 * Integration Workflow Tests — Board Governance Lifecycle
 *
 * Tests complete board governance workflows across multiple API endpoints:
 *   - Board meeting lifecycle (schedule -> agenda -> attend -> minutes -> complete)
 *   - Resolution voting (propose -> vote -> threshold -> pass/fail)
 *   - Failed resolution (insufficient votes -> tabled for future)
 *
 * Each test validates status transitions, vote tallying, and access control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockBoardMeetingCreate = vi.fn();
const mockBoardMeetingFindMany = vi.fn();
const mockBoardMeetingCount = vi.fn();
const mockBoardMeetingFindUnique = vi.fn();
const mockBoardMeetingUpdate = vi.fn();

const mockBoardResolutionCreate = vi.fn();
const mockBoardResolutionFindMany = vi.fn();
const mockBoardResolutionCount = vi.fn();
const mockBoardResolutionFindUnique = vi.fn();
const mockBoardResolutionUpdate = vi.fn();

const mockBoardVoteCreate = vi.fn();
const mockBoardVoteFindFirst = vi.fn();
const mockBoardVoteFindMany = vi.fn();

const mockMeetingMinutesCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    boardMeeting: {
      create: (...args: unknown[]) => mockBoardMeetingCreate(...args),
      findMany: (...args: unknown[]) => mockBoardMeetingFindMany(...args),
      count: (...args: unknown[]) => mockBoardMeetingCount(...args),
      findUnique: (...args: unknown[]) => mockBoardMeetingFindUnique(...args),
      update: (...args: unknown[]) => mockBoardMeetingUpdate(...args),
    },
    boardResolution: {
      create: (...args: unknown[]) => mockBoardResolutionCreate(...args),
      findMany: (...args: unknown[]) => mockBoardResolutionFindMany(...args),
      count: (...args: unknown[]) => mockBoardResolutionCount(...args),
      findUnique: (...args: unknown[]) => mockBoardResolutionFindUnique(...args),
      update: (...args: unknown[]) => mockBoardResolutionUpdate(...args),
    },
    boardVote: {
      create: (...args: unknown[]) => mockBoardVoteCreate(...args),
      findFirst: (...args: unknown[]) => mockBoardVoteFindFirst(...args),
      findMany: (...args: unknown[]) => mockBoardVoteFindMany(...args),
    },
    meetingMinutes: {
      create: (...args: unknown[]) => mockMeetingMinutesCreate(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'board-member-001',
      propertyId: 'prop-001',
      role: 'board_member',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listGovernance, POST as createGovernance } from '@/app/api/v1/governance/route';
import {
  GET as getGovernanceItem,
  PATCH as updateGovernanceItem,
} from '@/app/api/v1/governance/[id]/route';
import { GET as listMeetings, POST as createMeeting } from '@/app/api/v1/governance/meetings/route';
import { POST as recordMinutes } from '@/app/api/v1/governance/meetings/minutes/route';
import { GET as getVotes, POST as castVote } from '@/app/api/v1/governance/meetings/votes/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-a000-000000000001';
const MEETING_ID = '00000000-0000-4000-a000-000000000010';
const RESOLUTION_ID = '00000000-0000-4000-a000-000000000020';
const AGENDA_ITEM_ID = 'agenda-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeeting(overrides: Record<string, unknown> = {}) {
  return {
    id: MEETING_ID,
    propertyId: PROPERTY_ID,
    title: 'Q1 2026 Board Meeting',
    description: 'Quarterly board meeting to discuss budget and maintenance.',
    scheduledAt: new Date('2026-04-01T18:00:00Z'),
    location: 'Meeting Room B, 2nd Floor',
    type: 'regular',
    status: 'scheduled',
    createdBy: 'board-member-001',
    deletedAt: null,
    agendaItems: [],
    votes: [],
    minutes: [],
    resolutions: [],
    documents: [],
    _count: { votes: 0, minutes: 0 },
    ...overrides,
  };
}

function makeResolution(overrides: Record<string, unknown> = {}) {
  return {
    id: RESOLUTION_ID,
    propertyId: PROPERTY_ID,
    title: 'Approve 2026 Budget Allocation',
    description: 'Allocate $50,000 for lobby renovation.',
    status: 'pending',
    meetingId: MEETING_ID,
    implementationDeadline: null,
    approvedAt: null,
    createdBy: 'board-member-001',
    deletedAt: null,
    meeting: {
      id: MEETING_ID,
      title: 'Q1 2026 Board Meeting',
      scheduledAt: new Date('2026-04-01T18:00:00Z'),
      status: 'scheduled',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Board Meeting Lifecycle
// ===========================================================================

describe('Scenario 1: Board Meeting Lifecycle (schedule -> agenda -> attend -> minutes -> complete)', () => {
  it('Step 1: admin schedules meeting via POST /governance (type=meeting)', async () => {
    mockBoardMeetingCreate.mockResolvedValue(makeMeeting());

    const req = createPostRequest('/api/v1/governance', {
      type: 'meeting',
      propertyId: PROPERTY_ID,
      title: 'Q1 2026 Board Meeting',
      description: 'Quarterly board meeting to discuss budget and maintenance.',
      scheduledAt: '2026-04-01T18:00:00Z',
      location: 'Meeting Room B, 2nd Floor',
      meetingType: 'regular',
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; title: string }; message: string }>(
      res,
    );
    expect(body.data.status).toBe('scheduled');
    expect(body.data.title).toBe('Q1 2026 Board Meeting');
    expect(body.message).toContain('Meeting created');
  });

  it('Step 1b: meeting creation stores correct fields', async () => {
    mockBoardMeetingCreate.mockResolvedValue(makeMeeting());

    await createGovernance(
      createPostRequest('/api/v1/governance', {
        type: 'meeting',
        propertyId: PROPERTY_ID,
        title: 'Q1 2026 Board Meeting',
        scheduledAt: '2026-04-01T18:00:00Z',
        meetingType: 'regular',
      }),
    );

    expect(mockBoardMeetingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          status: 'scheduled',
          type: 'regular',
          createdBy: 'board-member-001',
        }),
      }),
    );
  });

  it('Step 2: meeting appears in listing via GET /governance?type=meetings', async () => {
    mockBoardMeetingFindMany.mockResolvedValue([makeMeeting()]);
    mockBoardMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance', {
      searchParams: { propertyId: PROPERTY_ID, type: 'meetings' },
    });

    const res = await listGovernance(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('Step 3: meeting also listed via GET /governance/meetings', async () => {
    mockBoardMeetingFindMany.mockResolvedValue([makeMeeting()]);
    mockBoardMeetingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance/meetings', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listMeetings(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; title: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.title).toBe('Q1 2026 Board Meeting');
  });

  it('Step 4: record attendance and minutes via POST /governance/meetings/minutes', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting({ status: 'in_progress' }));
    mockMeetingMinutesCreate.mockResolvedValue({
      id: 'minutes-001',
      meetingId: MEETING_ID,
      propertyId: PROPERTY_ID,
      content: 'Meeting opened at 6pm. Budget discussion...',
      attendees: ['board-member-001', 'board-member-002', 'board-member-003'],
      recordedBy: 'board-member-001',
    });

    const req = createPostRequest('/api/v1/governance/meetings/minutes', {
      meetingId: MEETING_ID,
      propertyId: PROPERTY_ID,
      content:
        'Meeting opened at 6pm. Budget discussion followed by maintenance updates. All items passed.',
      attendees: ['board-member-001', 'board-member-002', 'board-member-003'],
    });

    const res = await recordMinutes(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.message).toContain('Minutes recorded');
  });

  it('Step 5: mark meeting as completed via PATCH /governance/:id', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting({ status: 'in_progress' }));
    mockBoardMeetingUpdate.mockResolvedValue(makeMeeting({ status: 'completed' }));

    const req = createPatchRequest(`/api/v1/governance/${MEETING_ID}`, {
      entityType: 'meeting',
      status: 'completed',
    });

    const res = await updateGovernanceItem(req, { params: Promise.resolve({ id: MEETING_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('completed');
    expect(body.message).toContain('Meeting updated');
  });

  it('Step 6: retrieve meeting detail with agenda, votes, minutes via GET /governance/:id', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(
      makeMeeting({
        status: 'completed',
        agendaItems: [
          { id: AGENDA_ITEM_ID, title: 'Budget Approval', description: null, sortOrder: 1 },
          { id: 'agenda-002', title: 'Maintenance Plan', description: null, sortOrder: 2 },
        ],
        votes: [
          { id: 'v1', agendaItemId: AGENDA_ITEM_ID, vote: 'approve', voterId: 'board-member-001' },
          { id: 'v2', agendaItemId: AGENDA_ITEM_ID, vote: 'approve', voterId: 'board-member-002' },
          { id: 'v3', agendaItemId: AGENDA_ITEM_ID, vote: 'reject', voterId: 'board-member-003' },
        ],
        minutes: [{ id: 'minutes-001', content: 'Full minutes...', createdAt: new Date() }],
        resolutions: [
          { id: RESOLUTION_ID, title: 'Budget', status: 'approved', createdAt: new Date() },
        ],
        documents: [],
      }),
    );
    mockBoardResolutionFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/governance/${MEETING_ID}`);
    const res = await getGovernanceItem(req, { params: Promise.resolve({ id: MEETING_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        entityType: string;
        agendaItems: { voteTally: { approve: number; reject: number } }[];
        minutes: { id: string }[];
      };
    }>(res);
    expect(body.data.entityType).toBe('meeting');
    expect(body.data.agendaItems).toHaveLength(2);
    expect(body.data.agendaItems[0]!.voteTally.approve).toBe(2);
    expect(body.data.agendaItems[0]!.voteTally.reject).toBe(1);
    expect(body.data.minutes).toHaveLength(1);
  });

  it('full workflow: create -> in_progress -> record minutes -> complete', async () => {
    // Create
    mockBoardMeetingCreate.mockResolvedValue(makeMeeting());
    const createRes = await createGovernance(
      createPostRequest('/api/v1/governance', {
        type: 'meeting',
        propertyId: PROPERTY_ID,
        title: 'Q1 2026 Board Meeting',
        scheduledAt: '2026-04-01T18:00:00Z',
      }),
    );
    expect(createRes.status).toBe(201);

    // Move to in_progress
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting({ status: 'scheduled' }));
    mockBoardMeetingUpdate.mockResolvedValue(makeMeeting({ status: 'in_progress' }));
    const progressRes = await updateGovernanceItem(
      createPatchRequest(`/api/v1/governance/${MEETING_ID}`, {
        entityType: 'meeting',
        status: 'in_progress',
      }),
      { params: Promise.resolve({ id: MEETING_ID }) },
    );
    expect(progressRes.status).toBe(200);

    // Record minutes
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting({ status: 'in_progress' }));
    mockMeetingMinutesCreate.mockResolvedValue({ id: 'min-1' });
    const minutesRes = await recordMinutes(
      createPostRequest('/api/v1/governance/meetings/minutes', {
        meetingId: MEETING_ID,
        propertyId: PROPERTY_ID,
        content: 'Full meeting notes covering all agenda items discussed at the board meeting.',
      }),
    );
    expect(minutesRes.status).toBe(201);

    // Complete
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting({ status: 'in_progress' }));
    mockBoardMeetingUpdate.mockResolvedValue(makeMeeting({ status: 'completed' }));
    const completeRes = await updateGovernanceItem(
      createPatchRequest(`/api/v1/governance/${MEETING_ID}`, {
        entityType: 'meeting',
        status: 'completed',
      }),
      { params: Promise.resolve({ id: MEETING_ID }) },
    );
    expect(completeRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 2: Resolution Voting (propose -> vote -> pass)
// ===========================================================================

describe('Scenario 2: Resolution Voting (propose -> vote -> threshold met -> passed)', () => {
  it('Step 1: board member proposes resolution via POST /governance (type=resolution)', async () => {
    mockBoardResolutionCreate.mockResolvedValue(makeResolution());
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());

    const req = createPostRequest('/api/v1/governance', {
      type: 'resolution',
      propertyId: PROPERTY_ID,
      title: 'Approve 2026 Budget Allocation',
      description: 'Allocate $50,000 for lobby renovation.',
      meetingId: MEETING_ID,
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; title: string }; message: string }>(
      res,
    );
    expect(body.data.status).toBe('pending');
    expect(body.message).toContain('Resolution created');
  });

  it('Step 1b: resolution linked to meeting when meetingId provided', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardResolutionCreate.mockResolvedValue(makeResolution());

    await createGovernance(
      createPostRequest('/api/v1/governance', {
        type: 'resolution',
        propertyId: PROPERTY_ID,
        title: 'Approve 2026 Budget Allocation',
        meetingId: MEETING_ID,
      }),
    );

    expect(mockBoardResolutionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meetingId: MEETING_ID,
          status: 'pending',
        }),
      }),
    );
  });

  it('Step 2: board member casts approve vote via POST /governance/meetings/votes', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardVoteFindFirst.mockResolvedValue(null);
    mockBoardVoteCreate.mockResolvedValue({
      id: 'vote-001',
      meetingId: MEETING_ID,
      agendaItemId: AGENDA_ITEM_ID,
      propertyId: PROPERTY_ID,
      vote: 'approve',
      voterId: 'board-member-001',
    });

    const req = createPostRequest('/api/v1/governance/meetings/votes', {
      meetingId: MEETING_ID,
      agendaItemId: AGENDA_ITEM_ID,
      propertyId: PROPERTY_ID,
      vote: 'approve',
    });

    const res = await castVote(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { vote: string }; message: string }>(res);
    expect(body.data.vote).toBe('approve');
    expect(body.message).toContain('Vote recorded');
  });

  it('Step 2b: duplicate vote is rejected with 409', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardVoteFindFirst.mockResolvedValue({
      id: 'vote-existing',
      vote: 'approve',
      voterId: 'board-member-001',
    });

    const req = createPostRequest('/api/v1/governance/meetings/votes', {
      meetingId: MEETING_ID,
      agendaItemId: AGENDA_ITEM_ID,
      propertyId: PROPERTY_ID,
      vote: 'approve',
    });

    const res = await castVote(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('DUPLICATE_VOTE');
  });

  it('Step 3: vote tally shows majority approve via GET /governance/meetings/votes', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'board-member-001' },
      { id: 'v2', vote: 'approve', voterId: 'board-member-002' },
      { id: 'v3', vote: 'approve', voterId: 'board-member-003' },
      { id: 'v4', vote: 'reject', voterId: 'board-member-004' },
      { id: 'v5', vote: 'abstain', voterId: 'board-member-005' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: {
        propertyId: PROPERTY_ID,
        meetingId: MEETING_ID,
        agendaItemId: AGENDA_ITEM_ID,
      },
    });

    const res = await getVotes(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        tally: { approve: number; reject: number; abstain: number; total: number };
        result: string;
      };
    }>(res);
    expect(body.data.tally.approve).toBe(3);
    expect(body.data.tally.reject).toBe(1);
    expect(body.data.tally.abstain).toBe(1);
    expect(body.data.tally.total).toBe(5);
    expect(body.data.result).toBe('passed');
  });

  it('Step 4: resolution marked as approved via PATCH /governance/:id', async () => {
    mockBoardResolutionFindUnique.mockResolvedValue(makeResolution({ status: 'pending' }));
    mockBoardMeetingFindUnique.mockResolvedValue(null);
    mockBoardResolutionUpdate.mockResolvedValue(
      makeResolution({ status: 'approved', approvedAt: new Date() }),
    );

    const req = createPatchRequest(`/api/v1/governance/${RESOLUTION_ID}`, {
      entityType: 'resolution',
      status: 'approved',
    });

    const res = await updateGovernanceItem(req, { params: Promise.resolve({ id: RESOLUTION_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('approved');
    expect(body.message).toContain('Resolution updated');
  });

  it('Step 4b: approved resolution sets approvedAt timestamp', async () => {
    mockBoardResolutionFindUnique.mockResolvedValue(makeResolution({ status: 'pending' }));
    mockBoardMeetingFindUnique.mockResolvedValue(null);
    mockBoardResolutionUpdate.mockResolvedValue(makeResolution({ status: 'approved' }));

    await updateGovernanceItem(
      createPatchRequest(`/api/v1/governance/${RESOLUTION_ID}`, {
        entityType: 'resolution',
        status: 'approved',
      }),
      { params: Promise.resolve({ id: RESOLUTION_ID }) },
    );

    expect(mockBoardResolutionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'approved',
          approvedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('Step 5: resolution appears in listing via GET /governance?type=resolutions', async () => {
    mockBoardResolutionFindMany.mockResolvedValue([makeResolution({ status: 'approved' })]);
    mockBoardResolutionCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/governance', {
      searchParams: { propertyId: PROPERTY_ID, type: 'resolutions' },
    });

    const res = await listGovernance(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; status: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.status).toBe('approved');
  });

  it('resolution detail accessible via GET /governance/:id', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(null);
    mockBoardResolutionFindUnique.mockResolvedValue(makeResolution({ status: 'approved' }));

    const req = createGetRequest(`/api/v1/governance/${RESOLUTION_ID}`);
    const res = await getGovernanceItem(req, { params: Promise.resolve({ id: RESOLUTION_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { entityType: string; title: string; meeting: { title: string } };
    }>(res);
    expect(body.data.entityType).toBe('resolution');
    expect(body.data.meeting.title).toBe('Q1 2026 Board Meeting');
  });
});

// ===========================================================================
// SCENARIO 3: Failed Resolution
// ===========================================================================

describe('Scenario 3: Failed Resolution (insufficient votes -> rejected)', () => {
  it('vote tally shows majority reject', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'reject', voterId: 'board-member-001' },
      { id: 'v2', vote: 'reject', voterId: 'board-member-002' },
      { id: 'v3', vote: 'reject', voterId: 'board-member-003' },
      { id: 'v4', vote: 'approve', voterId: 'board-member-004' },
      { id: 'v5', vote: 'abstain', voterId: 'board-member-005' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: { propertyId: PROPERTY_ID, meetingId: MEETING_ID },
    });

    const res = await getVotes(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { tally: { approve: number; reject: number }; result: string };
    }>(res);
    expect(body.data.tally.reject).toBeGreaterThan(body.data.tally.approve);
    expect(body.data.result).toBe('failed');
  });

  it('resolution marked as rejected via PATCH', async () => {
    mockBoardResolutionFindUnique.mockResolvedValue(makeResolution({ status: 'pending' }));
    mockBoardMeetingFindUnique.mockResolvedValue(null);
    mockBoardResolutionUpdate.mockResolvedValue(makeResolution({ status: 'rejected' }));

    const req = createPatchRequest(`/api/v1/governance/${RESOLUTION_ID}`, {
      entityType: 'resolution',
      status: 'rejected',
    });

    const res = await updateGovernanceItem(req, { params: Promise.resolve({ id: RESOLUTION_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('rejected');
  });

  it('vote tally shows tie result', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(makeMeeting());
    mockBoardVoteFindMany.mockResolvedValue([
      { id: 'v1', vote: 'approve', voterId: 'board-member-001' },
      { id: 'v2', vote: 'reject', voterId: 'board-member-002' },
      { id: 'v3', vote: 'abstain', voterId: 'board-member-003' },
    ]);

    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: { propertyId: PROPERTY_ID, meetingId: MEETING_ID },
    });

    const res = await getVotes(req);
    const body = await parseResponse<{
      data: { tally: { approve: number; reject: number }; result: string };
    }>(res);

    expect(body.data.tally.approve).toBe(1);
    expect(body.data.tally.reject).toBe(1);
    expect(body.data.result).toBe('tie');
  });

  it('rejected resolution can be re-proposed as new resolution for future meeting', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(
      makeMeeting({ id: '00000000-0000-4000-a000-000000000011' }),
    );
    mockBoardResolutionCreate.mockResolvedValue(
      makeResolution({
        id: 'resolution-002',
        meetingId: '00000000-0000-4000-a000-000000000011',
        title: 'Revised Budget Allocation (Re-proposed)',
        status: 'pending',
      }),
    );

    const req = createPostRequest('/api/v1/governance', {
      type: 'resolution',
      propertyId: PROPERTY_ID,
      title: 'Revised Budget Allocation (Re-proposed)',
      description: 'Revised from previous failed resolution. Reduced scope to $30,000.',
      meetingId: '00000000-0000-4000-a000-000000000011',
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; title: string } }>(res);
    expect(body.data.status).toBe('pending');
    expect(body.data.title).toContain('Re-proposed');
  });
});

// ===========================================================================
// Cross-Scenario: Validation and Edge Cases
// ===========================================================================

describe('Governance: Validation & Edge Cases', () => {
  it('should reject meeting creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/governance', {
      type: 'meeting',
      title: 'Test Meeting',
      scheduledAt: '2026-04-01T18:00:00Z',
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject meeting creation without title', async () => {
    const req = createPostRequest('/api/v1/governance', {
      type: 'meeting',
      propertyId: PROPERTY_ID,
      scheduledAt: '2026-04-01T18:00:00Z',
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(400);
  });

  it('should reject resolution with invalid meetingId', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/governance', {
      type: 'resolution',
      propertyId: PROPERTY_ID,
      title: 'Some Resolution',
      meetingId: '00000000-0000-4000-a000-999999999999',
    });

    const res = await createGovernance(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('listing governance requires propertyId', async () => {
    const req = createGetRequest('/api/v1/governance', {
      searchParams: { type: 'meetings' },
    });

    const res = await listGovernance(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('listing governance requires valid type', async () => {
    const req = createGetRequest('/api/v1/governance', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listGovernance(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for nonexistent governance item', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(null);
    mockBoardResolutionFindUnique.mockResolvedValue(null);

    const res = await getGovernanceItem(createGetRequest('/api/v1/governance/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 404 when recording minutes for nonexistent meeting', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(null);

    const res = await recordMinutes(
      createPostRequest('/api/v1/governance/meetings/minutes', {
        meetingId: 'nonexistent',
        propertyId: PROPERTY_ID,
        content: 'This should fail because the meeting does not exist in our system.',
      }),
    );
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MEETING_NOT_FOUND');
  });

  it('should reject vote for nonexistent meeting', async () => {
    mockBoardMeetingFindUnique.mockResolvedValue(null);

    const res = await castVote(
      createPostRequest('/api/v1/governance/meetings/votes', {
        meetingId: 'nonexistent',
        agendaItemId: AGENDA_ITEM_ID,
        propertyId: PROPERTY_ID,
        vote: 'approve',
      }),
    );
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MEETING_NOT_FOUND');
  });

  it('vote tally requires meetingId', async () => {
    const req = createGetRequest('/api/v1/governance/meetings/votes', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getVotes(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_MEETING');
  });

  it('meeting listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/governance/meetings');
    const res = await listMeetings(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});
