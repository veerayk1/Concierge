'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  FileCheck2,
  Download,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  Loader2,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComplianceFramework {
  id: string;
  name: string;
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
  score: number;
  lastAudit: string;
  nextAudit: string;
  controlsTotal: number;
  controlsPassing: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceReport {
  id: string;
  title: string;
  type: 'audit' | 'assessment' | 'certification' | 'incident' | 'review';
  framework: string;
  generatedAt: string;
  generatedBy: string;
  status: 'draft' | 'final' | 'archived';
  fileSize: string;
}

interface ComplianceApiResponse {
  frameworks: ComplianceFramework[];
  reports: ComplianceReport[];
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle2 }
> = {
  compliant: { label: 'Compliant', variant: 'success', icon: CheckCircle2 },
  partially_compliant: { label: 'Partial', variant: 'warning', icon: AlertTriangle },
  non_compliant: { label: 'Non-Compliant', variant: 'error', icon: X },
  not_applicable: { label: 'N/A', variant: 'default', icon: Clock },
};

const RISK_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  low: { label: 'Low', variant: 'success' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'error' },
  critical: { label: 'Critical', variant: 'error' },
};

const TYPE_CONFIG: Record<
  string,
  { label: string; variant: 'primary' | 'info' | 'success' | 'error' | 'warning' }
> = {
  audit: { label: 'Audit', variant: 'primary' },
  assessment: { label: 'Assessment', variant: 'info' },
  certification: { label: 'Certification', variant: 'success' },
  incident: { label: 'Incident', variant: 'error' },
  review: { label: 'Review', variant: 'warning' },
};

const REPORT_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'default' }
> = {
  draft: { label: 'Draft', variant: 'warning' },
  final: { label: 'Final', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
};

// ---------------------------------------------------------------------------
// Score ring component
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 90
      ? 'text-success-500'
      : score >= 70
        ? 'text-warning-500'
        : score > 0
          ? 'text-error-500'
          : 'text-neutral-300';

  const strokeColor =
    score >= 90
      ? 'stroke-success-500'
      : score >= 70
        ? 'stroke-warning-500'
        : score > 0
          ? 'stroke-error-500'
          : 'stroke-neutral-300';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-neutral-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={strokeColor}
        />
      </svg>
      <span className={`absolute text-[11px] font-bold ${color}`}>
        {score > 0 ? `${score}%` : 'N/A'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate Report Dialog
// ---------------------------------------------------------------------------

const REPORT_TYPE_OPTIONS = [
  { value: 'access_audit', label: 'Access Audit Report' },
  { value: 'data_retention', label: 'Data Retention Report' },
  { value: 'consent_tracking', label: 'Consent Tracking Report' },
  { value: 'incident_response', label: 'Incident Response Report' },
  { value: 'vendor_compliance', label: 'Vendor Compliance Report' },
  { value: 'security_audit', label: 'Security Audit Report' },
  { value: 'privacy_impact', label: 'Privacy Impact Assessment' },
  { value: 'sla_performance', label: 'SLA Performance Report' },
];

function GenerateReportDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const type = form.get('type') as string;
    const framework = (form.get('framework') as string) || undefined;
    const from = (form.get('from') as string) || undefined;
    const to = (form.get('to') as string) || undefined;

    if (!type) {
      setError('Report type is required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest('/api/v1/compliance', {
        method: 'POST',
        body: {
          propertyId: DEMO_PROPERTY_ID,
          type,
          framework,
          ...(from && to ? { dateRange: { from, to } } : {}),
        },
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || 'Failed to generate report');
        return;
      }

      setSuccessMsg(result.message || 'Report generated successfully.');
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
        onSuccess();
      }, 1200);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <FileCheck2 className="text-primary-500 h-5 w-5" />
          Generate Compliance Report
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Select a report type and optional date range to generate a compliance report.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]">
              {successMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Report Type<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              name="type"
              required
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
            >
              <option value="">Select report type...</option>
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="framework"
            label="Framework (optional)"
            placeholder="e.g. PIPEDA, GDPR, SOC 2"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input name="from" label="From Date" type="date" />
            <Input name="to" label="To Date" type="date" />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Fetch compliance data from API
  const {
    data: apiData,
    loading,
    error,
    refetch,
  } = useApi<ComplianceApiResponse | ComplianceFramework[]>(
    apiUrl('/api/v1/compliance', { propertyId: DEMO_PROPERTY_ID }),
  );

  // Normalize: API may return { frameworks, reports } or just an array of frameworks
  const { frameworks, reports } = useMemo(() => {
    if (!apiData)
      return { frameworks: [] as ComplianceFramework[], reports: [] as ComplianceReport[] };
    if (Array.isArray(apiData)) {
      return { frameworks: apiData as ComplianceFramework[], reports: [] as ComplianceReport[] };
    }
    const resp = apiData as ComplianceApiResponse;
    return {
      frameworks: resp.frameworks ?? [],
      reports: resp.reports ?? [],
    };
  }, [apiData]);

  // Summary stats
  const stats = useMemo(() => {
    const monitored = frameworks.filter((f) => f.status !== 'not_applicable').length;
    const fullyCompliant = frameworks.filter((f) => f.status === 'compliant').length;
    const actionItems = frameworks.reduce(
      (sum, f) => sum + (f.controlsTotal - f.controlsPassing),
      0,
    );
    return { monitored, fullyCompliant, actionItems };
  }, [frameworks]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!searchQuery) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.framework.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  }, [searchQuery, reports]);

  // Report table columns
  const reportColumns: Column<ComplianceReport>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => <span className="font-semibold text-neutral-900">{row.title}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => {
        const cfg = TYPE_CONFIG[row.type] ?? { label: row.type, variant: 'default' as const };
        return (
          <Badge variant={cfg.variant} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'framework',
      header: 'Framework',
      accessorKey: 'framework',
      sortable: true,
    },
    {
      id: 'generatedAt',
      header: 'Generated',
      accessorKey: 'generatedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-neutral-600">
          {new Date(row.generatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = REPORT_STATUS_CONFIG[row.status] ?? {
          label: row.status,
          variant: 'default' as const,
        };
        return (
          <Badge variant={cfg.variant} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'fileSize',
      header: 'Size',
      accessorKey: 'fileSize',
      cell: (row) => <span className="text-neutral-500">{row.fileSize}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <Button variant="ghost" size="sm">
          <Download className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      title="Compliance"
      description="Monitor compliance status across PIPEDA, GDPR, SOC 2, and other frameworks."
      actions={
        <>
          <Button variant="secondary" size="md">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowReportDialog(true)}>
            <FileCheck2 className="h-4 w-4" />
            Generate Report
          </Button>
        </>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading compliance data...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load compliance data"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Empty State */}
          {frameworks.length === 0 && reports.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-6 w-6" />}
              title="No compliance data"
              description="Compliance frameworks and reports will appear here once configured."
            />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                      <Shield className="text-primary-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                        Frameworks Monitored
                      </p>
                      <p className="text-[22px] font-bold text-neutral-900">{stats.monitored}</p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                      <CheckCircle2 className="text-success-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                        Fully Compliant
                      </p>
                      <p className="text-success-600 text-[22px] font-bold">
                        {stats.fullyCompliant}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                      <AlertTriangle className="text-warning-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                        Action Items
                      </p>
                      <p className="text-warning-600 text-[22px] font-bold">{stats.actionItems}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Framework Compliance Cards */}
              {frameworks.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
                    Framework Status
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {frameworks.map((framework) => {
                      const statusCfg =
                        STATUS_CONFIG[framework.status] ?? STATUS_CONFIG['not_applicable']!;
                      const riskCfg = RISK_CONFIG[framework.riskLevel] ?? RISK_CONFIG['low']!;
                      const StatusIcon = statusCfg!.icon;

                      return (
                        <Card key={framework.id} hoverable>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-[15px] font-semibold text-neutral-900">
                                {framework.name}
                              </h3>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <StatusIcon className="h-3.5 w-3.5" />
                                <Badge variant={statusCfg!.variant} size="sm">
                                  {statusCfg!.label}
                                </Badge>
                              </div>
                            </div>
                            <ScoreRing score={framework.score} />
                          </div>

                          <div className="mt-4 space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-neutral-500">Controls</span>
                                <span className="font-medium text-neutral-700">
                                  {framework.controlsPassing}/{framework.controlsTotal}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    framework.score >= 90
                                      ? 'bg-success-500'
                                      : framework.score >= 70
                                        ? 'bg-warning-500'
                                        : framework.score > 0
                                          ? 'bg-error-500'
                                          : 'bg-neutral-300'
                                  }`}
                                  style={{
                                    width:
                                      framework.controlsTotal > 0
                                        ? `${(framework.controlsPassing / framework.controlsTotal) * 100}%`
                                        : '0%',
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-500">Risk Level</span>
                              <Badge variant={riskCfg!.variant} size="sm">
                                {riskCfg!.label}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-500">Last Audit</span>
                              <span className="text-neutral-600">
                                {new Date(framework.lastAudit).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-500">Next Audit</span>
                              <span className="text-neutral-600">
                                {new Date(framework.nextAudit).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Reports */}
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-neutral-900">Recent Reports</h2>
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:border-primary-300 focus:ring-primary-100 h-9 w-64 rounded-lg border border-neutral-200 bg-white pr-8 pl-9 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {filteredReports.length > 0 ? (
                  <DataTable columns={reportColumns} data={filteredReports} />
                ) : (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="No reports found"
                    description={
                      reports.length === 0
                        ? 'Compliance reports will appear here once generated.'
                        : 'Try adjusting your search query to find compliance reports.'
                    }
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSuccess={() => refetch()}
      />
    </PageShell>
  );
}
