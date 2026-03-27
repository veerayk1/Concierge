/**
 * Training/LMS API — List courses, create courses, training reports
 * Per PRD 11 Training LMS
 *
 * Unique feature from Condo Control. Enables staff onboarding,
 * mandatory compliance training, quizzes, and certificate generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { handleDemoRequest } from '@/server/demo';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

export async function GET(request: NextRequest) {
  // Skip demo handler — training uses the real database so GET/POST stay consistent
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'training_lms');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const statusFilter = searchParams.get('status');
    const isReport = searchParams.get('report') === 'true';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    // Build where clause — non-admins only see published courses
    const where: Record<string, unknown> = { propertyId };
    if (statusFilter && isAdmin) {
      where.status = statusFilter;
    } else if (!isAdmin) {
      where.status = 'published';
    }
    // Admins with no status filter see ALL courses (draft + published + archived)

    // Report mode: include enrollment stats for completion rates
    if (isReport && isAdmin) {
      const courses = await prisma.course.findMany({
        where,
        include: {
          enrollments: {
            select: { id: true, status: true },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: [{ mandatory: 'desc' }, { title: 'asc' }],
      });

      const reportData = courses.map((course) => {
        const enrollmentCount = course._count.enrollments;
        const passedCount = course.enrollments.filter((e) => e.status === 'passed').length;
        const completionRate =
          enrollmentCount > 0 ? Math.round((passedCount / enrollmentCount) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          enrollmentCount,
          completionRate,
        };
      });

      return NextResponse.json({ data: reportData });
    }

    // Standard listing with module details
    const courses = await prisma.course.findMany({
      where,
      include: {
        modules: {
          select: { id: true, title: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        learningPathCourses: {
          select: {
            learningPath: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ mandatory: 'desc' }, { title: 'asc' }],
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error('GET /api/v1/training error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch courses' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Skip demo handler — training uses the real database so GET/POST stay consistent
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'training_lms');
    if (moduleCheck) return moduleCheck;

    // Only admins can create courses
    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can create courses.' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const errors: Record<string, string[]> = {};
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.title = ['Title is required'];
    }
    if (
      !body.description ||
      typeof body.description !== 'string' ||
      body.description.trim().length === 0
    ) {
      errors.description = ['Description is required'];
    }
    if (
      body.estimatedMinutes === undefined ||
      body.estimatedMinutes === null ||
      typeof body.estimatedMinutes !== 'number'
    ) {
      errors.estimatedMinutes = ['Estimated minutes is required and must be a number'];
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Missing required fields', fields: errors },
        { status: 400 },
      );
    }

    // Generate course code
    const courseCode = `TRN-${String(Date.now()).slice(-6)}`;

    const resolvedPropertyId = body.propertyId || auth.user.propertyId;

    // Resolve a real createdById — demo mode user may not exist in the DB
    let createdById = auth.user.userId;
    try {
      const realUser = await prisma.user.findFirst({
        where: { propertyId: resolvedPropertyId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (realUser) createdById = realUser.id;
    } catch {
      // Ignore — use auth userId
    }

    const course = await prisma.course.create({
      data: {
        propertyId: resolvedPropertyId,
        courseCode,
        title: body.title.trim(),
        description: body.description.trim(),
        estimatedDurationMinutes: body.estimatedMinutes,
        category: body.category || null,
        difficulty: body.difficulty || 'beginner',
        passThreshold: body.passThreshold || 70,
        mandatory: body.mandatory || false,
        status: 'draft',
        createdById,
      },
    });

    return NextResponse.json(
      { data: course, message: `Course "${course.title}" created with code ${course.courseCode}.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/training error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: `Failed to create course: ${errMsg}` },
      { status: 500 },
    );
  }
}
