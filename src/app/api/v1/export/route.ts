/**
 * Export API — Generate CSV exports for any module
 * Per PRD 10 Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const module = searchParams.get('module'); // users, packages, events, maintenance, units
    const format = searchParams.get('format') || 'csv'; // csv, json

    if (!propertyId || !module) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'propertyId and module are required' },
        { status: 400 },
      );
    }

    let data: Record<string, unknown>[] = [];

    switch (module) {
      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            deletedAt: null,
            userProperties: { some: { propertyId, deletedAt: null } },
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
          where: { propertyId, deletedAt: null },
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
          where: { propertyId, deletedAt: null },
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
          where: { propertyId, deletedAt: null },
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

      case 'units': {
        const units = await prisma.unit.findMany({
          where: { propertyId, deletedAt: null },
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

      default:
        return NextResponse.json(
          { error: 'INVALID_MODULE', message: `Unknown module: ${module}` },
          { status: 400 },
        );
    }

    if (format === 'json') {
      return NextResponse.json({ data, meta: { count: data.length, module, format } });
    }

    // CSV format
    if (data.length === 0) {
      return new NextResponse('No data to export', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(','),
      ),
    ];

    return new NextResponse(csvRows.join('\n'), {
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
