/**
 * POST /api/v1/events/:id/acknowledge
 *
 * Staff acknowledgment trail for an incident — the guard who filed
 * the incident wants to know "did the manager actually see this?".
 * One tap from any staff member appends an entry to the event's
 * customFields.acknowledgments array: { userId, name, role, at }.
 *
 * Same user can re-acknowledge (e.g. after they read updated
 * comments) — the trail accumulates and the latest tap from each
 * person is the one rendered on the detail page.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

interface Ack {
  userId: string;
  name: string;
  role: string;
  at: string;
}

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
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION', message: 'Invalid event id.' },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, propertyId: true, customFields: true },
    });
    if (!event) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Event not found' }, { status: 404 });
    }
    const tenancy = enforcePropertyAccess(auth.user, event.propertyId);
    if (tenancy) return tenancy;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { firstName: true, lastName: true },
    });
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Staff';

    const existing =
      (event.customFields as { acknowledgments?: Ack[] } | null)?.acknowledgments ?? [];
    // Replace any previous acknowledgment from the same userId so the
    // trail stays compact (one row per person, latest tap wins).
    const filtered = existing.filter((a) => a.userId !== auth.user.userId);
    const next: Ack[] = [
      ...filtered,
      {
        userId: auth.user.userId,
        name,
        role: auth.user.role,
        at: new Date().toISOString(),
      },
    ];

    const merged = {
      ...((event.customFields as Record<string, unknown> | null) ?? {}),
      acknowledgments: next.map((a) => ({ ...a })),
    };
    await prisma.event.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { customFields: merged as any },
    });

    return NextResponse.json({
      data: { acknowledgments: next },
      message: 'Acknowledged.',
    });
  } catch (error) {
    console.error('POST /api/v1/events/:id/acknowledge error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to acknowledge.' },
      { status: 500 },
    );
  }
}
