/**
 * Emergency Broadcast Cancel API — POST cancel
 * Phase 2: Stops the cascade and marks broadcast as cancelled
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['property_admin', 'security_guard'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify broadcast exists
    const broadcast = await prisma.emergencyBroadcast.findUnique({
      where: { id },
      select: { id: true, propertyId: true, status: true },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Emergency broadcast not found' },
        { status: 404 },
      );
    }

    // Cancelling another property's emergency broadcast would suppress
    // their fire/medical/lockdown alert — block cross-tenant cancels.
    const tenancy = enforcePropertyAccess(auth.user, broadcast.propertyId);
    if (tenancy) return tenancy;

    if (broadcast.status === 'cancelled') {
      return NextResponse.json(
        { error: 'ALREADY_CANCELLED', message: 'Broadcast is already cancelled' },
        { status: 400 },
      );
    }

    const updated = await prisma.emergencyBroadcast.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledById: auth.user.userId,
      },
    });

    return NextResponse.json({
      data: updated,
      message: 'Emergency broadcast cancelled.',
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cancel broadcast' },
      { status: 500 },
    );
  }
}
