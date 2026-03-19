'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Play,
  CheckCircle2,
  Printer,
  CalendarPlus,
  ClipboardCheck,
  MapPin,
  Camera,
  Link2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectionItem {
  id: string;
  name?: string;
  text?: string;
  type: string;
  required: boolean;
  passed: boolean | null;
  completedAt: string | null;
  notes: string | null;
}

interface InspectionReport {
  totalItems: number;
  passedItems: number;
  failedItems: number;
  passRate: number;
  overallResult: string;
}

interface InspectionData {
  id: string;
  title: string;
  category?: string;
  status: string;
  priority?: string;
  inspectorId?: string;
  location?: string;
  scheduledAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  notes?: string | null;
  items: InspectionItem[];
  report: InspectionReport;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const STATUS_BADGE_VARIANT: Record<
  string,
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  failed: 'error',
  overdue: 'error',
  cancelled: 'default',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
const PRIORITY_BADGE_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InspectionSkeleton() {
  return (
    <PageShell title="" description="">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchInspection() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/inspections/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch inspection (${res.status})`);
        const json = await res.json();
        setInspection(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchInspection();
  }, [id]);

  if (loading) return <InspectionSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ClipboardCheck className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Inspection not found</h1>
        <p className="text-[14px] text-neutral-500">
          The inspection you are looking for does not exist or has been removed.
        </p>
        <Button variant="secondary" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Inspections
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading inspection</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Inspections
        </Button>
      </div>
    );
  }

  if (!inspection) return null;

  const report = inspection.report;
  const progressPercent = report.totalItems > 0 ? report.passRate : 0;
  const completedItems = report.passedItems + report.failedItems;
  const priority = inspection.priority || 'medium';

  return (
    <PageShell
      title={inspection.title}
      description={
        inspection.scheduledAt
          ? `Inspection scheduled for ${formatDateTime(inspection.scheduledAt)}`
          : 'Inspection'
      }
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Inspections
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Inspection Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Title
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-neutral-900">
                    {inspection.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Category
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="default">{inspection.category || 'General'}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Priority
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={PRIORITY_BADGE_VARIANT[priority] || 'default'} dot>
                      {PRIORITY_LABELS[priority] || priority}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={STATUS_BADGE_VARIANT[inspection.status] || 'default'} dot>
                      {STATUS_LABELS[inspection.status] || inspection.status}
                    </Badge>
                  </dd>
                </div>
                {inspection.location && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Location
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">{inspection.location}</dd>
                  </div>
                )}
                {inspection.scheduledAt && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Scheduled Date
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">
                      {formatDateTime(inspection.scheduledAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Checklist */}
          {inspection.items.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <Badge variant="info" size="sm">
                  {completedItems}/{report.totalItems} completed
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {inspection.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 px-4 py-3 transition-colors hover:bg-neutral-50/50"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.completedAt ? (
                          <CheckCircle2 className="text-success-500 h-5 w-5" />
                        ) : (
                          <div className="h-4 w-4 rounded border-2 border-neutral-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-[14px] ${item.completedAt ? 'text-neutral-900' : 'text-neutral-500'}`}
                        >
                          {item.name || item.text || item.type}
                        </p>
                        {item.notes && (
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      {item.passed !== null && (
                        <Badge variant={item.passed ? 'success' : 'error'} size="sm">
                          {item.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Findings */}
          {report.failedItems > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Findings</CardTitle>
                <Badge variant="warning" size="sm">
                  {report.failedItems} findings
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {inspection.items
                    .filter((i) => i.passed === false)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl border border-neutral-100 px-4 py-3"
                      >
                        <AlertTriangle className="text-error-500 mt-0.5 h-4 w-4 shrink-0" />
                        <div className="flex-1">
                          <Badge variant="error" size="sm">
                            Failed
                          </Badge>
                          <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
                            {item.name || item.text || item.type}
                            {item.notes ? ` \u2014 ${item.notes}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* GPS */}
          {inspection.gpsLatitude && inspection.gpsLongitude && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>GPS Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Latitude
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="font-mono text-[14px] text-neutral-900">
                        {inspection.gpsLatitude}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Longitude
                    </dt>
                    <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                      {inspection.gpsLongitude}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card padding="md" className="flex flex-col items-center gap-4 text-center">
            <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
              Progress
            </p>
            <Badge variant={STATUS_BADGE_VARIANT[inspection.status] || 'default'} size="lg" dot>
              {STATUS_LABELS[inspection.status] || inspection.status}
            </Badge>
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-[12px] text-neutral-500">
                <span>
                  {completedItems} of {report.totalItems} items
                </span>
                <span className="font-semibold text-neutral-900">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100
                      ? 'bg-success-500'
                      : progressPercent >= 50
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="sm" fullWidth>
                  <Play className="h-4 w-4" />
                  Start Inspection
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
