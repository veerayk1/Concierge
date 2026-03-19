/**
 * Training/LMS — Quiz Submission
 * Per PRD 11 Training LMS
 *
 * Submit quiz answers, score them against correct answers, and determine
 * pass/fail based on the course's passThreshold setting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

interface SubmittedAnswer {
  questionId: string;
  selectedOptionIndex?: number;
  selectedBoolean?: boolean;
  freeFormResponse?: string;
}

interface QuizQuestion {
  id: string;
  questionType: string;
  options?: Array<{ text: string; is_correct: boolean }> | null;
  correctAnswer?: boolean | null;
  points: number;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: courseId } = await params;
    const body = await request.json();

    // Validate answers array
    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Answers array is required and must not be empty.' },
        { status: 400 },
      );
    }

    // Verify enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: auth.user.userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Enrollment not found. Please enroll first.' },
        { status: 404 },
      );
    }

    // Fetch the quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { courseId },
      include: {
        questions: {
          select: {
            id: true,
            questionType: true,
            options: true,
            correctAnswer: true,
            points: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No quiz found for this course.' },
        { status: 404 },
      );
    }

    // Get course pass threshold
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { passThreshold: true },
    });

    const passThreshold = course?.passThreshold ?? 70;

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        enrollmentId: enrollment.id,
        quizId: quiz.id,
        startedAt: new Date(),
      },
    });

    // Grade each answer
    const questions = quiz.questions as QuizQuestion[];
    const submittedAnswers = body.answers as SubmittedAnswer[];
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = submittedAnswers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) {
        return {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptionIndex: answer.selectedOptionIndex ?? null,
          selectedBoolean: answer.selectedBoolean ?? null,
          freeFormResponse: answer.freeFormResponse ?? null,
          isCorrect: false,
          pointsAwarded: 0,
        };
      }

      totalPoints += question.points;
      let isCorrect = false;

      if (question.questionType === 'multiple_choice' && question.options) {
        const options = question.options as Array<{ text: string; is_correct: boolean }>;
        const selectedIdx = answer.selectedOptionIndex;
        if (selectedIdx !== undefined && selectedIdx !== null && options[selectedIdx]) {
          isCorrect = options[selectedIdx]!.is_correct === true;
        }
      } else if (question.questionType === 'true_false') {
        isCorrect = answer.selectedBoolean === question.correctAnswer;
      }

      const pointsAwarded = isCorrect ? question.points : 0;
      earnedPoints += pointsAwarded;

      return {
        attemptId: attempt.id,
        questionId: answer.questionId,
        selectedOptionIndex: answer.selectedOptionIndex ?? null,
        selectedBoolean: answer.selectedBoolean ?? null,
        freeFormResponse: answer.freeFormResponse ?? null,
        isCorrect,
        pointsAwarded,
      };
    });

    // Save answers
    await prisma.quizAnswer.createMany({
      data: gradedAnswers,
    });

    // Calculate score percentage
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
    const passed = score >= passThreshold;

    // Update attempt with results
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        score,
        passed,
        timeSpentSeconds: 0,
      },
    });

    // Update enrollment with quiz stats
    const newQuizAttempts = enrollment.quizAttempts + 1;
    const currentBest = Number(enrollment.bestQuizScore ?? 0);
    const bestScore = Math.max(currentBest, score);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        quizAttempts: newQuizAttempts,
        bestQuizScore: bestScore,
      },
    });

    return NextResponse.json({
      data: {
        attemptId: updatedAttempt.id,
        score,
        passed,
        totalQuestions: questions.length,
        correctAnswers: gradedAnswers.filter((a) => a.isCorrect).length,
        passThreshold,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/training/:id/quiz error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to submit quiz' },
      { status: 500 },
    );
  }
}
