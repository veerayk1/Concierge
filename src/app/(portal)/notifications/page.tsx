'use client';

/**
 * Notification Log page — UX-282
 *
 * Shows every outbound notification the platform has sent (welcome
 * emails, parking-violation cascades, future SMS/push) with delivery
 * status from the provider. Staff can finally answer "did the
 * resident actually receive this?" without diving into server logs.
 */

import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { useIsResident } from '@/lib/role-mode';
import { AccessDeniedPanel } from '@/components/ui/access-denied-panel';
import { Bell, Mail, Smartphone, BellRing } from 'lucide-react';

interface Delivery {
  id: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  category: string;
  subject: string | null;
  bodyPreview: string | null;
  status: 'sent' | 'failed' | 'skipped' | 'queued';
  providerId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface DeliveriesResponse {
  items: Delivery[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const CHANNEL_FILTERS: { label: string; value: string }[] = [
  { label: 'All channels', value: '' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
  { label: 'In-app', value: 'in_app' },
];

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All status', value: '' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped', value: 'skipped' },
  { label: 'Queued', value: 'queued' },
];

const CATEGORY_FILTERS: { label: string; value: string }[] = [
  { label: 'All categories', value: '' },
  { label: 'Welcome', value: 'welcome' },
  { label: 'Announcements', value: 'announcement' },
  { label: 'Parking violations', value: 'parking_violation' },
  { label: 'Package pickup', value: 'package_pickup' },
  { label: 'Password reset', value: 'password_reset' },
];

const STATUS_VARIANT: Record<Delivery['status'], 'success' | 'error' | 'warning' | 'default'> = {
  sent: 'success',
  failed: 'error',
  skipped: 'warning',
  queued: 'default',
};

function channelIcon(channel: Delivery['channel']) {
  switch (channel) {
    case 'email':
      return <Mail className="h-3.5 w-3.5" />;
    case 'sms':
      return <Smartphone className="h-3.5 w-3.5" />;
    case 'push':
      return <BellRing className="h-3.5 w-3.5" />;
    default:
      return <Bell className="h-3.5 w-3.5" />;
  }
}

function formatRelative(iso: string): string {
  const dt = new Date(iso);
  const diff = Date.now() - dt.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return dt.toLocaleDateString();
}

export default function NotificationsPage() {
  const isResident = useIsResident();
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const url = useMemo(() => {
    if (!mounted) return null;
    const propertyId = getPropertyId();
    if (!propertyId) return null;
    const params: Record<string, string> = { propertyId, pageSize: '100' };
    if (channel) params.channel = channel;
    if (status) params.status = status;
    if (category) params.category = category;
    if (debouncedSearch) params.search = debouncedSearch;
    return apiUrl('/api/v1/notifications/deliveries', params);
  }, [mounted, channel, status, category, debouncedSearch]);

  const { data, loading } = useApi<DeliveriesResponse>(url);
  const items: Delivery[] = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  const successCount = items.filter((d) => d.status === 'sent').length;
  const failedCount = items.filter((d) => d.status === 'failed').length;
  const skippedCount = items.filter((d) => d.status === 'skipped').length;

  const columns: Column<Delivery>[] = [
    {
      id: 'createdAt',
      header: 'When',
      accessorKey: 'createdAt',
      cell: (row) => (
        <span
          className="text-[13px] text-neutral-600"
          title={new Date(row.createdAt).toLocaleString()}
        >
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
    {
      id: 'channel',
      header: 'Channel',
      accessorKey: 'channel',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-700">
          {channelIcon(row.channel)}
          {row.channel}
        </span>
      ),
    },
    {
      id: 'recipient',
      header: 'Recipient',
      accessorKey: 'recipientEmail',
      cell: (row) => (
        <span className="font-mono text-[12px] text-neutral-700">
          {row.recipientEmail ?? row.recipientPhone ?? '—'}
        </span>
      ),
    },
    {
      id: 'subject',
      header: 'Subject / preview',
      accessorKey: 'subject',
      cell: (row) => (
        <div className="max-w-md">
          <p className="text-[13px] font-medium text-neutral-900">{row.subject ?? row.category}</p>
          {row.bodyPreview ? (
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">{row.bodyPreview}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => (
        <Badge variant="default" size="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant={STATUS_VARIANT[row.status]} size="sm">
            {row.status}
          </Badge>
          {row.errorMessage ? (
            <span className="text-error-600 text-[11px]" title={row.errorMessage}>
              {row.errorMessage.slice(0, 40)}
              {row.errorMessage.length > 40 ? '…' : ''}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  if (isResident) {
    return (
      <PageShell title="Notification Log" description="">
        <AccessDeniedPanel
          resource="Notification log"
          whoCanSee="your property manager or front desk"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Notification Log"
      description={
        loading
          ? 'Loading deliveries…'
          : `${total} ${total === 1 ? 'delivery' : 'deliveries'} matched`
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Sent" value={successCount} tone="success" />
          <StatCard label="Failed" value={failedCount} tone="error" />
          <StatCard label="Skipped" value={skippedCount} tone="warning" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-4 py-3">
            <input
              type="search"
              placeholder="Search by email or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-100 min-w-[200px] flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] focus:ring-2 focus:outline-none"
            />
            <FilterSelect value={channel} onChange={setChannel} options={CHANNEL_FILTERS} />
            <FilterSelect value={status} onChange={setStatus} options={STATUS_FILTERS} />
            <FilterSelect value={category} onChange={setCategory} options={CATEGORY_FILTERS} />
          </div>
          <DataTable
            columns={columns}
            data={items}
            emptyMessage={
              search || channel || status || category
                ? 'No deliveries match these filters.'
                : 'Nothing sent yet.'
            }
            emptyDescription={
              search || channel || status || category
                ? 'Try clearing the filters above.'
                : 'When the platform emails a resident or staff member, the delivery shows up here with status and timestamp.'
            }
            emptyIcon={<Bell className="h-6 w-6" />}
          />
        </Card>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'error' | 'warning';
}) {
  const toneClass = {
    success: 'text-success-700 bg-success-50 border-success-100',
    error: 'text-error-700 bg-error-50 border-error-100',
    warning: 'text-amber-700 bg-amber-50 border-amber-100',
  }[tone];
  return (
    <Card className={`border ${toneClass} px-4 py-3`}>
      <p className="text-[11px] font-semibold tracking-[0.08em] uppercase">{label}</p>
      <p className="mt-1 text-[24px] leading-none font-semibold">{value}</p>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus:border-primary-500 focus:ring-primary-100 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] focus:ring-2 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
