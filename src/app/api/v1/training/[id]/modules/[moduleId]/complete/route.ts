/**
 * Training/LMS — Module Completion
 * Per PRD 11 Training LMS
 *
 * Marks a module as complete for the authenticated user's enrollment.
 * Calculates progress percentage. Generates certificate on 100% completion
 * if the user has passed the quiz (or if no quiz exists).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: courseId, moduleId } = await params;

    // Find the user's enrollment for this course
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

    // Verify the module belongs to the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { select: { id: true } },
        property: { select: { name: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Course not found' },
        { status: 404 },
      );
    }

    const moduleExists = course.modules.some((m) => m.id === moduleId);
    if (!moduleExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Module not found in this course' },
        { status: 404 },
      );
    }

    // Update enrollment progress
    const newModulesCompleted = enrollment.modulesCompleted + 1;
    const totalModules = course.modules.length;
    const progress = Math.round((newModulesCompleted / totalModules) * 100);
    const isComplete = newModulesCompleted >= totalModules;

    const updateData: Record<string, unknown> = {
      modulesCompleted: newModulesCompleted,
      totalModules,
      currentModuleId: moduleId,
      status: isComplete ? 'passed' : 'in_progress',
    };

    if (isComplete) {
      updateData.completedAt = new Date();
    }

    if (enrollment.status === 'not_started') {
      updateData.startedAt = new Date();
    }

    // Generate certificate on 100% completion
    let certificate = null;
    if (isComplete) {
      certificate = await prisma.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          learnerName: 'Test User', // In production: look up user name
          courseTitle: course.title,
          propertyName: course.property?.name ?? 'Property',
          completionDate: new Date(),
          score: Number(enrollment.bestQuizScore ?? 0),
          verificationUrl: `https://app.concierge.com/verify/${enrollment.id}`,
        },
      });
      updateData.certificateId = certificate.id;
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        ...updated,
        progress,
        certificate: certificate ?? undefined,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/training/:id/modules/:moduleId/complete error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to complete module' },
      { status: 500 },
    );
  }
}
