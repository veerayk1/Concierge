/**
 * Training/LMS — Course Type and Product Updates (GAP 11.2)
 *
 * The training module must support different course types:
 * - standard: Regular training courses
 * - product_update: Release notes and feature walkthroughs
 * - compliance: Mandatory regulatory training
 *
 * This enables the "Product Updates" learning path concept from the GAP analysis.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockCourseCreate = vi.fn();
const mockCourseFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    course: {
      create: (...args: unknown[]) => mockCourseCreate(...args),
      findMany: (...args: unknown[]) => mockCourseFindMany(...args),
    },
  },
}));

let mockGuardRole = 'property_admin';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: {
        userId: 'test-admin',
        propertyId: '00000000-0000-4000-b000-000000000001',
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    }),
  ),
}));

import { POST, GET } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'property_admin';
  mockCourseFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// GAP 11.2: Course type field
// ---------------------------------------------------------------------------

describe('POST /api/v1/training — Course Type (GAP 11.2)', () => {
  const baseCourse = {
    propertyId: PROPERTY_ID,
    title: 'March 2026 Platform Update',
    description:
      'Overview of new features released in March 2026 including AI briefing and weather widget.',
    estimatedMinutes: 15,
  };

  it('creates a course with courseType=product_update', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'course-pu-1',
      ...baseCourse,
      courseType: 'product_update',
      courseCode: 'TRN-001',
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/training', {
      ...baseCourse,
      courseType: 'product_update',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.courseType).toBe('product_update');
  });

  it('creates a course with courseType=compliance', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'course-comp-1',
      ...baseCourse,
      courseType: 'compliance',
      courseCode: 'TRN-002',
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/training', {
      ...baseCourse,
      courseType: 'compliance',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.courseType).toBe('compliance');
  });

  it('defaults to courseType=standard when not specified', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'course-std-1',
      ...baseCourse,
      courseType: 'standard',
      courseCode: 'TRN-003',
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/training', baseCourse);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.courseType).toBe('standard');
  });

  it('stores category alongside courseType', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'course-cat-1',
      ...baseCourse,
      courseType: 'product_update',
      category: 'platform_features',
      courseCode: 'TRN-004',
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/training', {
      ...baseCourse,
      courseType: 'product_update',
      category: 'platform_features',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.courseType).toBe('product_update');
    expect(createData.category).toBe('platform_features');
  });
});

// ---------------------------------------------------------------------------
// GAP 11.2: Product Updates learning path — listing courses by type
// ---------------------------------------------------------------------------

describe('GET /api/v1/training — Product Update courses visible in listing', () => {
  it('returns product_update courses in the standard listing', async () => {
    const courses = [
      {
        id: 'course-pu-1',
        title: 'March 2026 Update',
        courseType: 'product_update',
        status: 'published',
        modules: [],
        learningPathCourses: [],
      },
      {
        id: 'course-std-1',
        title: 'Fire Safety',
        courseType: 'standard',
        status: 'published',
        modules: [{ id: 'm1', title: 'Module 1', sortOrder: 1 }],
        learningPathCourses: [],
      },
    ];
    mockCourseFindMany.mockResolvedValue(courses);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof courses }>(res);
    expect(body.data).toHaveLength(2);
  });
});
