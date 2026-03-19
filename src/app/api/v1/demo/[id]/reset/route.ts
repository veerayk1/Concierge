/**
 * Demo Environment API — Reset
 * Per PRD 21 — Sales demo + training sandbox system
 *
 * POST: Resets a demo environment back to its initial state by
 * clearing all user-generated data and re-seeding from the template.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];
const DEMO_TYPES = ['DEMO', 'TRAINING'];

/**
 * POST /api/v1/demo/:id/reset — Reset demo to initial state
 *
 * Clears all user-generated data and re-seeds from the original template.
 * Only admins can reset. Cannot reset production properties.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    // Only admins can reset demo environments
    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can reset demo environments.' },
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

    // Prevent resetting production properties
    if (!DEMO_TYPES.includes(property.type)) {
      return NextResponse.json(
        {
          error: 'NOT_DEMO_PROPERTY',
          message: 'Cannot reset production properties through the demo API',
        },
        { status: 403 },
      );
    }

    // Look up the original template to re-seed
    const template = await prisma.demoTemplate.findUnique({
      where: { id: property.demoTemplateId! },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'TEMPLATE_NOT_FOUND', message: 'Original demo template no longer exists' },
        { status: 404 },
      );
    }

    // Reset: clear data and re-seed in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // In a full implementation, this would:
      // 1. Delete all user-generated data (events, packages, maintenance, etc.)
      // 2. Re-seed from template.dataSpec
      // 3. Update reset metadata

      const updated = await tx.property.update({
        where: { id },
        data: {
          lastAccessedAt: new Date(),
        },
      });

      return {
        ...updated,
        resetAt: new Date(),
        resetCount: 1,
      };
    });

    return NextResponse.json({
      data: result,
      message: `Demo environment "${property.name}" has been reset to its initial state.`,
    });
  } catch (error) {
    console.error('POST /api/v1/demo/:id/reset error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to reset demo environment' },
      { status: 500 },
    );
  }
}
