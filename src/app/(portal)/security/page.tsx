'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventDialog } from '@/components/forms/create-event-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Eye,
  Key,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  StickyNote,
  Users,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types — Unified event model per CLAUDE.md
// ---------------------------------------------------------------------------

interface SecurityEvent {
  id: string;
  type: 'visitor' | 'incident' | 'package' | 'key' | 'pass_on' | 'cleaning' | 'note';
  title: string;
  description: string;
  unit?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Event Type Config (per PRD 03 unified event model)
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<
  SecurityEvent['type'],
  { label: string; icon: typeof Shield; color: string; bgColor: string }
> = {
  visitor: { label: 'Visitor', icon: Users, color: 'text-success-600', bgColor: 'bg-success-50' },
  incident: {
    label: 'Incident',
    icon: ShieldAlert,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  package: { label: 'Package', icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  key: { label: 'Key/FOB', icon: Key, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  pass_on: {
    label: 'Pass-On',
    icon: StickyNote,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  cleaning: { label: 'Cleaning', icon: Sparkles, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  note: { label: 'Note', icon: StickyNote, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_EVENTS: SecurityEvent[] = [
  {
    id: '1',
    type: 'visitor',
    title: 'John Williams — Visiting Unit 1501',
    description: 'Expected guest. Resident confirmed via intercom.',
    unit: '1501',
    status: 'open',
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T09:30:00',
  },
  {
    id: '2',
    type: 'incident',
    title: 'Noise Complaint — Floor 8',
    description: 'Resident in 803 reports excessive noise from 805. Verbal warning issued.',
    unit: '805',
    status: 'in_progress',
    priority: 'medium',
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T08:15:00',
  },
  {
    id: '3',
    type: 'key',
    title: 'FOB Issued — Unit 422',
    description: 'Replacement FOB #SN-4589 issued to resident Jane Doe.',
    unit: '422',
    status: 'closed',
    createdBy: 'Guard Chen',
    createdAt: '2026-03-18T07:45:00',
  },
  {
    id: '4',
    type: 'pass_on',
    title: 'Night Shift Note',
    description:
      'Lobby doors were sticking. Maintenance notified. Use side entrance after 11pm until fixed.',
    status: 'open',
    createdBy: 'Guard Martinez',
    createdAt: '2026-03-17T23:00:00',
  },
  {
    id: '5',
    type: 'visitor',
    title: 'Delivery — Skip The Dishes',
    description: 'Food delivery for unit 1203. Contactless drop-off at lobby.',
    unit: '1203',
    status: 'closed',
    createdBy: 'Guard Patel',
    createdAt: '2026-03-18T12:15:00',
  },
  {
    id: '6',
    type: 'incident',
    title: 'Suspicious Vehicle — P2 Parking',
    description:
      'White sedan with no visible permit parked in reserved spot P2-45. Plates noted: ABCD 123.',
    status: 'open',
    priority: 'high',
    createdBy: 'Guard Chen',
    createdAt: '2026-03-18T10:00:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SecurityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch real events from database
  const { data: apiEvents, refetch } = useApi<SecurityEvent[]>(
    apiUrl('/api/v1/events', { propertyId: DEMO_PROPERTY_ID }),
  );

  // Use API data if available, otherwise mock
  const allEvents = useMemo(() => {
    if (apiEvents && Array.isArray(apiEvents) && apiEvents.length > 0) {
      return apiEvents.map((e: SecurityEvent) => {
        const raw = e as unknown as Record<string, unknown>;
        return {
          id: e.id as string,
          type: ((raw.eventType as Record<string, string>)?.name
            ?.toLowerCase()
            .replace(/[/ ]/g, '_') || 'note') as SecurityEvent['type'],
          title: e.title as string,
          description: (e.description as string) || '',
          unit: (raw.unit as Record<string, string>)?.number,
          status: e.status as string as SecurityEvent['status'],
          priority: e.priority as SecurityEvent['priority'],
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
        e.description.toLowerCase().includes(q) ||
        e.unit?.toLowerCase().includes(q) ||
        e.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = allEvents.filter(
    (e) => e.status === 'open' || e.status === 'in_progress',
  ).length;
  const incidentCount = allEvents.filter((e) => e.type === 'incident').length;

  const columns: Column<SecurityEvent>[] = [
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => {
        const config = EVENT_TYPE_CONFIG[row.type];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bgColor}`}
            >
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
            <span className="text-[13px] font-medium text-neutral-700">{config.label}</span>
          </div>
        );
      },
    },
    {
      id: 'title',
      header: 'Event',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-neutral-900">{row.title}</span>
          <span className="line-clamp-1 text-[13px] text-neutral-500">{row.description}</span>
        </div>
      ),
    },
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
      cell: (row) => {
        const statusMap = {
          open: { variant: 'warning' as const, label: 'Open' },
          in_progress: { variant: 'info' as const, label: 'In Progress' },
          resolved: { variant: 'success' as const, label: 'Resolved' },
          closed: { variant: 'default' as const, label: 'Closed' },
        };
        const s = statusMap[row.status];
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => {
        if (!row.priority) return null;
        const priorityMap = {
          low: 'default' as const,
          medium: 'warning' as const,
          high: 'error' as const,
          urgent: 'error' as const,
        };
        return (
          <Badge variant={priorityMap[row.priority]} size="sm">
            {row.priority}
          </Badge>
        );
      },
    },
    {
      id: 'createdBy',
      header: 'Logged By',
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
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Security Console"
      description="Unified security dashboard with real-time event logging."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Eye className="h-4 w-4" />
            View Cameras
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Log Event
          </Button>
        </div>
      }
    >
      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Open Events',
            value: openCount,
            icon: Clock,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Incidents',
            value: incidentCount,
            icon: ShieldAlert,
            color: 'text-error-600',
            bg: 'bg-error-50',
          },
          {
            label: 'Active Visitors',
            value: 2,
            icon: Users,
            color: 'text-success-600',
            bg: 'bg-success-50',
          },
          { label: 'Keys Out', value: 1, icon: Key, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{stat.value}</p>
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Type Filter */}
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

        {/* Type pills */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'visitor', label: 'Visitors' },
            { key: 'incident', label: 'Incidents' },
            { key: 'key', label: 'Keys' },
            { key: 'pass_on', label: 'Pass-On' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTypeFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                typeFilter === t.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Table */}
      <DataTable
        columns={columns}
        data={filteredEvents}
        emptyMessage="No security events to display."
        emptyIcon={<Shield className="h-6 w-6" />}
        onRowClick={(row) => {
          if (row.type === 'incident') {
            router.push(`/security/incidents/${row.id}` as never);
          }
        }}
      />

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
