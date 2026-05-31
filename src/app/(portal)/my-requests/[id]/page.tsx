'use client';

/**
 * Resident maintenance request detail.
 *
 * Read-only view of one of the resident's own requests — title, body,
 * status, priority, the comment thread (non-internal only), and any
 * attachments the resident uploaded when they filed it. This is the
 * page the resident reaches by clicking a row in /my-requests.
 *
 * Deliberately separate from the staff /maintenance/[id] page, which
 * exposes assignment, internal notes, SLA timers, vendor compliance,
 * and other admin surfaces a resident should never see.
 */

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ImageIcon,
  Paperclip,
  Wrench,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { formatTimestamp } from '@/lib/format';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface MaintenanceComment {
  id: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
}

interface MaintenanceAttachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface MyRequestDetail {
  id: string;
  referenceNumber: string;
  title: string | null;
  description: string;
  status: string;
  priority: string;
  permissionToEnter: string;
  entryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  completedDate: string | null;
  unitNumber: string | null;
  category: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  employee: { id: string; firstName: string; lastName: string } | null;
  comments: MaintenanceComment[];
  attachments: MaintenanceAttachment[];
}

const STATUS_LABEL: Record<string, { label: string; tone: 'warning' | 'primary' | 'success' }> = {
  open: { label: 'Open', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'primary' },
  on_hold: { label: 'On hold', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Resolved', tone: 'success' },
  completed: { label: 'Resolved', tone: 'success' },
};

const PRIORITY_LABEL: Record<string, { label: string; tone: 'default' | 'warning' | 'error' }> = {
  low: { label: 'Low', tone: 'default' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'error' },
  urgent: { label: 'Urgent', tone: 'error' },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return formatTimestamp(iso);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: response,
    loading,
    error,
  } = useApi<{ data?: MyRequestDetail } | MyRequestDetail>(
    apiUrl(`/api/v1/resident/maintenance/${id}`, { propertyId: getPropertyId() }),
  );

  const detail = useMemo<MyRequestDetail | null>(() => {
    if (!response) return null;
    const raw = (response as { data?: MyRequestDetail }).data ?? (response as MyRequestDetail);
    if (!raw || typeof raw !== 'object' || !('id' in raw)) return null;
    return raw;
  }, [response]);

  if (loading) {
    return (
      <PageShell hero="emerald" title="My Requests" description="Loading…">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !detail) {
    return (
      <PageShell hero="emerald" title="My Requests">
        <EmptyState
          tone="emerald"
          icon={<Wrench className="h-6 w-6" />}
          title="We couldn't find that request."
          description="It may have been removed, or the link points to a different unit."
          action={
            <Link href="/my-requests">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to my requests
              </Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const statusCfg = STATUS_LABEL[detail.status] ?? {
    label: detail.status,
    tone: 'primary' as const,
  };
  const priorityCfg =
    detail.priority && detail.priority !== 'normal' ? PRIORITY_LABEL[detail.priority] : null;
  const isResolved =
    detail.status === 'resolved' || detail.status === 'closed' || detail.status === 'completed';

  return (
    <PageShell hero="emerald" title={detail.title || 'Maintenance request'}>
      <div className="-mt-2 mb-2">
        <Link
          href="/my-requests"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to my requests
        </Link>
      </div>

      {/* Status banner — green for resolved, soft sky for in-progress,
          warm amber for open. Gives the resident a one-glance read of
          where their request stands without scanning the whole page. */}
      <section
        className={`relative mb-6 overflow-hidden rounded-2xl border px-5 py-4 ${
          isResolved
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50'
            : detail.status === 'in_progress'
              ? 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50'
              : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                  : detail.status === 'in_progress'
                    ? 'bg-sky-100 text-sky-700 ring-sky-200'
                    : 'bg-amber-100 text-amber-700 ring-amber-200'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : detail.status === 'in_progress' ? (
                <Wrench className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                {isResolved
                  ? 'Resolved'
                  : detail.status === 'in_progress'
                    ? 'Being worked on'
                    : 'Open'}
              </p>
              <p className="text-[14px] font-medium text-neutral-800">
                {isResolved
                  ? `Completed ${formatDateTime(detail.completedDate || detail.updatedAt)}`
                  : `Submitted ${formatDateTime(detail.createdAt)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {priorityCfg && (
              <Badge variant={priorityCfg.tone} size="md" dot>
                {priorityCfg.label}
              </Badge>
            )}
            <Badge variant={statusCfg.tone} size="md" dot>
              {statusCfg.label}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* What you reported */}
        <Card className="xl:col-span-2">
          <h2 className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
            What you reported
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap text-neutral-800">
            {detail.description || <span className="text-neutral-400 italic">No description.</span>}
          </p>

          {detail.permissionToEnter === 'yes' && (
            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
              <p className="text-[12px] font-semibold tracking-wide text-sky-800 uppercase">
                Permission to enter
              </p>
              <p className="mt-1 text-[13.5px] text-neutral-700">
                You let staff enter the unit when you're not home.
              </p>
              {detail.entryInstructions && (
                <p className="mt-1.5 text-[13px] text-neutral-600 italic">
                  "{detail.entryInstructions}"
                </p>
              )}
            </div>
          )}

          {detail.attachments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
                Attachments
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detail.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.fileUrl ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 transition-all hover:-translate-y-px hover:border-neutral-300 hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                      {a.contentType.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-neutral-800">
                        {a.fileName}
                      </p>
                      <p className="text-[11.5px] text-neutral-500">
                        {formatBytes(a.fileSizeBytes)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Right column — details + activity */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
              Details
            </h2>
            <dl className="mt-3 flex flex-col gap-3 text-[13.5px]">
              {detail.category && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-neutral-500">Category</dt>
                  <dd className="font-medium text-neutral-800">{detail.category.name}</dd>
                </div>
              )}
              {detail.unitNumber && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-neutral-500">Unit</dt>
                  <dd className="font-medium text-neutral-800">{detail.unitNumber}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-500">Submitted</dt>
                <dd className="text-right font-medium text-neutral-800">
                  {formatDateTime(detail.createdAt)}
                </dd>
              </div>
              {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-neutral-500">Last updated</dt>
                  <dd className="text-right font-medium text-neutral-800">
                    {formatDateTime(detail.updatedAt)}
                  </dd>
                </div>
              )}
              {detail.completedDate && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-neutral-500">Completed</dt>
                  <dd className="text-right font-medium text-neutral-800">
                    {formatDateTime(detail.completedDate)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {detail.comments.length > 0 && (
            <Card>
              <h2 className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
                Updates from the desk
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {detail.comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-3"
                  >
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-neutral-800">
                      {c.comment}
                    </p>
                    <p className="mt-1.5 text-[11.5px] text-neutral-500">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Staff'} ·{' '}
                      {formatDateTime(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {detail.comments.length === 0 && !isResolved && (
            <Card className="border-dashed">
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.8} />
                <p className="text-[14px] font-medium text-neutral-800">
                  No updates yet — staff will post here when they pick this up.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
