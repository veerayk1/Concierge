'use client';

/**
 * Activity Feed — UX-289
 *
 * Surfaces the AuditEntry table that the platform's been writing to
 * but no UI was reading from. Property managers can finally answer
 * "who created this user / posted that announcement / issued the
 * parking ticket and when?" without grepping server logs.
 *
 * Today's seeded write sites: property create, user create, parking
 * violation create, announcement create. Anything else still won't
 * appear here until its route calls logAudit() — by design, this is
 * the audit trail, not a fake activity stream.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { useIsResident } from '@/lib/role-mode';
import { formatRelative, formatDateTime } from '@/lib/format';
import { AccessDeniedPanel } from '@/components/ui/access-denied-panel';
import { Activity, ShieldCheck } from 'lucide-react';

interface AuditRow {
  id: string;
  userId: string;
  propertyId: string;
  action: 'create' | 'update' | 'delete' | 'read';
  resource: string;
  resourceId: string;
  fields: string[] | null;
  ipAddress: string;
  userAgent: string | null;
  piiAccessed: boolean;
  createdAt: string;
}

// The /api/v1/audit-log route returns { data: rows[], meta: {...} }
// and useApi() unwraps the outer `data`, so the hook hands back the
// rows array directly. Pagination meta isn't exposed in that shape
// without changing the API; the page just counts the visible rows.
type ApiResponse = AuditRow[];

const ACTION_VARIANT: Record<AuditRow['action'], 'success' | 'warning' | 'error' | 'default'> = {
  create: 'success',
  update: 'warning',
  delete: 'error',
  read: 'default',
};

const ACTION_FILTERS: { label: string; value: string }[] = [
  { label: 'All actions', value: '' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Read (PII)', value: 'read' },
];

const RESOURCE_FILTERS: { label: string; value: string }[] = [
  { label: 'All resources', value: '' },
  { label: 'User', value: 'user' },
  { label: 'Property', value: 'property' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Parking violation', value: 'parking_violation' },
  { label: 'Maintenance', value: 'maintenance_request' },
];

export default function ActivityPage() {
  const isResident = useIsResident();
  const searchParams = useSearchParams();
  const propertyOverride = searchParams.get('propertyId');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const url = useMemo(() => {
    if (!mounted) return null;
    // Honor ?propertyId= so Super Admins can audit any property they manage
    // (the API already gates access via enforcePropertyAccess).
    const propertyId = propertyOverride || getPropertyId();
    if (!propertyId) return null;
    const params: Record<string, string> = { propertyId, pageSize: '100' };
    if (action) params.action = action;
    if (resource) params.resource = resource;
    return apiUrl('/api/v1/audit-log', params);
  }, [mounted, action, resource, propertyOverride]);

  const { data, loading } = useApi<ApiResponse>(url);
  const items: AuditRow[] = data ?? [];
  const total = items.length;

  const piiCount = items.filter((r) => r.piiAccessed).length;

  const columns: Column<AuditRow>[] = [
    {
      id: 'createdAt',
      header: 'When',
      accessorKey: 'createdAt',
      cell: (row) => (
        <span className="text-[13px] text-neutral-600" title={formatDateTime(row.createdAt)}>
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      cell: (row) => (
        <Badge variant={ACTION_VARIANT[row.action]} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      accessorKey: 'resource',
      cell: (row) => (
        <div>
          <p className="text-[13px] font-medium text-neutral-900">{row.resource}</p>
          <p className="font-mono text-[11px] text-neutral-400">{row.resourceId.slice(0, 12)}…</p>
        </div>
      ),
    },
    {
      id: 'fields',
      header: 'Fields',
      accessorKey: 'fields',
      cell: (row) => (
        <span className="font-mono text-[12px] text-neutral-600">
          {row.fields?.length ? row.fields.join(', ') : '—'}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessorKey: 'userId',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[12px] text-neutral-600">{row.userId.slice(0, 12)}…</span>
          {row.piiAccessed ? (
            <span title="PII fields accessed">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: 'ip',
      header: 'IP',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <span className="font-mono text-[12px] text-neutral-500">{row.ipAddress}</span>
      ),
    },
  ];

  if (isResident) {
    return (
      <PageShell title="Activity Log" description="">
        <AccessDeniedPanel
          resource="Activity log"
          whoCanSee="your property manager or building admin"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Activity Log"
      description={
        loading
          ? 'Loading audit entries…'
          : `${total} ${total === 1 ? 'event' : 'events'} matched${piiCount > 0 ? ` · ${piiCount} touched PII` : ''}`
      }
    >
      <div className="flex flex-col gap-5">
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-4 py-3">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-100 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] focus:ring-2 focus:outline-none"
            >
              {ACTION_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-100 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] focus:ring-2 focus:outline-none"
            >
              {RESOURCE_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <DataTable
            columns={columns}
            data={items}
            emptyMessage={
              action || resource
                ? 'No audit entries match these filters.'
                : 'No audit entries recorded yet.'
            }
            emptyDescription={
              action || resource
                ? 'Try clearing the filters above.'
                : 'When staff create users, post announcements, or issue parking violations, the actions show up here with who, what, and when.'
            }
            emptyIcon={<Activity className="h-6 w-6" />}
          />
        </Card>
      </div>
    </PageShell>
  );
}
