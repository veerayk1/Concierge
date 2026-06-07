/**
 * Incident Escalation API — per PRD 03 Section Incident Escalation
 * Escalate an incident to a higher authority
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';
import { sendSms, formatPhoneNumber } from '@/server/sms';
import { createLogger } from '@/server/logger';

const logger = createLogger('incident-escalate');

const escalateSchema = z.object({
  escalateTo: z.string().min(1, 'Escalation target is required').max(200),
  reason: z.string().min(1, 'Reason is required').max(1000),
  priority: z.enum(['high', 'critical']).default('high'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
        'front_desk',
        'superintendent',
        'maintenance_staff',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = escalateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Tenant isolation: verify the event belongs to the user's property
    const existingEvent = await prisma.event.findUnique({
      where: { id, propertyId: auth.user.propertyId },
      select: { id: true, propertyId: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Incident not found' },
        { status: 404 },
      );
    }

    // Atomic compare-and-swap: only the first concurrent escalate POST
    // wins. Without this, N rapid clicks of the Escalate button would
    // each fire a full email + SMS cascade to every property manager —
    // turning one logical escalation into N URGENT pages per manager.
    // The CAS rejects re-escalation; to re-prioritize an already-
    // escalated incident, callers must explicitly downgrade first.
    const casCount = await prisma.$executeRaw`
      UPDATE events SET priority = ${input.priority}, status = 'in_progress'
      WHERE id = ${id}::uuid AND status != 'in_progress'
    `;
    if (casCount === 0) {
      return NextResponse.json(
        {
          error: 'ALREADY_ESCALATED',
          message: 'Incident has already been escalated — no new alert sent.',
        },
        { status: 409 },
      );
    }
    // Now apply the customFields metadata; this write is safe because the
    // CAS above gated us as the single winning escalator.
    const event = await prisma.event.update({
      where: { id },
      data: {
        customFields: {
          escalatedTo: stripControlChars(stripHtml(input.escalateTo)),
          escalationReason: stripControlChars(stripHtml(input.reason)),
          escalatedAt: new Date().toISOString(),
          escalatedBy: auth.user.userId,
        },
      },
    });

    // Notify the escalation target (property manager) via email (fire-and-forget)
    const targetUsers = await prisma.userProperty.findMany({
      where: {
        propertyId: event.propertyId,
        deletedAt: null,
        role: { slug: 'property_manager' },
        user: { isActive: true, deletedAt: null },
      },
      select: { user: { select: { email: true, firstName: true, phone: true } } },
    });

    for (const pu of targetUsers) {
      void sendEmail({
        to: pu.user.email,
        subject: `Incident Escalated — ${event.title}`,
        html: renderTemplate('incident_escalation', {
          incidentTitle: event.title,
          priority: input.priority,
          escalatedTo: input.escalateTo,
        }),
      }).catch((err) => {
        logger.error(
          { err, eventId: id, recipientEmail: pu.user.email },
          'Failed to send escalation email',
        );
      });

      // Send SMS to property manager (fire-and-forget)
      if (pu.user.phone) {
        const normalizedPhone = formatPhoneNumber(pu.user.phone);
        if (normalizedPhone) {
          void sendSms({
            to: normalizedPhone,
            body: `URGENT: Incident "${event.title}" escalated (${input.priority}). Reason: ${input.reason}. Please review ASAP. — BuildingAutopilot`,
          }).catch((err) => {
            logger.error(
              { err, eventId: id, recipientPhone: pu.user.phone },
              'Failed to send escalation SMS',
            );
          });
        }
      }
    }

    return NextResponse.json({
      data: event,
      message: `Incident escalated to ${input.escalateTo}.`,
    });
  } catch (error) {
    console.error('POST /api/v1/incidents/:id/escalate error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to escalate' },
      { status: 500 },
    );
  }
}
