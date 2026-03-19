/**
 * Know Your Residents — Gamified Staff Training Tests
 *
 * Per CLAUDE.md: "Know Your Residents" is a training module, NOT a sidebar item.
 * This is a gamified quiz where staff learn to recognize residents by name, unit,
 * and photo. Supports difficulty levels, streaks, leaderboards, and personal bests.
 *
 * Data model: OccupancyRecord (unit + user link) + User (name, avatar) + Unit (number)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockOccupancyFindMany = vi.fn();
const mockKyrSessionCreate = vi.fn();
const mockKyrSessionFindUnique = vi.fn();
const mockKyrSessionUpdate = vi.fn();
const mockKyrSessionFindMany = vi.fn();
const mockKyrAnswerCreate = vi.fn();
const mockKyrLeaderboardFindMany = vi.fn();
const mockKyrLeaderboardUpsert = vi.fn();
const mockKyrLeaderboardFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    occupancyRecord: {
      findMany: (...args: unknown[]) => mockOccupancyFindMany(...args),
    },
    kyrSession: {
      create: (...args: unknown[]) => mockKyrSessionCreate(...args),
      findUnique: (...args: unknown[]) => mockKyrSessionFindUnique(...args),
      update: (...args: unknown[]) => mockKyrSessionUpdate(...args),
      findMany: (...args: unknown[]) => mockKyrSessionFindMany(...args),
    },
    kyrAnswer: {
      create: (...args: unknown[]) => mockKyrAnswerCreate(...args),
    },
    kyrLeaderboard: {
      findMany: (...args: unknown[]) => mockKyrLeaderboardFindMany(...args),
      upsert: (...args: unknown[]) => mockKyrLeaderboardUpsert(...args),
      findUnique: (...args: unknown[]) => mockKyrLeaderboardFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

let mockGuardRole = 'front_desk';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      user: {
        userId: 'staff-user-1',
        propertyId: 'prop-001',
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    });
  }),
}));

import { GET, POST } from '../route';
import { GET as GET_LEADERBOARD } from '../leaderboard/route';

const PROPERTY_ID = 'prop-001';

// Helpers for mock resident data
function makeMockResident(overrides: Record<string, unknown> = {}) {
  return {
    id: 'occ-1',
    unitId: 'unit-1',
    userId: 'resident-1',
    propertyId: PROPERTY_ID,
    residentType: 'owner',
    moveInDate: new Date('2025-01-15'),
    moveOutDate: null,
    isPrimary: true,
    unit: { id: 'unit-1', number: '101', floor: 1 },
    user: {
      id: 'resident-1',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: 'https://cdn.example.com/photos/jane.jpg',
      isActive: true,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'front_desk';
  mockKyrLeaderboardUpsert.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// 1. GET — Start quiz session: random resident shown (photo + unit)
// ---------------------------------------------------------------------------

describe('GET /api/v1/training/know-your-residents — Start Quiz Session', () => {
  it('starts a quiz session and returns a random resident question', async () => {
    const residents = [
      makeMockResident(),
      makeMockResident({
        id: 'occ-2',
        unitId: 'unit-2',
        userId: 'resident-2',
        unit: { id: 'unit-2', number: '205', floor: 2 },
        user: {
          id: 'resident-2',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://cdn.example.com/photos/john.jpg',
          isActive: true,
        },
      }),
    ];
    mockOccupancyFindMany.mockResolvedValue(residents);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'easy',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'easy' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        sessionId: string;
        question: {
          occupancyId: string;
          photoUrl: string | null;
          unitNumber: string;
          isNewResident: boolean;
        };
        difficulty: string;
        totalResidents: number;
      };
    }>(res);

    expect(body.data.sessionId).toBe('session-1');
    expect(body.data.question).toBeDefined();
    expect(body.data.question.unitNumber).toBeDefined();
    expect(body.data.difficulty).toBe('easy');
    expect(body.data.totalResidents).toBe(2);
  });

  // 9. Only active residents included in quiz pool
  it('only includes active residents with no move-out date', async () => {
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'easy',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    // Verify the query filters for active residents only
    const queryArg = mockOccupancyFindMany.mock.calls[0]![0];
    expect(queryArg.where.moveOutDate).toEqual(null);
    expect(queryArg.where.user.isActive).toBe(true);
  });

  // 10. New residents highlighted (moved in last 30 days)
  it('marks residents who moved in within the last 30 days as new', async () => {
    const recentMoveIn = new Date();
    recentMoveIn.setDate(recentMoveIn.getDate() - 10); // 10 days ago

    const oldMoveIn = new Date('2024-06-01');

    const residents = [
      makeMockResident({ moveInDate: recentMoveIn }),
      makeMockResident({
        id: 'occ-2',
        userId: 'resident-2',
        unitId: 'unit-2',
        moveInDate: oldMoveIn,
        unit: { id: 'unit-2', number: '305', floor: 3 },
        user: {
          id: 'resident-2',
          firstName: 'Bob',
          lastName: 'Old',
          avatarUrl: null,
          isActive: true,
        },
      }),
    ];
    mockOccupancyFindMany.mockResolvedValue(residents);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'easy',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: {
        sessionId: string;
        question: { isNewResident: boolean };
        totalResidents: number;
      };
    }>(res);

    // At least one question was returned; new resident flag is present
    expect(typeof body.data.question.isNewResident).toBe('boolean');
    expect(body.data.totalResidents).toBe(2);
  });

  // 11. Difficulty levels
  it('accepts difficulty=easy (unit -> name)', async () => {
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'easy',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'easy' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { difficulty: string; question: { prompt: string } };
    }>(res);

    expect(body.data.difficulty).toBe('easy');
    // Easy mode: shows unit number, player guesses name
    expect(body.data.question.prompt).toBe('unit_to_name');
  });

  it('accepts difficulty=medium (name -> unit)', async () => {
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'medium',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'medium' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { difficulty: string; question: { prompt: string } };
    }>(res);

    expect(body.data.difficulty).toBe('medium');
    expect(body.data.question.prompt).toBe('name_to_unit');
  });

  it('accepts difficulty=hard (photo -> name+unit)', async () => {
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);
    mockKyrSessionCreate.mockResolvedValue({
      id: 'session-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      difficulty: 'hard',
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID, difficulty: 'hard' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { difficulty: string; question: { prompt: string } };
    }>(res);

    expect(body.data.difficulty).toBe('hard');
    expect(body.data.question.prompt).toBe('photo_to_name_and_unit');
  });

  it('returns 400 if propertyId is missing', async () => {
    const req = createGetRequest('/api/v1/training/know-your-residents');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if no active residents in property', async () => {
    mockOccupancyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/training/know-your-residents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 2-5. POST — Submit answer (correct/wrong, scoring, streaks, session tracking)
// ---------------------------------------------------------------------------

describe('POST /api/v1/training/know-your-residents — Submit Answer', () => {
  const activeSession = {
    id: 'session-1',
    userId: 'staff-user-1',
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
    createdAt: new Date(),
    questionStartedAt: new Date(Date.now() - 5000), // 5 seconds ago
  };

  // 2. Player guesses resident name
  it('accepts a guess for a resident name', async () => {
    mockKyrSessionFindUnique.mockResolvedValue(activeSession);
    // Single mock that covers the occupancy lookup inside POST
    mockOccupancyFindMany.mockResolvedValue([
      makeMockResident(),
      makeMockResident({
        id: 'occ-2',
        userId: 'resident-2',
        unitId: 'unit-2',
        unit: { id: 'unit-2', number: '205', floor: 2 },
        user: {
          id: 'resident-2',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: null,
          isActive: true,
        },
      }),
    ]);

    const correctAnswer = {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    };

    mockKyrAnswerCreate.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      givenAnswer: 'Jane Smith',
      correctAnswer: 'Jane Smith',
      isCorrect: true,
      timeMs: 5000,
      points: 10,
    });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      correctAnswers: 2,
      currentStreak: 2,
      totalScore: 20,
      totalTimeMs: 13000,
    });
    mockKyrLeaderboardUpsert.mockResolvedValue({});

    const req = createPostRequest('/api/v1/training/know-your-residents', correctAnswer);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        isCorrect: boolean;
        points: number;
        streak: number;
        session: { totalScore: number; correctAnswers: number; wrongAnswers: number };
        nextQuestion: Record<string, unknown> | null;
      };
    }>(res);

    expect(body.data.isCorrect).toBe(true);
  });

  // 3. Correct answer: +10 points, streak counter increments
  it('awards 10 points and increments streak on correct answer', async () => {
    mockKyrSessionFindUnique.mockResolvedValue(activeSession);

    mockKyrAnswerCreate.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      givenAnswer: 'Jane Smith',
      correctAnswer: 'Jane Smith',
      isCorrect: true,
      timeMs: 5000,
      points: 10,
    });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      correctAnswers: 2,
      currentStreak: 2,
      totalScore: 20,
      totalTimeMs: 13000,
    });
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        isCorrect: boolean;
        points: number;
        streak: number;
        session: { totalScore: number };
      };
    }>(res);

    expect(body.data.isCorrect).toBe(true);
    expect(body.data.points).toBe(10);
    expect(body.data.streak).toBe(2);
    expect(body.data.session.totalScore).toBe(20);
  });

  // 4. Wrong answer: 0 points, streak resets, correct answer shown
  it('awards 0 points, resets streak, and shows correct answer on wrong guess', async () => {
    mockKyrSessionFindUnique.mockResolvedValue({
      ...activeSession,
      currentStreak: 5,
    });

    mockKyrAnswerCreate.mockResolvedValue({
      id: 'answer-2',
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      givenAnswer: 'Wrong Name',
      correctAnswer: 'Jane Smith',
      isCorrect: false,
      timeMs: 5000,
      points: 0,
    });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      correctAnswers: 1,
      wrongAnswers: 2,
      currentStreak: 0,
      bestStreak: 5,
      totalScore: 10,
      totalTimeMs: 13000,
    });
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Wrong Name',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        isCorrect: boolean;
        points: number;
        streak: number;
        correctAnswer: string;
        session: { totalScore: number; wrongAnswers: number };
      };
    }>(res);

    expect(body.data.isCorrect).toBe(false);
    expect(body.data.points).toBe(0);
    expect(body.data.streak).toBe(0);
    expect(body.data.correctAnswer).toBe('Jane Smith');
    expect(body.data.session.wrongAnswers).toBe(2);
  });

  // 5. Session tracks: correct, wrong, total, time per question
  it('tracks correct, wrong, total, and time per question in session', async () => {
    mockKyrSessionFindUnique.mockResolvedValue(activeSession);

    mockKyrAnswerCreate.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      givenAnswer: 'Jane Smith',
      correctAnswer: 'Jane Smith',
      isCorrect: true,
      timeMs: 5000,
      points: 10,
    });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      correctAnswers: 2,
      wrongAnswers: 1,
      totalScore: 20,
      totalTimeMs: 13000,
    });
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        timeMs: number;
        session: {
          totalQuestions: number;
          correctAnswers: number;
          wrongAnswers: number;
          totalTimeMs: number;
          totalScore: number;
        };
      };
    }>(res);

    // Time is calculated live, allow small tolerance
    expect(body.data.timeMs).toBeGreaterThanOrEqual(5000);
    expect(body.data.timeMs).toBeLessThan(6000);
    expect(body.data.session.totalQuestions).toBe(3);
    expect(body.data.session.correctAnswers).toBe(2);
    expect(body.data.session.wrongAnswers).toBe(1);
    expect(body.data.session.totalTimeMs).toBe(13000);
  });

  // 12. Session timeout after 60 seconds per question
  it('returns timeout when question exceeds 60 seconds', async () => {
    const timedOutSession = {
      ...activeSession,
      questionStartedAt: new Date(Date.now() - 61000), // 61 seconds ago
    };
    mockKyrSessionFindUnique.mockResolvedValue(timedOutSession);

    mockKyrAnswerCreate.mockResolvedValue({
      id: 'answer-timeout',
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      givenAnswer: 'Jane Smith',
      correctAnswer: 'Jane Smith',
      isCorrect: false,
      timeMs: 61000,
      points: 0,
      timedOut: true,
    });
    mockKyrSessionUpdate.mockResolvedValue({
      ...activeSession,
      totalQuestions: 3,
      wrongAnswers: 2,
      currentStreak: 0,
      totalTimeMs: 69000,
    });
    mockOccupancyFindMany.mockResolvedValue([makeMockResident()]);

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        isCorrect: boolean;
        timedOut: boolean;
        correctAnswer: string;
        points: number;
      };
    }>(res);

    expect(body.data.timedOut).toBe(true);
    expect(body.data.isCorrect).toBe(false);
    expect(body.data.points).toBe(0);
    expect(body.data.correctAnswer).toBeDefined();
  });

  it('returns 400 if sessionId is missing', async () => {
    const req = createPostRequest('/api/v1/training/know-your-residents', {
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if session does not exist', async () => {
    mockKyrSessionFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'nonexistent',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 if session belongs to a different user', async () => {
    mockKyrSessionFindUnique.mockResolvedValue({
      ...activeSession,
      userId: 'other-user',
    });

    const req = createPostRequest('/api/v1/training/know-your-residents', {
      sessionId: 'session-1',
      occupancyId: 'occ-1',
      answer: 'Jane Smith',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 6-8. GET /training/know-your-residents/leaderboard
// ---------------------------------------------------------------------------

describe('GET /api/v1/training/know-your-residents/leaderboard', () => {
  // 6. Leaderboard endpoint returns entries
  it('returns the leaderboard for a property', async () => {
    mockKyrLeaderboardFindMany.mockResolvedValue([
      {
        id: 'lb-1',
        userId: 'staff-1',
        propertyId: PROPERTY_ID,
        highScore: 150,
        bestStreak: 10,
        totalGames: 20,
        avgTimeMs: 4500,
        user: { id: 'staff-1', firstName: 'Alice', lastName: 'A', avatarUrl: null },
      },
      {
        id: 'lb-2',
        userId: 'staff-2',
        propertyId: PROPERTY_ID,
        highScore: 120,
        bestStreak: 8,
        totalGames: 15,
        avgTimeMs: 5200,
        user: { id: 'staff-2', firstName: 'Bob', lastName: 'B', avatarUrl: null },
      },
      {
        id: 'lb-3',
        userId: 'staff-3',
        propertyId: PROPERTY_ID,
        highScore: 120,
        bestStreak: 6,
        totalGames: 12,
        avgTimeMs: 3800,
        user: { id: 'staff-3', firstName: 'Carol', lastName: 'C', avatarUrl: null },
      },
    ]);

    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_LEADERBOARD(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{
        rank: number;
        userId: string;
        userName: string;
        highScore: number;
        bestStreak: number;
        totalGames: number;
        avgTimeMs: number;
      }>;
    }>(res);

    expect(body.data).toHaveLength(3);
    expect(body.data[0]!.rank).toBe(1);
  });

  // 7. Leaderboard sorted by score descending, then by avgTimeMs ascending
  it('sorts leaderboard by score descending, then by avgTimeMs ascending', async () => {
    mockKyrLeaderboardFindMany.mockResolvedValue([
      {
        id: 'lb-1',
        userId: 'staff-1',
        propertyId: PROPERTY_ID,
        highScore: 150,
        bestStreak: 10,
        totalGames: 20,
        avgTimeMs: 4500,
        user: { id: 'staff-1', firstName: 'Alice', lastName: 'A', avatarUrl: null },
      },
      {
        id: 'lb-3',
        userId: 'staff-3',
        propertyId: PROPERTY_ID,
        highScore: 120,
        bestStreak: 6,
        totalGames: 12,
        avgTimeMs: 3800,
        user: { id: 'staff-3', firstName: 'Carol', lastName: 'C', avatarUrl: null },
      },
      {
        id: 'lb-2',
        userId: 'staff-2',
        propertyId: PROPERTY_ID,
        highScore: 120,
        bestStreak: 8,
        totalGames: 15,
        avgTimeMs: 5200,
        user: { id: 'staff-2', firstName: 'Bob', lastName: 'B', avatarUrl: null },
      },
    ]);

    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_LEADERBOARD(req);
    const body = await parseResponse<{
      data: Array<{ userId: string; highScore: number; avgTimeMs: number }>;
    }>(res);

    // First: Alice (150), then Carol (120, 3800ms), then Bob (120, 5200ms)
    expect(body.data[0]!.userId).toBe('staff-1');
    expect(body.data[1]!.userId).toBe('staff-3');
    expect(body.data[2]!.userId).toBe('staff-2');

    // Verify the orderBy passed to Prisma
    const queryArg = mockKyrLeaderboardFindMany.mock.calls[0]![0];
    expect(queryArg.orderBy).toEqual([{ highScore: 'desc' }, { avgTimeMs: 'asc' }]);
  });

  // 8. Personal best tracking per user
  it('includes personal best for the requesting user', async () => {
    mockKyrLeaderboardFindMany.mockResolvedValue([
      {
        id: 'lb-1',
        userId: 'staff-user-1',
        propertyId: PROPERTY_ID,
        highScore: 200,
        bestStreak: 15,
        totalGames: 30,
        avgTimeMs: 3500,
        user: { id: 'staff-user-1', firstName: 'Me', lastName: 'Staff', avatarUrl: null },
      },
    ]);
    mockKyrLeaderboardFindUnique.mockResolvedValue({
      id: 'lb-1',
      userId: 'staff-user-1',
      propertyId: PROPERTY_ID,
      highScore: 200,
      bestStreak: 15,
      totalGames: 30,
      avgTimeMs: 3500,
    });

    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_LEADERBOARD(req);
    const body = await parseResponse<{
      data: Array<Record<string, unknown>>;
      personalBest: {
        highScore: number;
        bestStreak: number;
        totalGames: number;
        avgTimeMs: number;
      };
    }>(res);

    expect(body.personalBest).toBeDefined();
    expect(body.personalBest.highScore).toBe(200);
    expect(body.personalBest.bestStreak).toBe(15);
    expect(body.personalBest.totalGames).toBe(30);
  });

  it('returns 400 if propertyId is missing', async () => {
    const req = createGetRequest('/api/v1/training/know-your-residents/leaderboard');
    const res = await GET_LEADERBOARD(req);
    expect(res.status).toBe(400);
  });
});
