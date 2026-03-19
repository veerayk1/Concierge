/**
 * Compliance Detail API — Framework detail, control updates, audit scheduling
 *
 * GET: Retrieve framework detail with controls and evidence
 * PATCH: Update control status, add evidence
 * POST: Schedule a compliance audit
 *
 * PRD 28: 8 compliance report types, monitoring dashboards, audit automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { REPORT_CATALOG } from '@/server/compliance';

// ---------------------------------------------------------------------------
// Framework Control Definitions
// ---------------------------------------------------------------------------

interface ControlDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

const FRAMEWORK_CONTROLS: Record<string, ControlDefinition[]> = {
  pipeda: [
    {
      id: 'pip-1',
      name: 'Accountability',
      description: 'Organization responsible for personal information',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'pip-2',
      name: 'Identifying Purposes',
      description: 'Purposes for collection identified before or at time of collection',
      category: 'collection',
      criticality: 'critical',
    },
    {
      id: 'pip-3',
      name: 'Consent',
      description: 'Knowledge and consent required for collection, use, or disclosure',
      category: 'consent',
      criticality: 'critical',
    },
    {
      id: 'pip-4',
      name: 'Limiting Collection',
      description: 'Collection limited to necessary purposes',
      category: 'collection',
      criticality: 'high',
    },
    {
      id: 'pip-5',
      name: 'Limiting Use/Disclosure',
      description: 'Personal information not used or disclosed for other purposes',
      category: 'usage',
      criticality: 'high',
    },
    {
      id: 'pip-6',
      name: 'Accuracy',
      description: 'Personal information kept accurate, complete, and up-to-date',
      category: 'data_quality',
      criticality: 'medium',
    },
    {
      id: 'pip-7',
      name: 'Safeguards',
      description: 'Security safeguards appropriate to sensitivity',
      category: 'security',
      criticality: 'critical',
    },
    {
      id: 'pip-8',
      name: 'Openness',
      description: 'Policies and practices readily available',
      category: 'transparency',
      criticality: 'medium',
    },
    {
      id: 'pip-9',
      name: 'Individual Access',
      description: 'Right to access and challenge accuracy',
      category: 'access',
      criticality: 'high',
    },
    {
      id: 'pip-10',
      name: 'Challenging Compliance',
      description: 'Ability to challenge compliance with principles',
      category: 'governance',
      criticality: 'medium',
    },
  ],
  gdpr: [
    {
      id: 'gdpr-1',
      name: 'Lawfulness & Fairness',
      description: 'Processing must be lawful, fair, and transparent',
      category: 'legal_basis',
      criticality: 'critical',
    },
    {
      id: 'gdpr-2',
      name: 'Purpose Limitation',
      description: 'Collected for specified, explicit, and legitimate purposes',
      category: 'collection',
      criticality: 'critical',
    },
    {
      id: 'gdpr-3',
      name: 'Data Minimization',
      description: 'Adequate, relevant, and limited to what is necessary',
      category: 'collection',
      criticality: 'high',
    },
    {
      id: 'gdpr-4',
      name: 'Accuracy',
      description: 'Accurate and kept up to date',
      category: 'data_quality',
      criticality: 'high',
    },
    {
      id: 'gdpr-5',
      name: 'Storage Limitation',
      description: 'Kept no longer than necessary',
      category: 'retention',
      criticality: 'high',
    },
    {
      id: 'gdpr-6',
      name: 'Integrity & Confidentiality',
      description: 'Appropriate security of personal data',
      category: 'security',
      criticality: 'critical',
    },
    {
      id: 'gdpr-7',
      name: 'Data Subject Rights',
      description: 'Right to access, rectify, erase, restrict, port, object',
      category: 'access',
      criticality: 'critical',
    },
    {
      id: 'gdpr-8',
      name: 'Data Protection Impact Assessment',
      description: 'DPIA for high-risk processing',
      category: 'assessment',
      criticality: 'high',
    },
  ],
  soc2: [
    {
      id: 'soc2-cc1',
      name: 'Control Environment',
      description: 'Organization demonstrates commitment to integrity and ethical values',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'soc2-cc2',
      name: 'Communication & Information',
      description: 'Internal and external communication supports internal control',
      category: 'communication',
      criticality: 'high',
    },
    {
      id: 'soc2-cc3',
      name: 'Risk Assessment',
      description: 'Entity identifies and assesses risks',
      category: 'risk',
      criticality: 'critical',
    },
    {
      id: 'soc2-cc4',
      name: 'Monitoring Activities',
      description: 'Ongoing and/or separate evaluations',
      category: 'monitoring',
      criticality: 'high',
    },
    {
      id: 'soc2-cc5',
      name: 'Control Activities',
      description: 'Actions to mitigate risks',
      category: 'controls',
      criticality: 'critical',
    },
    {
      id: 'soc2-cc6',
      name: 'Logical & Physical Access',
      description: 'Controls over access to systems and data',
      category: 'access',
      criticality: 'critical',
    },
    {
      id: 'soc2-cc7',
      name: 'System Operations',
      description: 'Controls over system processing and error handling',
      category: 'operations',
      criticality: 'high',
    },
    {
      id: 'soc2-cc8',
      name: 'Change Management',
      description: 'Controls over changes to infrastructure and software',
      category: 'change',
      criticality: 'high',
    },
    {
      id: 'soc2-cc9',
      name: 'Risk Mitigation',
      description: 'Identifies and mitigates vendor and business risks',
      category: 'risk',
      criticality: 'medium',
    },
  ],
  iso27001: [
    {
      id: 'iso27-a5',
      name: 'Information Security Policies',
      description: 'Management direction for information security',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'iso27-a6',
      name: 'Organization of InfoSec',
      description: 'Internal organization and mobile devices/telework',
      category: 'governance',
      criticality: 'high',
    },
    {
      id: 'iso27-a7',
      name: 'Human Resource Security',
      description: 'Before, during, and termination/change of employment',
      category: 'hr',
      criticality: 'high',
    },
    {
      id: 'iso27-a8',
      name: 'Asset Management',
      description: 'Responsibility for assets, classification, media handling',
      category: 'assets',
      criticality: 'high',
    },
    {
      id: 'iso27-a9',
      name: 'Access Control',
      description: 'Business requirements, user access, system/application access',
      category: 'access',
      criticality: 'critical',
    },
    {
      id: 'iso27-a10',
      name: 'Cryptography',
      description: 'Cryptographic controls and key management',
      category: 'security',
      criticality: 'critical',
    },
    {
      id: 'iso27-a12',
      name: 'Operations Security',
      description: 'Procedures, malware, backup, logging, software',
      category: 'operations',
      criticality: 'critical',
    },
    {
      id: 'iso27-a13',
      name: 'Communications Security',
      description: 'Network security management and information transfer',
      category: 'network',
      criticality: 'high',
    },
  ],
  iso27701: [
    {
      id: 'iso701-1',
      name: 'PII Controller Conditions',
      description: 'Conditions for processing PII',
      category: 'controller',
      criticality: 'critical',
    },
    {
      id: 'iso701-2',
      name: 'PII Processor Conditions',
      description: 'Conditions for processing PII as processor',
      category: 'processor',
      criticality: 'critical',
    },
    {
      id: 'iso701-3',
      name: 'Privacy Risk Assessment',
      description: 'Identify and assess privacy risks',
      category: 'risk',
      criticality: 'high',
    },
    {
      id: 'iso701-4',
      name: 'Privacy by Design',
      description: 'Embed privacy into system design',
      category: 'design',
      criticality: 'high',
    },
  ],
  iso27017: [
    {
      id: 'iso017-1',
      name: 'Shared Roles & Responsibilities',
      description: 'Cloud service customer and provider roles',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'iso017-2',
      name: 'Asset Removal',
      description: 'Assets of cloud service customer removed upon termination',
      category: 'data',
      criticality: 'high',
    },
    {
      id: 'iso017-3',
      name: 'Virtual Environment Segregation',
      description: 'Virtual machines hardened and isolated',
      category: 'infrastructure',
      criticality: 'critical',
    },
    {
      id: 'iso017-4',
      name: 'Cloud Admin Operations',
      description: 'Administrative operations of cloud services monitored',
      category: 'operations',
      criticality: 'high',
    },
  ],
  iso9001: [
    {
      id: 'iso9-4',
      name: 'Context of Organization',
      description: 'Understanding the organization and its context',
      category: 'governance',
      criticality: 'high',
    },
    {
      id: 'iso9-5',
      name: 'Leadership',
      description: 'Leadership and commitment to quality management',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'iso9-6',
      name: 'Planning',
      description: 'Actions to address risks and opportunities',
      category: 'planning',
      criticality: 'high',
    },
    {
      id: 'iso9-7',
      name: 'Support',
      description: 'Resources, competence, awareness, communication, documentation',
      category: 'support',
      criticality: 'medium',
    },
    {
      id: 'iso9-8',
      name: 'Operation',
      description: 'Operational planning and control',
      category: 'operations',
      criticality: 'critical',
    },
    {
      id: 'iso9-9',
      name: 'Performance Evaluation',
      description: 'Monitoring, measurement, analysis, and evaluation',
      category: 'monitoring',
      criticality: 'high',
    },
    {
      id: 'iso9-10',
      name: 'Improvement',
      description: 'Nonconformity, corrective action, continual improvement',
      category: 'improvement',
      criticality: 'high',
    },
  ],
  hipaa: [
    {
      id: 'hipaa-1',
      name: 'Administrative Safeguards',
      description: 'Policies and procedures for managing PHI',
      category: 'governance',
      criticality: 'critical',
    },
    {
      id: 'hipaa-2',
      name: 'Physical Safeguards',
      description: 'Physical measures to protect electronic PHI',
      category: 'physical',
      criticality: 'critical',
    },
    {
      id: 'hipaa-3',
      name: 'Technical Safeguards',
      description: 'Technology to protect and control access to PHI',
      category: 'technical',
      criticality: 'critical',
    },
    {
      id: 'hipaa-4',
      name: 'Organizational Requirements',
      description: 'BAAs and group health plan requirements',
      category: 'governance',
      criticality: 'high',
    },
    {
      id: 'hipaa-5',
      name: 'Breach Notification',
      description: 'Notification requirements for unsecured PHI breaches',
      category: 'incident',
      criticality: 'critical',
    },
  ],
};

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const patchControlSchema = z.object({
  controlId: z.string().min(1, 'controlId is required'),
  status: z.enum(['compliant', 'partial', 'non_compliant', 'not_assessed']),
  evidence: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  assessedBy: z.string().optional(),
});

const scheduleAuditSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a valid UUID'),
  scheduledDate: z.string().min(1, 'scheduledDate is required'),
  auditorName: z.string().min(1).max(200),
  auditorEmail: z.string().email().optional(),
  scope: z.array(z.string()).min(1, 'At least one scope item required'),
  notes: z.string().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/compliance/:id — Framework detail with controls
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const frameworkId = id.toLowerCase();

    // Check if this is a report ID (UUID) or a framework ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      // Retrieve a specific compliance report by ID
      const report = await prisma.complianceReport.findUnique({
        where: { id },
      });

      if (!report) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Compliance report not found' },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: report });
    }

    // Framework detail lookup
    const controls = FRAMEWORK_CONTROLS[frameworkId];
    if (!controls) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: `Framework '${id}' not found. Available: ${Object.keys(FRAMEWORK_CONTROLS).join(', ')}`,
        },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    // Fetch related reports if propertyId provided
    let relatedReports: unknown[] = [];
    if (propertyId) {
      const relevantTypes = REPORT_CATALOG.filter((r) => {
        // Match report types to framework categories
        const frameworkCategory = controls[0]?.category || '';
        return (
          r.category === frameworkCategory || r.category === 'security' || r.category === 'privacy'
        );
      }).map((r) => r.type);

      relatedReports = await prisma.complianceReport.findMany({
        where: {
          propertyId,
          type: { in: relevantTypes },
        },
        orderBy: { generatedAt: 'desc' },
        take: 10,
      });
    }

    // Build controls with default status
    const controlsWithStatus = controls.map((ctrl) => ({
      ...ctrl,
      status: 'not_assessed' as const,
      evidence: null,
      lastAssessed: null,
    }));

    return NextResponse.json({
      data: {
        frameworkId,
        controls: controlsWithStatus,
        totalControls: controls.length,
        criticalControls: controls.filter((c) => c.criticality === 'critical').length,
        recentReports: relatedReports,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/compliance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch compliance detail' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/compliance/:id — Update control status, add evidence
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const frameworkId = id.toLowerCase();

    const controls = FRAMEWORK_CONTROLS[frameworkId];
    if (!controls) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Framework '${id}' not found` },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = patchControlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Validate control exists in this framework
    const control = controls.find((c) => c.id === input.controlId);
    if (!control) {
      return NextResponse.json(
        {
          error: 'INVALID_CONTROL',
          message: `Control '${input.controlId}' not found in framework '${frameworkId}'`,
        },
        { status: 400 },
      );
    }

    // Sanitize text inputs
    const sanitizedEvidence = input.evidence
      ? stripControlChars(stripHtml(input.evidence))
      : undefined;
    const sanitizedNotes = input.notes ? stripControlChars(stripHtml(input.notes)) : undefined;

    // In a full implementation, this would persist to a ComplianceControlStatus table.
    // For now, we return the updated control status.
    const updatedControl = {
      ...control,
      status: input.status,
      evidence: sanitizedEvidence || null,
      notes: sanitizedNotes || null,
      assessedBy: input.assessedBy || auth.user.userId,
      lastAssessed: new Date().toISOString(),
    };

    return NextResponse.json({
      data: updatedControl,
      message: `Control '${control.name}' updated to '${input.status}'.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/compliance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update compliance control' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/compliance/:id — Schedule a compliance audit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const frameworkId = id.toLowerCase();

    const controls = FRAMEWORK_CONTROLS[frameworkId];
    if (!controls) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Framework '${id}' not found` },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = scheduleAuditSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Validate scheduled date is in the future
    const scheduledDate = new Date(input.scheduledDate);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'INVALID_DATE', message: 'Scheduled date must be in the future' },
        { status: 400 },
      );
    }

    // Sanitize inputs
    const sanitizedAuditor = stripControlChars(stripHtml(input.auditorName));
    const sanitizedNotes = input.notes ? stripControlChars(stripHtml(input.notes)) : undefined;

    // Create audit record via ComplianceReport
    const auditRecord = await prisma.complianceReport.create({
      data: {
        propertyId: input.propertyId,
        type: 'security_audit',
        parameters: {
          framework: frameworkId,
          auditType: 'scheduled',
          auditorName: sanitizedAuditor,
          auditorEmail: input.auditorEmail || null,
          scope: input.scope,
          notes: sanitizedNotes || null,
          scheduledDate: scheduledDate.toISOString(),
        },
        status: 'generating', // Will be updated when audit is completed
        generatedBy: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        data: {
          auditId: auditRecord.id,
          framework: frameworkId,
          scheduledDate: scheduledDate.toISOString(),
          auditor: sanitizedAuditor,
          scope: input.scope,
          status: 'scheduled',
          controlCount: controls.length,
        },
        message: `Compliance audit scheduled for ${frameworkId.toUpperCase()} on ${scheduledDate.toLocaleDateString()}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/compliance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to schedule compliance audit' },
      { status: 500 },
    );
  }
}
