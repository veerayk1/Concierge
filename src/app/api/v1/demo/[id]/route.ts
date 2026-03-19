/**
 * Demo Environment API — Detail and Delete
 * Per PRD 21 — Sales demo + training sandbox system
 *
 * GET: Returns demo details including session history for usage auditing
 * DELETE: Purges demo environment and all associated data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];
const DEMO_TYPES = ['DEMO', 'TRAINING'];

/**
 * GET /api/v1/demo/:id — Get demo environment details
 *
 * Returns the demo property with session history for usage tracking.
 * Rejects access to production properties to maintain isolation.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        demoSessions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Demo environment not found' },
        { status: 404 },
      );
    }

    // Prevent accessing production properties through demo endpoints
    if (!DEMO_TYPES.includes(property.type)) {
      return NextResponse.json(
        {
          error: 'NOT_DEMO_PROPERTY',
          message: 'This endpoint can only access demo or training environments',
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('GET /api/v1/demo/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch demo environment' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/demo/:id — Delete demo environment
 *
 * Purges the demo property and all associated data (units, users, packages, etc).
 * Only admins can delete. Cannot delete production properties.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    // Only admins can delete demo environments
    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can delete demo environments.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Demo environment not found' },
        { status: 404 },
      );
    }

    // Prevent deletion of production properties
    if (!DEMO_TYPES.includes(property.type)) {
      return NextResponse.json(
        {
          error: 'NOT_DEMO_PROPERTY',
          message: 'Cannot delete production properties through the demo API',
        },
        { status: 403 },
      );
    }

    // Delete all associated data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete cascade: sessions, units, users, packages, etc.
      await tx.property.delete({ where: { id } });
    });

    return NextResponse.json({
      message: `Demo environment "${property.name}" has been deleted and all data purged.`,
    });
  } catch (error) {
    console.error('DELETE /api/v1/demo/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete demo environment' },
      { status: 500 },
    );
  }
}
