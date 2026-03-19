/**
 * Training/LMS Module — Comprehensive Tests (PRD 11)
 *
 * TDD coverage for course CRUD, admin-only creation, module ordering,
 * completion tracking, enrollment progress, quiz pass/fail scoring,
 * certificate generation, learning paths, and completion rate reports.
 *
 * Tests 1-15:
 *  1. Course CRUD — list published courses
 *  2. Course CRUD — admin creates a new course
 *  3. Course CRUD — reject creation by non-admin (front_desk)
 *  4. Course CRUD — reject creation by resident role
 *  5. Module ordering — course detail returns modules sorted by sortOrder
 *  6. Module completion — marks module complete and updates progress
 *  7. Module completion — calculates progress percentage correctly
 *  8. Enrollment — enroll authenticated user in a course
 *  9. Enrollment — prevent double enrollment (409 ALREADY_ENROLLED)
 * 10. Enrollment — returns 404 for non-existent course
 * 11. Quiz — submit answers and receive score
 * 12. Quiz — fail when score is below pass threshold
 * 13. Quiz — reject submission without enrollment
 * 14. Certificate — generate on 100% completion with passing quiz
 * 15. Completion rate — report endpoint returns per-course stats
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockCourseFindMany = vi.fn();
const mockCourseCount = vi.fn();
const mockCourseFindUnique = vi.fn();
const mockCourseCreate = vi.fn();
const mockEnrollmentFindUnique = vi.fn();
const mockEnrollmentCreate = vi.fn();
const mockEnrollmentUpdate = vi.fn();
const mockEnrollmentFindMany = vi.fn();
const mockCertificateCreate = vi.fn();
const mockQuizAttemptCreate = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizAnswerCreateMany = vi.fn();
const mockQuizAttemptUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    course: {
      findMany: (...args: unknown[]) => mockCourseFindMany(...args),
      count: (...args: unknown[]) => mockCourseCount(...args),
      findUnique: (...args: unknown[]) => mockCourseFindUnique(...args),
      create: (...args: unknown[]) => mockCourseCreate(...args),
    },
    enrollment: {
      findUnique: (...args: unknown[]) => mockEnrollmentFindUnique(...args),
      findMany: (...args: unknown[]) => mockEnrollmentFindMany(...args),
      create: (...args: unknown[]) => mockEnrollmentCreate(...args),
      update: (...args: unknown[]) => mockEnrollmentUpdate(...args),
    },
    certificate: {
      create: (...args: unknown[]) => mockCertificateCreate(...args),
    },
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
    },
    quizAttempt: {
      create: (...args: unknown[]) => mockQuizAttemptCreate(...args),
      update: (...args: unknown[]) => mockQuizAttemptUpdate(...args),
    },
    quizAnswer: {
      createMany: (...args: unknown[]) => mockQuizAnswerCreateMany(...args),
    },
  },
}));

let mockGuardRole = 'property_admin';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      user: {
        userId: 'test-user',
        propertyId: '00000000-0000-4000-b000-000000000001',
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    });
  }),
}));

import { GET, POST } from '../route';
import { POST as ENROLL_POST } from '../[id]/enroll/route';
import { POST as COMPLETE_POST } from '../[id]/modules/[moduleId]/complete/route';
import { POST as QUIZ_POST } from '../[id]/quiz/route';
import { GET as GET_BY_ID } from '../[id]/route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'property_admin';
  mockCourseFindMany.mockResolvedValue([]);
  mockCourseCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. Course CRUD — list published courses
// ===========================================================================

describe('1. Course CRUD — list published courses', () => {
  it('lists published courses for the property', async () => {
    const courses = [
      {
        id: 'c1',
        title: 'Fire Safety',
        status: 'published',
        modules: [{ id: 'm1', sortOrder: 1 }],
        estimatedDurationMinutes: 30,
      },
      {
        id: 'c2',
        title: 'Front Desk',
        status: 'published',
        modules: [{ id: 'm2', sortOrder: 1 }],
        estimatedDurationMinutes: 60,
      },
    ];
    mockCourseFindMany.mockResolvedValue(courses);

    const req = createGetRequest('/api/v1/training', { searchParams: { propertyId: PROPERTY_ID } });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('non-admins only see published courses', async () => {
    mockGuardRole = 'front_desk';
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', { searchParams: { propertyId: PROPERTY_ID } });
    await GET(req);

    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });
});

// ===========================================================================
// 2. Course CRUD — admin creates a new course
// ===========================================================================

describe('2. Course CRUD — admin creates course', () => {
  const validCourse = {
    propertyId: PROPERTY_ID,
    title: 'Emergency Evacuation',
    description: 'Complete training on building evacuation protocols.',
    estimatedMinutes: 45,
    category: 'safety',
    difficulty: 'beginner',
    passThreshold: 80,
  };

  it('admin creates a course and receives 201', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      ...validCourse,
      courseCode: 'TRN-001',
      status: 'draft',
      createdById: 'test-user',
    });

    const req = createPostRequest('/api/v1/training', validCourse);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBe('c-new');
  });

  it('rejects creation without title', async () => {
    const { title: _, ...noTitle } = validCourse;
    const req = createPostRequest('/api/v1/training', noTitle);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects creation without description', async () => {
    const { description: _, ...noDesc } = validCourse;
    const req = createPostRequest('/api/v1/training', noDesc);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 3. Course CRUD — reject creation by non-admin (front_desk)
// ===========================================================================

describe('3. Course CRUD — reject creation by front_desk', () => {
  it('returns 403 for front_desk role', async () => {
    mockGuardRole = 'front_desk';
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Unauthorized Course',
      description: 'Should be rejected.',
      estimatedMinutes: 15,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 4. Course CRUD — reject creation by resident
// ===========================================================================

describe('4. Course CRUD — reject creation by resident', () => {
  it('returns 403 for resident_owner role', async () => {
    mockGuardRole = 'resident_owner';
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Resident Course',
      description: 'Residents cannot create courses.',
      estimatedMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 403 for security_guard role', async () => {
    mockGuardRole = 'security_guard';
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Guard Course',
      description: 'Security guards cannot create courses.',
      estimatedMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 5. Module ordering — course detail returns modules sorted by sortOrder
// ===========================================================================

describe('5. Module ordering — sorted by sortOrder', () => {
  it('returns modules in sortOrder within course detail', async () => {
    const course = {
      id: 'c1',
      title: 'Fire Safety',
      description: 'Fire safety protocols.',
      status: 'published',
      estimatedDurationMinutes: 45,
      passThreshold: 70,
      modules: [
        { id: 'm1', title: 'Introduction', sortOrder: 1, estimatedMinutes: 10 },
        { id: 'm2', title: 'Extinguishers', sortOrder: 2, estimatedMinutes: 15 },
        { id: 'm3', title: 'Evacuation', sortOrder: 3, estimatedMinutes: 20 },
      ],
      quiz: { id: 'quiz-1', title: 'Fire Safety Quiz', questions: [] },
    };
    mockCourseFindUnique.mockResolvedValue(course);

    const req = createGetRequest('/api/v1/training/c1');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof course }>(res);
    expect(body.data.modules).toHaveLength(3);
    expect(body.data.modules[0]!.sortOrder).toBe(1);
    expect(body.data.modules[2]!.sortOrder).toBe(3);
  });

  it('returns 404 for non-existent course', async () => {
    mockCourseFindUnique.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/training/nonexistent');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 6. Module completion — marks module complete and updates progress
// ===========================================================================

describe('6. Module completion — update progress', () => {
  it('marks a module complete and increments modulesCompleted', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      modulesCompleted: 1,
      totalModules: 3,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enr-1',
      modulesCompleted: 2,
      totalModules: 3,
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/c1/modules/m2/complete', {});
    const res = await COMPLETE_POST(req, { params: Promise.resolve({ id: 'c1', moduleId: 'm2' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { modulesCompleted: number } }>(res);
    expect(body.data.modulesCompleted).toBe(2);
  });
});

// ===========================================================================
// 7. Module completion — calculates progress percentage
// ===========================================================================

describe('7. Progress percentage calculation', () => {
  it('calculates 75% when 3 of 4 modules are complete', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      modulesCompleted: 2,
      totalModules: 4,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }],
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enr-1',
      modulesCompleted: 3,
      totalModules: 4,
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/c1/modules/m3/complete', {});
    const res = await COMPLETE_POST(req, { params: Promise.resolve({ id: 'c1', moduleId: 'm3' }) });

    const body = await parseResponse<{ data: { progress: number } }>(res);
    expect(body.data.progress).toBe(75);
  });
});

// ===========================================================================
// 8. Enrollment — enroll authenticated user
// ===========================================================================

describe('8. Enrollment — enroll user', () => {
  it('enrolls user and returns status=not_started', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Fire Safety',
      status: 'published',
      modules: [{ id: 'm1' }, { id: 'm2' }],
    });
    mockEnrollmentFindUnique.mockResolvedValue(null);
    mockEnrollmentCreate.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'not_started',
      modulesCompleted: 0,
      totalModules: 2,
    });

    const req = createPostRequest('/api/v1/training/c1/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('not_started');
  });
});

// ===========================================================================
// 9. Enrollment — prevent double enrollment
// ===========================================================================

describe('9. Enrollment — prevent double enrollment', () => {
  it('returns 409 ALREADY_ENROLLED on duplicate', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Fire Safety',
      status: 'published',
      modules: [{ id: 'm1' }],
    });
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-existing',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/c1/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_ENROLLED');
  });
});

// ===========================================================================
// 10. Enrollment — 404 for non-existent course
// ===========================================================================

describe('10. Enrollment — course not found', () => {
  it('returns 404 when course does not exist', async () => {
    mockCourseFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/ghost/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 11. Quiz — submit answers and receive score
// ===========================================================================

describe('11. Quiz — submit and score', () => {
  it('submits quiz answers and returns score with passed flag', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      quizAttempts: 0,
    });
    mockQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'c1',
      title: 'Safety Quiz',
      questions: [
        {
          id: 'q1',
          questionType: 'multiple_choice',
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
          ],
          points: 1,
        },
        { id: 'q2', questionType: 'true_false', correctAnswer: true, points: 1 },
      ],
    });
    mockQuizAttemptCreate.mockResolvedValue({ id: 'att-1', startedAt: new Date() });
    mockQuizAnswerCreateMany.mockResolvedValue({ count: 2 });
    mockQuizAttemptUpdate.mockResolvedValue({
      id: 'att-1',
      score: 100,
      passed: true,
      submittedAt: new Date(),
    });
    mockEnrollmentUpdate.mockResolvedValue({ id: 'enr-1', quizAttempts: 1, bestQuizScore: 100 });

    const req = createPostRequest('/api/v1/training/c1/quiz', {
      answers: [
        { questionId: 'q1', selectedOptionIndex: 0 },
        { questionId: 'q2', selectedBoolean: true },
      ],
    });
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { score: number; passed: boolean } }>(res);
    expect(body.data.score).toBeDefined();
    expect(body.data.passed).toBe(true);
  });
});

// ===========================================================================
// 12. Quiz — fail when below threshold
// ===========================================================================

describe('12. Quiz — fail below threshold', () => {
  it('marks quiz as failed when score is below pass threshold', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      quizAttempts: 0,
    });
    mockQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'c1',
      title: 'Safety Quiz',
      questions: [
        {
          id: 'q1',
          questionType: 'multiple_choice',
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
          ],
          points: 1,
        },
        { id: 'q2', questionType: 'true_false', correctAnswer: true, points: 1 },
        { id: 'q3', questionType: 'true_false', correctAnswer: false, points: 1 },
      ],
    });
    mockCourseFindUnique.mockResolvedValue({ id: 'c1', passThreshold: 70 });
    mockQuizAttemptCreate.mockResolvedValue({ id: 'att-1', startedAt: new Date() });
    mockQuizAnswerCreateMany.mockResolvedValue({ count: 3 });
    mockQuizAttemptUpdate.mockResolvedValue({
      id: 'att-1',
      score: 33,
      passed: false,
      submittedAt: new Date(),
    });
    mockEnrollmentUpdate.mockResolvedValue({ id: 'enr-1', quizAttempts: 1, bestQuizScore: 33 });

    const req = createPostRequest('/api/v1/training/c1/quiz', {
      answers: [
        { questionId: 'q1', selectedOptionIndex: 0 },
        { questionId: 'q2', selectedBoolean: false },
        { questionId: 'q3', selectedBoolean: true },
      ],
    });
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { passed: boolean } }>(res);
    expect(body.data.passed).toBe(false);
  });
});

// ===========================================================================
// 13. Quiz — reject without enrollment
// ===========================================================================

describe('13. Quiz — reject without enrollment', () => {
  it('returns 404 when user is not enrolled', async () => {
    mockEnrollmentFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/c1/quiz', {
      answers: [{ questionId: 'q1', selectedOptionIndex: 0 }],
    });
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(404);
  });

  it('rejects quiz with empty answers array', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      quizAttempts: 0,
    });

    const req = createPostRequest('/api/v1/training/c1/quiz', {});
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 14. Certificate — generate on 100% completion
// ===========================================================================

describe('14. Certificate generation on completion', () => {
  it('generates certificate when all modules completed with passing score', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      modulesCompleted: 2,
      totalModules: 3,
      bestQuizScore: 85,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Fire Safety',
      passThreshold: 70,
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
      property: { name: 'Test Property' },
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enr-1',
      modulesCompleted: 3,
      totalModules: 3,
      status: 'passed',
      certificateId: 'cert-1',
    });
    mockCertificateCreate.mockResolvedValue({
      id: 'cert-1',
      enrollmentId: 'enr-1',
      learnerName: 'Test User',
      courseTitle: 'Fire Safety',
      completionDate: new Date(),
      score: 85,
      verificationUrl: 'https://app.concierge.com/verify/cert-1',
    });

    const req = createPostRequest('/api/v1/training/c1/modules/m3/complete', {});
    const res = await COMPLETE_POST(req, { params: Promise.resolve({ id: 'c1', moduleId: 'm3' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { progress: number; certificate: { id: string } } }>(
      res,
    );
    expect(body.data.progress).toBe(100);
    expect(body.data.certificate).toBeDefined();
    expect(body.data.certificate.id).toBe('cert-1');
  });

  it('returns 404 if enrollment does not exist for module completion', async () => {
    mockEnrollmentFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/c1/modules/m1/complete', {});
    const res = await COMPLETE_POST(req, { params: Promise.resolve({ id: 'c1', moduleId: 'm1' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 15. Completion rate report
// ===========================================================================

describe('15. Completion rate reports', () => {
  it('returns per-course completion rates when report=true', async () => {
    mockCourseFindMany.mockResolvedValue([
      {
        id: 'c1',
        title: 'Fire Safety',
        status: 'published',
        enrollments: [
          { id: 'e1', status: 'passed' },
          { id: 'e2', status: 'in_progress' },
          { id: 'e3', status: 'passed' },
          { id: 'e4', status: 'not_started' },
        ],
        _count: { enrollments: 4 },
      },
      {
        id: 'c2',
        title: 'Front Desk',
        status: 'published',
        enrollments: [
          { id: 'e5', status: 'passed' },
          { id: 'e6', status: 'failed' },
        ],
        _count: { enrollments: 2 },
      },
    ]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, report: 'true' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ completionRate: number; enrollmentCount: number }>;
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.completionRate).toBe(50);
    expect(body.data[0]!.enrollmentCount).toBe(4);
    expect(body.data[1]!.completionRate).toBe(50);
  });

  it('admins can filter draft courses for review', async () => {
    mockGuardRole = 'property_admin';
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, status: 'draft' },
    });
    await GET(req);

    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('draft');
  });
});
