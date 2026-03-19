'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cog,
  Clock,
  Download,
  Filter,
  Plus,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { CreateEquipmentDialog } from '@/components/forms/create-equipment-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EquipmentCategory =
  | 'hvac'
  | 'elevator'
  | 'plumbing'
  | 'electrical'
  | 'fire_safety'
  | 'security'
  | 'other';

type EquipmentStatus = 'operational' | 'needs_maintenance' | 'out_of_service' | 'decommissioned';

interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  status: EquipmentStatus;
  installDate: string;
  warrantyExpiry: string;
  lastServiceDate: string;
  nextServiceDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<EquipmentCategory, 'info' | 'warning' | 'success' | 'error'> = {
  hvac: 'info',
  elevator: 'warning',
  plumbing: 'success',
  electrical: 'error',
  fire_safety: 'error',
  security: 'info',
  other: 'info',
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  hvac: 'HVAC',
  elevator: 'Elevator',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  fire_safety: 'Fire Safety',
  security: 'Security',
  other: 'Other',
};

const STATUS_COLORS: Record<EquipmentStatus, 'success' | 'warning' | 'error' | 'default'> = {
  operational: 'success',
  needs_maintenance: 'warning',
  out_of_service: 'error',
  decommissioned: 'default',
};

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  operational: 'Operational',
  needs_maintenance: 'Needs Maintenance',
  out_of_service: 'Out of Service',
  decommissioned: 'Decommissioned',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_EQUIPMENT: EquipmentItem[] = [
  {
    id: '1',
    name: 'Rooftop HVAC Unit #1',
    category: 'hvac',
    location: 'Rooftop Mechanical Room',
    manufacturer: 'Carrier',
    modelNumber: '50XC-A24',
    serialNumber: 'CR-2023-44821',
    status: 'operational',
    installDate: '2023-06-15',
    warrantyExpiry: '2028-06-15',
    lastServiceDate: '2026-01-10',
    nextServiceDate: '2026-04-10',
  },
  {
    id: '2',
    name: 'Passenger Elevator A',
    category: 'elevator',
    location: 'Main Lobby',
    manufacturer: 'Otis',
    modelNumber: 'Gen2-MRL',
    serialNumber: 'OT-2019-10934',
    status: 'needs_maintenance',
    installDate: '2019-03-22',
    warrantyExpiry: '2024-03-22',
    lastServiceDate: '2026-02-28',
    nextServiceDate: '2026-03-28',
  },
  {
    id: '3',
    name: 'Fire Alarm Panel',
    category: 'fire_safety',
    location: 'Ground Floor Security Office',
    manufacturer: 'Honeywell',
    modelNumber: 'SWIFT-3200',
    serialNumber: 'HW-2021-78452',
    status: 'operational',
    installDate: '2021-09-01',
    warrantyExpiry: '2026-09-01',
    lastServiceDate: '2026-03-01',
    nextServiceDate: '2026-06-01',
  },
  {
    id: '4',
    name: 'Security Camera System',
    category: 'security',
    location: 'Server Room B2',
    manufacturer: 'Axis Communications',
    modelNumber: 'P3245-LVE',
    serialNumber: 'AX-2022-33019',
    status: 'operational',
    installDate: '2022-11-10',
    warrantyExpiry: '2025-11-10',
    lastServiceDate: '2026-02-15',
    nextServiceDate: '2026-05-15',
  },
  {
    id: '5',
    name: 'Central Boiler',
    category: 'plumbing',
    location: 'Basement Mechanical Room',
    manufacturer: 'Weil-McLain',
    modelNumber: 'SVF-1500',
    serialNumber: 'WM-2020-55671',
    status: 'out_of_service',
    installDate: '2020-04-18',
    warrantyExpiry: '2025-04-18',
    lastServiceDate: '2026-03-10',
    nextServiceDate: '2026-03-20',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EquipmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiEquipment } = useApi<EquipmentItem[]>(
    apiUrl('/api/v1/equipment', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allEquipment = useMemo<EquipmentItem[]>(
    () => apiEquipment ?? MOCK_EQUIPMENT,
    [apiEquipment],
  );

  const filteredEquipment = useMemo(() => {
    return allEquipment.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.modelNumber.toLowerCase().includes(q)
      );
    });
  }, [allEquipment, categoryFilter, statusFilter, searchQuery]);

  const totalCount = allEquipment.length;
  const operationalCount = allEquipment.filter((e) => e.status === 'operational').length;
  const needsMaintenanceCount = allEquipment.filter((e) => e.status === 'needs_maintenance').length;

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  const columns: Column<EquipmentItem>[] = [
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
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant={CATEGORY_COLORS[row.category]} size="sm">
          {CATEGORY_LABELS[row.category]}
        </Badge>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.location}</span>,
    },
    {
      id: 'model',
      header: 'Model / Serial',
      accessorKey: 'modelNumber',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-neutral-900">{row.modelNumber}</span>
          <span className="font-mono text-[11px] text-neutral-400">{row.serialNumber}</span>
        </div>
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
      id: 'lastService',
      header: 'Last Service',
      accessorKey: 'lastServiceDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.lastServiceDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'nextService',
      header: 'Next Service',
      accessorKey: 'nextServiceDate',
      sortable: true,
      cell: (row) => {
        const next = new Date(row.nextServiceDate);
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
      id: 'warranty',
      header: 'Warranty',
      accessorKey: 'warrantyExpiry',
      sortable: true,
      cell: (row) => {
        const expiry = new Date(row.warrantyExpiry);
        const now = new Date();
        const isExpired = expiry < now;
        return (
          <Badge variant={isExpired ? 'error' : 'success'} size="sm">
            {isExpired ? 'Expired' : 'Active'}
          </Badge>
        );
      },
    },
  ];

  return (
    <PageShell
      title="Equipment"
      description="Track building equipment lifecycle, maintenance schedules, and warranties."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Cog className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Equipment</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {operationalCount}
            </p>
            <p className="text-[13px] text-neutral-500">Operational</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {needsMaintenanceCount}
            </p>
            <p className="text-[13px] text-neutral-500">Needs Maintenance</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search equipment..."
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
              {(categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCategoryFilter('all');
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
            <label htmlFor="category-filter" className="text-[13px] font-medium text-neutral-600">
              Category:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as EquipmentCategory | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="hvac">HVAC</option>
              <option value="elevator">Elevator</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="fire_safety">Fire Safety</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="operational">Operational</option>
              <option value="needs_maintenance">Needs Maintenance</option>
              <option value="out_of_service">Out of Service</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEquipment}
        emptyMessage="No equipment found."
        emptyIcon={<Wrench className="h-6 w-6" />}
      />

      <CreateEquipmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={DEMO_PROPERTY_ID}
      />
    </PageShell>
  );
}
