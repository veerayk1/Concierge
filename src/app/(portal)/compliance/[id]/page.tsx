'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit2,
  FileText,
  Search,
  Shield,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FrameworkStatus = 'compliant' | 'partially_compliant' | 'non_compliant';
type ControlStatus = 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface ComplianceControl {
  id: string;
  controlId: string;
  name: string;
  category: string;
  status: ControlStatus;
  hasEvidence: boolean;
  lastReviewed: string;
  remediationNote?: string;
}

interface AuditRecord {
  id: string;
  date: string;
  auditor: string;
  result: 'pass' | 'fail' | 'partial';
  score: number;
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  status: FrameworkStatus;
  score: number;
  riskLevel: RiskLevel;
  lastAuditDate: string;
  nextAuditDate: string;
  controls: ComplianceControl[];
  auditHistory: AuditRecord[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_FRAMEWORK: ComplianceFramework = {
  id: '1',
  name: 'PIPEDA',
  description:
    "Personal Information Protection and Electronic Documents Act. Canada's federal privacy law for private-sector organizations. Governs how personal information is collected, used, and disclosed in the course of commercial activities.",
  status: 'partially_compliant',
  score: 87,
  riskLevel: 'low',
  lastAuditDate: '2025-12-15',
  nextAuditDate: '2026-06-15',
  controls: [
    {
      id: 'c-1',
      controlId: 'PIP-1.1',
      name: 'Accountability Designation',
      category: 'Accountability',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-2',
      controlId: 'PIP-1.2',
      name: 'Privacy Officer Appointment',
      category: 'Accountability',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-3',
      controlId: 'PIP-2.1',
      name: 'Purpose Identification at Collection',
      category: 'Purpose Limitation',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-4',
      controlId: 'PIP-3.1',
      name: 'Meaningful Consent Mechanisms',
      category: 'Consent',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-5',
      controlId: 'PIP-3.2',
      name: 'Consent Withdrawal Process',
      category: 'Consent',
      status: 'partially_compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
      remediationNote:
        'Consent withdrawal flow exists but lacks confirmation email. Target fix: Q2 2026.',
    },
    {
      id: 'c-6',
      controlId: 'PIP-4.1',
      name: 'Collection Limitation',
      category: 'Data Minimization',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-7',
      controlId: 'PIP-5.1',
      name: 'Use and Disclosure Controls',
      category: 'Use Limitation',
      status: 'compliant',
      hasEvidence: false,
      lastReviewed: '2025-11-20',
    },
    {
      id: 'c-8',
      controlId: 'PIP-6.1',
      name: 'Data Accuracy Procedures',
      category: 'Accuracy',
      status: 'compliant',
      hasEvidence: true,
      lastReviewed: '2025-12-15',
    },
    {
      id: 'c-9',
      controlId: 'PIP-7.1',
      name: 'Security Safeguards',
      category: 'Safeguards',
      status: 'non_compliant',
      hasEvidence: false,
      lastReviewed: '2025-12-15',
      remediationNote:
        'Encryption at rest not yet implemented for backup storage. Vendor evaluation in progress. Critical priority.',
    },
    {
      id: 'c-10',
      controlId: 'PIP-8.1',
      name: 'Individual Access Rights',
      category: 'Access Rights',
      status: 'not_applicable',
      hasEvidence: false,
      lastReviewed: '2025-12-15',
    },
  ],
  auditHistory: [
    {
      id: 'a-1',
      date: '2025-12-15',
      auditor: 'ComplianceFirst Inc.',
      result: 'partial',
      score: 87,
    },
    {
      id: 'a-2',
      date: '2025-06-10',
      auditor: 'ComplianceFirst Inc.',
      result: 'partial',
      score: 79,
    },
    {
      id: 'a-3',
      date: '2024-12-18',
      auditor: 'NorthStar Audit Group',
      result: 'fail',
      score: 62,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRAMEWORK_STATUS_CONFIG: Record<
  FrameworkStatus,
  { variant: 'success' | 'warning' | 'error'; label: string }
> = {
  compliant: { variant: 'success', label: 'Compliant' },
  partially_compliant: { variant: 'warning', label: 'Partially Compliant' },
  non_compliant: { variant: 'error', label: 'Non-Compliant' },
};

const CONTROL_STATUS_CONFIG: Record<
  ControlStatus,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  compliant: { variant: 'success', label: 'Compliant' },
  non_compliant: { variant: 'error', label: 'Non-Compliant' },
  partially_compliant: { variant: 'warning', label: 'Partial' },
  not_applicable: { variant: 'default', label: 'N/A' },
};

const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { variant: 'success' | 'warning' | 'error' | 'primary'; label: string; description: string }
> = {
  low: {
    variant: 'success',
    label: 'Low',
    description: 'Minimal risk exposure. Most controls are in place and functioning correctly.',
  },
  medium: {
    variant: 'warning',
    label: 'Medium',
    description: 'Some gaps identified. Remediation should be prioritized within 90 days.',
  },
  high: {
    variant: 'error',
    label: 'High',
    description: 'Significant gaps present. Immediate remediation required within 30 days.',
  },
  critical: {
    variant: 'error',
    label: 'Critical',
    description: 'Major compliance failures. Urgent action needed to avoid regulatory penalties.',
  },
};

const AUDIT_RESULT_CONFIG: Record<
  AuditRecord['result'],
  { variant: 'success' | 'error' | 'warning'; label: string }
> = {
  pass: { variant: 'success', label: 'Pass' },
  fail: { variant: 'error', label: 'Fail' },
  partial: { variant: 'warning', label: 'Partial' },
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-success-600';
  if (score >= 70) return 'text-warning-600';
  return 'text-error-600';
}

function getScoreRingColor(score: number): string {
  if (score >= 90) return 'border-success-400';
  if (score >= 70) return 'border-warning-400';
  return 'border-error-400';
}

function getScoreTrackColor(score: number): string {
  if (score >= 90) return 'border-success-100';
  if (score >= 70) return 'border-warning-100';
  return 'border-error-100';
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplianceFrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In production this would come from an API call using id
  const framework = MOCK_FRAMEWORK;
  const statusCfg = FRAMEWORK_STATUS_CONFIG[framework.status];
  const riskCfg = RISK_LEVEL_CONFIG[framework.riskLevel];

  const nonCompliantControls = framework.controls.filter(
    (c) => c.status === 'non_compliant' || c.status === 'partially_compliant',
  );

  const controlColumns: Column<ComplianceControl>[] = [
    {
      id: 'controlId',
      header: 'Control ID',
      accessorKey: 'controlId',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 text-[13px] font-semibold">{row.controlId}</span>
      ),
    },
    {
      id: 'name',
      header: 'Control Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[13px] font-medium text-neutral-900">{row.name}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.category}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = CONTROL_STATUS_CONFIG[row.status];
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'evidence',
      header: 'Evidence',
      accessorKey: 'hasEvidence',
      cell: (row) =>
        row.hasEvidence ? (
          <CheckCircle2 className="text-success-500 h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4 text-neutral-300" />
        ),
    },
    {
      id: 'lastReviewed',
      header: 'Last Reviewed',
      accessorKey: 'lastReviewed',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.lastReviewed).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title={framework.name}
      description="Compliance Framework"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export Controls
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href={'/compliance' as never}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to compliance
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Framework Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Framework Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Name" value={framework.name} />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={
                      <p className="leading-relaxed text-neutral-700">{framework.description}</p>
                    }
                  />
                </div>
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Score"
                  value={
                    <span className={`text-[18px] font-bold ${getScoreColor(framework.score)}`}>
                      {framework.score}/100
                    </span>
                  }
                />
                <InfoRow
                  label="Last Audit"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(framework.lastAuditDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
                <InfoRow
                  label="Next Audit"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(framework.nextAuditDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls Table */}
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={controlColumns}
                data={framework.controls}
                emptyMessage="No controls defined for this framework."
                emptyIcon={<ClipboardCheck className="h-6 w-6" />}
                compact
              />
            </CardContent>
          </Card>

          {/* Non-Compliant Items */}
          {nonCompliantControls.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-warning-500 h-4 w-4" />
                  <CardTitle>Items Requiring Attention</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {nonCompliantControls.map((control) => {
                    const ctrlCfg = CONTROL_STATUS_CONFIG[control.status];
                    return (
                      <div
                        key={control.id}
                        className={`rounded-xl border p-4 ${
                          control.status === 'non_compliant'
                            ? 'border-error-200 bg-error-50/50'
                            : 'border-warning-200 bg-warning-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-neutral-700">
                              {control.controlId}
                            </span>
                            <span className="text-[14px] font-semibold text-neutral-900">
                              {control.name}
                            </span>
                          </div>
                          <Badge variant={ctrlCfg.variant} size="sm" dot>
                            {ctrlCfg.label}
                          </Badge>
                        </div>
                        {control.remediationNote && (
                          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                            {control.remediationNote}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${getScoreRingColor(framework.score)} ${getScoreTrackColor(framework.score)} bg-white`}
                >
                  <span className={`text-[32px] font-bold ${getScoreColor(framework.score)}`}>
                    {framework.score}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-500">out of 100</p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Level */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    riskCfg.variant === 'success'
                      ? 'bg-success-50'
                      : riskCfg.variant === 'warning'
                        ? 'bg-warning-50'
                        : 'bg-error-50'
                  }`}
                >
                  <Shield
                    className={`h-8 w-8 ${
                      riskCfg.variant === 'success'
                        ? 'text-success-600'
                        : riskCfg.variant === 'warning'
                          ? 'text-warning-600'
                          : 'text-error-600'
                    }`}
                  />
                </div>
                <Badge variant={riskCfg.variant} size="lg" dot>
                  {riskCfg.label}
                </Badge>
                <p className="text-[13px] leading-relaxed text-neutral-500">
                  {riskCfg.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="secondary" fullWidth>
                  <Calendar className="h-4 w-4" />
                  Schedule Audit
                </Button>
                <Button variant="secondary" fullWidth>
                  <Download className="h-4 w-4" />
                  Export Controls
                </Button>
                <Button variant="secondary" fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Update Evidence
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit History */}
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {framework.auditHistory.map((audit) => {
                  const auditCfg = AUDIT_RESULT_CONFIG[audit.result];
                  return (
                    <div
                      key={audit.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">
                          {new Date(audit.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {audit.auditor} &middot; Score: {audit.score}%
                        </p>
                      </div>
                      <Badge variant={auditCfg.variant} size="sm" dot>
                        {auditCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
