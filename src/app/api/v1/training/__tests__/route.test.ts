/**
 * Training/LMS API Tests — per PRD 11 Training LMS
 *
 * The Training module is a unique feature from Condo Control that neither
 * Aquarius nor BuildingLink offers. It enables staff onboarding, mandatory
 * compliance training, quizzes with pass/fail scoring, and certificate
 * generation on completion. Getting this right is essential for high-turnover
 * concierge teams.
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
    const adminRoles = ['super_admin', 'property_admin'];
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

// ---------------------------------------------------------------------------
// 1. GET /api/v1/training — Lists available courses
// ---------------------------------------------------------------------------

describe('GET /api/v1/training — List Courses', () => {
  it('lists available courses for the authenticated user', async () => {
    const courses = [
      {
        id: 'course-1',
        title: 'Fire Safety',
        status: 'published',
        modules: [{ id: 'm1', title: 'Module 1', sortOrder: 1 }],
        estimatedDurationMinutes: 30,
      },
      {
        id: 'course-2',
        title: 'Front Desk Procedures',
        status: 'published',
        modules: [
          { id: 'm2', title: 'Module 1', sortOrder: 1 },
          { id: 'm3', title: 'Module 2', sortOrder: 2 },
        ],
        estimatedDurationMinutes: 60,
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

  // 2. Filters by status — published only for non-admins
  it('filters to published courses only for non-admin roles', async () => {
    mockGuardRole = 'front_desk';
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('allows admins to see all statuses when requested', async () => {
    mockGuardRole = 'property_admin';
    mockCourseFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID, status: 'draft' },
    });
    await GET(req);

    const where = mockCourseFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('draft');
  });

  // 3. Includes module count and estimated duration
  it('includes module count and estimated duration per course', async () => {
    const courses = [
      {
        id: 'course-1',
        title: 'Fire Safety',
        status: 'published',
        estimatedDurationMinutes: 45,
        modules: [
          { id: 'm1', title: 'Module 1', sortOrder: 1 },
          { id: 'm2', title: 'Module 2', sortOrder: 2 },
          { id: 'm3', title: 'Module 3', sortOrder: 3 },
        ],
        learningPathCourses: [],
      },
    ];
    mockCourseFindMany.mockResolvedValue(courses);

    const req = createGetRequest('/api/v1/training', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: typeof courses }>(res);

    expect(body.data[0]!.modules).toHaveLength(3);
    expect(body.data[0]!.estimatedDurationMinutes).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// 4. POST /api/v1/training — Admin creates new course
// ---------------------------------------------------------------------------

describe('POST /api/v1/training — Course Creation', () => {
  const validCourse = {
    propertyId: PROPERTY_ID,
    title: 'Emergency Evacuation Procedures',
    description: 'Complete training on building evacuation protocols and assembly points.',
    estimatedMinutes: 45,
    category: 'safety',
    difficulty: 'beginner',
    passThreshold: 80,
  };

  it('admin creates a new course successfully', async () => {
    mockCourseCreate.mockResolvedValue({
      id: 'course-new',
      ...validCourse,
      courseCode: 'TRN-001',
      status: 'draft',
      createdById: 'test-user',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/training', validCourse);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; courseCode: string } }>(res);
    expect(body.data.id).toBe('course-new');
  });

  // 5. Requires title, description, estimatedMinutes
  it('rejects creation without required title field', async () => {
    const { title: _, ...noTitle } = validCourse;
    const req = createPostRequest('/api/v1/training', noTitle);
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects creation without required description field', async () => {
    const { description: _, ...noDesc } = validCourse;
    const req = createPostRequest('/api/v1/training', noDesc);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects creation without required estimatedMinutes field', async () => {
    const { estimatedMinutes: _, ...noMinutes } = validCourse;
    const req = createPostRequest('/api/v1/training', noMinutes);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // 6. Rejects creation by non-admin roles
  it('rejects course creation by front_desk role', async () => {
    mockGuardRole = 'front_desk';

    const req = createPostRequest('/api/v1/training', validCourse);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects course creation by security_guard role', async () => {
    mockGuardRole = 'security_guard';

    const req = createPostRequest('/api/v1/training', validCourse);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects course creation by resident role', async () => {
    mockGuardRole = 'resident_owner';

    const req = createPostRequest('/api/v1/training', validCourse);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 7. GET /api/v1/training/:id — Returns course with modules
// ---------------------------------------------------------------------------

describe('GET /api/v1/training/:id — Course Detail', () => {
  it('returns course with modules included', async () => {
    const course = {
      id: 'course-1',
      title: 'Fire Safety',
      description: 'Learn fire safety protocols.',
      status: 'published',
      estimatedDurationMinutes: 45,
      passThreshold: 70,
      modules: [
        {
          id: 'm1',
          title: 'Introduction',
          contentType: 'rich_text',
          sortOrder: 1,
          estimatedMinutes: 10,
        },
        {
          id: 'm2',
          title: 'Extinguisher Types',
          contentType: 'video',
          sortOrder: 2,
          estimatedMinutes: 15,
        },
        {
          id: 'm3',
          title: 'Evacuation Routes',
          contentType: 'document',
          sortOrder: 3,
          estimatedMinutes: 20,
        },
      ],
      quiz: {
        id: 'quiz-1',
        title: 'Fire Safety Quiz',
        questions: [{ id: 'q1' }, { id: 'q2' }],
      },
    };
    mockCourseFindUnique.mockResolvedValue(course);

    const req = createGetRequest('/api/v1/training/course-1');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof course }>(res);
    expect(body.data.modules).toHaveLength(3);
    expect(body.data.quiz).toBeDefined();
  });

  it('returns 404 for non-existent course', async () => {
    mockCourseFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/training/nonexistent');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 8. POST /api/v1/training/:id/enroll — Track enrollment
// ---------------------------------------------------------------------------

describe('POST /api/v1/training/:id/enroll — Enrollment', () => {
  it('enrolls the authenticated user in a course', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      title: 'Fire Safety',
      status: 'published',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    });
    mockEnrollmentFindUnique.mockResolvedValue(null); // not yet enrolled
    mockEnrollmentCreate.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'not_started',
      modulesCompleted: 0,
      totalModules: 3,
    });

    const req = createPostRequest('/api/v1/training/course-1/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; status: string } }>(res);
    expect(body.data.status).toBe('not_started');
  });

  // 9. Prevents double enrollment
  it('prevents double enrollment in the same course', async () => {
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      title: 'Fire Safety',
      status: 'published',
      modules: [{ id: 'm1' }],
    });
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-existing',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/course-1/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_ENROLLED');
  });

  it('returns 404 if course does not exist', async () => {
    mockCourseFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/nonexistent/enroll', {});
    const res = await ENROLL_POST(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 10. POST /api/v1/training/:id/modules/:moduleId/complete — Module completion
// ---------------------------------------------------------------------------

describe('POST /api/v1/training/:id/modules/:moduleId/complete — Module Completion', () => {
  it('marks a module as complete and updates progress', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      modulesCompleted: 1,
      totalModules: 3,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enrollment-1',
      modulesCompleted: 2,
      totalModules: 3,
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/course-1/modules/m2/complete', {});
    const res = await COMPLETE_POST(req, {
      params: Promise.resolve({ id: 'course-1', moduleId: 'm2' }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { modulesCompleted: number; progress: number } }>(res);
    expect(body.data.modulesCompleted).toBe(2);
  });

  // 11. Calculates progress percentage per enrollment
  it('calculates progress percentage correctly', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      modulesCompleted: 2,
      totalModules: 4,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }],
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enrollment-1',
      modulesCompleted: 3,
      totalModules: 4,
      status: 'in_progress',
    });

    const req = createPostRequest('/api/v1/training/course-1/modules/m3/complete', {});
    const res = await COMPLETE_POST(req, {
      params: Promise.resolve({ id: 'course-1', moduleId: 'm3' }),
    });

    const body = await parseResponse<{ data: { progress: number } }>(res);
    expect(body.data.progress).toBe(75);
  });

  // 12. Generates certificate on 100% completion
  it('generates certificate when all modules are completed', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      modulesCompleted: 2,
      totalModules: 3,
      bestQuizScore: 85,
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      title: 'Fire Safety',
      passThreshold: 70,
      modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
      property: { name: 'Test Property' },
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enrollment-1',
      modulesCompleted: 3,
      totalModules: 3,
      status: 'passed',
      certificateId: 'cert-1',
    });
    mockCertificateCreate.mockResolvedValue({
      id: 'cert-1',
      enrollmentId: 'enrollment-1',
      learnerName: 'Test User',
      courseTitle: 'Fire Safety',
      completionDate: new Date(),
      score: 85,
      verificationUrl: 'https://app.concierge.com/verify/cert-1',
    });

    const req = createPostRequest('/api/v1/training/course-1/modules/m3/complete', {});
    const res = await COMPLETE_POST(req, {
      params: Promise.resolve({ id: 'course-1', moduleId: 'm3' }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { progress: number; certificate: { id: string } } }>(
      res,
    );
    expect(body.data.progress).toBe(100);
    expect(body.data.certificate).toBeDefined();
    expect(body.data.certificate.id).toBe('cert-1');
  });

  it('returns 404 if enrollment does not exist', async () => {
    mockEnrollmentFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/course-1/modules/m1/complete', {});
    const res = await COMPLETE_POST(req, {
      params: Promise.resolve({ id: 'course-1', moduleId: 'm1' }),
    });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 13. POST /api/v1/training/:id/quiz — Submit quiz answers
// ---------------------------------------------------------------------------

describe('POST /api/v1/training/:id/quiz — Quiz Submission', () => {
  const quizAnswers = {
    answers: [
      { questionId: 'q1', selectedOptionIndex: 0 },
      { questionId: 'q2', selectedOptionIndex: 2 },
      { questionId: 'q3', selectedBoolean: true },
    ],
  };

  it('submits quiz answers and returns score', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      quizAttempts: 0,
    });
    mockQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'course-1',
      title: 'Fire Safety Quiz',
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
        {
          id: 'q2',
          questionType: 'multiple_choice',
          options: [
            { text: 'X', is_correct: false },
            { text: 'Y', is_correct: false },
            { text: 'Z', is_correct: true },
          ],
          points: 1,
        },
        { id: 'q3', questionType: 'true_false', correctAnswer: true, points: 1 },
      ],
    });
    mockQuizAttemptCreate.mockResolvedValue({
      id: 'attempt-1',
      enrollmentId: 'enrollment-1',
      quizId: 'quiz-1',
      startedAt: new Date(),
    });
    mockQuizAnswerCreateMany.mockResolvedValue({ count: 3 });
    mockQuizAttemptUpdate.mockResolvedValue({
      id: 'attempt-1',
      score: 100,
      passed: true,
      submittedAt: new Date(),
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enrollment-1',
      quizAttempts: 1,
      bestQuizScore: 100,
    });

    const req = createPostRequest('/api/v1/training/course-1/quiz', quizAnswers);
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { score: number; passed: boolean } }>(res);
    expect(body.data.score).toBeDefined();
    expect(body.data.passed).toBeDefined();
  });

  // 14. Quiz scoring: pass/fail based on minimum score threshold
  it('marks quiz as failed when score is below threshold', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      quizAttempts: 0,
    });
    mockQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      courseId: 'course-1',
      title: 'Fire Safety Quiz',
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
        {
          id: 'q2',
          questionType: 'multiple_choice',
          options: [
            { text: 'X', is_correct: false },
            { text: 'Y', is_correct: true },
          ],
          points: 1,
        },
        { id: 'q3', questionType: 'true_false', correctAnswer: true, points: 1 },
      ],
    });
    mockCourseFindUnique.mockResolvedValue({
      id: 'course-1',
      passThreshold: 70,
    });
    mockQuizAttemptCreate.mockResolvedValue({
      id: 'attempt-1',
      enrollmentId: 'enrollment-1',
      quizId: 'quiz-1',
      startedAt: new Date(),
    });
    mockQuizAnswerCreateMany.mockResolvedValue({ count: 3 });
    // User got 1 out of 3 correct = 33%
    mockQuizAttemptUpdate.mockResolvedValue({
      id: 'attempt-1',
      score: 33.33,
      passed: false,
      submittedAt: new Date(),
    });
    mockEnrollmentUpdate.mockResolvedValue({
      id: 'enrollment-1',
      quizAttempts: 1,
      bestQuizScore: 33.33,
    });

    const failAnswers = {
      answers: [
        { questionId: 'q1', selectedOptionIndex: 0 }, // correct
        { questionId: 'q2', selectedOptionIndex: 0 }, // wrong
        { questionId: 'q3', selectedBoolean: false }, // wrong
      ],
    };

    const req = createPostRequest('/api/v1/training/course-1/quiz', failAnswers);
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { score: number; passed: boolean } }>(res);
    expect(body.data.passed).toBe(false);
  });

  it('rejects quiz submission without enrollment', async () => {
    mockEnrollmentFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/course-1/quiz', quizAnswers);
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(404);
  });

  it('rejects quiz submission without answers', async () => {
    mockEnrollmentFindUnique.mockResolvedValue({
      id: 'enrollment-1',
      userId: 'test-user',
      courseId: 'course-1',
      status: 'in_progress',
      quizAttempts: 0,
    });

    const req = createPostRequest('/api/v1/training/course-1/quiz', {});
    const res = await QUIZ_POST(req, { params: Promise.resolve({ id: 'course-1' }) });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 15. Training report: completion rates per course across property
// ---------------------------------------------------------------------------

describe('GET /api/v1/training — Training Report', () => {
  it('returns completion rates when report=true query param is set', async () => {
    mockCourseFindMany.mockResolvedValue([
      {
        id: 'course-1',
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
        id: 'course-2',
        title: 'Front Desk Procedures',
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
      data: Array<{
        id: string;
        title: string;
        enrollmentCount: number;
        completionRate: number;
      }>;
    }>(res);

    expect(body.data).toHaveLength(2);
    // Course 1: 2 passed out of 4 = 50%
    expect(body.data[0]!.completionRate).toBe(50);
    expect(body.data[0]!.enrollmentCount).toBe(4);
    // Course 2: 1 passed out of 2 = 50%
    expect(body.data[1]!.completionRate).toBe(50);
  });
});
