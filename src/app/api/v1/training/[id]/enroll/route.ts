/**
 * Training/LMS — Enrollment
 * Per PRD 11 Training LMS
 *
 * Enrolls the authenticated user in a course. Prevents double enrollment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: courseId } = await params;

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { select: { id: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Course not found' },
        { status: 404 },
      );
    }

    // Check for existing enrollment
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: auth.user.userId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'ALREADY_ENROLLED', message: 'You are already enrolled in this course.' },
        { status: 409 },
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: auth.user.userId,
        courseId,
        assignedById: auth.user.userId,
        status: 'not_started',
        modulesCompleted: 0,
        totalModules: course.modules.length,
      },
    });

    return NextResponse.json(
      { data: enrollment, message: `Enrolled in "${course.title}".` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/training/:id/enroll error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to enroll' },
      { status: 500 },
    );
  }
}
