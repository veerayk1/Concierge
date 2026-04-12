'use client';

import { useState, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { CreateRecurringTaskDialog } from '@/components/forms/create-recurring-task-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskCategory = 'maintenance' | 'cleaning' | 'inspection' | 'safety' | 'administrative';

type TaskFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

type TaskStatus = 'active' | 'paused' | 'completed';

type TaskPriority = 'low' | 'medium' | 'high';

interface RecurringTaskItem {
  id: string;
  name: string;
  category?: { id: string; name: string };
  intervalType: TaskFrequency;
  assignedEmployeeId?: string | null;
  assignedTo?: string;
  location: string;
  isActive: boolean;
  lastCompletedDate?: string | null;
  nextOccurrence?: string | null;
  completionRate?: number;
  defaultPriority: TaskPriority;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<TaskCategory, 'info' | 'warning' | 'success' | 'error' | 'primary'> =
  {
    maintenance: 'info',
    cleaning: 'success',
    inspection: 'warning',
    safety: 'error',
    administrative: 'primary',
  };

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  maintenance: 'Maintenance',
  cleaning: 'Cleaning',
  inspection: 'Inspection',
  safety: 'Safety',
  administrative: 'Administrative',
};

const FREQUENCY_COLORS: Record<
  TaskFrequency,
  'default' | 'info' | 'warning' | 'success' | 'error' | 'primary'
> = {
  daily: 'primary',
  weekly: 'info',
  biweekly: 'info',
  monthly: 'default',
  quarterly: 'warning',
  annually: 'success',
};

const FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const STATUS_COLORS: Record<TaskStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiResponse {
  data: RecurringTaskItem[];
  meta?: { total: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecurringTasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<TaskFrequency | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiTasks,
    loading,
    error,
    refetch,
  } = useApi<RecurringTaskItem[] | ApiResponse>(
    apiUrl('/api/v1/recurring-tasks', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      frequency: frequencyFilter !== 'all' ? frequencyFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  );

  const allTasks = useMemo<RecurringTaskItem[]>(() => {
    if (!apiTasks) return [];
    if (Array.isArray(apiTasks)) return apiTasks;
    if (Array.isArray((apiTasks as ApiResponse).data)) return (apiTasks as ApiResponse).data;
    return [];
  }, [apiTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((item) => {
      if (categoryFilter !== 'all' && item.category?.id !== categoryFilter) return false;
      if (frequencyFilter !== 'all' && item.intervalType !== frequencyFilter) return false;
      if (statusFilter !== 'all') {
        const isActive = item.isActive ? 'active' : 'paused';
        if (isActive !== statusFilter) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) || (item.location?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allTasks, categoryFilter, frequencyFilter, statusFilter, searchQuery]);

  const totalCount = allTasks.length;
  const activeCount = allTasks.filter((t) => t.isActive).length;
  const overdueCount = allTasks.filter(
    (t) => t.nextOccurrence && new Date(t.nextOccurrence) < new Date(),
  ).length;

  const hasActiveFilters =
    categoryFilter !== 'all' || frequencyFilter !== 'all' || statusFilter !== 'all';

  const columns: Column<RecurringTaskItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[14px] font-semibold text-neutral-900">{row.name}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category' as keyof RecurringTaskItem,
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            CATEGORY_COLORS[
              row.category?.name?.toLowerCase().replace(/\s+/g, '_') as TaskCategory
            ] || 'info'
          }
          size="sm"
        >
          {row.category?.name || '—'}
        </Badge>
      ),
    },
    {
      id: 'frequency',
      header: 'Frequency',
      accessorKey: 'intervalType',
      sortable: true,
      cell: (row) => (
        <Badge variant={FREQUENCY_COLORS[row.intervalType]} size="sm">
          {FREQUENCY_LABELS[row.intervalType]}
        </Badge>
      ),
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessorKey: 'assignedTo',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.assignedTo || '—'}</span>,
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.location}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: (row) => {
        const status = row.isActive ? 'active' : 'paused';
        return (
          <Badge variant={STATUS_COLORS[status as TaskStatus]} size="sm" dot>
            {STATUS_LABELS[status as TaskStatus]}
          </Badge>
        );
      },
    },
    {
      id: 'lastCompleted',
      header: 'Last Completed',
      accessorKey: 'lastCompletedDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {!row.lastCompletedDate
            ? '—'
            : new Date(row.lastCompletedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
        </span>
      ),
    },
    {
      id: 'nextDue',
      header: 'Next Due',
      accessorKey: 'nextOccurrence',
      sortable: true,
      cell: (row) => {
        if (!row.nextOccurrence) {
          return <span className="text-[13px] text-neutral-500">—</span>;
        }
        const next = new Date(row.nextOccurrence);
        const now = new Date();
        const isOverdue = next < now;
        return (
          <span
            className={`text-[13px] ${isOverdue ? 'text-error-600 font-semibold' : 'text-neutral-500'}`}
          >
            {next.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {isOverdue && ' (Overdue)'}
          </span>
        );
      },
    },
    {
      id: 'completionRate',
      header: 'Completion Rate',
      accessorKey: 'completionRate',
      sortable: true,
      cell: (row) => {
        const rate = row.completionRate ?? 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all ${
                  rate >= 90 ? 'bg-success-500' : rate >= 70 ? 'bg-warning-500' : 'bg-error-500'
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-[13px] font-medium text-neutral-600">{rate}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <PageShell
      title="Recurring Tasks"
      description="Manage preventive maintenance schedules and recurring building tasks."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<Repeat className="h-6 w-6" />}
          title="Failed to load recurring tasks"
          description={error}
          action={
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <Repeat className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {totalCount}
                </p>
                <p className="text-[13px] text-neutral-500">Total Tasks</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <CheckCircle2 className="text-success-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {activeCount}
                </p>
                <p className="text-[13px] text-neutral-500">Active</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <AlertTriangle className="text-error-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {overdueCount}
                </p>
                <p className="text-[13px] text-neutral-500">Overdue</p>
              </div>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search recurring tasks..."
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
            <Button
              variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="primary" size="sm">
                  {(categoryFilter !== 'all' ? 1 : 0) +
                    (frequencyFilter !== 'all' ? 1 : 0) +
                    (statusFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setFrequencyFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="category-filter"
                  className="text-[13px] font-medium text-neutral-600"
                >
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="inspection">Inspection</option>
                  <option value="safety">Safety</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="frequency-filter"
                  className="text-[13px] font-medium text-neutral-600"
                >
                  Frequency:
                </label>
                <select
                  id="frequency-filter"
                  value={frequencyFilter}
                  onChange={(e) => setFrequencyFilter(e.target.value as TaskFrequency | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Frequencies</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredTasks}
            emptyMessage="No recurring tasks found."
            emptyIcon={<Repeat className="h-6 w-6" />}
          />
        </>
      )}
      <CreateRecurringTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
