/**
 * Compliance Reports API — List and generate compliance reports
 * Per PRD 28: 8 report types, monitoring dashboards, audit automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';
import {
  REPORT_CATALOG,
  COMPLIANCE_REPORT_TYPES,
  generateComplianceReport,
  validateSchedule,
  type ComplianceReportType,
  type ScheduleConfig,
} from '@/server/compliance';

const generateReportSchema = z.object({
  type: z.string().min(1),
  propertyId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  schedule: z
    .object({
      frequency: z.string(),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      recipients: z.array(z.string().email()).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/compliance/reports — List available compliance report types
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    return NextResponse.json({
      data: {
        reportTypes: REPORT_CATALOG,
        totalTypes: REPORT_CATALOG.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/compliance/reports error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch compliance report types' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/compliance/reports — Generate a compliance report
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { type, propertyId, from, to, schedule } = parsed.data;

    // Validate report type against allowed list
    if (!COMPLIANCE_REPORT_TYPES.includes(type as ComplianceReportType)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid report type. Must be one of: ${COMPLIANCE_REPORT_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Handle schedule creation
    if (schedule) {
      const scheduleConfig: ScheduleConfig = {
        reportType: type as ComplianceReportType,
        frequency: schedule.frequency as 'daily' | 'weekly' | 'monthly',
        dayOfWeek: schedule.dayOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        recipients: schedule.recipients ?? [],
        propertyId,
      };

      const scheduleErrors = validateSchedule(scheduleConfig);
      if (scheduleErrors.length > 0) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: scheduleErrors.join('; ') },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          data: {
            scheduled: true,
            config: scheduleConfig,
          },
          message: `Report '${type}' scheduled ${schedule.frequency}`,
        },
        { status: 201 },
      );
    }

    // Generate report
    const filters = {
      propertyId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };

    const report = await generateComplianceReport(type as ComplianceReportType, filters);

    return NextResponse.json(
      {
        data: report,
        message: `${type} report generated successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/compliance/reports error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate compliance report' },
      { status: 500 },
    );
  }
}
