'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Edit2,
  Eye,
  Mail,
  Monitor,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnouncementDetail {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  category: string;
  channels: string[];
  author: string;
  publishedAt: string;
  createdAt: string;
  audience: {
    type: string;
    label: string;
    count: number;
  };
  deliveryStats: {
    totalSent: number;
    delivered: number;
    opened: number;
    clickRate: number;
  };
  viewCount: number;
}

interface DeliveryRecord {
  id: string;
  channel: string;
  status: string;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  recipientName: string | null;
  recipientEmail: string | null;
}

interface DeliveriesResponse {
  summary: { total: number; sent: number; failed: number; pending: number };
  channelBreakdown: { channel: string; status: string; count: number }[];
  deliveries: DeliveryRecord[];
}

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: Smartphone,
  push: Bell,
  lobby: Monitor,
};

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function AnnouncementDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="h-7 w-80 rounded bg-neutral-200" />
        <div className="h-4 w-56 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-64 rounded-xl bg-neutral-100 xl:col-span-2" />
        <div className="flex flex-col gap-6">
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-28 rounded-xl bg-neutral-100" />
          <div className="h-36 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: announcement,
    loading,
    error,
    refetch,
  } = useApi<AnnouncementDetail>(
    apiUrl(`/api/v1/announcements/${id}`, { propertyId: getPropertyId() }),
  );

  // Fetch delivery records for the failure tracking section (GAP 9.3)
  const { data: deliveriesData } = useApi<DeliveriesResponse>(
    id ? `/api/v1/announcements/${id}/deliveries` : null,
  );

  // -- Action Handlers --

  const handleEdit = () => {
    alert('Edit Announcement is coming soon.');
  };

  const handleResend = async () => {
    if (!confirm('Are you sure you want to resend this announcement?')) return;
    try {
      const res = await apiRequest(
        apiUrl(`/api/v1/announcements/${id}/resend`, { propertyId: getPropertyId() }),
        { method: 'POST' },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message || `Failed to resend (${res.status})`);
        return;
      }
      alert('Announcement resent.');
      await refetch();
    } catch {
      alert('Network error. Please try again.');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this announcement?')) return;
    try {
      const res = await apiRequest(
        apiUrl(`/api/v1/announcements/${id}`, { propertyId: getPropertyId() }),
        { method: 'PATCH', body: { status: 'archived' } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message || `Failed to archive (${res.status})`);
        return;
      }
      await refetch();
    } catch {
      alert('Network error. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (
      !confirm('Are you sure you want to delete this announcement? This action cannot be undone.')
    )
      return;
    try {
      const res = await apiRequest(
        apiUrl(`/api/v1/announcements/${id}`, { propertyId: getPropertyId() }),
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message || `Failed to delete (${res.status})`);
        return;
      }
      router.push('/announcements');
    } catch {
      alert('Network error. Please try again.');
    }
  };

  // -- Loading State --
  if (loading) {
    return <AnnouncementDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Announcement Not Found' : 'Failed to Load Announcement'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/announcements">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to announcements
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Bell className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Announcement Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The announcement you are looking for does not exist or has been removed.
        </p>
        <Link href="/announcements">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to announcements
          </Button>
        </Link>
      </div>
    );
  }

  const channels = announcement.channels ?? [];
  const audience = announcement.audience ?? {
    type: 'all_residents',
    label: 'All Residents',
    count: 0,
  };
  const deliveryStats = announcement.deliveryStats ?? {
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clickRate: 0,
  };

  const failedDeliveries = (deliveriesData?.deliveries ?? []).filter(
    (d) => d.status === 'failed' || d.status === 'bounced',
  );
  const failedCount = deliveriesData?.summary.failed ?? 0;

  const statusVariant =
    announcement.status === 'published'
      ? 'success'
      : announcement.status === 'draft'
        ? 'default'
        : 'warning';
  const priorityVariant =
    announcement.priority === 'important'
      ? 'warning'
      : announcement.priority === 'urgent'
        ? 'error'
        : 'default';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to announcements
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              {announcement.title}
            </h1>
            <Badge variant={statusVariant} size="lg" dot>
              {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
            </Badge>
            {announcement.priority && announcement.priority !== 'normal' && (
              <Badge variant={priorityVariant} size="lg" dot>
                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-[14px] text-neutral-500">
            By {announcement.author} &middot;{' '}
            {announcement.publishedAt
              ? new Date(announcement.publishedAt).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Draft'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleEdit}>
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={handleResend}>
            <RefreshCw className="h-4 w-4" />
            Resend
          </Button>
          <Button variant="secondary" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
            Archive
          </Button>
          <Button variant="ghost" size="sm" className="text-error-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delivery failure banner (GAP 9.3) */}
      {failedCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span className="text-[14px] font-medium text-red-700">
            {failedCount} delivery failure{failedCount !== 1 ? 's' : ''} — see the Non-Delivered
            list below
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column — Content */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent>
              <div className="prose prose-neutral max-w-none">
                {announcement.body.split('\n').map((p, i) =>
                  p ? (
                    <p key={i} className="text-[15px] leading-relaxed text-neutral-700">
                      {p}
                    </p>
                  ) : (
                    <br key={i} />
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column -- Metadata */}
        <div className="flex flex-col gap-6">
          {/* Metadata */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Details</h2>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Published
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">
                    {announcement.publishedAt
                      ? new Date(announcement.publishedAt).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Not yet published'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Author
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{announcement.author}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <p className="mt-1">
                    <Badge variant="primary" size="md">
                      {announcement.category}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Priority
                  </p>
                  <p className="mt-1">
                    <Badge variant={priorityVariant} size="md" dot>
                      {announcement.priority}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Distribution Channels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((ch) => {
                      const Icon = channelIcons[ch] || Send;
                      return (
                        <Badge key={ch} variant="info" size="md">
                          <Icon className="h-3 w-3" />
                          {ch}
                        </Badge>
                      );
                    })}
                    {channels.length === 0 && (
                      <span className="text-[13px] text-neutral-400">No channels configured</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Audience</h2>
            </div>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">{audience.label}</p>
                  <p className="text-[13px] text-neutral-500">{audience.count} recipients</p>
                </div>
                <Badge variant="primary" size="sm">
                  {audience.type === 'all_residents' ? 'All' : 'Targeted'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Stats */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Delivery Stats</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Send className="h-4 w-4 text-neutral-400" />
                    Total Sent
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">
                    {deliveryStats.totalSent}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    Delivered
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {deliveryStats.delivered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Eye className="h-4 w-4 text-neutral-400" />
                    Opened
                  </span>
                  <span className="text-success-700 text-[14px] font-medium">
                    {deliveryStats.opened}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <BarChart3 className="h-4 w-4 text-neutral-400" />
                    Click Rate
                  </span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {deliveryStats.clickRate}%
                  </span>
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <span className="flex items-center gap-2 text-[14px] text-red-600">
                      <XCircle className="h-4 w-4" />
                      Failed
                    </span>
                    <span className="text-[14px] font-semibold text-red-700">{failedCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Non-Delivered Mailing List — GAP 9.3 */}
      {failedDeliveries.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <h2 className="text-[14px] font-semibold text-neutral-900">
              Non-Delivered Mailing List
            </h2>
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              {failedDeliveries.length} failed
            </span>
          </div>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="pb-2 text-left font-medium text-neutral-500">Recipient</th>
                    <th className="pb-2 text-left font-medium text-neutral-500">Email</th>
                    <th className="pb-2 text-left font-medium text-neutral-500">Channel</th>
                    <th className="pb-2 text-left font-medium text-neutral-500">Status</th>
                    <th className="pb-2 text-left font-medium text-neutral-500">Error Reason</th>
                    <th className="pb-2 text-left font-medium text-neutral-500">Time Recorded</th>
                    <th className="pb-2 text-right font-medium text-neutral-500">Retries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {failedDeliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="py-2 pr-4 font-medium text-neutral-900">
                        {d.recipientName ?? '—'}
                      </td>
                      <td className="py-2 pr-4 text-neutral-600">{d.recipientEmail ?? '—'}</td>
                      <td className="py-2 pr-4 text-neutral-600 capitalize">{d.channel}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            d.status === 'bounced'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-neutral-500">
                        {d.failureReason ?? <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="py-2 pr-4 text-neutral-500">
                        {d.failedAt
                          ? new Date(d.failedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2 text-right text-neutral-500">{d.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
