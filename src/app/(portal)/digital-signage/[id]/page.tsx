'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Eye,
  Loader2,
  Maximize2,
  Monitor,
  Pause,
  Play,
  Timer,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentType =
  | 'announcement'
  | 'welcome'
  | 'emergency'
  | 'event'
  | 'weather'
  | 'directory'
  | 'text'
  | 'image';
type ContentStatus = 'active' | 'paused' | 'scheduled' | 'expired';

/** Raw shape from GET /api/v1/digital-signage/:id */
interface ApiSignageDetail {
  id: string;
  title: string;
  body: string | null;
  contentType: string;
  zone: string;
  isActive: boolean;
  isCurrentlyActive: boolean;
  startDate: string;
  endDate: string;
  priority: number;
  durationSeconds: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
  createdById: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTENT_TYPE_CONFIG: Record<
  string,
  { variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }
> = {
  announcement: { variant: 'info', label: 'Announcement' },
  welcome: { variant: 'primary', label: 'Welcome' },
  emergency: { variant: 'error', label: 'Emergency' },
  event: { variant: 'warning', label: 'Event' },
  weather: { variant: 'default', label: 'Weather' },
  directory: { variant: 'default', label: 'Directory' },
  text: { variant: 'default', label: 'Text' },
  image: { variant: 'info', label: 'Image' },
};

const PRIORITY_CONFIG: Record<
  string,
  { variant: 'default' | 'info' | 'warning' | 'error'; label: string }
> = {
  low: { variant: 'default', label: 'Low' },
  normal: { variant: 'info', label: 'Normal' },
  high: { variant: 'warning', label: 'High' },
  urgent: { variant: 'error', label: 'Urgent' },
};

function getStatus(raw: ApiSignageDetail): ContentStatus {
  const now = new Date();
  const start = new Date(raw.startDate);
  const end = new Date(raw.endDate);
  if (!raw.isActive) return 'paused';
  if (end < now) return 'expired';
  if (start > now) return 'scheduled';
  return 'active';
}

function getStatusConfig(status: ContentStatus) {
  const map: Record<
    ContentStatus,
    { variant: 'success' | 'warning' | 'info' | 'default'; label: string }
  > = {
    active: { variant: 'success', label: 'Active' },
    paused: { variant: 'warning', label: 'Paused' },
    scheduled: { variant: 'info', label: 'Scheduled' },
    expired: { variant: 'default', label: 'Expired' },
  };
  return map[status];
}

function getPriorityLabel(p: number): string {
  if (p >= 10) return 'urgent';
  if (p >= 5) return 'high';
  if (p >= 1) return 'normal';
  return 'low';
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalSignageDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: content,
    loading,
    error,
    refetch,
  } = useApi<ApiSignageDetail>(`/api/v1/digital-signage/${id}`);

  // Loading
  if (loading) {
    return (
      <PageShell title="Digital Signage Content" description="Loading...">
        <div className="-mt-4 mb-4">
          <Link
            href="/digital-signage"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to digital signage
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading content details...</p>
        </div>
      </PageShell>
    );
  }

  // Error
  if (error || !content) {
    return (
      <PageShell title="Digital Signage Content" description="Error">
        <div className="-mt-4 mb-4">
          <Link
            href="/digital-signage"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to digital signage
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">Failed to load content</p>
          <p className="mt-1 text-[13px] text-neutral-500">{error ?? 'Content not found'}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const typeCfg = CONTENT_TYPE_CONFIG[content.contentType] || CONTENT_TYPE_CONFIG.text!;
  const status = getStatus(content);
  const statusCfg = getStatusConfig(status);
  const priorityKey = getPriorityLabel(content.priority);
  const priorityCfg = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.normal!;
  const daysRemaining = getDaysRemaining(content.endDate);
  const zone = content.zone.charAt(0).toUpperCase() + content.zone.slice(1);

  return (
    <PageShell
      title={content.title}
      description="Digital Signage Content"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Content
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/digital-signage"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to digital signage
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900">
                <div className="max-w-lg px-8 text-center">
                  <p className="text-[20px] leading-relaxed font-semibold text-white">
                    {content.body ?? 'No content body'}
                  </p>
                </div>
                {status === 'active' && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="success" size="sm" dot>
                      LIVE
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Name"
                    value={<span className="text-[16px] font-semibold">{content.title}</span>}
                  />
                </div>
                <InfoRow
                  label="Type"
                  value={
                    <Badge variant={typeCfg.variant} size="lg">
                      {typeCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Screen Zone"
                  value={
                    <Badge variant="default" size="lg">
                      {zone}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Priority"
                  value={
                    <Badge variant={priorityCfg.variant} size="lg" dot>
                      {priorityCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Rotation Duration"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5 text-neutral-400" />
                      {content.durationSeconds} seconds
                    </span>
                  }
                />
                {content.body && (
                  <div className="sm:col-span-2">
                    <InfoRow
                      label="Content"
                      value={<p className="leading-relaxed text-neutral-700">{content.body}</p>}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Start Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(content.startDate)}
                    </span>
                  }
                />
                <InfoRow
                  label="End Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {formatDate(content.endDate)}
                    </span>
                  }
                />
                <InfoRow
                  label="Days Remaining"
                  value={
                    <span className="text-[16px] font-bold text-neutral-900">
                      {daysRemaining} days
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${status === 'active' ? 'bg-success-50' : status === 'paused' ? 'bg-warning-50' : 'bg-neutral-100'}`}
                >
                  {status === 'active' ? (
                    <Play className="text-success-600 h-7 w-7" />
                  ) : status === 'paused' ? (
                    <Pause className="text-warning-600 h-7 w-7" />
                  ) : (
                    <Clock className="h-7 w-7 text-neutral-400" />
                  )}
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] text-neutral-500">Displaying on {zone} screen</p>
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
                <Button variant="secondary" fullWidth>
                  {content.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {content.isActive ? 'Pause Content' : 'Activate Content'}
                </Button>
                <Button variant="secondary" fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Content
                </Button>
                <Button variant="secondary" fullWidth>
                  <Calendar className="h-4 w-4" />
                  Extend Schedule
                </Button>
                <Button variant="secondary" fullWidth>
                  <Maximize2 className="h-4 w-4" />
                  Preview Full Screen
                </Button>
                <Button variant="danger" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Delete Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
