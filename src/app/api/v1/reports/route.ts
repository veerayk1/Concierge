/**
 * Reports API — Generate and export reports
 * Per PRD 10 Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { handleDemoRequest } from '@/server/demo';

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'superintendent',
        'security_supervisor',
      ],
    });
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'reports');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    // Use authenticated user's propertyId to prevent IDOR
    const propertyId = auth.user.propertyId || searchParams.get('propertyId');
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

      case 'visitor_log': {
        const visitors = await prisma.visitorEntry.findMany({
          where: {
            propertyId,
            ...(hasDateFilter ? { arrivalAt: dateFilter } : {}),
          },
          include: {
            unit: { select: { number: true } },
          },
          orderBy: { arrivalAt: 'desc' },
          take: 10000,
        });

        const byType: Record<string, number> = {};
        for (const v of visitors) {
          byType[v.visitorType] = (byType[v.visitorType] || 0) + 1;
        }

        const records = visitors.map((v) => {
          const arrival = new Date(v.arrivalAt);
          const departure = v.departureAt ? new Date(v.departureAt) : null;
          const durationMs = departure ? departure.getTime() - arrival.getTime() : null;
          const durationMin = durationMs !== null ? Math.round(durationMs / 60000) : null;
          return {
            name: v.visitorName,
            type: v.visitorType,
            unit: v.unit?.number || '',
            arrivalTime: v.arrivalAt.toISOString(),
            departureTime: v.departureAt?.toISOString() || '',
            duration: durationMin !== null ? `${durationMin} min` : 'Still on-site',
          };
        });

        const headers = ['name', 'type', 'unit', 'arrivalTime', 'departureTime', 'duration'];

        return NextResponse.json({
          data: {
            summary: { total: visitors.length, byType },
            records,
            headers,
          },
        });
      }

      case 'key_inventory': {
        const keys = await prisma.keyInventory.findMany({
          where: { propertyId },
          include: {
            checkouts: {
              where: { returnTime: null },
              select: { checkedOutTo: true },
              take: 1,
            },
          },
          orderBy: { keyName: 'asc' },
          take: 10000,
        });

        const summary = {
          total: keys.length,
          available: keys.filter((k) => k.status === 'available').length,
          checkedOut: keys.filter((k) => k.status === 'checked_out').length,
          lost: keys.filter((k) => k.status === 'lost').length,
        };

        const records = keys.map((k) => ({
          name: k.keyName,
          type: k.category,
          serial: k.keyNumber || '',
          status: k.status,
          owner: k.keyOwner || '',
          checkedOutTo: k.checkouts[0]?.checkedOutTo || '',
        }));

        const headers = ['name', 'type', 'serial', 'status', 'owner', 'checkedOutTo'];

        return NextResponse.json({ data: { summary, records, headers } });
      }

      case 'shift_log_summary': {
        const shifts = await prisma.securityShift.findMany({
          where: {
            propertyId,
            ...(hasDateFilter ? { startTime: dateFilter } : {}),
          },
          include: {
            logEntries: {
              orderBy: { entryTime: 'asc' },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 5000,
        });

        const allEntries = shifts.flatMap((s) =>
          s.logEntries.map((e) => ({
            shiftId: s.id,
            shiftStart: s.startTime.toISOString(),
            shiftEnd: s.endTime.toISOString(),
            entryTime: e.entryTime.toISOString(),
            category: e.category,
            entryText: e.entryText,
          })),
        );

        const byCategory: Record<string, number> = {};
        for (const e of allEntries) {
          byCategory[e.category] = (byCategory[e.category] || 0) + 1;
        }

        const summary = {
          totalEntries: allEntries.length,
          totalShifts: shifts.length,
          byCategory,
        };

        const headers = ['shiftStart', 'shiftEnd', 'entryTime', 'category', 'entryText'];

        return NextResponse.json({ data: { summary, records: allEntries, headers } });
      }

      case 'amenity_usage': {
        const bookings = await prisma.booking.findMany({
          where: {
            propertyId,
            status: { not: 'cancelled' },
            ...(hasDateFilter ? { startDate: dateFilter } : {}),
          },
          include: {
            amenity: { select: { id: true, name: true } },
            unit: { select: { number: true } },
          },
          orderBy: { startDate: 'desc' },
          take: 10000,
        });

        const byAmenity: Record<string, { name: string; count: number }> = {};
        let totalGuests = 0;
        for (const b of bookings) {
          const aid = b.amenityId;
          if (!byAmenity[aid]) {
            byAmenity[aid] = { name: b.amenity?.name || 'Unknown', count: 0 };
          }
          byAmenity[aid].count += 1;
          totalGuests += b.guestCount;
        }

        const summary = {
          totalBookings: bookings.length,
          byAmenity: Object.values(byAmenity),
          avgGuestsPerBooking:
            bookings.length > 0 ? Math.round((totalGuests / bookings.length) * 10) / 10 : 0,
        };

        const records = bookings.map((b) => ({
          amenityName: b.amenity?.name || '',
          date: b.startDate.toISOString().split('T')[0],
          timeSlot: `${b.startTime.toISOString().substring(11, 16)} - ${b.endTime.toISOString().substring(11, 16)}`,
          unit: b.unit?.number || '',
          guests: b.guestCount,
          status: b.status,
          fee: Number(b.feeAmount),
        }));

        const headers = ['amenityName', 'date', 'timeSlot', 'unit', 'guests', 'status', 'fee'];

        return NextResponse.json({ data: { summary, records, headers } });
      }

      case 'resident_directory': {
        const occupants = await prisma.occupancyRecord.findMany({
          where: {
            propertyId,
            moveOutDate: null,
          },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            unit: { select: { number: true } },
          },
          orderBy: { user: { lastName: 'asc' } },
          take: 10000,
        });

        const byType: Record<string, number> = {};
        for (const o of occupants) {
          byType[o.residentType] = (byType[o.residentType] || 0) + 1;
        }

        const summary = {
          totalResidents: occupants.length,
          byType,
        };

        const records = occupants.map((o) => ({
          firstName: o.user?.firstName || '',
          lastName: o.user?.lastName || '',
          email: o.user?.email || '',
          phone: o.user?.phone || '',
          unitNumber: o.unit?.number || '',
          type: o.residentType,
          moveInDate: o.moveInDate.toISOString().split('T')[0],
        }));

        const headers = [
          'firstName',
          'lastName',
          'email',
          'phone',
          'unitNumber',
          'type',
          'moveInDate',
        ];

        return NextResponse.json({ data: { summary, records, headers } });
      }

      case 'financial_summary': {
        const paidBookings = await prisma.booking.findMany({
          where: {
            propertyId,
            status: { not: 'cancelled' },
            ...(hasDateFilter ? { startDate: dateFilter } : {}),
          },
          select: {
            referenceNumber: true,
            feeAmount: true,
            depositAmount: true,
            totalAmount: true,
            paymentStatus: true,
            startDate: true,
            depositRefunded: true,
          },
        });

        const bookingRevenue = paidBookings.reduce((sum, b) => sum + Number(b.feeAmount), 0);
        const outstandingDeposits = paidBookings
          .filter((b) => Number(b.depositAmount) > 0 && !b.depositRefunded)
          .reduce((sum, b) => sum + Number(b.depositAmount), 0);

        const summary = {
          totalRevenue: Math.round(bookingRevenue * 100) / 100,
          bookingRevenue: Math.round(bookingRevenue * 100) / 100,
          parkingRevenue: 0,
          outstandingDeposits: Math.round(outstandingDeposits * 100) / 100,
        };

        const records = paidBookings.map((b) => ({
          type: 'booking' as const,
          reference: b.referenceNumber,
          amount: Number(b.totalAmount),
          date: b.startDate.toISOString().split('T')[0],
          status: b.paymentStatus,
        }));

        const headers = ['type', 'reference', 'amount', 'date', 'status'];

        return NextResponse.json({ data: { summary, records, headers } });
      }

      case 'training_compliance': {
        try {
          const progress = await prisma.trainingProgress.findMany({
            where: { propertyId },
          });

          const totalCourses = new Set(progress.map((p) => p.moduleSlug)).size;
          const completed = progress.filter((p) => p.tutorialCompleted).length;
          const completionRate =
            progress.length > 0 ? `${Math.round((completed / progress.length) * 100)}%` : '0%';
          const overdueCount = progress.filter(
            (p) => !p.tutorialCompleted && !p.assessmentPassed,
          ).length;

          const summary = { totalCourses, completionRate, overdueCount };

          const records = progress.map((p) => ({
            moduleSlug: p.moduleSlug,
            completed: p.tutorialCompleted,
            completedAt: p.tutorialCompletedAt?.toISOString() || '',
            assessmentPassed: p.assessmentPassed ?? false,
            assessmentScore: p.assessmentScore ?? 0,
            timeSpentSeconds: p.timeSpentSeconds,
          }));

          const headers = [
            'moduleSlug',
            'completed',
            'completedAt',
            'assessmentPassed',
            'assessmentScore',
            'timeSpentSeconds',
          ];

          return NextResponse.json({ data: { summary, records, headers } });
        } catch {
          return NextResponse.json({
            data: {
              summary: { totalCourses: 0, completionRate: '0%', overdueCount: 0 },
              records: [],
              headers: [],
            },
          });
        }
      }

      case 'building_analytics': {
        const [openMaintenance, allMaintenance, packages, visitors] = await Promise.all([
          prisma.maintenanceRequest.count({
            where: { propertyId, status: 'open', deletedAt: null },
          }),
          prisma.maintenanceRequest.findMany({
            where: {
              propertyId,
              deletedAt: null,
              status: 'resolved',
              ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            },
            select: { createdAt: true, updatedAt: true },
          }),
          prisma.package.findMany({
            where: {
              propertyId,
              deletedAt: null,
              status: 'released',
              ...(hasDateFilter ? { createdAt: dateFilter } : {}),
            },
            select: { createdAt: true, releasedAt: true },
          }),
          prisma.visitorEntry.count({
            where: {
              propertyId,
              ...(hasDateFilter ? { arrivalAt: dateFilter } : {}),
            },
          }),
        ]);

        const avgResolutionMs =
          allMaintenance.length > 0
            ? allMaintenance.reduce(
                (sum, m) => sum + (m.updatedAt.getTime() - m.createdAt.getTime()),
                0,
              ) / allMaintenance.length
            : 0;
        const avgResolutionDays = Math.round((avgResolutionMs / (1000 * 60 * 60 * 24)) * 10) / 10;

        const releasedWithTime = packages.filter((p) => p.releasedAt);
        const avgReleaseMs =
          releasedWithTime.length > 0
            ? releasedWithTime.reduce(
                (sum, p) => sum + (p.releasedAt!.getTime() - p.createdAt.getTime()),
                0,
              ) / releasedWithTime.length
            : 0;
        const avgReleaseHours = Math.round((avgReleaseMs / (1000 * 60 * 60)) * 10) / 10;

        // Simple health score: 100 - penalties
        let healthScore = 100;
        if (openMaintenance > 10) healthScore -= 15;
        else if (openMaintenance > 5) healthScore -= 5;
        if (avgResolutionDays > 14) healthScore -= 20;
        else if (avgResolutionDays > 7) healthScore -= 10;
        if (avgReleaseHours > 48) healthScore -= 10;
        else if (avgReleaseHours > 24) healthScore -= 5;

        const summary = {
          maintenance: {
            openCount: openMaintenance,
            resolvedCount: allMaintenance.length,
            avgResolutionDays,
          },
          packages: {
            releasedCount: packages.length,
            avgReleaseHours,
          },
          visitors: {
            totalVisitors: visitors,
          },
          buildingHealthScore: Math.max(0, healthScore),
        };

        return NextResponse.json({ data: { summary, records: [], headers: [] } });
      }

      case 'parking_permits': {
        const permits = await prisma.parkingPermit.findMany({
          where: {
            propertyId,
            deletedAt: null,
          },
          include: {
            unit: { select: { number: true } },
            permitType: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });

        const now = new Date();
        const summary = {
          total: permits.length,
          active: permits.filter((p) => p.status === 'active').length,
          expired: permits.filter(
            (p) =>
              p.status === 'expired' ||
              (p.validUntil && new Date(p.validUntil) < now && p.status === 'active'),
          ).length,
          suspended: permits.filter((p) => p.status === 'suspended').length,
        };

        const violations = await prisma.parkingViolation.count({
          where: {
            propertyId,
            ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          },
        });

        const records = permits.map((p) => ({
          referenceNumber: p.referenceNumber,
          permitType: p.permitType?.name || '',
          unit: p.unit?.number || '',
          licensePlate: p.licensePlate,
          vehicleMake: p.vehicleMake || '',
          vehicleModel: p.vehicleModel || '',
          vehicleColor: p.vehicleColor || '',
          status: p.status,
          validFrom: p.validFrom.toISOString().split('T')[0],
          validUntil: p.validUntil.toISOString().split('T')[0],
        }));

        const headers = [
          'referenceNumber',
          'permitType',
          'unit',
          'licensePlate',
          'vehicleMake',
          'vehicleModel',
          'vehicleColor',
          'status',
          'validFrom',
          'validUntil',
        ];

        return NextResponse.json({
          data: {
            summary: { ...summary, violations },
            records,
            headers,
          },
        });
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
