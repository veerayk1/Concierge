/**
 * Reports API — Generate and export reports
 * Per PRD 10 Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const reportType = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDateFilter = from || to;

    switch (reportType) {
      case 'package_activity': {
        const packages = await prisma.package.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          include: {
            unit: { select: { number: true } },
            courier: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const summary = {
          total: packages.length,
          unreleased: packages.filter((p) => p.status === 'unreleased').length,
          released: packages.filter((p) => p.status === 'released').length,
          perishable: packages.filter((p) => p.isPerishable).length,
        };

        return NextResponse.json({ data: { summary, records: packages } });
      }

      case 'maintenance_summary': {
        const requests = await prisma.maintenanceRequest.findMany({
          where: {
            propertyId,
            deletedAt: null,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          include: {
            unit: { select: { number: true } },
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const summary = {
          total: requests.length,
          open: requests.filter((r) => r.status === 'open').length,
          inProgress: requests.filter((r) => r.status === 'in_progress').length,
          resolved: requests.filter((r) => r.status === 'resolved').length,
        };

        return NextResponse.json({ data: { summary, records: requests } });
      }

      case 'security_incidents': {
        const events = await prisma.event.findMany({
          where: {
            propertyId,
            deletedAt: null,
            eventType: { slug: { in: ['incident', 'security'] } },
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
          include: {
            eventType: { select: { name: true } },
            unit: { select: { number: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ data: { summary: { total: events.length }, records: events } });
      }

      default: {
        // Return available report types
        return NextResponse.json({
          data: {
            availableReports: [
              { type: 'package_activity', name: 'Package Activity Report' },
              { type: 'maintenance_summary', name: 'Maintenance Summary' },
              { type: 'security_incidents', name: 'Security Incident Report' },
              { type: 'amenity_usage', name: 'Amenity Usage Report' },
              { type: 'resident_directory', name: 'Resident Directory Export' },
              { type: 'visitor_log', name: 'Visitor Log Report' },
              { type: 'key_inventory', name: 'Key/FOB Inventory' },
              { type: 'parking_permits', name: 'Parking Permit Report' },
              { type: 'financial_summary', name: 'Financial Summary' },
              { type: 'training_compliance', name: 'Training Compliance' },
              { type: 'shift_log_summary', name: 'Shift Log Summary' },
              { type: 'building_analytics', name: 'Building Analytics' },
            ],
          },
        });
      }
    }
  } catch (error) {
    console.error('GET /api/v1/reports error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate report' },
      { status: 500 },
    );
  }
}
