/**
 * Training/LMS API — List courses and track progress
 * Per PRD 11 Training LMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const _userId = searchParams.get('userId');
    const _status = searchParams.get('status'); // not_started, in_progress, completed

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const courses = await prisma.course.findMany({
      where: {
        propertyId,
        status: 'published',
      },
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
