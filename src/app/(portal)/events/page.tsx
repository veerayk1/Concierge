'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { AlertCircle, Download, Layers, Loader2, Plus, Search, X } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { LogEventDialog } from '@/components/forms/log-event-dialog';

// ---------------------------------------------------------------------------
// Types — Unified Event Model (API response shape)
// ---------------------------------------------------------------------------

interface ApiEvent {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  notificationSent?: boolean;
  eventType?: { name: string } | null;
  unit?: { number: string } | null;
  createdBy?: { firstName: string; lastName: string } | null;
}

// Display shape after normalization
interface EventLogEntry {
  id: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  typeBgColor: string;
  title: string;
  unit?: string;
  status: 'open' | 'closed';
  notificationSent: boolean;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Type color map
// ---------------------------------------------------------------------------

const TYPE_STYLE_MAP: Record<string, { color: string; bg: string }> = {
  package: { color: 'text-primary-600', bg: 'bg-primary-50' },
  visitor: { color: 'text-success-600', bg: 'bg-success-50' },
  incident: { color: 'text-error-600', bg: 'bg-error-50' },
  key: { color: 'text-purple-600', bg: 'bg-purple-50' },
  pass_on: { color: 'text-warning-600', bg: 'bg-warning-50' },
  cleaning: { color: 'text-cyan-600', bg: 'bg-cyan-50' },
  note: { color: 'text-neutral-600', bg: 'bg-neutral-100' },
};

function normalizeEvent(e: ApiEvent): EventLogEntry {
  const typeName = e.eventType?.name ?? 'Note';
  const typeKey = typeName.toLowerCase().replace(/[/ ]/g, '_');
  const style = (TYPE_STYLE_MAP[typeKey] ?? TYPE_STYLE_MAP.note) as { color: string; bg: string };

  const createdByName = e.createdBy
    ? `${e.createdBy.firstName ?? ''} ${e.createdBy.lastName ?? ''}`.trim() || 'Staff'
    : 'Staff';

  return {
    id: e.id,
    type: typeKey,
    typeLabel: typeName,
    typeColor: style.color,
    typeBgColor: style.bg,
    title: e.title,
    unit: e.unit?.number,
    status: (e.status as 'open' | 'closed') ?? 'open',
    notificationSent: e.notificationSent ?? false,
    createdBy: createdByName,
    createdAt: e.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showLogDialog, setShowLogDialog] = useState(false);

  const {
    data: apiEvents,
    loading,
    error,
    refetch,
  } = useApi<ApiEvent[]>(
    apiUrl('/api/v1/events', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
  );

  const allEvents = useMemo<EventLogEntry[]>(() => {
    if (!apiEvents || !Array.isArray(apiEvents)) return [];
    return apiEvents.map(normalizeEvent);
  }, [apiEvents]);

  // Client-side type filter for display (API may not support type filter)
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.unit?.toLowerCase().includes(q) ||
          e.createdBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allEvents, typeFilter, searchQuery]);

  const columns: Column<EventLogEntry>[] = [
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${row.typeBgColor} ${row.typeColor}`}
        >
          {row.typeLabel}
        </span>
      ),
    },
    { id: 'title', header: 'Event', accessorKey: 'title', sortable: true },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.unit || '\u2014'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'open' ? 'warning' : 'default'} size="sm" dot>
          {row.status === 'open' ? 'Open' : 'Closed'}
        </Badge>
      ),
    },
    {
      id: 'notification',
      header: 'Notified',
      accessorKey: 'notificationSent',
      cell: (row) =>
        row.notificationSent ? (
          <Badge variant="success" size="sm">
            Sent
          </Badge>
        ) : (
          <span className="text-neutral-300">{'\u2014'}</span>
        ),
    },
    {
      id: 'createdBy',
      header: 'By',
      accessorKey: 'createdBy',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.createdBy}</span>,
    },
    {
      id: 'createdAt',
      header: 'Time',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Event Log"
      description="Unified event log with configurable event types."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowLogDialog(true)}>
            <Plus className="h-4 w-4" />
            Log Event
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading events...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load events"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'package', label: 'Packages' },
                { key: 'visitor', label: 'Visitors' },
                { key: 'incident', label: 'Incidents' },
                { key: 'key', label: 'Keys' },
                { key: 'pass_on', label: 'Pass-On' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${typeFilter === t.key ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredEvents}
            emptyMessage="No events logged."
            emptyIcon={<Layers className="h-6 w-6" />}
            onRowClick={(row) => router.push(`/events/${row.id}` as never)}
          />
        </>
      )}
      <LogEventDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowLogDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
