'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Calendar,
  Download,
  Filter,
  Key,
  Layers,
  Package,
  Plus,
  Search,
  Shield,
  Sparkles,
  StickyNote,
  Users,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types — Unified Event Model
// ---------------------------------------------------------------------------

interface EventLogEntry {
  id: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  typeBgColor: string;
  title: string;
  unit?: string;
  resident?: string;
  status: 'open' | 'closed';
  notificationSent: boolean;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_EVENTS: EventLogEntry[] = [
  {
    id: '1',
    type: 'package',
    typeLabel: 'Package',
    typeColor: 'text-primary-600',
    typeBgColor: 'bg-primary-50',
    title: 'Amazon delivery for Janet Smith',
    unit: '1501',
    resident: 'Janet Smith',
    status: 'open',
    notificationSent: true,
    createdBy: 'Mike Johnson',
    createdAt: '2026-03-18T09:15:00',
  },
  {
    id: '2',
    type: 'visitor',
    typeLabel: 'Visitor',
    typeColor: 'text-success-600',
    typeBgColor: 'bg-success-50',
    title: 'John Williams visiting unit 1501',
    unit: '1501',
    resident: 'Janet Smith',
    status: 'open',
    notificationSent: true,
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T09:30:00',
  },
  {
    id: '3',
    type: 'incident',
    typeLabel: 'Incident',
    typeColor: 'text-error-600',
    typeBgColor: 'bg-error-50',
    title: 'Noise complaint — Floor 8',
    unit: '805',
    status: 'open',
    notificationSent: false,
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T08:15:00',
  },
  {
    id: '4',
    type: 'key',
    typeLabel: 'Key/FOB',
    typeColor: 'text-purple-600',
    typeBgColor: 'bg-purple-50',
    title: 'FOB #SN-4589 issued',
    unit: '422',
    resident: 'Jane Doe',
    status: 'closed',
    notificationSent: false,
    createdBy: 'Guard Chen',
    createdAt: '2026-03-18T07:45:00',
  },
  {
    id: '5',
    type: 'pass_on',
    typeLabel: 'Pass-On',
    typeColor: 'text-warning-600',
    typeBgColor: 'bg-warning-50',
    title: 'Lobby doors sticking — use side entrance after 11pm',
    status: 'open',
    notificationSent: false,
    createdBy: 'Guard Martinez',
    createdAt: '2026-03-17T23:00:00',
  },
  {
    id: '6',
    type: 'cleaning',
    typeLabel: 'Cleaning',
    typeColor: 'text-cyan-600',
    typeBgColor: 'bg-cyan-50',
    title: 'Lobby floor cleaned and mopped',
    status: 'closed',
    notificationSent: false,
    createdBy: 'Cleaning Staff',
    createdAt: '2026-03-18T06:00:00',
  },
  {
    id: '7',
    type: 'package',
    typeLabel: 'Package',
    typeColor: 'text-primary-600',
    typeBgColor: 'bg-primary-50',
    title: 'FedEx delivery for David Chen',
    unit: '802',
    resident: 'David Chen',
    status: 'open',
    notificationSent: true,
    createdBy: 'Mike Johnson',
    createdAt: '2026-03-18T08:30:00',
  },
  {
    id: '8',
    type: 'visitor',
    typeLabel: 'Visitor',
    typeColor: 'text-success-600',
    typeBgColor: 'bg-success-50',
    title: 'Skip The Dishes delivery — unit 1203',
    unit: '1203',
    resident: 'Maria Garcia',
    status: 'closed',
    notificationSent: true,
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T12:15:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: apiEvents } = useApi<EventLogEntry[]>(
    apiUrl('/api/v1/events', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allEvents = useMemo(() => {
    if (apiEvents && Array.isArray(apiEvents) && apiEvents.length > 0) {
      return apiEvents.map((e: Record<string, unknown>) => {
        const et = e.eventType as Record<string, string> | null;
        return {
          id: e.id as string,
          type: et?.name?.toLowerCase().replace(/[/ ]/g, '_') || 'note',
          typeLabel: et?.name || 'Note',
          typeColor: 'text-neutral-600',
          typeBgColor: 'bg-neutral-100',
          title: e.title as string,
          unit: (e.unit as Record<string, string>)?.number,
          resident: undefined,
          status: e.status as string as 'open' | 'closed',
          notificationSent: false,
          createdBy: 'Staff',
          createdAt: e.createdAt as string,
        };
      });
    }
    return MOCK_EVENTS;
  }, [apiEvents]);

  const filteredEvents = allEvents.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.unit?.toLowerCase().includes(q) ||
        e.resident?.toLowerCase().includes(q) ||
        e.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
      id: 'resident',
      header: 'Resident',
      accessorKey: 'resident',
      cell: (row) => <span className="text-neutral-600">{row.resident || '\u2014'}</span>,
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
          <span className="text-neutral-300">\u2014</span>
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
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Log Event
          </Button>
        </div>
      }
    >
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
        onRowClick={(row) => router.push(`/events/${row.id}`)}
      />
    </PageShell>
  );
}
