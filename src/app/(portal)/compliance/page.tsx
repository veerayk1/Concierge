'use client';

import { useState, useMemo } from 'react';
import {
  FileCheck2,
  Download,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

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

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  compliant: { label: 'Compliant', variant: 'success' as const, icon: CheckCircle2 },
  partially_compliant: { label: 'Partial', variant: 'warning' as const, icon: AlertTriangle },
  non_compliant: { label: 'Non-Compliant', variant: 'error' as const, icon: X },
  not_applicable: { label: 'N/A', variant: 'default' as const, icon: Clock },
} as const;

const RISK_CONFIG = {
  low: { label: 'Low', variant: 'success' as const },
  medium: { label: 'Medium', variant: 'warning' as const },
  high: { label: 'High', variant: 'error' as const },
  critical: { label: 'Critical', variant: 'error' as const },
} as const;

const TYPE_CONFIG = {
  audit: { label: 'Audit', variant: 'primary' as const },
  assessment: { label: 'Assessment', variant: 'info' as const },
  certification: { label: 'Certification', variant: 'success' as const },
  incident: { label: 'Incident', variant: 'error' as const },
  review: { label: 'Review', variant: 'warning' as const },
} as const;

const REPORT_STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'warning' as const },
  final: { label: 'Final', variant: 'success' as const },
  archived: { label: 'Archived', variant: 'default' as const },
} as const;

// ---------------------------------------------------------------------------
// Mock Data — 8 compliance frameworks
// ---------------------------------------------------------------------------

const FRAMEWORKS: ComplianceFramework[] = [
  {
    id: '1',
    name: 'PIPEDA',
    status: 'compliant',
    score: 96,
    lastAudit: '2026-01-15',
    nextAudit: '2026-07-15',
    controlsTotal: 42,
    controlsPassing: 40,
    riskLevel: 'low',
  },
  {
    id: '2',
    name: 'GDPR',
    status: 'compliant',
    score: 92,
    lastAudit: '2026-02-01',
    nextAudit: '2026-08-01',
    controlsTotal: 58,
    controlsPassing: 53,
    riskLevel: 'low',
  },
  {
    id: '3',
    name: 'SOC 2 Type II',
    status: 'partially_compliant',
    score: 78,
    lastAudit: '2025-12-10',
    nextAudit: '2026-06-10',
    controlsTotal: 64,
    controlsPassing: 50,
    riskLevel: 'medium',
  },
  {
    id: '4',
    name: 'ISO 27001',
    status: 'partially_compliant',
    score: 81,
    lastAudit: '2026-01-20',
    nextAudit: '2026-07-20',
    controlsTotal: 93,
    controlsPassing: 75,
    riskLevel: 'medium',
  },
  {
    id: '5',
    name: 'ISO 27701',
    status: 'compliant',
    score: 89,
    lastAudit: '2026-02-10',
    nextAudit: '2026-08-10',
    controlsTotal: 49,
    controlsPassing: 44,
    riskLevel: 'low',
  },
  {
    id: '6',
    name: 'ISO 27017',
    status: 'partially_compliant',
    score: 74,
    lastAudit: '2025-11-30',
    nextAudit: '2026-05-30',
    controlsTotal: 37,
    controlsPassing: 27,
    riskLevel: 'medium',
  },
  {
    id: '7',
    name: 'ISO 9001',
    status: 'compliant',
    score: 94,
    lastAudit: '2026-03-01',
    nextAudit: '2026-09-01',
    controlsTotal: 52,
    controlsPassing: 49,
    riskLevel: 'low',
  },
  {
    id: '8',
    name: 'HIPAA',
    status: 'not_applicable',
    score: 0,
    lastAudit: '2025-10-01',
    nextAudit: '2026-10-01',
    controlsTotal: 44,
    controlsPassing: 0,
    riskLevel: 'low',
  },
];

// ---------------------------------------------------------------------------
// Mock Data — 5 recent reports
// ---------------------------------------------------------------------------

const REPORTS: ComplianceReport[] = [
  {
    id: '1',
    title: 'Annual PIPEDA Compliance Audit',
    type: 'audit',
    framework: 'PIPEDA',
    generatedAt: '2026-03-15T10:30:00Z',
    generatedBy: 'Sarah Chen',
    status: 'final',
    fileSize: '2.4 MB',
  },
  {
    id: '2',
    title: 'GDPR Data Subject Access Request Report',
    type: 'assessment',
    framework: 'GDPR',
    generatedAt: '2026-03-12T14:00:00Z',
    generatedBy: 'Michael Torres',
    status: 'final',
    fileSize: '1.8 MB',
  },
  {
    id: '3',
    title: 'SOC 2 Type II Readiness Assessment',
    type: 'assessment',
    framework: 'SOC 2 Type II',
    generatedAt: '2026-03-10T09:15:00Z',
    generatedBy: 'Sarah Chen',
    status: 'draft',
    fileSize: '3.1 MB',
  },
  {
    id: '4',
    title: 'ISO 27001 Gap Analysis',
    type: 'review',
    framework: 'ISO 27001',
    generatedAt: '2026-03-05T16:45:00Z',
    generatedBy: 'James Park',
    status: 'final',
    fileSize: '4.7 MB',
  },
  {
    id: '5',
    title: 'Q1 Incident Response Review',
    type: 'incident',
    framework: 'SOC 2 Type II',
    generatedAt: '2026-03-01T11:00:00Z',
    generatedBy: 'Michael Torres',
    status: 'archived',
    fileSize: '1.2 MB',
  },
];

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
// Report table columns
// ---------------------------------------------------------------------------

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
      const cfg = TYPE_CONFIG[row.type];
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
      const cfg = REPORT_STATUS_CONFIG[row.status];
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
    className: 'w-12',
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Summary stats
  const stats = useMemo(() => {
    const monitored = FRAMEWORKS.filter((f) => f.status !== 'not_applicable').length;
    const fullyCompliant = FRAMEWORKS.filter((f) => f.status === 'compliant').length;
    const actionItems = FRAMEWORKS.reduce(
      (sum, f) => sum + (f.controlsTotal - f.controlsPassing),
      0,
    );
    return { monitored, fullyCompliant, actionItems };
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!searchQuery) return REPORTS;
    const q = searchQuery.toLowerCase();
    return REPORTS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.framework.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  }, [searchQuery]);

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
          <Button variant="primary" size="md">
            <FileCheck2 className="h-4 w-4" />
            Generate Report
          </Button>
        </>
      }
    >
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
              <p className="text-success-600 text-[22px] font-bold">{stats.fullyCompliant}</p>
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
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Framework Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FRAMEWORKS.map((framework) => {
            const statusCfg = STATUS_CONFIG[framework.status];
            const riskCfg = RISK_CONFIG[framework.riskLevel];
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={framework.id} hoverable>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-neutral-900">{framework.name}</h3>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <StatusIcon className="h-3.5 w-3.5" />
                      <Badge variant={statusCfg.variant} size="sm">
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                  <ScoreRing score={framework.score} />
                </div>

                <div className="mt-4 space-y-2">
                  {/* Controls progress bar */}
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

                  {/* Risk level */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Risk Level</span>
                    <Badge variant={riskCfg.variant} size="sm">
                      {riskCfg.label}
                    </Badge>
                  </div>

                  {/* Audit dates */}
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
            description="Try adjusting your search query to find compliance reports."
          />
        )}
      </div>
    </PageShell>
  );
}
