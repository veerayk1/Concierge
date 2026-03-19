/**
 * Survey API Tests — Comprehensive coverage
 *
 * Covers:
 * 1. GET /surveys — list surveys sorted by createdAt
 * 2. GET /surveys — filter by status (draft, active, closed, archived/expired)
 * 3. POST /surveys — create survey with title, description, type, questions
 * 4. POST /surveys — validates title length (min 1, max 200)
 * 5. POST /surveys — validates at least 1 question
 * 6. POST /surveys — question types: multiple_choice, free_text, rating, yes_no, checkbox, ranking
 * 7. POST /surveys — question structure: { questionText, questionType, options?, isRequired }
 * 8. POST /surveys — sets status to "draft" initially
 * 9. POST /surveys — anonymous survey option
 * 10. POST /surveys — visibility settings (visibleToOwners, visibleToTenants)
 * 11. Tenant isolation
 * 12. XSS sanitization
 * 13. Error handling
 * 25+ tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockSurveyFindMany = vi.fn();
const mockSurveyFindUnique = vi.fn();
const mockSurveyCreate = vi.fn();
const mockSurveyUpdate = vi.fn();
const mockSurveyCount = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    survey: {
      findMany: (...args: unknown[]) => mockSurveyFindMany(...args),
      findUnique: (...args: unknown[]) => mockSurveyFindUnique(...args),
      create: (...args: unknown[]) => mockSurveyCreate(...args),
      update: (...args: unknown[]) => mockSurveyUpdate(...args),
      count: (...args: unknown[]) => mockSurveyCount(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks
import { GET, POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
const USER_ADMIN = 'user-admin-001';
const USER_RESIDENT = 'user-resident-002';

function setAuth(userId: string, role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId: PROPERTY_A, role, permissions: ['*'], mfaVerified: false },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(USER_ADMIN, 'property_admin');
  mockSurveyFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const validQuestion = {
  questionText: 'How satisfied are you with the building maintenance?',
  questionType: 'rating' as const,
  isRequired: true,
};

const multipleChoiceQuestion = {
  questionText: 'Which amenity do you use the most?',
  questionType: 'multiple_choice' as const,
  isRequired: true,
  options: ['Pool', 'Gym', 'Party Room', 'Rooftop'],
};

const yesNoQuestion = {
  questionText: 'Would you support a new dog park?',
  questionType: 'yes_no' as const,
  isRequired: false,
};

const checkboxQuestion = {
  questionText: 'Select improvements you would like to see:',
  questionType: 'checkbox' as const,
  isRequired: true,
  options: ['Better lighting', 'More parking', 'Recycling bins', 'EV charging'],
};

const freeTextQuestion = {
  questionText: 'Any additional comments?',
  questionType: 'free_text' as const,
  isRequired: false,
};

const rankingQuestion = {
  questionText: 'Rank amenities by importance:',
  questionType: 'ranking' as const,
  isRequired: true,
  options: ['Pool', 'Gym', 'Concierge', 'Security'],
};

const validSurvey = {
  propertyId: PROPERTY_A,
  title: 'Q1 2026 Resident Satisfaction Survey',
  description: 'Help us improve your living experience.',
  questions: [validQuestion, multipleChoiceQuestion],
};

// ---------------------------------------------------------------------------
// 1. GET /surveys — list surveys sorted by createdAt
// ---------------------------------------------------------------------------

describe('GET /surveys — Listing', () => {
  it('sorts by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockSurveyFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns empty array when no surveys exist', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('returns surveys with questions included', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockSurveyFindMany.mock.calls[0]![0];
    expect(call.include.questions).toBeDefined();
  });

  it('orders questions by sortOrder ascending', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockSurveyFindMany.mock.calls[0]![0];
    expect(call.include.questions.orderBy).toEqual({ sortOrder: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// 2. GET /surveys — Tenant isolation
// ---------------------------------------------------------------------------

describe('GET /surveys — Tenant isolation', () => {
  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/surveys');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockSurveyFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to provided propertyId', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockSurveyFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_A);
  });

  it('isolates queries between properties', async () => {
    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const call = mockSurveyFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_B);
  });
});

// ---------------------------------------------------------------------------
// 3. POST /surveys — create survey with title, description, questions
// ---------------------------------------------------------------------------

describe('POST /surveys — Survey creation', () => {
  it('creates a survey with title, description, and questions', async () => {
    mockSurveyCreate.mockResolvedValue({
      id: 'survey-1',
      ...validSurvey,
      status: 'draft',
      questions: [
        { ...validQuestion, id: 'q-1', sortOrder: 0 },
        { ...multipleChoiceQuestion, id: 'q-2', sortOrder: 1 },
      ],
    });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; title: string } }>(res);
    expect(body.data.title).toContain('Satisfaction');
  });

  it('sets initial status to draft', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('draft');
  });

  it('stores createdById from authenticated user', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe(USER_ADMIN);
  });

  it('creates questions with correct sortOrder', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      questions: [validQuestion, multipleChoiceQuestion, freeTextQuestion],
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    const questionsCreate = createData.questions.create;
    expect(questionsCreate[0].sortOrder).toBe(0);
    expect(questionsCreate[1].sortOrder).toBe(1);
    expect(questionsCreate[2].sortOrder).toBe(2);
  });

  it('returns 201 with survey and message', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('created');
  });
});

// ---------------------------------------------------------------------------
// 4. POST /surveys — title validation
// ---------------------------------------------------------------------------

describe('POST /surveys — Title validation', () => {
  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty title', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: '',
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title longer than 200 characters', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'X'.repeat(201),
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts title at maximum length (200 chars)', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'X'.repeat(200),
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 5. POST /surveys — validates at least 1 question
// ---------------------------------------------------------------------------

describe('POST /surveys — Question count validation', () => {
  it('rejects survey with 0 questions', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Empty survey',
      questions: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects survey with missing questions array', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'No questions survey',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts survey with exactly 1 question', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Single question survey',
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 6. POST /surveys — question types
// ---------------------------------------------------------------------------

describe('POST /surveys — Question types', () => {
  it('accepts multiple_choice question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'MC Survey',
      questions: [multipleChoiceQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts free_text question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Free Text Survey',
      questions: [freeTextQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts rating question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Rating Survey',
      questions: [validQuestion], // validQuestion is rating type
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts yes_no question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Yes No Survey',
      questions: [yesNoQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts checkbox question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Checkbox Survey',
      questions: [checkboxQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts ranking question type', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Ranking Survey',
      questions: [rankingQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid question type', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Bad Question Survey',
      questions: [
        {
          questionText: 'Invalid question',
          questionType: 'invalid_type',
          isRequired: false,
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts mixed question types in one survey', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Mixed Survey',
      questions: [
        validQuestion,
        multipleChoiceQuestion,
        yesNoQuestion,
        checkboxQuestion,
        freeTextQuestion,
        rankingQuestion,
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /surveys — question structure validation
// ---------------------------------------------------------------------------

describe('POST /surveys — Question structure', () => {
  it('rejects question without questionText', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Bad Question Survey',
      questions: [
        {
          questionType: 'rating',
          isRequired: true,
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects question with empty questionText', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Empty Text Survey',
      questions: [
        {
          questionText: '',
          questionType: 'rating',
          isRequired: true,
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores isRequired flag correctly', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Required Questions Survey',
      questions: [
        { questionText: 'Required question', questionType: 'rating', isRequired: true },
        { questionText: 'Optional question', questionType: 'free_text', isRequired: false },
      ],
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.questions.create[0].isRequired).toBe(true);
    expect(createData.questions.create[1].isRequired).toBe(false);
  });

  it('stores options for multiple choice questions', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Options Survey',
      questions: [multipleChoiceQuestion],
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.questions.create[0].options).toEqual(multipleChoiceQuestion.options);
  });
});

// ---------------------------------------------------------------------------
// 8. POST /surveys — anonymous survey option
// ---------------------------------------------------------------------------

describe('POST /surveys — Anonymous surveys', () => {
  it('creates anonymous survey when anonymous=true', async () => {
    mockSurveyCreate.mockResolvedValue({
      id: 'survey-1',
      status: 'draft',
      anonymous: true,
      questions: [],
    });

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      anonymous: true,
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.anonymous).toBe(true);
  });

  it('defaults anonymous to false when not specified', async () => {
    mockSurveyCreate.mockResolvedValue({
      id: 'survey-1',
      status: 'draft',
      anonymous: false,
      questions: [],
    });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.anonymous).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. POST /surveys — visibility settings
// ---------------------------------------------------------------------------

describe('POST /surveys — Visibility settings', () => {
  it('stores visibleToOwners setting', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      visibleToOwners: true,
      visibleToTenants: false,
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.visibleToOwners).toBe(true);
    expect(createData.visibleToTenants).toBe(false);
  });

  it('defaults both visibility flags to true', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.visibleToOwners).toBe(true);
    expect(createData.visibleToTenants).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. POST /surveys — expiry date
// ---------------------------------------------------------------------------

describe('POST /surveys — Expiry date', () => {
  it('stores expiryDate when provided', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });
    const expiryDate = '2026-06-30T00:00:00.000Z';

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      expiryDate,
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.expiryDate).toEqual(new Date(expiryDate));
  });

  it('stores null expiryDate when not provided', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.expiryDate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 11. POST /surveys — XSS sanitization
// ---------------------------------------------------------------------------

describe('POST /surveys — XSS sanitization', () => {
  it('strips HTML from title', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      title: '<script>alert("xss")</script>Clean Survey',
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });

  it('strips HTML from question text', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Clean Survey',
      questions: [
        {
          questionText: '<img onerror="alert(1)">How do you rate?',
          questionType: 'rating',
          isRequired: true,
        },
      ],
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.questions.create[0].questionText).not.toContain('<img');
  });

  it('strips HTML from description', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      description: '<b onmouseover="alert(1)">Please fill</b> this survey',
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.description).not.toContain('<b');
    expect(createData.description).not.toContain('onmouseover');
  });
});

// ---------------------------------------------------------------------------
// 12. POST /surveys — propertyId validation
// ---------------------------------------------------------------------------

describe('POST /surveys — PropertyId validation', () => {
  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      ...validSurvey,
      propertyId: 'not-a-uuid',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      title: 'No property survey',
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 13. POST /surveys — max 50 questions
// ---------------------------------------------------------------------------

describe('POST /surveys — Question limits', () => {
  it('rejects survey with more than 50 questions', async () => {
    const manyQuestions = Array.from({ length: 51 }, (_, i) => ({
      questionText: `Question number ${i + 1}?`,
      questionType: 'rating' as const,
      isRequired: false,
    }));

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Too Many Questions',
      questions: manyQuestions,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts survey with exactly 50 questions', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const fiftyQuestions = Array.from({ length: 50 }, (_, i) => ({
      questionText: `Question number ${i + 1} for the survey?`,
      questionType: 'rating' as const,
      isRequired: false,
    }));

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Max Questions Survey',
      questions: fiftyQuestions,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 14. Error handling
// ---------------------------------------------------------------------------

describe('Surveys — Error handling', () => {
  it('handles database errors without leaking internals on GET', async () => {
    mockSurveyFindMany.mockRejectedValue(new Error('connection refused'));

    const req = createGetRequest('/api/v1/surveys', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('connection refused');
  });

  it('handles database errors without leaking internals on POST', async () => {
    mockSurveyCreate.mockRejectedValue(new Error('unique constraint violation'));

    const req = createPostRequest('/api/v1/surveys', validSurvey);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('unique constraint');
  });
});

// ---------------------------------------------------------------------------
// 15. POST /surveys — description validation
// ---------------------------------------------------------------------------

describe('POST /surveys — Description validation', () => {
  it('accepts survey without description (optional)', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'No description survey',
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects description longer than 500 characters', async () => {
    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'Long description survey',
      description: 'X'.repeat(501),
      questions: [validQuestion],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores null description when not provided', async () => {
    mockSurveyCreate.mockResolvedValue({ id: 'survey-1', status: 'draft', questions: [] });

    const req = createPostRequest('/api/v1/surveys', {
      propertyId: PROPERTY_A,
      title: 'No description survey',
      questions: [validQuestion],
    });
    await POST(req);

    const createData = mockSurveyCreate.mock.calls[0]![0].data;
    expect(createData.description).toBeNull();
  });
});
