/**
 * Training/LMS API — List courses and track progress
 * Per PRD 11 Training LMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // not_started, in_progress, completed

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const courses = await prisma.course.findMany({
      where: {
        propertyId,
        deletedAt: null,
        isPublished: true,
      },
      include: {
        learningPath: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ isRequired: 'desc' }, { title: 'asc' }],
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
