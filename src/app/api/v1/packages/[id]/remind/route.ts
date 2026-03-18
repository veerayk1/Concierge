/**
 * Package Reminder API — per PRD 04 Section 3.1.5
 * Send a reminder notification to the resident about an unclaimed package
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { number: true } },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Package not found' },
        { status: 404 },
      );
    }

    if (pkg.status !== 'unreleased') {
      return NextResponse.json(
        { error: 'INVALID_STATE', message: 'Can only send reminders for unreleased packages' },
        { status: 400 },
      );
    }

    // Log reminder to history
    await prisma.packageHistory.create({
      data: {
        packageId: id,
        action: 'reminder_sent',
        detail: `Reminder notification sent for package ${pkg.referenceNumber}`,
        actorName: 'Staff',
      },
    });

    // TODO: Actually send notification via email/push/sms

    return NextResponse.json({
      message: `Reminder sent for package ${pkg.referenceNumber} (Unit ${pkg.unit?.number}).`,
    });
  } catch (error) {
    console.error('POST /api/v1/packages/:id/remind error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to send reminder' },
      { status: 500 },
    );
  }
}
