/**
 * Events API — Unified Event Model
 * Per PRD 03 Security Console + CLAUDE.md unified event model
 *
 * GET  /api/v1/events — List events with filters
 * POST /api/v1/events — Create a new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createEventSchema } from '@/schemas/event';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendBulkEmail } from '@/server/email';

// ---------------------------------------------------------------------------
// GET /api/v1/events
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const typeId = searchParams.get('typeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const unitId = searchParams.get('unitId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
    };

    if (typeId) where.eventTypeId = typeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (unitId) where.unitId = unitId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          eventType: {
            select: { id: true, name: true, icon: true, color: true },
          },
          unit: {
            select: { id: true, number: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Resolve eventTypeId: accept either UUID or slug
    let resolvedEventTypeId = input.eventTypeId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(resolvedEventTypeId)) {
      // Treat as slug — look up or auto-create the event type
      let eventType = await prisma.eventType.findFirst({
        where: {
          slug: resolvedEventTypeId,
          propertyId: input.propertyId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!eventType) {
        // Auto-create: ensure an event group exists
        let eventGroup = await prisma.eventGroup.findFirst({
          where: { propertyId: input.propertyId, slug: 'security', deletedAt: null },
        });
        if (!eventGroup) {
          eventGroup = await prisma.eventGroup.create({
            data: {
              propertyId: input.propertyId,
              name: 'Security',
              slug: 'security',
              sortOrder: 0,
            },
          });
        }
        // Derive a human-readable name from the slug
        const slugName = resolvedEventTypeId
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        eventType = await prisma.eventType.create({
          data: {
            propertyId: input.propertyId,
            eventGroupId: eventGroup.id,
            name: slugName,
            slug: resolvedEventTypeId,
            icon: 'shield-alert',
            color: '#DC2626',
            defaultPriority: 'high',
            notifyOnCreate: true,
            notifyOnClose: false,
          },
        });
      }
      resolvedEventTypeId = eventType.id;
    }

    // Generate reference number (e.g., EVT-A1B2C3)
    const referenceNo = `EVT-${nanoid(6).toUpperCase()}`;

    const event = await prisma.event.create({
      data: {
        propertyId: input.propertyId,
        eventTypeId: resolvedEventTypeId,
        unitId: input.unitId || null,
        title: stripControlChars(stripHtml(input.title)),
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        priority: input.priority,
        referenceNo,
        createdById: auth.user.userId, // TODO: Get from auth context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customFields: (input.customFields as any) || undefined,
      },
      include: {
        eventType: {
          select: { id: true, name: true, icon: true, color: true, notifyOnCreate: true },
        },
        unit: {
          select: { id: true, number: true },
        },
      },
    });

    // ---- Auto-CC notification (fire-and-forget, never blocks 201 response) ----
    if (event.eventType?.notifyOnCreate) {
      sendEventAutoCc(event, auth.user).catch(() => {
        /* silent — email failures never block event creation */
      });
    }

    return NextResponse.json({ data: event, message: 'Event created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create event' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Auto-CC notification helpers
// ---------------------------------------------------------------------------

interface CreatedEventForNotification {
  id: string;
  referenceNo: string;
  title: string;
  description: string | null;
  priority: string;
  createdAt: Date;
  eventTypeId: string;
  eventType: { id: string; name: string } | null;
  unit: { id: string; number: string } | null;
}

interface AuthActor {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Fetches the EventTypeEmailConfig for the given event's type and sends
 * notification emails to all configured autoCcAddresses.
 * This function is fire-and-forget — callers should `.catch(() => {})` it.
 */
async function sendEventAutoCc(
  event: CreatedEventForNotification,
  actor: AuthActor,
): Promise<void> {
  const emailConfig = await prisma.eventTypeEmailConfig.findFirst({
    where: { eventTypeId: event.eventTypeId, isActive: true },
  });

  if (!emailConfig || emailConfig.autoCcAddresses.length === 0) return;

  const subject = `[Event Alert] ${event.eventType?.name ?? 'Event'}: ${event.title}`;
  const html = buildEventNotificationHtml(event, actor);

  await sendBulkEmail({
    to: emailConfig.autoCcAddresses,
    subject,
    html,
    from: emailConfig.fromAddress
      ? `${emailConfig.fromName ?? 'Concierge'} <${emailConfig.fromAddress}>`
      : undefined,
    replyTo: emailConfig.replyToAddress ?? undefined,
  });
}

function buildEventNotificationHtml(event: CreatedEventForNotification, actor: AuthActor): string {
  const actorName =
    [actor.firstName, actor.lastName].filter(Boolean).join(' ') || actor.email || 'Staff';
  const unitLabel = event.unit?.number ? `Unit ${event.unit.number}` : 'N/A';
  const priority = event.priority.charAt(0).toUpperCase() + event.priority.slice(1);
  const createdAt = new Date(event.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">New Event Created</h2>
  <p style="color:#6b7280;font-size:14px;margin-top:0;">Reference: <strong>${event.referenceNo}</strong></p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
    <tr style="border-bottom:1px solid #e5e7eb;">
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;width:130px;">Type</th>
      <td style="padding:8px 12px;">${event.eventType?.name ?? '—'}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;">Title</th>
      <td style="padding:8px 12px;">${event.title}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;">Unit</th>
      <td style="padding:8px 12px;">${unitLabel}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;">Priority</th>
      <td style="padding:8px 12px;">${priority}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;">Created by</th>
      <td style="padding:8px 12px;">${actorName}</td>
    </tr>
    <tr>
      <th style="text-align:left;padding:8px 12px;background:#f9fafb;color:#6b7280;font-weight:600;">Time</th>
      <td style="padding:8px 12px;">${createdAt}</td>
    </tr>
  </table>
  ${event.description ? `<p style="margin-top:16px;font-size:14px;"><strong>Notes:</strong> ${event.description}</p>` : ''}
  <p style="margin-top:24px;font-size:12px;color:#9ca3af;">This is an automated notification from Concierge. You are receiving this because you are configured as an auto-CC recipient for ${event.eventType?.name ?? 'this event type'} events.</p>
</body>
</html>`;
}
