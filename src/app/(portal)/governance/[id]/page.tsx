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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiRequest } from '@/lib/hooks/use-api';

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
  const { confirm, flash, ConfirmHost } = useConfirmDialog();
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    scheduledAt: '',
    location: '',
    description: '',
  });
  const [minutesContent, setMinutesContent] = useState('');

  async function fetchMeeting() {
    try {
      setLoading(true);
      const res = await apiRequest(`/api/v1/governance/${id}`, { method: 'GET' });
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

  useEffect(() => {
    if (id) fetchMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openEdit() {
    if (!meeting) return;
    // input[type=datetime-local] needs YYYY-MM-DDTHH:MM (no Z). Slice the
    // ISO string down so the picker shows the current value.
    setEditForm({
      title: meeting.title ?? '',
      scheduledAt: meeting.scheduledAt ? meeting.scheduledAt.slice(0, 16) : '',
      location: meeting.location ?? '',
      description: (meeting.description as string | undefined) ?? '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        entityType: 'meeting',
        title: editForm.title.trim(),
        location: editForm.location.trim(),
      };
      if (editForm.description.trim()) payload.description = editForm.description.trim();
      // Convert datetime-local back to an ISO string so the schema's
      // .datetime() validator accepts it.
      if (editForm.scheduledAt) {
        payload.scheduledAt = new Date(editForm.scheduledAt).toISOString();
      }
      const res = await apiRequest(`/api/v1/governance/${id}`, { method: 'PATCH', body: payload });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        flash('err', data?.message ?? 'Could not save changes. Try again.');
        return;
      }
      flash('ok', 'Meeting updated.');
      setEditOpen(false);
      fetchMeeting();
    } catch {
      flash('err', 'Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMinutes() {
    const content = minutesContent.trim();
    if (content.length < 10) {
      flash('err', 'Minutes need at least 10 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest(`/api/v1/governance/${id}`, {
        method: 'PATCH',
        body: { entityType: 'meeting', minutes: { content } },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        flash('err', data?.message ?? 'Could not save minutes. Try again.');
        return;
      }
      flash('ok', 'Minutes saved.');
      setMinutesOpen(false);
      setMinutesContent('');
      fetchMeeting();
    } catch {
      flash('err', 'Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function cancelMeeting() {
    setSaving(true);
    try {
      const res = await apiRequest(`/api/v1/governance/${id}`, {
        method: 'PATCH',
        body: { entityType: 'meeting', status: 'cancelled' },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        flash('err', data?.message ?? 'Could not cancel the meeting. Try again.');
        return;
      }
      flash('ok', 'Meeting cancelled.');
      fetchMeeting();
    } catch {
      flash('err', 'Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GovernanceSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <FileText className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[24px] font-bold text-neutral-900">Governance item not found</h1>
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
        <h1 className="text-[24px] font-bold text-neutral-900">Error loading governance item</h1>
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

  const statusCfg = MEETING_STATUS_CONFIG[meeting.status] ?? {
    variant: 'info' as const,
    label: 'Scheduled',
  };
  const agendaItems = meeting.agendaItems || [];
  const resolutions = meeting.resolutions || [];
  const documents = meeting.documents || [];
  const existingMinutes = meeting.minutes?.[0]?.content || null;

  return (
    <PageShell
      title={meeting.title}
      description={meeting.entityType === 'resolution' ? 'Board Resolution' : 'Board Meeting'}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={saving || meeting.status === 'cancelled' || meeting.status === 'completed'}
            onClick={openEdit}
          >
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
              {existingMinutes ? (
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5">
                  <p className="text-[14px] leading-relaxed whitespace-pre-line text-neutral-700">
                    {existingMinutes}
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
                    const resCfg = RESOLUTION_STATUS_CONFIG[res.status] ?? {
                      variant: 'default' as const,
                      label: 'Pending',
                    };
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
                {meeting.status === 'cancelled' ? (
                  <p className="text-[13px] text-neutral-500">
                    This meeting was cancelled. No further actions are available.
                  </p>
                ) : meeting.status === 'completed' ? (
                  <p className="text-[13px] text-neutral-500">
                    This meeting is closed. You can still upload minutes for the official record.
                  </p>
                ) : null}
                <Button
                  fullWidth
                  disabled={
                    saving || meeting.status === 'cancelled' || meeting.status === 'completed'
                  }
                  onClick={openEdit}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Meeting
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={saving || meeting.status === 'cancelled'}
                  onClick={() => {
                    setMinutesContent(minutesContent || (meeting.minutes?.[0]?.content ?? ''));
                    setMinutesOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {minutesContent.length > 0 || meeting.minutes?.length
                    ? 'Update minutes'
                    : 'Upload minutes'}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled
                  title="Per-attendee tracking is coming next release — for now, include the attendee list at the top of the minutes."
                >
                  <Users className="h-4 w-4" />
                  Record Attendance
                </Button>
                {meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
                  <Button
                    variant="danger"
                    fullWidth
                    disabled={saving}
                    onClick={() =>
                      confirm({
                        title: `Cancel ${meeting.title}?`,
                        body: `Residents who saw the agenda will see this meeting marked cancelled. You can't un-cancel — schedule a new meeting if it gets re-set.`,
                        confirmLabel: 'Cancel meeting',
                        cancelLabel: 'Keep meeting',
                        destructive: true,
                        run: cancelMeeting,
                      })
                    }
                  >
                    <XIcon className="h-4 w-4" />
                    Cancel meeting
                  </Button>
                )}
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

      {/* Edit meeting dialog — board secretary edits title/time/location/agenda
          notes. Most common edit is moving the time after a conflict surfaces. */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>
            Update what changed. Residents who already saw the agenda will see the new details next
            time they open the meeting.
          </DialogDescription>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveEdit();
            }}
          >
            <Input
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
              disabled={saving}
              maxLength={200}
              required
            />
            <Input
              label="When"
              type="datetime-local"
              value={editForm.scheduledAt}
              onChange={(e) => setEditForm((s) => ({ ...s, scheduledAt: e.target.value }))}
              disabled={saving}
            />
            <Input
              label="Location"
              value={editForm.location}
              onChange={(e) => setEditForm((s) => ({ ...s, location: e.target.value }))}
              placeholder="e.g. Conference Room A, 7th Floor or Zoom link"
              disabled={saving}
              maxLength={200}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                Notes / agenda summary
              </label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                disabled={saving}
                maxLength={5000}
                placeholder="Quick summary of what the board will cover."
                className="focus:border-primary-300 focus:ring-primary-100 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:bg-neutral-50"
              />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !editForm.title.trim()}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload minutes dialog — paste from a Word doc or type fresh.
          Markdown is fine. Required min 10 chars so the API accepts it. */}
      <Dialog open={minutesOpen} onOpenChange={(open) => !saving && setMinutesOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{meeting.minutes?.length ? 'Update minutes' : 'Upload minutes'}</DialogTitle>
          <DialogDescription>
            Paste from Word or type fresh. Markdown formatting is supported. Include the attendee
            list at the top until per-attendee tracking ships.
          </DialogDescription>
          <div className="mt-4 flex flex-col gap-2">
            <textarea
              autoFocus
              rows={12}
              value={minutesContent}
              onChange={(e) => setMinutesContent(e.target.value)}
              disabled={saving}
              maxLength={50000}
              placeholder={`Attendees: Sarah Chen, David Patel, ...\n\n1. Call to order — 7:02 PM\n2. Approval of previous minutes — passed\n3. New business: ...`}
              className="focus:border-primary-300 focus:ring-primary-100 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:bg-neutral-50"
            />
            <p className="text-[12px] text-neutral-400">
              {minutesContent.trim().length}/50,000 characters
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => setMinutesOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || minutesContent.trim().length < 10}
              onClick={() => void saveMinutes()}
            >
              {saving ? 'Saving…' : 'Save minutes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmHost />
    </PageShell>
  );
}
