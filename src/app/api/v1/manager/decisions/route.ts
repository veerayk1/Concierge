/**
 * GET /api/v1/manager/decisions
 *
 * Aggregates everything currently waiting on the property manager's
 * sign-off — alterations awaiting review, amenity bookings pending
 * approval, urgent maintenance still unassigned. One round-trip so
 * the dashboard can render a single "things waiting on you" feed
 * instead of fanning out across modules.
 *
 * Returns up to 25 items, sorted by priority then longest-waiting.
 * Each item has a uniform shape (type, title, who, when, href,
 * optional approveAction) so the card can render them as one list.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

interface Decision {
  id: string;
  type: 'alteration' | 'booking' | 'maintenance';
  title: string;
  subtitle: string | null;
  unitNumber: string | null;
  who: string | null;
  waitingSince: string;
  hoursWaiting: number;
  href: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approveAction: {
    method: 'PATCH';
    url: string;
    approveBody: Record<string, unknown>;
  } | null;
}

function hoursSince(d: Date): number {
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 3600000));
}

// MaintenanceRequest uses ('low' | 'normal' | 'high' | 'critical');
// map to the shared queue palette ('low' | 'medium' | 'high' | 'urgent').
function maintenanceQueuePriority(p: string): Decision['priority'] {
  if (p === 'critical') return 'urgent';
  if (p === 'high') return 'high';
  if (p === 'normal') return 'medium';
  return 'low';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'board_member',
        'superintendent',
      ],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required.' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    // Fan out — every "needs manager attention" query in parallel.
    // Promise.allSettled so a single module outage doesn't blank the
    // whole queue.
    const [alterationsRes, bookingsRes, maintenanceRes] = await Promise.allSettled([
      prisma.alterationProject.findMany({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['submitted', 'under_review'] },
        },
        include: {
          unit: { select: { number: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      prisma.booking.findMany({
        where: {
          propertyId,
          approvalStatus: 'pending',
          status: { notIn: ['cancelled', 'declined'] },
        },
        include: {
          amenity: { select: { name: true } },
          unit: { select: { number: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['open', 'on_hold'] },
          priority: { in: ['critical', 'high'] },
          assignedEmployeeId: null,
          assignedVendorId: null,
        },
        include: {
          unit: { select: { number: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);

    // Booking lacks a direct user relation — batch-resolve residentIds
    // to first/last names in one query so the queue can show "Sarah" not
    // just a UUID.
    const residentIds = new Set<string>();
    if (bookingsRes.status === 'fulfilled') {
      for (const b of bookingsRes.value) {
        if (b.residentId) residentIds.add(b.residentId);
      }
    }
    const residents = residentIds.size
      ? await prisma.user.findMany({
          where: { id: { in: [...residentIds] } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const residentNameById = new Map(
      residents.map((u) => [
        u.id,
        [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Resident',
      ]),
    );

    const items: Decision[] = [];

    if (alterationsRes.status === 'fulfilled') {
      for (const a of alterationsRes.value) {
        items.push({
          id: `alt-${a.id}`,
          type: 'alteration',
          title: a.description.slice(0, 80) || 'Alteration request',
          subtitle: a.type ?? null,
          unitNumber: a.unit?.number ?? null,
          who: null,
          waitingSince: a.createdAt.toISOString(),
          hoursWaiting: hoursSince(a.createdAt),
          href: `/alterations/${a.id}`,
          priority: 'medium',
          approveAction: null, // alterations need a real review, not one-tap
        });
      }
    }

    if (bookingsRes.status === 'fulfilled') {
      for (const b of bookingsRes.value) {
        const name = residentNameById.get(b.residentId) ?? 'Resident';
        const whenLabel = `${b.startDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} · ${b.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`;
        items.push({
          id: `book-${b.id}`,
          type: 'booking',
          title: `${b.amenity?.name ?? 'Amenity'} — ${name}`,
          subtitle: whenLabel,
          unitNumber: b.unit?.number ?? null,
          who: name,
          waitingSince: b.createdAt.toISOString(),
          hoursWaiting: hoursSince(b.createdAt),
          href: `/amenity-booking?id=${b.id}`,
          priority: 'low',
          approveAction: {
            method: 'PATCH',
            url: `/api/v1/bookings/${b.id}`,
            // Use the approvalStatus-only path — the booking state machine
            // doesn't allow arbitrary status transitions, but flipping the
            // approval gate is always safe.
            approveBody: { approvalStatus: 'approved' },
          },
        });
      }
    }

    if (maintenanceRes.status === 'fulfilled') {
      for (const m of maintenanceRes.value) {
        items.push({
          id: `mnt-${m.id}`,
          type: 'maintenance',
          title: m.title ?? 'Maintenance request',
          subtitle: m.description?.slice(0, 80) ?? null,
          unitNumber: m.unit?.number ?? null,
          who: null,
          waitingSince: m.createdAt.toISOString(),
          hoursWaiting: hoursSince(m.createdAt),
          href: `/maintenance/${m.id}`,
          priority: maintenanceQueuePriority(m.priority),
          approveAction: null, // maintenance needs vendor/staff assignment, not one-tap approve
        });
      }
    }

    const priorityRank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    items.sort((a, b) => {
      const pr = (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
      if (pr !== 0) return pr;
      return b.hoursWaiting - a.hoursWaiting;
    });

    return NextResponse.json({ data: items.slice(0, 25) });
  } catch (error) {
    console.error('GET /api/v1/manager/decisions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load manager decisions.' },
      { status: 500 },
    );
  }
}
