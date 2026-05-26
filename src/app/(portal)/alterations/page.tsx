'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Hammer,
  Plus,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { CreateAlterationDialog } from '@/components/forms/create-alteration-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiTile } from '@/components/ui/kpi-tile';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlterationType = 'renovation' | 'repair' | 'addition' | 'removal';

type AlterationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'in_progress'
  | 'inspection'
  | 'completed'
  | 'rejected';

type AlterationMomentum = 'ok' | 'slow' | 'stalled' | 'stopped';

interface AlterationItem {
  id: string;
  referenceNumber: string;
  unit: string;
  resident: string;
  description: string;
  type: AlterationType;
  status: AlterationStatus;
  momentum: AlterationMomentum;
  startDate: string;
  expectedEnd: string;
  contractorName: string;
  hasPermit: boolean;
  hasInsurance: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<AlterationType, 'info' | 'warning' | 'success' | 'error'> = {
  renovation: 'info',
  repair: 'warning',
  addition: 'success',
  removal: 'error',
};

const TYPE_LABELS: Record<AlterationType, string> = {
  renovation: 'Renovation',
  repair: 'Repair',
  addition: 'Addition',
  removal: 'Removal',
};

const STATUS_COLORS: Record<
  AlterationStatus,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  submitted: 'default',
  under_review: 'warning',
  approved: 'info',
  in_progress: 'info',
  inspection: 'warning',
  completed: 'success',
  rejected: 'error',
};

const STATUS_LABELS: Record<AlterationStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  in_progress: 'In Progress',
  inspection: 'Inspection',
  completed: 'Completed',
  rejected: 'Rejected',
};

const MOMENTUM_COLORS: Record<AlterationMomentum, 'success' | 'warning' | 'error'> = {
  ok: 'success',
  slow: 'warning',
  stalled: 'error',
  stopped: 'error',
};

const MOMENTUM_LABELS: Record<AlterationMomentum, string> = {
  ok: 'OK',
  slow: 'Slow',
  stalled: 'Stalled',
  stopped: 'Stopped',
};

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiResponse {
  data: AlterationItem[];
  meta?: { total: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlterationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlterationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlterationType | 'all'>('all');
  const [momentumFilter, setMomentumFilter] = useState<AlterationMomentum | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiAlterations,
    loading,
    error,
    refetch,
  } = useApi<AlterationItem[] | ApiResponse>(
    apiUrl('/api/v1/alterations', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      momentum: momentumFilter !== 'all' ? momentumFilter : undefined,
    }),
  );

  const allAlterations = useMemo<AlterationItem[]>(() => {
    let list: AlterationItem[] = [];
    if (!apiAlterations) return list;
    if (Array.isArray(apiAlterations)) list = apiAlterations;
    else if (Array.isArray((apiAlterations as ApiResponse).data))
      list = (apiAlterations as ApiResponse).data;
    // Drop test-fixture descriptions ("admin legitimate edit",
    // "r1 legitimate edit", CHAIN/EXH/E2E prefixes) so the
    // manager's alteration board reads like real renovation work.
    const TEST_DESC =
      /^(EXH[- ]?[A-Z]|CHAIN[- ]?[A-Z]|UI[- ]?CHAIN|E2E[- ]|SEC[- ]\d|TEST[- ]|QA[- ]?TEST|admin legitimate edit|r\d legitimate edit)/i;
    return list.filter((a) => !TEST_DESC.test((a.description ?? '').trim()));
  }, [apiAlterations]);

  const filteredAlterations = useMemo(() => {
    return allAlterations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (momentumFilter !== 'all' && item.momentum !== momentumFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.referenceNumber.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        item.resident.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.contractorName.toLowerCase().includes(q)
      );
    });
  }, [allAlterations, statusFilter, typeFilter, momentumFilter, searchQuery]);

  const totalCount = allAlterations.length;
  const inProgressCount = allAlterations.filter((a) => a.status === 'in_progress').length;
  const stalledStoppedCount = allAlterations.filter(
    (a) => a.momentum === 'stalled' || a.momentum === 'stopped',
  ).length;

  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || momentumFilter !== 'all';

  const columns: Column<AlterationItem>[] = [
    {
      id: 'referenceNumber',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[13px] font-medium text-neutral-900">
          {row.referenceNumber}
        </span>
      ),
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-semibold text-neutral-900">
          {typeof row.unit === 'object' && row.unit !== null
            ? (row.unit as Record<string, string>).number
            : row.unit || '—'}
        </span>
      ),
    },
    {
      id: 'resident',
      header: 'Resident',
      accessorKey: 'resident',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.resident}</span>,
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span className="text-[13px] text-neutral-600" title={row.description}>
          {row.description.length > 50 ? `${row.description.slice(0, 50)}...` : row.description}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={TYPE_COLORS[row.type] ?? 'default'} size="sm">
          {TYPE_LABELS[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={STATUS_COLORS[row.status] ?? 'default'} size="sm" dot>
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      id: 'momentum',
      header: 'Momentum',
      accessorKey: 'momentum',
      sortable: true,
      cell: (row) => (
        <Badge
          variant={MOMENTUM_COLORS[row.momentum] ?? 'default'}
          size="sm"
          dot={row.momentum === 'stalled' || row.momentum === 'stopped'}
        >
          {MOMENTUM_LABELS[row.momentum] ?? row.momentum}
        </Badge>
      ),
    },
    {
      id: 'contractor',
      header: 'Contractor',
      accessorKey: 'contractorName',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.contractorName}</span>,
    },
    {
      id: 'permit',
      header: 'Permit',
      accessorKey: 'hasPermit',
      cell: (row) =>
        row.hasPermit ? (
          <CheckCircle2 className="text-success-600 h-4 w-4" />
        ) : (
          <X className="text-error-500 h-4 w-4" />
        ),
    },
    {
      id: 'insurance',
      header: 'Insurance',
      accessorKey: 'hasInsurance',
      cell: (row) =>
        row.hasInsurance ? (
          <CheckCircle2 className="text-success-600 h-4 w-4" />
        ) : (
          <X className="text-error-500 h-4 w-4" />
        ),
    },
  ];

  return (
    <PageShell
      title="Alterations"
      description="Track renovation projects, permits, and contractor compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Alteration
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<Hammer className="h-6 w-6" />}
          title="Failed to load alterations"
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
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile label="Total Projects" value={totalCount} icon={Hammer} accent="neutral" />
            <KpiTile
              label="In Progress"
              value={inProgressCount}
              icon={TrendingUp}
              accent="info"
              caption="Work happening now."
            />
            <KpiTile
              label="Stalled / Stopped"
              value={stalledStoppedCount}
              icon={AlertTriangle}
              accent="error"
              caption="Need follow-up."
            />
          </div>

          {/* Search & Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search alterations..."
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
                  {(statusFilter !== 'all' ? 1 : 0) +
                    (typeFilter !== 'all' ? 1 : 0) +
                    (momentumFilter !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setMomentumFilter('all');
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
                <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AlterationStatus | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="inspection">Inspection</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="type-filter" className="text-[13px] font-medium text-neutral-600">
                  Type:
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as AlterationType | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="renovation">Renovation</option>
                  <option value="repair">Repair</option>
                  <option value="addition">Addition</option>
                  <option value="removal">Removal</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="momentum-filter"
                  className="text-[13px] font-medium text-neutral-600"
                >
                  Momentum:
                </label>
                <select
                  id="momentum-filter"
                  value={momentumFilter}
                  onChange={(e) => setMomentumFilter(e.target.value as AlterationMomentum | 'all')}
                  className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option value="all">All Momentum</option>
                  <option value="ok">OK</option>
                  <option value="slow">Slow</option>
                  <option value="stalled">Stalled</option>
                  <option value="stopped">Stopped</option>
                </select>
              </div>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredAlterations}
            emptyMessage="No alteration projects found."
            emptyIcon={<Hammer className="h-6 w-6" />}
          />
        </>
      )}
      <CreateAlterationDialog
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
