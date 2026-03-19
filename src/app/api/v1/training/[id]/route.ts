/**
 * Training/LMS — Course Detail
 * Per PRD 11 Training LMS
 *
 * Returns a single course with its modules, quiz, and learning path info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            contentType: true,
            sortOrder: true,
            estimatedMinutes: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        quiz: {
          include: {
            questions: {
              select: {
                id: true,
                questionType: true,
                questionText: true,
                options: true,
                points: true,
                sortOrder: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Course not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('GET /api/v1/training/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch course' },
      { status: 500 },
    );
  }
}
