'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  MapPin,
  Upload,
  Users,
  X as XIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeetingData {
  id: string;
  entityType: string;
  title: string;
  description?: string;
  status: string;
  scheduledAt?: string;
  location?: string;
  agendaItems?: Array<{
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    voteTally?: { approve: number; reject: number; abstain: number; total: number };
  }>;
  minutes?: Array<{ id: string; content: string; createdAt: string }>;
  resolutions?: Array<{ id: string; title: string; status: string; createdAt: string }>;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    filePath: string;
    createdAt: string;
  }>;
  votes?: unknown[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEETING_STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'info' | 'default' | 'error' | 'warning'; label: string }
> = {
  scheduled: { variant: 'info', label: 'Scheduled' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const RESOLUTION_STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  pending: { variant: 'default', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' },
  implemented: { variant: 'success', label: 'Implemented' },
  passed: { variant: 'success', label: 'Passed' },
  failed: { variant: 'error', label: 'Failed' },
  tabled: { variant: 'warning', label: 'Tabled' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function GovernanceSkeleton() {
  return (
    <PageShell title="" description="Board Meeting">
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

export default function GovernanceMeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/governance/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch meeting (${res.status})`);
        const json = await res.json();
        setMeeting(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMeeting();
  }, [id]);

  if (loading) return <GovernanceSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Governance item not found</h1>
        <p className="text-[14px] text-neutral-500">
          The meeting or resolution you are looking for does not exist.
        </p>
        <Link href={'/governance' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to governance
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading governance item</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href={'/governance' as never}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to governance
          </Button>
        </Link>
      </div>
    );
  }

  if (!meeting) return null;

  const statusCfg = MEETING_STATUS_CONFIG[meeting.status] || MEETING_STATUS_CONFIG.scheduled;
  const agendaItems = meeting.agendaItems || [];
  const resolutions = meeting.resolutions || [];
  const documents = meeting.documents || [];
  const minutesContent = meeting.minutes?.[0]?.content || null;

  return (
    <PageShell
      title={meeting.title}
      description={meeting.entityType === 'resolution' ? 'Board Resolution' : 'Board Meeting'}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Meeting
          </Button>
        </div>
      }
    >
      <div className="-mt-4 mb-4">
        <Link
          href={'/governance' as never}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to governance
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Meeting Details */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Title" value={meeting.title} />
                </div>
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                {meeting.scheduledAt && (
                  <InfoRow
                    label="Date"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(meeting.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                {meeting.location && (
                  <InfoRow
                    label="Location"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {meeting.location}
                      </span>
                    }
                  />
                )}
                {meeting.description && (
                  <div className="sm:col-span-2">
                    <InfoRow
                      label="Description"
                      value={
                        <p className="leading-relaxed text-neutral-700">{meeting.description}</p>
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agenda */}
          {agendaItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {agendaItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-200/60 text-[13px] font-bold text-neutral-600">
                        {item.sortOrder || idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-neutral-900">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-[12px] text-neutral-500">{item.description}</p>
                        )}
                        {item.voteTally && item.voteTally.total > 0 && (
                          <p className="mt-1 text-[12px] text-neutral-500">
                            Votes: {item.voteTally.approve} for / {item.voteTally.reject} against /{' '}
                            {item.voteTally.abstain} abstain
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Minutes */}
          <Card>
            <CardHeader>
              <CardTitle>Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              {minutesContent ? (
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5">
                  <p className="text-[14px] leading-relaxed whitespace-pre-line text-neutral-700">
                    {minutesContent}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 py-10 text-center">
                  <FileText className="h-8 w-8 text-neutral-300" />
                  <p className="text-[14px] text-neutral-500">Minutes not yet available</p>
                  <Button variant="secondary" size="sm">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Minutes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolutions */}
          {resolutions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resolutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {resolutions.map((res) => {
                    const resCfg =
                      RESOLUTION_STATUS_CONFIG[res.status] || RESOLUTION_STATUS_CONFIG.pending;
                    return (
                      <div
                        key={res.id}
                        className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                      >
                        <span className="text-[14px] font-medium text-neutral-900">
                          {res.title}
                        </span>
                        <Badge variant={resCfg.variant} size="sm" dot>
                          {resCfg.label}
                        </Badge>
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
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Meeting
                </Button>
                <Button variant="secondary" fullWidth>
                  <Upload className="h-4 w-4" />
                  Upload Minutes
                </Button>
                <Button variant="secondary" fullWidth>
                  <Users className="h-4 w-4" />
                  Record Attendance
                </Button>
                <Button variant="danger" fullWidth>
                  <XIcon className="h-4 w-4" />
                  Cancel Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                          <FileText className="text-primary-600 h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-900">{doc.title}</p>
                          <p className="text-[11px] text-neutral-400">{doc.type}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-neutral-400 transition-colors hover:text-neutral-600"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
