'use client';

import { useEffect, useState } from 'react';
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
  Shield,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ControlData {
  id: string;
  name: string;
  description: string;
  category: string;
  criticality: string;
  status: string;
  evidence: string | null;
  lastAssessed: string | null;
}

interface ComplianceFrameworkData {
  frameworkId: string;
  controls: ControlData[];
  totalControls: number;
  criticalControls: number;
  recentReports: unknown[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTROL_STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  compliant: { variant: 'success', label: 'Compliant' },
  non_compliant: { variant: 'error', label: 'Non-Compliant' },
  partial: { variant: 'warning', label: 'Partial' },
  partially_compliant: { variant: 'warning', label: 'Partial' },
  not_assessed: { variant: 'default', label: 'Not Assessed' },
  not_applicable: { variant: 'default', label: 'N/A' },
};

const CRITICALITY_CONFIG: Record<
  string,
  { variant: 'error' | 'warning' | 'info' | 'default'; label: string }
> = {
  critical: { variant: 'error', label: 'Critical' },
  high: { variant: 'warning', label: 'High' },
  medium: { variant: 'info', label: 'Medium' },
  low: { variant: 'default', label: 'Low' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ComplianceSkeleton() {
  return (
    <PageShell title="" description="Compliance Framework">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplianceFrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [framework, setFramework] = useState<ComplianceFrameworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchFramework() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/compliance/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch framework (${res.status})`);
        const json = await res.json();
        setFramework(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchFramework();
  }, [id]);

  if (loading) return <ComplianceSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Shield className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Framework not found</h1>
        <p className="text-[14px] text-neutral-500">
          The compliance framework you are looking for does not exist.
        </p>
        <Link href={'/compliance' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to compliance
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading framework</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href={'/compliance' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to compliance
          </Button>
        </Link>
      </div>
    );
  }

  if (!framework) return null;

  const compliantCount = framework.controls.filter((c) => c.status === 'compliant').length;
  const nonCompliantControls = framework.controls.filter(
    (c) =>
      c.status === 'non_compliant' || c.status === 'partial' || c.status === 'partially_compliant',
  );
  const score =
    framework.totalControls > 0 ? Math.round((compliantCount / framework.totalControls) * 100) : 0;

  function getScoreColor(s: number): string {
    if (s >= 90) return 'text-success-600';
    if (s >= 70) return 'text-warning-600';
    return 'text-error-600';
  }

  function getScoreRingColor(s: number): string {
    if (s >= 90) return 'border-success-400';
    if (s >= 70) return 'border-warning-400';
    return 'border-error-400';
  }

  function getScoreTrackColor(s: number): string {
    if (s >= 90) return 'border-success-100';
    if (s >= 70) return 'border-warning-100';
    return 'border-error-100';
  }

  return (
    <PageShell
      title={framework.frameworkId.toUpperCase()}
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
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Framework Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Framework" value={framework.frameworkId.toUpperCase()} />
                </div>
                <InfoRow label="Total Controls" value={framework.totalControls} />
                <InfoRow label="Critical Controls" value={framework.criticalControls} />
                <InfoRow
                  label="Compliant"
                  value={
                    <span className="text-success-600 font-semibold">
                      {compliantCount} / {framework.totalControls}
                    </span>
                  }
                />
                <InfoRow
                  label="Score"
                  value={
                    <span className={`text-[18px] font-bold ${getScoreColor(score)}`}>
                      {score}/100
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls Table */}
          <Card>
            <CardHeader>
              <CardTitle>Controls ({framework.controls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {framework.controls.map((control) => {
                  const statusCfg =
                    CONTROL_STATUS_CONFIG[control.status] || CONTROL_STATUS_CONFIG.not_assessed;
                  const critCfg = CRITICALITY_CONFIG[control.criticality] || CRITICALITY_CONFIG.low;
                  return (
                    <div
                      key={control.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 transition-colors hover:bg-neutral-50/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-neutral-700">
                            {control.id}
                          </span>
                          <span className="text-[14px] font-medium text-neutral-900">
                            {control.name}
                          </span>
                          <Badge variant={critCfg.variant} size="sm">
                            {critCfg.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[12px] text-neutral-500">{control.description}</p>
                      </div>
                      <Badge variant={statusCfg.variant} size="sm" dot>
                        {statusCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
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
                    const ctrlCfg =
                      CONTROL_STATUS_CONFIG[control.status] || CONTROL_STATUS_CONFIG.not_assessed;
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
                              {control.id}
                            </span>
                            <span className="text-[14px] font-semibold text-neutral-900">
                              {control.name}
                            </span>
                          </div>
                          <Badge variant={ctrlCfg.variant} size="sm" dot>
                            {ctrlCfg.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${getScoreRingColor(score)} ${getScoreTrackColor(score)} bg-white`}
                >
                  <span className={`text-[32px] font-bold ${getScoreColor(score)}`}>{score}</span>
                </div>
                <p className="text-[13px] text-neutral-500">out of 100</p>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </PageShell>
  );
}
