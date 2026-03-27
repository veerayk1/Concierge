'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Printer,
  Shield,
  ShieldAlert,
  Siren,
  User,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAccessToken } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncidentUpdate {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
  statusChange?: { from: string; to: string };
}

interface IncidentData {
  id: string;
  referenceNumber?: string;
  title?: string;
  type?: string;
  description?: string;
  status?: string;
  priority?: string;
  location?: string;
  createdAt?: string;
  closedAt?: string | null;
  unit?: { id: string; number: string } | null;
  eventType?: { id: string; name: string; icon: string | null; color: string | null } | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUpdateIcon(action: string) {
  switch (action) {
    case 'created':
      return <ShieldAlert className="text-error-600 h-4 w-4" />;
    case 'status_change':
      return <ArrowUpRight className="text-info-600 h-4 w-4" />;
    case 'update':
      return <MessageSquare className="text-warning-600 h-4 w-4" />;
    case 'resolved':
      return <CheckCircle2 className="text-success-600 h-4 w-4" />;
    case 'escalated':
      return <AlertTriangle className="text-error-600 h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4 text-neutral-400" />;
  }
}

const statusMap: Record<
  string,
  { variant: 'warning' | 'info' | 'success' | 'default'; label: string }
> = {
  open: { variant: 'warning', label: 'Open' },
  investigating: { variant: 'info', label: 'Investigating' },
  resolved: { variant: 'success', label: 'Resolved' },
  closed: { variant: 'default', label: 'Closed' },
};

const priorityMap: Record<string, 'default' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function IncidentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchIncident() {
      try {
        setLoading(true);
        const token = getAccessToken();
        const res = await fetch(`/api/v1/events/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch incident (${res.status})`);
        }
        const json = await res.json();
        setIncident(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchIncident();
  }, [id]);

  if (loading) return <IncidentSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Incident not found</h1>
        <p className="text-[14px] text-neutral-500">
          The incident you are looking for does not exist or has been removed.
        </p>
        <Link href="/security">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to security
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading incident</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href="/security">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to security
          </Button>
        </Link>
      </div>
    );
  }

  if (!incident) return null;

  const status = statusMap[incident.status || 'open'] ?? {
    variant: 'warning' as const,
    label: 'Open',
  };
  const priority = incident.priority || 'medium';
  const priorityVariant = priorityMap[priority] ?? ('default' as const);
  const refNumber = incident.referenceNumber || `EVT-${incident.id?.slice(0, 8)}`;
  const typeName = incident.eventType?.name || incident.type || 'Incident';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to security
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Incident {refNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            <Badge variant={priorityVariant} size="lg" dot>
              {priority} urgency
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" size="sm">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Incident Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Incident Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Title
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {incident.title || 'Untitled Incident'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Type
                  </p>
                  <p className="mt-1">
                    <Badge variant="default" size="md">
                      {typeName}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Occurred
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {incident.createdAt
                      ? new Date(incident.createdAt).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '\u2014'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {incident.location || String((incident.customFields as Record<string, unknown>)?.location || '') || '\u2014'}
                  </p>
                </div>
                {incident.unit && (
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Related Unit
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-900">Unit {incident.unit.number}</p>
                  </div>
                )}
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Priority
                  </p>
                  <p className="mt-1">
                    <Badge variant={priorityVariant} size="md" dot>
                      {priority}
                    </Badge>
                  </p>
                </div>
                {incident.description && (
                  <div className="col-span-2">
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Description
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                      {incident.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="danger" fullWidth size="lg">
                  <AlertTriangle className="h-4 w-4" />
                  Escalate
                </Button>
                <Button variant="secondary" fullWidth>
                  <MessageSquare className="h-4 w-4" />
                  Add Update
                </Button>
                <Button variant="secondary" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Close Incident
                </Button>
                <Button variant="secondary" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Status</h2>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Current Status
                  </p>
                  <p className="mt-1">
                    <Badge variant={status.variant} size="lg" dot>
                      {status.label}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Items */}
          {incident.unit && (
            <Card>
              <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Linked Items</h2>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Link href={`/units/${incident.unit.number}`}>
                    <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-colors hover:bg-neutral-50">
                      <div>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Related Unit
                        </p>
                        <p className="text-primary-600 mt-0.5 text-[13px] font-semibold">
                          Unit {incident.unit.number}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Resolution</h2>
            <CardContent>
              {incident.closedAt ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Resolved At
                    </p>
                    <p className="mt-1 text-[14px] text-neutral-900">
                      {new Date(incident.closedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-8 text-center">
                  <Clock className="mb-2 h-5 w-5 text-neutral-300" />
                  <p className="text-[13px] text-neutral-400">Incident not yet resolved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
