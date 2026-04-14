/**
 * Package Reminder API — per PRD 04 Section 3.1.5
 * Send a reminder notification to the resident about an unclaimed package
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';
import { sendPushToUser } from '@/server/push';
import { sendSms, formatPhoneNumber } from '@/server/sms';
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

    // Resolve actor name
    let actorName = 'System';
    try {
      const actor = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { firstName: true, lastName: true },
      });
      if (actor) actorName = `${actor.firstName} ${actor.lastName}`.trim();
    } catch {
      /* non-critical */
    }

    // Log reminder to history
    await prisma.packageHistory.create({
      data: {
        packageId: id,
        action: 'reminder_sent',
        details: `Reminder notification sent for package ${pkg.referenceNumber}`,
        actorId: auth.user.userId,
        actorName,
      },
    });

    // Send email notification to the resident (fire-and-forget)
    if (pkg.residentId) {
      const resident = await prisma.user.findUnique({
        where: { id: pkg.residentId },
        select: { email: true, firstName: true, phone: true },
      });

      if (resident?.email) {
        void sendEmail({
          to: resident.email,
          subject: `Package Reminder — ${pkg.referenceNumber}`,
          html: renderTemplate('package_reminder', {
            residentName: resident.firstName ?? 'Resident',
            packageRef: pkg.referenceNumber,
            unitNumber: pkg.unit?.number ?? '',
          }),
        }).catch((err) => {
          logger.error(
            { err, packageId: id, residentId: pkg.residentId },
            'Failed to send package reminder email',
          );
        });
      }

      // Send SMS reminder (fire-and-forget)
      if (resident?.phone) {
        const normalizedPhone = formatPhoneNumber(resident.phone);
        if (normalizedPhone) {
          void sendSms({
            to: normalizedPhone,
            body: `Hi${resident.firstName ? ` ${resident.firstName}` : ''}, your package (${pkg.referenceNumber}) is waiting at the front desk. Please pick it up at your earliest convenience. — Concierge`,
          }).catch((err) => {
            logger.error(
              { err, packageId: id, residentId: pkg.residentId },
              'Failed to send package reminder SMS',
            );
          });
        }
      }

      // Send push notification (fire-and-forget)
      void sendPushToUser(pkg.residentId, {
        title: `Package Reminder — ${pkg.referenceNumber}`,
        body: `Your package (${pkg.referenceNumber}) is waiting at the front desk.`,
        data: { packageId: id, screen: 'packages', action: 'view' },
      }).catch((err) => {
        logger.error(
          { err, packageId: id, residentId: pkg.residentId },
          'Failed to send package reminder push notification',
        );
      });
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
