'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  Clock,
  Download,
  Edit2,
  MapPin,
  MessageSquare,
  Tag,
  User,
  Users,
  X as XIcon,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
type RsvpStatus = 'attending' | 'maybe' | 'declined';

interface Rsvp {
  id: string;
  name: string;
  unit: string;
  status: RsvpStatus;
  rsvpDate: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  organizer: string;
  status: EventStatus;
  capacity: number | null;
  attendingCount: number;
  maybeCount: number;
  declinedCount: number;
  rsvps: Rsvp[];
  comments: Comment[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  upcoming: { variant: 'info', label: 'Upcoming' },
  in_progress: { variant: 'success', label: 'In Progress' },
  completed: { variant: 'default', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const RSVP_STATUS_CONFIG: Record<
  RsvpStatus,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  attending: { variant: 'success', label: 'Attending' },
  maybe: { variant: 'warning', label: 'Maybe' },
  declined: { variant: 'error', label: 'Declined' },
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
// Skeleton Loader
// ---------------------------------------------------------------------------

function EventDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 rounded bg-neutral-200" />
        <div className="h-8 w-72 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-36 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: event,
    loading,
    error,
  } = useApi<CommunityEvent>(apiUrl(`/api/v1/events/${id}`, { propertyId: DEMO_PROPERTY_ID }));

  // -- Loading State --
  if (loading) {
    return <EventDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Event Not Found' : 'Failed to Load Event'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/events">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Calendar className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Event Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The event you are looking for does not exist or has been removed.
        </p>
        <Link href="/events">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = EVENT_STATUS_CONFIG[event.status] ?? EVENT_STATUS_CONFIG.upcoming;
  const rsvps = event.rsvps ?? [];
  const comments = event.comments ?? [];

  const rsvpColumns: Column<Rsvp>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[13px] font-semibold text-neutral-900">{row.name}</span>,
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => <span className="text-[13px] font-medium text-neutral-700">{row.unit}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = RSVP_STATUS_CONFIG[row.status];
        return (
          <Badge variant={cfg?.variant ?? 'default'} size="sm" dot>
            {cfg?.label ?? row.status}
          </Badge>
        );
      },
    },
    {
      id: 'rsvpDate',
      header: 'RSVP Date',
      accessorKey: 'rsvpDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.rsvpDate).toLocaleDateString('en-US', {
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
      title={event.title}
      description="Community Event"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Event
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Title" value={event.title} />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={<p className="leading-relaxed text-neutral-700">{event.description}</p>}
                  />
                </div>
                <InfoRow
                  label="Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
                <InfoRow
                  label="Time"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {event.startTime} &ndash; {event.endTime}
                    </span>
                  }
                />
                <InfoRow
                  label="Location"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {event.location}
                    </span>
                  }
                />
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant="primary" size="lg">
                      {event.category}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Organizer"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {event.organizer}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* RSVP List */}
          <Card>
            <CardHeader>
              <CardTitle>RSVP List</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={rsvpColumns}
                data={rsvps}
                emptyMessage="No RSVPs yet."
                emptyIcon={<Users className="h-6 w-6" />}
                compact
              />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                <CardTitle>Comments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <User className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {c.author}
                          </span>
                          <span className="text-[12px] text-neutral-400">
                            {new Date(c.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] text-neutral-700">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No comments yet.</p>
              )}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-[14px] placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                />
                <Button size="sm">Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    statusCfg.variant === 'success'
                      ? 'bg-success-50'
                      : statusCfg.variant === 'error'
                        ? 'bg-error-50'
                        : statusCfg.variant === 'info'
                          ? 'bg-info-50'
                          : 'bg-neutral-100'
                  }`}
                >
                  <Calendar
                    className={`h-8 w-8 ${
                      statusCfg.variant === 'success'
                        ? 'text-success-600'
                        : statusCfg.variant === 'error'
                          ? 'text-error-600'
                          : statusCfg.variant === 'info'
                            ? 'text-info-600'
                            : 'text-neutral-400'
                    }`}
                  />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] text-neutral-500">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Attending',
                    count: event.attendingCount ?? 0,
                    color: 'text-success-600',
                    bg: 'bg-success-50',
                  },
                  {
                    label: 'Maybe',
                    count: event.maybeCount ?? 0,
                    color: 'text-warning-600',
                    bg: 'bg-warning-50',
                  },
                  {
                    label: 'Declined',
                    count: event.declinedCount ?? 0,
                    color: 'text-error-600',
                    bg: 'bg-error-50',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-600">{item.label}</span>
                    <span className={`text-[15px] font-bold ${item.color}`}>{item.count}</span>
                  </div>
                ))}
                <div className="mt-1 border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-neutral-700">Capacity</span>
                    <span className="text-[15px] font-bold text-neutral-900">
                      {event.capacity
                        ? `${event.attendingCount ?? 0} / ${event.capacity}`
                        : 'Unlimited'}
                    </span>
                  </div>
                  {event.capacity && (
                    <div className="mt-2 h-2 rounded-full bg-neutral-100">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((event.attendingCount ?? 0) / event.capacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
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
                  <Edit2 className="h-4 w-4" />
                  Edit Event
                </Button>
                <Button variant="secondary" fullWidth>
                  <XIcon className="h-4 w-4" />
                  Cancel Event
                </Button>
                <Button variant="secondary" fullWidth>
                  <Bell className="h-4 w-4" />
                  Send Reminder
                </Button>
                <Button variant="secondary" fullWidth>
                  <Download className="h-4 w-4" />
                  Export RSVP List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photo Gallery Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                  <Camera className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-[13px] text-neutral-500">
                  Photos will be available after the event
                </p>
                <Button variant="secondary" size="sm">
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
