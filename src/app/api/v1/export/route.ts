/**
 * Export API — Generate CSV/JSON exports for any listing module
 * Per PRD 10 Reports & Analytics: every listing page must have export capability.
 *
 * Supported modules: packages, maintenance, visitors, announcements, units, events
 * Supported formats: csv (default), json
 * Supports: date range filtering (startDate/endDate), status filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Module definitions — headers per module for empty-data CSV
// ---------------------------------------------------------------------------

const MODULE_HEADERS: Record<string, string[]> = {
  packages: [
    'reference',
    'unit',
    'courier',
    'status',
    'tracking',
    'perishable',
    'created_at',
    'released_at',
  ],
  maintenance: ['reference', 'unit', 'category', 'description', 'status', 'priority', 'created_at'],
  visitors: [
    'visitor_name',
    'visitor_type',
    'unit',
    'arrival_at',
    'departure_at',
    'comments',
    'created_at',
  ],
  announcements: [
    'title',
    'status',
    'priority',
    'is_emergency',
    'published_at',
    'expires_at',
    'created_at',
  ],
  units: ['number', 'floor', 'building', 'type', 'status', 'sq_ft', 'parking', 'locker'],
  events: ['reference', 'type', 'title', 'unit', 'status', 'priority', 'created_at'],
  users: ['first_name', 'last_name', 'email', 'phone', 'role', 'status', 'created_at'],
};

const VALID_MODULES = Object.keys(MODULE_HEADERS);

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCsv(headers: string[], data: Record<string, unknown>[]): string {
  const rows = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => escapeCsvValue(String(row[h] ?? ''))).join(',')),
  ];
  return rows.join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    // eslint-disable-next-line @next/next/no-assign-module-variable
    const module = searchParams.get('module');
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    if (!propertyId || !module) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'propertyId and module are required' },
        { status: 400 },
      );
    }

    if (!VALID_MODULES.includes(module)) {
      return NextResponse.json(
        { error: 'INVALID_MODULE', message: `Unknown module: ${module}` },
        { status: 400 },
      );
    }

    // Build date range filter for createdAt (or arrivalAt for visitors)
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    let data: Record<string, unknown>[] = [];

    switch (module) {
      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            deletedAt: null,
            userProperties: { some: { propertyId, deletedAt: null } },
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            userProperties: {
              where: { propertyId },
              select: { role: { select: { name: true } } },
            },
          },
        });
        data = users.map((u) => ({
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          phone: u.phone || '',
          role: u.userProperties[0]?.role?.name || '',
          status: u.isActive ? 'Active' : 'Inactive',
          created_at: u.createdAt.toISOString(),
        }));
        break;
      }

      case 'packages': {
        const packages = await prisma.package.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            ...(status ? { status } : {}),
          },
          include: {
            unit: { select: { number: true } },
            courier: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = packages.map((p) => ({
          reference: p.referenceNumber,
          unit: p.unit?.number || '',
          courier: p.courier?.name || '',
          status: p.status,
          tracking: p.trackingNumber || '',
          perishable: p.isPerishable ? 'Yes' : 'No',
          created_at: p.createdAt.toISOString(),
          released_at: p.releasedAt?.toISOString() || '',
        }));
        break;
      }

      case 'events': {
        const events = await prisma.event.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            ...(status ? { status } : {}),
          },
          include: {
            eventType: { select: { name: true } },
            unit: { select: { number: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = events.map((e) => ({
          reference: e.referenceNo,
          type: e.eventType?.name || '',
          title: e.title,
          unit: e.unit?.number || '',
          status: e.status,
          priority: e.priority,
          created_at: e.createdAt.toISOString(),
        }));
        break;
      }

      case 'maintenance': {
        const requests = await prisma.maintenanceRequest.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            ...(status ? { status } : {}),
          },
          include: {
            unit: { select: { number: true } },
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = requests.map((r) => ({
          reference: r.referenceNumber,
          unit: r.unit?.number || '',
          category: r.category?.name || '',
          description: r.description.substring(0, 200),
          status: r.status,
          priority: r.priority,
          created_at: r.createdAt.toISOString(),
        }));
        break;
      }

      case 'visitors': {
        const visitors = await prisma.visitorEntry.findMany({
          where: {
            propertyId,
            ...(hasDateFilter ? { arrivalAt: dateFilter } : {}),
          },
          include: {
            unit: { select: { number: true } },
          },
          orderBy: { arrivalAt: 'desc' },
        });
        data = visitors.map((v) => ({
          visitor_name: v.visitorName,
          visitor_type: v.visitorType,
          unit: v.unit?.number || '',
          arrival_at: v.arrivalAt.toISOString(),
          departure_at: v.departureAt?.toISOString() || '',
          comments: v.comments || '',
          created_at: v.createdAt.toISOString(),
        }));
        break;
      }

      case 'announcements': {
        const announcements = await prisma.announcement.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            ...(status ? { status } : {}),
          },
          orderBy: { createdAt: 'desc' },
        });
        data = announcements.map((a) => ({
          title: a.title,
          status: a.status,
          priority: a.priority,
          is_emergency: a.isEmergency ? 'Yes' : 'No',
          published_at: a.publishedAt?.toISOString() || '',
          expires_at: a.expiresAt?.toISOString() || '',
          created_at: a.createdAt.toISOString(),
        }));
        break;
      }

      case 'units': {
        const units = await prisma.unit.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(status ? { status } : {}),
          },
          include: { building: { select: { name: true } } },
          orderBy: { number: 'asc' },
        });
        data = units.map((u) => ({
          number: u.number,
          floor: u.floor || '',
          building: u.building?.name || '',
          type: u.unitType,
          status: u.status,
          sq_ft: u.squareFootage?.toString() || '',
          parking: u.parkingSpot || '',
          locker: u.locker || '',
        }));
        break;
      }
    }

    // JSON format
    if (format === 'json') {
      return NextResponse.json({ data, meta: { count: data.length, module, format } });
    }

    // CSV format — always return headers, even for empty data
    const headers = MODULE_HEADERS[module]!;
    const csvContent = toCsv(headers, data);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${module}-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/export error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Export failed' },
      { status: 500 },
    );
  }
}
