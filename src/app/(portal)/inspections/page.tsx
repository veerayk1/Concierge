'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectionItem {
  id: string;
  title: string;
  type:
    | 'fire_safety'
    | 'elevator'
    | 'plumbing'
    | 'electrical'
    | 'structural'
    | 'general'
    | 'move_in'
    | 'move_out';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'overdue';
  inspector: string;
  location: string;
  scheduledDate: string;
  completedDate?: string;
  checklistProgress: string;
  findings: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INSPECTIONS: InspectionItem[] = [
  {
    id: '1',
    title: 'Annual Fire Safety Inspection',
    type: 'fire_safety',
    status: 'scheduled',
    inspector: 'Fire Marshal Rodriguez',
    location: 'All Floors',
    scheduledDate: '2026-03-25T09:00:00',
    checklistProgress: '0/20',
    findings: '',
    priority: 'critical',
  },
  {
    id: '2',
    title: 'Elevator Annual Certification',
    type: 'elevator',
    status: 'in_progress',
    inspector: 'ThyssenKrupp - David Lee',
    location: 'Elevators A, B, C',
    scheduledDate: '2026-03-19T10:00:00',
    checklistProgress: '8/15',
    findings: 'Minor wear on Elevator B cable — monitoring recommended.',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Move-Out Inspection — Unit 1205',
    type: 'move_out',
    status: 'completed',
    inspector: 'James Wilson',
    location: 'Unit 1205',
    scheduledDate: '2026-03-17T14:00:00',
    completedDate: '2026-03-17T15:30:00',
    checklistProgress: '12/12',
    findings: 'Scuff marks on hallway wall. Minor stain on bedroom carpet.',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'General Hallway & Common Area Inspection',
    type: 'general',
    status: 'overdue',
    inspector: 'Mike Thompson',
    location: 'Floors 1-10 Common Areas',
    scheduledDate: '2026-03-14T08:00:00',
    checklistProgress: '5/18',
    findings: 'Incomplete — hallway lights on Floor 3 need replacement.',
    priority: 'low',
  },
  {
    id: '5',
    title: 'Electrical Panel Inspection — P1 Garage',
    type: 'electrical',
    status: 'failed',
    inspector: 'Spark Electric Co.',
    location: 'P1 Underground Garage',
    scheduledDate: '2026-03-16T11:00:00',
    completedDate: '2026-03-16T13:00:00',
    checklistProgress: '15/15',
    findings: 'Panel 3B breaker tripping under load. Immediate repair required.',
    priority: 'critical',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<InspectionItem['type'], string> = {
  fire_safety: 'Fire Safety',
  elevator: 'Elevator',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  structural: 'Structural',
  general: 'General',
  move_in: 'Move-In',
  move_out: 'Move-Out',
};

const TYPE_BADGE_VARIANT: Record<
  InspectionItem['type'],
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  fire_safety: 'error',
  elevator: 'warning',
  plumbing: 'info',
  electrical: 'warning',
  structural: 'primary',
  general: 'default',
  move_in: 'success',
  move_out: 'info',
};

const STATUS_BADGE_VARIANT: Record<
  InspectionItem['status'],
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  failed: 'error',
  overdue: 'error',
};

const STATUS_LABELS: Record<InspectionItem['status'], string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  overdue: 'Overdue',
};

const PRIORITY_BADGE_VARIANT: Record<
  InspectionItem['priority'],
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InspectionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: apiInspections } = useApi<InspectionItem[]>(
    apiUrl('/api/v1/inspections', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allInspections = useMemo<InspectionItem[]>(
    () => apiInspections ?? MOCK_INSPECTIONS,
    [apiInspections],
  );

  const filteredInspections = useMemo(
    () =>
      allInspections.filter((item) => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.inspector.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.findings.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [allInspections, searchQuery, typeFilter, statusFilter, priorityFilter],
  );

  const totalCount = allInspections.length;
  const upcomingCount = allInspections.filter(
    (i) => i.status === 'scheduled' || i.status === 'in_progress',
  ).length;
  const overdueCount = allInspections.filter(
    (i) => i.status === 'overdue' || i.status === 'failed',
  ).length;

  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
  };

  const columns: Column<InspectionItem>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-semibold text-neutral-900">{row.title}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={TYPE_BADGE_VARIANT[row.type]} size="sm">
          {TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: 'inspector',
      header: 'Inspector',
      accessorKey: 'inspector',
      sortable: true,
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
    },
    {
      id: 'scheduledDate',
      header: 'Scheduled Date',
      accessorKey: 'scheduledDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.scheduledDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={STATUS_BADGE_VARIANT[row.status]} size="sm" dot>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'checklistProgress',
      header: 'Checklist',
      accessorKey: 'checklistProgress',
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-600">{row.checklistProgress}</span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => (
        <Badge variant={PRIORITY_BADGE_VARIANT[row.priority]} size="sm" dot>
          {row.priority}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell
      title="Inspections"
      description="Schedule and track building inspections with checklists and compliance tracking."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Inspection
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <ClipboardCheck className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Inspections</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Calendar className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{upcomingCount}</p>
            <p className="text-[13px] text-neutral-500">Upcoming</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{overdueCount}</p>
            <p className="text-[13px] text-neutral-500">Overdue</p>
          </div>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search inspections..."
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

        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 transition-all focus:ring-4 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="fire_safety">Fire Safety</option>
            <option value="elevator">Elevator</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="structural">Structural</option>
            <option value="general">General</option>
            <option value="move_in">Move-In</option>
            <option value="move_out">Move-Out</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:border-primary-300 focus:ring-primary-100 h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 transition-all focus:ring-4 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="focus:border-primary-300 focus:ring-primary-100 h-10 rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 transition-all focus:ring-4 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Inspections Table */}
      <DataTable
        columns={columns}
        data={filteredInspections}
        emptyMessage="No inspections found."
        emptyIcon={<ClipboardCheck className="h-6 w-6" />}
        onRowClick={(row) => router.push(`/inspections/${row.id}` as never)}
      />
    </PageShell>
  );
}
