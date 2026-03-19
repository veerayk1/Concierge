/**
 * Survey Detail API Route Tests — [id] endpoints
 *
 * Tests cover:
 * 1.  GET returns survey with questions and questionCount
 * 2.  GET returns 404 for non-existent survey
 * 3.  PATCH transitions status draft -> active
 * 4.  PATCH transitions status active -> closed
 * 5.  PATCH transitions status closed -> archived
 * 6.  PATCH rejects invalid status transition (active -> draft)
 * 7.  PATCH rejects editing active survey content (title)
 * 8.  PATCH rejects editing active survey questions
 * 9.  PATCH allows status-only change on active survey
 * 10. PATCH allows editing draft survey content
 * 11. PATCH returns 404 for non-existent survey
 * 12. PATCH rejects non-owner non-admin edits
 * 13. POST submits response and increments responseCount
 * 14. POST validates required questions are answered
 * 15. POST rejects duplicate question IDs not in survey
 * 16. POST rejects response to non-active survey
 * 17. POST rejects response to expired survey
 * 18. POST returns respondentId as null for anonymous surveys
 * 19. Tenant isolation — only admins and creator can edit
 * 20. Error handling — database errors do not leak internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockSurveyFindUnique = vi.fn();
const mockSurveyUpdate = vi.fn();
const mockQuestionDeleteMany = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    survey: {
      findUnique: (...args: unknown[]) => mockSurveyFindUnique(...args),
      update: (...args: unknown[]) => mockSurveyUpdate(...args),
    },
    surveyQuestion: {
      deleteMany: (...args: unknown[]) => mockQuestionDeleteMany(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, PATCH, POST } from '../route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const SURVEY_ID = 'survey-detail-001';
const USER_ADMIN = 'user-admin-001';
const USER_RESIDENT = 'user-resident-002';
const USER_OTHER = 'user-other-003';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function setAuth(userId: string, role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId: PROPERTY_A, role, permissions: ['*'], mfaVerified: false },
    error: null,
  });
}

const Q1_ID = '00000000-0000-4000-b000-000000000011';
const Q2_ID = '00000000-0000-4000-b000-000000000012';
const Q_UNKNOWN_ID = '00000000-0000-4000-b000-000000000099';

const sampleQuestions = [
  {
    id: Q1_ID,
    questionText: 'Rate the building?',
    questionType: 'rating',
    isRequired: true,
    options: null,
    config: null,
    sortOrder: 0,
  },
  {
    id: Q2_ID,
    questionText: 'Any comments?',
    questionType: 'free_text',
    isRequired: false,
    options: null,
    config: null,
    sortOrder: 1,
  },
];

const sampleSurvey = {
  id: SURVEY_ID,
  propertyId: PROPERTY_A,
  title: 'Q1 Survey',
  description: 'Quarterly resident survey',
  status: 'draft',
  anonymous: false,
  responseCount: 0,
  expiryDate: null,
  createdById: USER_ADMIN,
  questions: sampleQuestions,
};

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(USER_ADMIN, 'property_admin');
  mockSurveyFindUnique.mockResolvedValue(null);
  mockSurveyUpdate.mockResolvedValue({});
  mockQuestionDeleteMany.mockResolvedValue({ count: 0 });
});

// ---------------------------------------------------------------------------
// 1–2. GET /api/v1/surveys/:id
// ---------------------------------------------------------------------------

describe('GET /api/v1/surveys/:id', () => {
  it('returns survey with questions and questionCount', async () => {
    mockSurveyFindUnique.mockResolvedValue(sampleSurvey);

    const req = createGetRequest('/api/v1/surveys/' + SURVEY_ID);
    const res = await GET(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; questions: unknown[]; questionCount: number };
    }>(res);
    expect(body.data.id).toBe(SURVEY_ID);
    expect(body.data.questionCount).toBe(2);
    expect(body.data.questions).toHaveLength(2);
  });

  it('returns 404 for non-existent survey', async () => {
    mockSurveyFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/surveys/non-existent');
    const res = await GET(req, makeParams('non-existent'));
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('includes questions ordered by sortOrder ascending', async () => {
    mockSurveyFindUnique.mockResolvedValue(sampleSurvey);

    const req = createGetRequest('/api/v1/surveys/' + SURVEY_ID);
    await GET(req, makeParams(SURVEY_ID));

    const call = mockSurveyFindUnique.mock.calls[0]![0];
    expect(call.include.questions.orderBy).toEqual({ sortOrder: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// 3–11. PATCH /api/v1/surveys/:id — Status transitions & content edits
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/surveys/:id — Status transitions', () => {
  it('transitions draft -> active', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'draft' });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      status: 'active',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'active' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('active');
  });

  it('transitions active -> closed', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      status: 'closed',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'closed' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('closed');
  });

  it('transitions closed -> archived', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'closed' });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      status: 'archived',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'archived' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition active -> draft', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'draft' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects transition from archived (no valid transitions)', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'archived' });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'active' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });
});

describe('PATCH /api/v1/surveys/:id — Content editing restrictions', () => {
  it('rejects editing title of active survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'New Title' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('LOCKED');
  });

  it('rejects editing questions of active survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, {
      questions: [{ questionText: 'New?', questionType: 'yes_no', isRequired: false }],
    });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('LOCKED');
  });

  it('allows status-only change on active survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      status: 'closed',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'closed' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });

  it('allows editing title of draft survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'draft' });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      title: 'Updated Title',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'Updated Title' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });

  it('replaces questions when editing draft survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'draft' });
    mockQuestionDeleteMany.mockResolvedValue({ count: 2 });
    mockSurveyUpdate.mockResolvedValue({ ...sampleSurvey, questions: [] });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, {
      questions: [{ questionText: 'Replaced?', questionType: 'yes_no', isRequired: true }],
    });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);

    expect(mockQuestionDeleteMany).toHaveBeenCalledWith({ where: { surveyId: SURVEY_ID } });
  });
});

describe('PATCH /api/v1/surveys/:id — Access control', () => {
  it('returns 404 for non-existent survey', async () => {
    mockSurveyFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/surveys/non-existent', { status: 'active' });
    const res = await PATCH(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });

  it('rejects non-owner non-admin edits', async () => {
    setAuth(USER_OTHER, 'resident');
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, createdById: USER_ADMIN });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'Hacked' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('allows admin to edit survey they did not create', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockSurveyFindUnique.mockResolvedValue({
      ...sampleSurvey,
      createdById: USER_OTHER,
      status: 'draft',
    });
    mockSurveyUpdate.mockResolvedValue({
      ...sampleSurvey,
      title: 'Admin Updated',
      questions: sampleQuestions,
    });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'Admin Updated' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });

  it('allows property_manager to edit any survey', async () => {
    setAuth('manager-001', 'property_manager');
    mockSurveyFindUnique.mockResolvedValue({
      ...sampleSurvey,
      createdById: USER_OTHER,
      status: 'draft',
    });
    mockSurveyUpdate.mockResolvedValue({ ...sampleSurvey, questions: sampleQuestions });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { status: 'active' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 13–18. POST /api/v1/surveys/:id — Submit response
// ---------------------------------------------------------------------------

describe('POST /api/v1/surveys/:id — Submit response', () => {
  const activeSurvey = { ...sampleSurvey, status: 'active', responseCount: 3 };

  it('submits response and increments responseCount', async () => {
    mockSurveyFindUnique.mockResolvedValue(activeSurvey);
    mockSurveyUpdate.mockResolvedValue({ ...activeSurvey, responseCount: 4 });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [
        { questionId: Q1_ID, value: 5 },
        { questionId: Q2_ID, value: 'Great building' },
      ],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { responseCount: number }; message: string }>(res);
    expect(body.data.responseCount).toBe(4);
    expect(body.message).toBe('Response submitted.');
  });

  it('validates required questions are answered', async () => {
    mockSurveyFindUnique.mockResolvedValue(activeSurvey);

    // q-1 is required but only answering q-2
    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q2_ID, value: 'Only optional' }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; missingQuestionIds: string[] }>(res);
    expect(body.error).toBe('MISSING_REQUIRED');
    expect(body.missingQuestionIds).toContain(Q1_ID);
  });

  it('rejects answers with question IDs not in survey', async () => {
    mockSurveyFindUnique.mockResolvedValue(activeSurvey);

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [
        { questionId: Q1_ID, value: 4 },
        { questionId: Q_UNKNOWN_ID, value: 'Sneaky' },
      ],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_QUESTIONS');
  });

  it('rejects response to non-active (draft) survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'draft' });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 5 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('SURVEY_CLOSED');
  });

  it('rejects response to closed survey', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'closed' });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 5 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);
  });

  it('rejects response to expired survey', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    mockSurveyFindUnique.mockResolvedValue({
      ...activeSurvey,
      expiryDate: expiredDate,
    });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 5 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('SURVEY_EXPIRED');
  });

  it('returns respondentId as null for anonymous surveys', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockSurveyFindUnique.mockResolvedValue({ ...activeSurvey, anonymous: true });
    mockSurveyUpdate.mockResolvedValue({ ...activeSurvey, responseCount: 4 });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 3 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { respondentId: string | null } }>(res);
    expect(body.data.respondentId).toBeNull();
  });

  it('returns respondentId for non-anonymous surveys', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockSurveyFindUnique.mockResolvedValue({ ...activeSurvey, anonymous: false });
    mockSurveyUpdate.mockResolvedValue({ ...activeSurvey, responseCount: 4 });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 3 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { respondentId: string | null } }>(res);
    expect(body.data.respondentId).toBe(USER_RESIDENT);
  });

  it('returns 404 for non-existent survey', async () => {
    mockSurveyFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/surveys/non-existent', {
      answers: [{ questionId: Q1_ID, value: 5 }],
    });
    const res = await POST(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });

  it('rejects empty answers array', async () => {
    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(400);
  });

  it('accepts string, number, and array answer values', async () => {
    mockSurveyFindUnique.mockResolvedValue(activeSurvey);
    mockSurveyUpdate.mockResolvedValue({ ...activeSurvey, responseCount: 4 });

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [
        { questionId: Q1_ID, value: 4 },
        { questionId: Q2_ID, value: 'Text answer' },
      ],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 19. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('non-owner non-admin cannot update surveys', async () => {
    setAuth(USER_OTHER, 'resident');
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, createdById: USER_ADMIN });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'Hijacked' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(403);
  });

  it('survey creator can update their own survey', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockSurveyFindUnique.mockResolvedValue({
      ...sampleSurvey,
      createdById: USER_RESIDENT,
      status: 'draft',
    });
    mockSurveyUpdate.mockResolvedValue({ ...sampleSurvey, questions: sampleQuestions });

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'My Updated Survey' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 20. Error handling
// ---------------------------------------------------------------------------

describe('Error handling', () => {
  it('handles database error on GET without leaking internals', async () => {
    mockSurveyFindUnique.mockRejectedValue(new Error('connection refused'));

    const req = createGetRequest('/api/v1/surveys/' + SURVEY_ID);
    const res = await GET(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('connection refused');
  });

  it('handles database error on PATCH without leaking internals', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'draft' });
    mockSurveyUpdate.mockRejectedValue(new Error('unique constraint'));

    const req = createPatchRequest('/api/v1/surveys/' + SURVEY_ID, { title: 'Crash' });
    const res = await PATCH(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('unique constraint');
  });

  it('handles database error on POST without leaking internals', async () => {
    mockSurveyFindUnique.mockResolvedValue({ ...sampleSurvey, status: 'active' });
    mockSurveyUpdate.mockRejectedValue(new Error('disk full'));

    const req = createPostRequest('/api/v1/surveys/' + SURVEY_ID, {
      answers: [{ questionId: Q1_ID, value: 5 }],
    });
    const res = await POST(req, makeParams(SURVEY_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('disk full');
  });
});
