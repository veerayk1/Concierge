/**
 * Notification Delivery Log API
 *
 * GET /api/v1/notifications/deliveries
 * Staff-only: returns the audit trail of outbound user-facing notifications
 * (emails today, SMS/push later). Lets admins answer "did the resident
 * actually receive my announcement / parking ticket / welcome email?"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const channel = searchParams.get('channel'); // email | sms | push | in_app
    const status = searchParams.get('status'); // sent | failed | skipped | queued
    const category = searchParams.get('category'); // welcome | announcement | parking_violation | …
    const search = searchParams.get('search') || ''; // matches against recipientEmail or subject
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, 200) : 50;

    // Use raw types via Record so we can compose filters cleanly. The
    // model is freshly added so we route through the typed prisma client
    // directly — no Json field manipulation needed.
    const where: Record<string, unknown> = { propertyId };
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.notificationDelivery.count as any)({ where }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.notificationDelivery.findMany as any)({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
    ]);

    return NextResponse.json({
      data: { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    });
  } catch (error) {
    console.error('GET /api/v1/notifications/deliveries error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load notification log' },
      { status: 500 },
    );
  }
}
