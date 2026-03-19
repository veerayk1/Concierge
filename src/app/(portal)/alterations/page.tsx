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
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { CreateAlterationDialog } from '@/components/forms/create-alteration-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

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
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ALTERATIONS: AlterationItem[] = [
  {
    id: '1',
    referenceNumber: 'ALT-2026-001',
    unit: '1204',
    resident: 'Margaret Chen',
    description:
      'Full kitchen renovation including new cabinetry, countertops, and appliance upgrades',
    type: 'renovation',
    status: 'approved',
    momentum: 'ok',
    startDate: '2026-04-01',
    expectedEnd: '2026-06-15',
    contractorName: 'Elite Renovations Inc.',
    hasPermit: true,
    hasInsurance: true,
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    referenceNumber: 'ALT-2026-002',
    unit: '807',
    resident: 'David Okonkwo',
    description: 'Bathroom remodel with walk-in shower conversion and new tiling',
    type: 'renovation',
    status: 'in_progress',
    momentum: 'slow',
    startDate: '2026-02-15',
    expectedEnd: '2026-04-30',
    contractorName: 'ProBuild Contractors',
    hasPermit: true,
    hasInsurance: true,
    createdAt: '2026-02-01',
  },
  {
    id: '3',
    referenceNumber: 'ALT-2026-003',
    unit: '302',
    resident: 'Sarah Leblanc',
    description: 'Balcony railing repair and waterproofing membrane replacement',
    type: 'repair',
    status: 'under_review',
    momentum: 'stalled',
    startDate: '',
    expectedEnd: '2026-05-15',
    contractorName: 'BalconyPro Services',
    hasPermit: false,
    hasInsurance: true,
    createdAt: '2026-03-10',
  },
  {
    id: '4',
    referenceNumber: 'ALT-2026-004',
    unit: '1501',
    resident: 'James Hartwell',
    description: 'Non-load-bearing wall removal between kitchen and dining room for open concept',
    type: 'removal',
    status: 'submitted',
    momentum: 'stopped',
    startDate: '',
    expectedEnd: '2026-07-01',
    contractorName: 'UrbanSpace Design Build',
    hasPermit: false,
    hasInsurance: false,
    createdAt: '2026-03-15',
  },
  {
    id: '5',
    referenceNumber: 'ALT-2026-005',
    unit: '610',
    resident: 'Priya Sharma',
    description: 'Hardwood flooring replacement throughout unit including living room and bedrooms',
    type: 'renovation',
    status: 'completed',
    momentum: 'ok',
    startDate: '2026-01-10',
    expectedEnd: '2026-02-28',
    contractorName: 'FloorCraft Toronto',
    hasPermit: true,
    hasInsurance: true,
    createdAt: '2025-12-20',
  },
];

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

  const { data: apiAlterations, refetch } = useApi<AlterationItem[]>(
    apiUrl('/api/v1/alterations', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allAlterations = useMemo<AlterationItem[]>(
    () => apiAlterations ?? MOCK_ALTERATIONS,
    [apiAlterations],
  );

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
      cell: (row) => <span className="text-[14px] font-semibold text-neutral-900">{row.unit}</span>,
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
        <Badge variant={TYPE_COLORS[row.type]} size="sm">
          {TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={STATUS_COLORS[row.status]} size="sm" dot>
          {STATUS_LABELS[row.status]}
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
          variant={MOMENTUM_COLORS[row.momentum]}
          size="sm"
          dot={row.momentum === 'stalled' || row.momentum === 'stopped'}
        >
          {MOMENTUM_LABELS[row.momentum]}
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
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Hammer className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Projects</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <TrendingUp className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {inProgressCount}
            </p>
            <p className="text-[13px] text-neutral-500">In Progress</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {stalledStoppedCount}
            </p>
            <p className="text-[13px] text-neutral-500">Stalled / Stopped</p>
          </div>
        </Card>
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
            <label htmlFor="momentum-filter" className="text-[13px] font-medium text-neutral-600">
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
      <CreateAlterationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={DEMO_PROPERTY_ID}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
