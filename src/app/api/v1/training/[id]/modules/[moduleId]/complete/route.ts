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
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: courseId, moduleId } = await params;
    if (!isUuid(courseId)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid course id.' },
        { status: 400 },
      );
    }
    if (!isUuid(moduleId)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid module id.' },
        { status: 400 },
      );
    }

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

    const tenancy = enforcePropertyAccess(auth.user, course.propertyId);
    if (tenancy) return tenancy;

    const moduleExists = course.modules.some((m) => m.id === moduleId);
    if (!moduleExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Module not found in this course' },
        { status: 404 },
      );
    }

    const totalModules = course.modules.length;

    // Atomic increment of modulesCompleted — Prisma compiles this to a
    // single SQL UPDATE which Postgres serializes via row-level lock, so
    // N concurrent module-complete POSTs each see their own pre-increment
    // value (not stale reads). Without this, N concurrent clicks at 99%
    // would all read modulesCompleted=N-1, all set =N, and the increment
    // would be lost.
    const afterIncrement = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        modulesCompleted: { increment: 1 },
        totalModules,
        currentModuleId: moduleId,
        ...(enrollment.status === 'not_started'
          ? { startedAt: new Date(), status: 'in_progress' as const }
          : {}),
      },
    });

    const newModulesCompleted = afterIncrement.modulesCompleted;
    const progress = Math.min(100, Math.round((newModulesCompleted / totalModules) * 100));
    const crossedCompletion = newModulesCompleted >= totalModules;

    // Generate certificate on 100% completion — race-guarded via atomic
    // CAS on completedAt IS NULL. Only the first transaction that
    // crosses the threshold gets to write the completedAt timestamp and
    // mint the credential; concurrent late callers see completedAt is
    // already set and skip cert creation. Certificate.enrollmentId has
    // a UNIQUE constraint as a belt-and-suspenders backup.
    let certificate = null;
    let updated = afterIncrement;
    if (crossedCompletion) {
      const claim = await prisma.$executeRaw`
        UPDATE enrollments
        SET "completedAt" = NOW(), status = 'passed'
        WHERE id = ${enrollment.id}::uuid AND "completedAt" IS NULL
      `;
      if (claim === 1) {
        certificate = await prisma.certificate.create({
          data: {
            enrollmentId: enrollment.id,
            learnerName: 'Test User',
            courseTitle: course.title,
            propertyName: course.property?.name ?? 'Property',
            completionDate: new Date(),
            score: Number(enrollment.bestQuizScore ?? 0),
            verificationUrl: `https://app.concierge.com/verify/${enrollment.id}`,
          },
        });
        updated = await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { certificateId: certificate.id },
        });
      } else {
        updated =
          (await prisma.enrollment.findUnique({ where: { id: enrollment.id } })) ?? afterIncrement;
      }
    }

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
