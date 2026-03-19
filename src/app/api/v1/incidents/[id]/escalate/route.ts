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
    const auth = await guardRoute(request);
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

    // Update the event priority and status
    const event = await prisma.event.update({
      where: { id },
      data: {
        priority: input.priority,
        status: 'in_progress',
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
        text: `Hi${pu.user.firstName ? ` ${pu.user.firstName}` : ''},\n\nAn incident has been escalated to you.\n\nIncident: ${event.title}\nPriority: ${input.priority}\nReason: ${input.reason}\n\nPlease review as soon as possible.\n\n— Concierge`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Incident Escalated</h2>
            <p>Hi${pu.user.firstName ? ` ${pu.user.firstName}` : ''},</p>
            <p>An incident has been escalated to you:</p>
            <ul>
              <li><strong>Incident:</strong> ${event.title}</li>
              <li><strong>Priority:</strong> ${input.priority}</li>
              <li><strong>Reason:</strong> ${input.reason}</li>
            </ul>
            <p>Please review as soon as possible.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Concierge — Building Management</p>
          </div>
        `,
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
            body: `URGENT: Incident "${event.title}" escalated (${input.priority}). Reason: ${input.reason}. Please review ASAP. — Concierge`,
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
