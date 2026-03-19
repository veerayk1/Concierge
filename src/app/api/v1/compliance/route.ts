/**
 * Compliance API — Frameworks listing & report generation
 *
 * PRD 28: 8 compliance frameworks (PIPEDA, GDPR, SOC2, ISO 27001/27701/27017,
 * ISO 9001, HIPAA) with monitoring dashboards and audit automation.
 *
 * GET: List compliance frameworks with status for a property
 * POST: Generate a compliance report (type, framework, dateRange)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import {
  COMPLIANCE_REPORT_TYPES,
  REPORT_CATALOG,
  generateComplianceReport,
  type ComplianceReportType,
} from '@/server/compliance';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPLIANCE_FRAMEWORKS = [
  {
    id: 'pipeda',
    name: 'PIPEDA',
    fullName: 'Personal Information Protection and Electronic Documents Act',
    region: 'Canada',
    category: 'privacy',
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullName: 'General Data Protection Regulation',
    region: 'EU',
    category: 'privacy',
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    fullName: 'Service Organization Control 2',
    region: 'Global',
    category: 'security',
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    fullName: 'Information Security Management System',
    region: 'Global',
    category: 'security',
  },
  {
    id: 'iso27701',
    name: 'ISO 27701',
    fullName: 'Privacy Information Management System',
    region: 'Global',
    category: 'privacy',
  },
  {
    id: 'iso27017',
    name: 'ISO 27017',
    fullName: 'Cloud Security Controls',
    region: 'Global',
    category: 'security',
  },
  {
    id: 'iso9001',
    name: 'ISO 9001',
    fullName: 'Quality Management System',
    region: 'Global',
    category: 'quality',
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    region: 'USA',
    category: 'privacy',
  },
] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const generateReportSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
  type: z.enum(COMPLIANCE_REPORT_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({
      message: `type must be one of: ${COMPLIANCE_REPORT_TYPES.join(', ')}`,
    }),
  }),
  framework: z.string().max(50).optional(),
  dateRange: z
    .object({
      from: z.string().min(1, 'dateRange.from is required'),
      to: z.string().min(1, 'dateRange.to is required'),
    })
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/compliance — List frameworks with property status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type') || undefined;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // If type filter provided, return compliance reports of that type
    if (type) {
      if (!COMPLIANCE_REPORT_TYPES.includes(type as ComplianceReportType)) {
        return NextResponse.json(
          {
            error: 'INVALID_TYPE',
            message: `type must be one of: ${COMPLIANCE_REPORT_TYPES.join(', ')}`,
          },
          { status: 400 },
        );
      }

      const reports = await prisma.complianceReport.findMany({
        where: { propertyId, type },
        orderBy: { generatedAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({
        data: reports,
        meta: { total: reports.length, type },
      });
    }

    // Default: return all frameworks with per-property compliance status
    // Fetch latest report per type to determine status
    const latestReports = await prisma.complianceReport.findMany({
      where: { propertyId },
      orderBy: { generatedAt: 'desc' },
    });

    // Build a map of type -> latest report
    const reportsByType = new Map<string, (typeof latestReports)[0]>();
    for (const report of latestReports) {
      if (!reportsByType.has(report.type)) {
        reportsByType.set(report.type, report);
      }
    }

    // Enrich frameworks with status
    const frameworksWithStatus = COMPLIANCE_FRAMEWORKS.map((fw) => {
      // Find report types relevant to this framework
      const relevantTypes = REPORT_CATALOG.filter((r) => r.category === fw.category);
      const relevantReports = relevantTypes.map((rt) => reportsByType.get(rt.type)).filter(Boolean);

      const hasReports = relevantReports.length > 0;
      const latestReport = relevantReports[0];

      let complianceStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' =
        'not_assessed';
      if (hasReports) {
        const allCompleted = relevantReports.every((r) => r!.status === 'completed');
        complianceStatus = allCompleted ? 'compliant' : 'partial';
      }

      return {
        ...fw,
        status: complianceStatus,
        lastAssessed: latestReport?.generatedAt || null,
        reportCount: relevantReports.length,
        relevantReportTypes: relevantTypes.map((rt) => rt.type),
      };
    });

    return NextResponse.json({
      data: {
        frameworks: frameworksWithStatus,
        reportTypes: REPORT_CATALOG,
        totalFrameworks: COMPLIANCE_FRAMEWORKS.length,
        totalReportTypes: REPORT_CATALOG.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/compliance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch compliance data' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/compliance — Generate a compliance report
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

    const input = parsed.data;

    // Determine date range
    const from = input.dateRange?.from || input.from;
    const to = input.dateRange?.to || input.to;

    // Generate the report via the compliance engine
    const filters = {
      propertyId: input.propertyId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };

    const report = await generateComplianceReport(input.type as ComplianceReportType, filters);

    // Archive the report in the database
    const archived = await prisma.complianceReport.create({
      data: {
        propertyId: input.propertyId,
        type: input.type,
        parameters: {
          framework: input.framework || null,
          from: from || null,
          to: to || null,
        },
        status: 'completed',
        generatedBy: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...report,
          archivedId: archived.id,
          framework: input.framework || null,
        },
        message: `${input.type} compliance report generated successfully.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/compliance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate compliance report' },
      { status: 500 },
    );
  }
}
