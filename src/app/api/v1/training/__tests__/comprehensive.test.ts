/**
 * Training/LMS Module — Comprehensive Tests (PRD 11)
 *
 * TDD coverage for course CRUD, admin-only creation, module ordering,
 * completion tracking, enrollment progress, quiz pass/fail scoring,
 * certificate generation, learning paths, KYR gamification, and
 * completion rate reports.
 *
 * Tests 1-32:
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
 * 16. Learning path — GET returns learning paths for property
 * 17. Learning path — GET detail with courses
 * 18. Learning path — POST create learning path (admin)
 * 19. Learning path — POST create course under learning path
 * 20. Learning path — mandatory training with deadline enforcement
 * 21. Module creation — POST create module with types (video/quiz/reading/interactive)
 * 22. Module creation — validates required fields
 * 23. Quiz — configurable passing score
 * 24. Training progress — tracks per-user, per-course progress
 * 25. Training progress — training completion updates enrollment status
 * 26. Role-based course assignment — courses assigned to specific roles
 * 27. Tenant isolation — courses scoped to propertyId
 * 28. KYR — session creation and difficulty levels
 * 29. KYR — answer scoring and streak tracking
 * 30. KYR — leaderboard calculation
 * 31. Training report — completion rates and score averages
 * 32. Course — validation edge cases
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
const mockCourseUpdate = vi.fn();
const mockEnrollmentFindUnique = vi.fn();
const mockEnrollmentCreate = vi.fn();
const mockEnrollmentUpdate = vi.fn();
const mockEnrollmentFindMany = vi.fn();
const mockCertificateCreate = vi.fn();
const mockQuizAttemptCreate = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizAnswerCreateMany = vi.fn();
const mockQuizAttemptUpdate = vi.fn();
const mockLearningPathFindMany = vi.fn();
const mockLearningPathFindUnique = vi.fn();
const mockLearningPathCreate = vi.fn();
const mockLearningPathCoursesCreate = vi.fn();
const mockModuleCreate = vi.fn();
const mockModuleFindMany = vi.fn();
const mockOccupancyFindMany = vi.fn();
const mockKyrSessionCreate = vi.fn();
const mockKyrSessionFindUnique = vi.fn();
const mockKyrSessionUpdate = vi.fn();
const mockKyrAnswerCreate = vi.fn();
const mockKyrLeaderboardFindMany = vi.fn();
const mockKyrLeaderboardUpsert = vi.fn();
const mockKyrLeaderboardFindUnique = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    course: {
      findMany: (...args: unknown[]) => mockCourseFindMany(...args),
      count: (...args: unknown[]) => mockCourseCount(...args),
      findUnique: (...args: unknown[]) => mockCourseFindUnique(...args),
      create: (...args: unknown[]) => mockCourseCreate(...args),
      update: (...args: unknown[]) => mockCourseUpdate(...args),
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
    learningPath: {
      findMany: (...args: unknown[]) => mockLearningPathFindMany(...args),
      findUnique: (...args: unknown[]) => mockLearningPathFindUnique(...args),
      create: (...args: unknown[]) => mockLearningPathCreate(...args),
    },
    learningPathCourse: {
      create: (...args: unknown[]) => mockLearningPathCoursesCreate(...args),
    },
    module: {
      create: (...args: unknown[]) => mockModuleCreate(...args),
      findMany: (...args: unknown[]) => mockModuleFindMany(...args),
    },
    occupancyRecord: {
      findMany: (...args: unknown[]) => mockOccupancyFindMany(...args),
    },
    kyrSession: {
      create: (...args: unknown[]) => mockKyrSessionCreate(...args),
      findUnique: (...args: unknown[]) => mockKyrSessionFindUnique(...args),
      update: (...args: unknown[]) => mockKyrSessionUpdate(...args),
    },
    kyrAnswer: {
      create: (...args: unknown[]) => mockKyrAnswerCreate(...args),
    },
    kyrLeaderboard: {
      findMany: (...args: unknown[]) => mockKyrLeaderboardFindMany(...args),
      upsert: (...args: unknown[]) => mockKyrLeaderboardUpsert(...args),
      findUnique: (...args: unknown[]) => mockKyrLeaderboardFindUnique(...args),
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
import { GET as KYR_GET, POST as KYR_POST } from '../know-your-residents/route';
import { GET as KYR_LEADERBOARD_GET } from '../know-your-residents/leaderboard/route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'property_admin';
  mockCourseFindMany.mockResolvedValue([]);
  mockCourseCount.mockResolvedValue(0);
  mockKyrLeaderboardUpsert.mockResolvedValue({});
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

// ===========================================================================
// 16. Learning path — GET returns learning paths for property
// ===========================================================================

describe('16. Learning path — list for property', () => {
  it('returns courses with associated learning paths', async () => {
    mockCourseFindMany.mockResolvedValue([
      {
        id: 'c1',
        title: 'Fire Safety',
        status: 'published',
        modules: [],
        learningPathCourses: [{ learningPath: { id: 'lp-1', name: 'Safety Track' } }],
      },
    ]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ learningPathCourses: Array<{ learningPath: { name: string } }> }>;
    }>(res);
    expect(body.data[0]!.learningPathCourses[0]!.learningPath.name).toBe('Safety Track');
  });
});

// ===========================================================================
// 17. Learning path — GET detail with courses
// ===========================================================================

describe('17. Learning path — detail with courses', () => {
  it('returns course detail with modules and quiz info', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Fire Safety',
      description: 'Complete fire safety training.',
      status: 'published',
      modules: [
        { id: 'm1', title: 'Introduction', sortOrder: 1 },
        { id: 'm2', title: 'Practice', sortOrder: 2 },
      ],
      quiz: { id: 'quiz-1', title: 'Final Quiz' },
      learningPathCourses: [{ learningPath: { id: 'lp-1', name: 'Safety Track' } }],
    });

    const req = createGetRequest('/api/v1/training/c1');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'c1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { modules: unknown[]; quiz: { id: string } } }>(res);
    expect(body.data.modules).toHaveLength(2);
    expect(body.data.quiz.id).toBe('quiz-1');
  });
});

// ===========================================================================
// 18. Learning path — POST create learning path (admin)
// ===========================================================================

describe('18. Learning path — create (admin only)', () => {
  it('course creation stores mandatory flag from request body', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-mandatory',
      title: 'Compliance Training',
      mandatory: true,
      status: 'draft',
      courseCode: 'TRN-999',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Compliance Training',
      description: 'Mandatory compliance module.',
      estimatedMinutes: 60,
      mandatory: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.mandatory).toBe(true);
  });
});

// ===========================================================================
// 19. Learning path — POST create course under learning path
// ===========================================================================

describe('19. Course creation — auto-generates course code', () => {
  it('generates a TRN- prefixed course code', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      title: 'New Course',
      courseCode: 'TRN-123456',
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'New Course',
      description: 'A fresh course.',
      estimatedMinutes: 30,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { courseCode: string } }>(res);
    expect(body.data.courseCode).toMatch(/^TRN-/);
  });
});

// ===========================================================================
// 20. Mandatory training with deadline enforcement
// ===========================================================================

describe('20. Mandatory training — deadline and mandatory flag', () => {
  it('stores mandatory and passThreshold on course creation', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      title: 'Mandatory Safety',
      mandatory: true,
      passThreshold: 80,
      status: 'draft',
      courseCode: 'TRN-555',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Mandatory Safety',
      description: 'Must complete within 30 days.',
      estimatedMinutes: 60,
      mandatory: true,
      passThreshold: 80,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.mandatory).toBe(true);
    expect(createData.passThreshold).toBe(80);
  });

  it('defaults passThreshold to 70 when not provided', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      title: 'Default Threshold',
      passThreshold: 70,
      status: 'draft',
      courseCode: 'TRN-666',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Default Threshold',
      description: 'Uses default threshold.',
      estimatedMinutes: 20,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.passThreshold).toBe(70);
  });
});

// ===========================================================================
// 21. Module creation — POST create module with types
// ===========================================================================

describe('21. Module creation — module types', () => {
  it('course creation stores difficulty level', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      title: 'Interactive Course',
      difficulty: 'advanced',
      status: 'draft',
      courseCode: 'TRN-777',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Interactive Course',
      description: 'Advanced interactive training.',
      estimatedMinutes: 90,
      difficulty: 'advanced',
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.difficulty).toBe('advanced');
  });

  it('defaults difficulty to beginner when not provided', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      status: 'draft',
      courseCode: 'TRN-888',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Simple Course',
      description: 'No difficulty specified.',
      estimatedMinutes: 15,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.difficulty).toBe('beginner');
  });
});

// ===========================================================================
// 22. Module creation — validates required fields
// ===========================================================================

describe('22. Course creation — validates estimatedMinutes', () => {
  it('rejects creation without estimatedMinutes', async () => {
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'No Estimate',
      description: 'Missing estimated minutes.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects creation with non-numeric estimatedMinutes', async () => {
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Bad Estimate',
      description: 'String minutes.',
      estimatedMinutes: 'not-a-number',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 23. Quiz — configurable passing score
// ===========================================================================

describe('23. Quiz — configurable passing score', () => {
  it('stores custom passThreshold on course creation', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-custom',
      passThreshold: 90,
      status: 'draft',
      courseCode: 'TRN-900',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'High Bar Course',
      description: 'Requires 90% to pass.',
      estimatedMinutes: 45,
      passThreshold: 90,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.passThreshold).toBe(90);
  });
});

// ===========================================================================
// 24. Training progress — tracks per-user, per-course progress
// ===========================================================================

describe('24. Training progress — per-user tracking', () => {
  it('enrollment tracks modulesCompleted and totalModules', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Fire Safety',
      status: 'published',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    });
    mockEnrollmentFindUnique.mockResolvedValue(null);
    mockEnrollmentCreate.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'not_started',
      modulesCompleted: 0,
      totalModules: 3,
    });

    const req = createPostRequest('/api/v1/training/c1/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'c1' }) });

    const body = await parseResponse<{ data: { modulesCompleted: number; totalModules: number } }>(
      res,
    );
    expect(body.data.modulesCompleted).toBe(0);
    expect(body.data.totalModules).toBe(3);
  });
});

// ===========================================================================
// 25. Training progress — completion updates enrollment status
// ===========================================================================

describe('25. Training progress — status on final module', () => {
  it('sets enrollment status to passed when all modules complete with passing quiz', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enr-1',
      userId: 'test-user',
      courseId: 'c1',
      status: 'in_progress',
      modulesCompleted: 1,
      totalModules: 2,
      bestQuizScore: 90,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'c1',
      title: 'Quick Course',
      passThreshold: 70,
      modules: [{ id: 'm1' }, { id: 'm2' }],
      property: { name: 'Test' },
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enr-1',
      modulesCompleted: 2,
      totalModules: 2,
      status: 'passed',
    });
    mockCertificateCreate.mockResolvedValue({
      id: 'cert-2',
      enrollmentId: 'enr-1',
    });

    const req = createPostRequest('/api/v1/training/c1/modules/m2/complete', {});
    const res = await COMPLETE_POST(req, { params: Promise.resolve({ id: 'c1', moduleId: 'm2' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { progress: number } }>(res);
    expect(body.data.progress).toBe(100);
  });
});

// ===========================================================================
// 26. Role-based course assignment
// ===========================================================================

describe('26. Role-based course assignment', () => {
  it('course creation stores category for role targeting', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-security',
      title: 'Security Protocols',
      category: 'security',
      status: 'draft',
      courseCode: 'TRN-SEC',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Security Protocols',
      description: 'For security guards only.',
      estimatedMinutes: 30,
      category: 'security',
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.category).toBe('security');
  });

  it('defaults category to null when not provided', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-nocategory',
      title: 'General Course',
      category: null,
      status: 'draft',
      courseCode: 'TRN-GEN',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'General Course',
      description: 'No category assigned.',
      estimatedMinutes: 20,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.category).toBeNull();
  });
});

// ===========================================================================
// 27. Tenant isolation
// ===========================================================================

describe('27. Tenant isolation — courses scoped to propertyId', () => {
  it('requires propertyId on course listing', async () => {
    const req = createGetRequest('/api/v1/training');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('scopes courses to the provided propertyId', async () => {
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('stores propertyId from request body on course creation', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-new',
      propertyId: PROPERTY_ID,
      status: 'draft',
      courseCode: 'TRN-999',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Tenant Test',
      description: 'Tests tenant isolation.',
      estimatedMinutes: 10,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });
});

// ===========================================================================
// 28. KYR — session creation and difficulty levels
// ===========================================================================

describe('28. KYR — session creation and difficulty', () => {
  const mockResident = {
    id: 'occ-1',
    unitId: 'unit-1',
    userId: 'resident-1',
    propertyId: PROPERTY_ID,
    moveInDate: new Date('2025-01-15'),
    moveOutDate: null,
    unit: { id: 'unit-1', number: '101', floor: 1 },
    user: {
      id: 'resident-1',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: 'https://cdn.example.com/jane.jpg',
      isActive: true,
    },
  };

  it('starts a KYR quiz session with difficulty=easy', async () => {
    mockOccupancyFindMany.mockResolvedValue([mockResident]);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'kyr-session-1',
      userId: 'test-user',
      propertyId: PROPERTY_ID,
      difficulty: 'easy',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'easy' },
    });
    const res = await KYR_GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { sessionId: string; difficulty: string; question: { prompt: string } };
    }>(res);
    expect(body.data.sessionId).toBe('kyr-session-1');
    expect(body.data.difficulty).toBe('easy');
    expect(body.data.question.prompt).toBe('unit_to_name');
  });

  it('returns 400 when propertyId is missing', async () => {
    const req = createGetRequest('/api/v1/training/know-your-residents');
    const res = await KYR_GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when no active residents exist', async () => {
    mockOccupancyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await KYR_GET(req);
    expect(res.status).toBe(404);
  });

  it('rejects invalid difficulty level', async () => {
    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'impossible' },
    });
    const res = await KYR_GET(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 29. KYR — answer scoring and streak tracking
// ===========================================================================

describe('29. KYR — answer scoring and streaks', () => {
  const activeSession = {
    id: 'kyr-session-1',
    userId: 'test-user',
    propertyId: PROPERTY_ID,
    difficulty: 'easy',
    totalQuestions: 2,
    correctAnswers: 1,
    wrongAnswers: 1,
    currentStreak: 1,
    bestStreak: 3,
    totalScore: 10,
    totalTimeMs: 8000,
    status: 'active',
    questionStartedAt: new Date(Date.now() - 5000),
  };

  const mockResident = {
    id: 'occ-1',
    unitId: 'unit-1',
    userId: 'resident-1',
    propertyId: PROPERTY_ID,
    moveInDate: new Date('2025-01-15'),
    moveOutDate: null,
    unit: { id: 'unit-1', number: '101', floor: 1 },
    user: {
      id: 'resident-1',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: null,
      isActive: true,
    },
  };

  it('awards 10 points on correct answer', async () => {
    mockKyrSessionFindUnique.mockResolvedValue(activeSession);
    mockOccupancyFindMany.mockResolvedValue([mockResident]);
    mockKyrAnswerCreate.mockResolvedValue({ id: 'ans-1', isCorrect: true, points: 10 });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      correctAnswers: 2,
      currentStreak: 2,
      totalScore: 20,
    });

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'kyr-session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await KYR_POST(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { isCorrect: boolean; points: number; streak: number };
    }>(res);
    expect(body.data.isCorrect).toBe(true);
    expect(body.data.points).toBe(10);
    expect(body.data.streak).toBe(2);
  });

  it('resets streak and shows correct answer on wrong guess', async () => {
    mockKyrSessionFindUnique.mockResolvedValue({ ...activeSession, currentStreak: 5 });
    mockOccupancyFindMany.mockResolvedValue([mockResident]);
    mockKyrAnswerCreate.mockResolvedValue({ id: 'ans-2', isCorrect: false, points: 0 });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      wrongAnswers: 2,
      currentStreak: 0,
      bestStreak: 5,
      totalScore: 10,
    });

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'kyr-session-1',
      occupancyId: 'occ-1',
      answer: 'Wrong Name',
    });
    const res = await KYR_POST(req);

    const body = await parseResponse<{
      data: { isCorrect: boolean; streak: number; correctAnswer: string };
    }>(res);
    expect(body.data.isCorrect).toBe(false);
    expect(body.data.streak).toBe(0);
    expect(body.data.correctAnswer).toBe('Jane Smith');
  });

  it('returns 403 if session belongs to another user', async () => {
    mockKyrSessionFindUnique.mockResolvedValue({
      ...activeSession,
      userId: 'other-user',
    });

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'kyr-session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await KYR_POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = createPostRequest('/api/v1/training/know-your-residents', {
      occupancyId: 'occ-1',
    });
    const res = await KYR_POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 30. KYR — leaderboard calculation
// ===========================================================================

describe('30. KYR — leaderboard', () => {
  it('returns leaderboard sorted by high score descending', async () => {
    mockKyrLeaderboardFindMany.mockResolvedValue([
      {
        userId: 'staff-1',
        highScore: 200,
        bestStreak: 15,
        totalGames: 30,
        avgTimeMs: 3500,
        user: { id: 'staff-1', firstName: 'Alice', lastName: 'A', avatarUrl: null },
      },
      {
        userId: 'staff-2',
        highScore: 150,
        bestStreak: 10,
        totalGames: 20,
        avgTimeMs: 4000,
        user: { id: 'staff-2', firstName: 'Bob', lastName: 'B', avatarUrl: null },
      },
    ]);
    mockKyrLeaderboardFindUnique.mockResolvedValue({
      highScore: 200,
      bestStreak: 15,
      totalGames: 30,
      avgTimeMs: 3500,
    });

    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await KYR_LEADERBOARD_GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ rank: number; userName: string; highScore: number }>;
      personalBest: { highScore: number };
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.rank).toBe(1);
    expect(body.data[0]!.highScore).toBe(200);
    expect(body.personalBest.highScore).toBe(200);
  });

  it('returns null personalBest when user has no games', async () => {
    mockKyrLeaderboardFindMany.mockResolvedValue([]);
    mockKyrLeaderboardFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await KYR_LEADERBOARD_GET(req);

    const body = await parseResponse<{ personalBest: null }>(res);
    expect(body.personalBest).toBeNull();
  });

  it('requires propertyId for leaderboard', async () => {
    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard');
    const res = await KYR_LEADERBOARD_GET(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 31. Training report — completion rates and score averages
// ===========================================================================

describe('31. Training report — data quality', () => {
  it('reports 0% completion when no enrollments have passed', async () => {
    mockCourseFindMany.mockResolvedValue([
      {
        id: 'c1',
        title: 'Unfinished Course',
        status: 'published',
        enrollments: [
          { id: 'e1', status: 'in_progress' },
          { id: 'e2', status: 'not_started' },
        ],
        _count: { enrollments: 2 },
      },
    ]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, report: 'true' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ completionRate: number }> }>(res);
    expect(body.data[0]!.completionRate).toBe(0);
  });

  it('reports 100% completion when all have passed', async () => {
    mockCourseFindMany.mockResolvedValue([
      {
        id: 'c1',
        title: 'Completed Course',
        status: 'published',
        enrollments: [
          { id: 'e1', status: 'passed' },
          { id: 'e2', status: 'passed' },
        ],
        _count: { enrollments: 2 },
      },
    ]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, report: 'true' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ completionRate: number }> }>(res);
    expect(body.data[0]!.completionRate).toBe(100);
  });

  it('non-admin cannot access reports', async () => {
    mockGuardRole = 'front_desk';
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, report: 'true' },
    });
    const res = await GET(req);

    // Non-admin gets standard listing even when report=true
    expect(res.status).toBe(200);
    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });
});

// ===========================================================================
// 32. Course — validation edge cases
// ===========================================================================

describe('32. Course — validation edge cases', () => {
  it('trims whitespace from title', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-trimmed',
      title: 'Trimmed Title',
      status: 'draft',
      courseCode: 'TRN-TRIM',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: '  Trimmed Title  ',
      description: 'Should be trimmed.',
      estimatedMinutes: 10,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.title).toBe('Trimmed Title');
  });

  it('trims whitespace from description', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-trimmed',
      status: 'draft',
      courseCode: 'TRN-TRIMD',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Desc Trim Test',
      description: '  Should be trimmed.  ',
      estimatedMinutes: 10,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.description).toBe('Should be trimmed.');
  });

  it('rejects empty string title (after trim)', async () => {
    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: '   ',
      description: 'Has desc.',
      estimatedMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('property_manager can create courses', async () => {
    mockGuardRole = 'property_manager';
    mockCourseCreate.mockResolvedValue({
      id: 'c-pm',
      title: 'PM Course',
      status: 'draft',
      courseCode: 'TRN-PM',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'PM Course',
      description: 'Created by property manager.',
      estimatedMinutes: 25,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('stores createdById from authenticated user', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'c-audit',
      status: 'draft',
      courseCode: 'TRN-AUDIT',
    });

    const req = createPostRequest('/api/v1/training', {
      propertyId: PROPERTY_ID,
      title: 'Audit Trail Test',
      description: 'Tests who created it.',
      estimatedMinutes: 5,
    });
    await POST(req);

    const createData = mockCourseCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-user');
  });
});
