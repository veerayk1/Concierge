/**
 * Know Your Residents — Gamified Staff Training API
 *
 * Per CLAUDE.md: "Know Your Residents" is a training module, NOT a sidebar item.
 * BuildingLink had this as primary navigation — we make it a training module instead.
 *
 * GET  — Start a new quiz session (returns first question)
 * POST — Submit an answer to the current question
 *
 * Difficulty levels:
 *   easy   — unit number shown, guess the resident name
 *   medium — resident name shown, guess the unit number
 *   hard   — photo shown, guess name + unit
 *
 * Scoring: +10 per correct answer, 0 for wrong. Streak tracking.
 * Timeout: 60 seconds per question.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

const POINTS_PER_CORRECT = 10;
const QUESTION_TIMEOUT_MS = 60_000;
const NEW_RESIDENT_DAYS = 30;

type Difficulty = 'easy' | 'medium' | 'hard';

const PROMPT_MAP: Record<Difficulty, string> = {
  easy: 'unit_to_name',
  medium: 'name_to_unit',
  hard: 'photo_to_name_and_unit',
};

interface OccupancyWithRelations {
  id: string;
  unitId: string;
  userId: string;
  propertyId: string;
  moveInDate: Date;
  moveOutDate: Date | null;
  unit: { id: string; number: string; floor: number | null };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    isActive: boolean;
  };
}

function isNewResident(moveInDate: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - NEW_RESIDENT_DAYS);
  return new Date(moveInDate) >= thirtyDaysAgo;
}

function buildQuestion(resident: OccupancyWithRelations, difficulty: Difficulty) {
  return {
    occupancyId: resident.id,
    photoUrl: resident.user.avatarUrl,
    unitNumber: resident.unit.number,
    residentName:
      difficulty === 'easy' ? undefined : `${resident.user.firstName} ${resident.user.lastName}`,
    isNewResident: isNewResident(resident.moveInDate),
    prompt: PROMPT_MAP[difficulty],
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ---------------------------------------------------------------------------
// GET — Start quiz session
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const difficulty = (searchParams.get('difficulty') || 'easy') as Difficulty;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'INVALID_DIFFICULTY', message: 'difficulty must be easy, medium, or hard' },
        { status: 400 },
      );
    }

    // Fetch active residents only (no move-out date, user is active)
    const residents = (await prisma.occupancyRecord.findMany({
      where: {
        propertyId,
        moveOutDate: null,
        user: { isActive: true },
      },
      include: {
        unit: { select: { id: true, number: true, floor: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    })) as unknown as OccupancyWithRelations[];

    if (residents.length === 0) {
      return NextResponse.json(
        { error: 'NO_RESIDENTS', message: 'No active residents found for this property' },
        { status: 404 },
      );
    }

    // Create session
    const session = await prisma.kyrSession.create({
      data: {
        userId: auth.user.userId,
        propertyId,
        difficulty,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalScore: 0,
        totalTimeMs: 0,
        status: 'active',
        questionStartedAt: new Date(),
      },
    });

    const selected = pickRandom(residents);
    const question = buildQuestion(selected, difficulty);

    return NextResponse.json({
      data: {
        sessionId: session.id,
        question,
        difficulty,
        totalResidents: residents.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/training/know-your-residents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to start quiz session' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Submit answer
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { sessionId, occupancyId, answer } = body;

    if (!sessionId || !occupancyId || answer === undefined) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'sessionId, occupancyId, and answer are required',
        },
        { status: 400 },
      );
    }

    // Load session
    const session = await prisma.kyrSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'SESSION_NOT_FOUND', message: 'Quiz session not found' },
        { status: 404 },
      );
    }

    if (session.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'This session belongs to another user' },
        { status: 403 },
      );
    }

    // Calculate time elapsed
    const now = new Date();
    const questionStart = new Date(session.questionStartedAt);
    const timeMs = now.getTime() - questionStart.getTime();
    const timedOut = timeMs > QUESTION_TIMEOUT_MS;

    // Fetch the correct resident data
    const residents = (await prisma.occupancyRecord.findMany({
      where: {
        propertyId: session.propertyId,
        moveOutDate: null,
        user: { isActive: true },
      },
      include: {
        unit: { select: { id: true, number: true, floor: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    })) as unknown as OccupancyWithRelations[];

    const targetResident = residents.find((r) => r.id === occupancyId);

    // Build correct answer based on difficulty
    const difficulty = session.difficulty as Difficulty;
    let correctAnswer: string;
    if (difficulty === 'medium') {
      correctAnswer = targetResident ? targetResident.unit.number : '';
    } else if (difficulty === 'hard') {
      correctAnswer = targetResident
        ? `${targetResident.user.firstName} ${targetResident.user.lastName} - ${targetResident.unit.number}`
        : '';
    } else {
      // easy: unit -> name
      correctAnswer = targetResident
        ? `${targetResident.user.firstName} ${targetResident.user.lastName}`
        : '';
    }

    // Determine if correct (case-insensitive, trimmed)
    const normalizedAnswer = String(answer).trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    const isCorrect = !timedOut && normalizedAnswer === normalizedCorrect;

    const points = isCorrect ? POINTS_PER_CORRECT : 0;
    const newStreak = isCorrect ? (session.currentStreak as number) + 1 : 0;
    const newBestStreak = Math.max(session.bestStreak as number, newStreak);

    // Record answer
    const answerRecord = await prisma.kyrAnswer.create({
      data: {
        sessionId,
        occupancyId,
        givenAnswer: String(answer),
        correctAnswer,
        isCorrect,
        timeMs,
        points,
        timedOut,
      },
    });

    // Update session
    const updatedSession = await prisma.kyrSession.update({
      where: { id: sessionId },
      data: {
        totalQuestions: (session.totalQuestions as number) + 1,
        correctAnswers: (session.correctAnswers as number) + (isCorrect ? 1 : 0),
        wrongAnswers: (session.wrongAnswers as number) + (isCorrect ? 0 : 1),
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        totalScore: (session.totalScore as number) + points,
        totalTimeMs: (session.totalTimeMs as number) + timeMs,
        questionStartedAt: new Date(), // Reset for next question
      },
    });

    // Pick next question (exclude the one just answered)
    const remaining = residents.filter((r) => r.id !== occupancyId);
    const nextResident = remaining.length > 0 ? pickRandom(remaining) : pickRandom(residents);
    const nextQuestion = buildQuestion(nextResident, difficulty);

    // Update personal best on leaderboard
    await prisma.kyrLeaderboard.upsert({
      where: {
        userId_propertyId: {
          userId: auth.user.userId,
          propertyId: session.propertyId as string,
        },
      },
      create: {
        userId: auth.user.userId,
        propertyId: session.propertyId as string,
        highScore: updatedSession.totalScore as number,
        bestStreak: newBestStreak,
        totalGames: 1,
        avgTimeMs: timeMs,
      },
      update: {
        highScore: { set: Math.max(0, updatedSession.totalScore as number) },
        bestStreak: { set: newBestStreak },
        totalGames: { increment: 0 }, // Updated on session end
        avgTimeMs: timeMs,
      },
    });

    const responseData: Record<string, unknown> = {
      isCorrect,
      points,
      streak: newStreak,
      timeMs,
      timedOut,
      session: {
        totalQuestions: updatedSession.totalQuestions,
        correctAnswers: updatedSession.correctAnswers,
        wrongAnswers: updatedSession.wrongAnswers,
        totalScore: updatedSession.totalScore,
        totalTimeMs: updatedSession.totalTimeMs,
      },
      nextQuestion,
    };

    // Show correct answer on wrong/timed-out answers
    if (!isCorrect) {
      responseData.correctAnswer = correctAnswer;
    }

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('POST /api/v1/training/know-your-residents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to submit answer' },
      { status: 500 },
    );
  }
}
