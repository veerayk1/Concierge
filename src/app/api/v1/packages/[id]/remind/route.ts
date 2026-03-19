/**
 * Package Reminder API — per PRD 04 Section 3.1.5
 * Send a reminder notification to the resident about an unclaimed package
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
import { createLogger } from '@/server/logger';

const logger = createLogger('package-remind');

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
        details: `Reminder notification sent for package ${pkg.referenceNumber}`,
        actorId: auth.user.userId,
        actorName: 'Staff',
      },
    });

    // Send email notification to the resident (fire-and-forget)
    if (pkg.residentId) {
      const resident = await prisma.user.findUnique({
        where: { id: pkg.residentId },
        select: { email: true, firstName: true },
      });

      if (resident?.email) {
        void sendEmail({
          to: resident.email,
          subject: `Package Reminder — ${pkg.referenceNumber}`,
          text: `Hi${resident.firstName ? ` ${resident.firstName}` : ''},\n\nYour package (${pkg.referenceNumber}) is waiting at the front desk. Please pick it up at your earliest convenience.\n\n— Concierge`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Package Reminder</h2>
              <p>Hi${resident.firstName ? ` ${resident.firstName}` : ''},</p>
              <p>Your package (<strong>${pkg.referenceNumber}</strong>) is waiting at the front desk. Please pick it up at your earliest convenience.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">Concierge — Building Management</p>
            </div>
          `,
        }).catch((err) => {
          logger.error(
            { err, packageId: id, residentId: pkg.residentId },
            'Failed to send package reminder email',
          );
        });
      }
    }

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
