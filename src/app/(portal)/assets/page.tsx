'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  FileBox,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssetCategory =
  | 'furniture'
  | 'appliance'
  | 'fixture'
  | 'technology'
  | 'vehicle'
  | 'tool'
  | 'infrastructure';
type AssetStatus = 'in_service' | 'storage' | 'repair' | 'disposed' | 'on_order';
type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

interface AssetItem {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  location: string;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  condition: AssetCondition;
  assignedTo: string | null;
  warrantyExpiry: string | null;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ASSETS: AssetItem[] = [
  {
    id: '1',
    assetTag: 'AST-001',
    name: 'Lobby Furniture Set',
    category: 'furniture',
    location: 'Main Lobby',
    status: 'in_service',
    purchaseDate: '2024-03-15',
    purchasePrice: 12500,
    currentValue: 9800,
    condition: 'good',
    assignedTo: null,
    warrantyExpiry: '2027-03-15',
  },
  {
    id: '2',
    assetTag: 'AST-002',
    name: 'Pool Pump',
    category: 'appliance',
    location: 'Pool Mechanical Room',
    status: 'in_service',
    purchaseDate: '2023-06-01',
    purchasePrice: 4200,
    currentValue: 2900,
    condition: 'fair',
    assignedTo: 'Maintenance Team',
    warrantyExpiry: '2025-06-01',
  },
  {
    id: '3',
    assetTag: 'AST-003',
    name: 'Security Camera System',
    category: 'technology',
    location: 'Building-wide',
    status: 'in_service',
    purchaseDate: '2024-09-20',
    purchasePrice: 18750,
    currentValue: 16200,
    condition: 'excellent',
    assignedTo: 'Security',
    warrantyExpiry: '2027-09-20',
  },
  {
    id: '4',
    assetTag: 'AST-004',
    name: 'Snowblower',
    category: 'tool',
    location: 'Storage Room B',
    status: 'storage',
    purchaseDate: '2022-11-10',
    purchasePrice: 3800,
    currentValue: 2100,
    condition: 'good',
    assignedTo: null,
    warrantyExpiry: null,
  },
  {
    id: '5',
    assetTag: 'AST-005',
    name: 'Fitness Equipment',
    category: 'fixture',
    location: 'Gym - Level 2',
    status: 'repair',
    purchaseDate: '2023-01-25',
    purchasePrice: 8900,
    currentValue: 5600,
    condition: 'poor',
    assignedTo: 'Maintenance Team',
    warrantyExpiry: '2026-01-25',
  },
  {
    id: '6',
    assetTag: 'AST-006',
    name: 'HVAC Unit',
    category: 'infrastructure',
    location: 'Rooftop',
    status: 'in_service',
    purchaseDate: '2021-08-05',
    purchasePrice: 32000,
    currentValue: 22400,
    condition: 'fair',
    assignedTo: 'Maintenance Team',
    warrantyExpiry: '2026-08-05',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const categoryLabels: Record<AssetCategory, string> = {
  furniture: 'Furniture',
  appliance: 'Appliance',
  fixture: 'Fixture',
  technology: 'Technology',
  vehicle: 'Vehicle',
  tool: 'Tool',
  infrastructure: 'Infrastructure',
};

const statusConfig: Record<
  AssetStatus,
  { label: string; variant: 'success' | 'default' | 'warning' | 'error' | 'info' }
> = {
  in_service: { label: 'In Service', variant: 'success' },
  storage: { label: 'Storage', variant: 'default' },
  repair: { label: 'Repair', variant: 'warning' },
  disposed: { label: 'Disposed', variant: 'error' },
  on_order: { label: 'On Order', variant: 'info' },
};

const conditionConfig: Record<
  AssetCondition,
  { label: string; variant: 'success' | 'info' | 'warning' | 'error' }
> = {
  excellent: { label: 'Excellent', variant: 'success' },
  good: { label: 'Good', variant: 'info' },
  fair: { label: 'Fair', variant: 'warning' },
  poor: { label: 'Poor', variant: 'error' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssetsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<AssetCondition | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // In production, this would fetch from the API
  // const { data, loading, error } = useApi<AssetItem[]>(
  //   apiUrl(`/api/assets`, { propertyId: DEMO_PROPERTY_ID })
  // );
  const assets = MOCK_ASSETS;

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          asset.name.toLowerCase().includes(q) ||
          asset.assetTag.toLowerCase().includes(q) ||
          asset.location.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
      if (conditionFilter !== 'all' && asset.condition !== conditionFilter) return false;
      return true;
    });
  }, [assets, searchQuery, categoryFilter, statusFilter, conditionFilter]);

  // Summary stats
  const totalAssets = assets.length;
  const inServiceCount = assets.filter((a) => a.status === 'in_service').length;
  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  const hasActiveFilters =
    categoryFilter !== 'all' || statusFilter !== 'all' || conditionFilter !== 'all';

  function clearFilters() {
    setCategoryFilter('all');
    setStatusFilter('all');
    setConditionFilter('all');
    setSearchQuery('');
  }

  function isWarrantyExpired(warrantyExpiry: string | null): boolean {
    if (!warrantyExpiry) return false;
    return new Date(warrantyExpiry) < new Date();
  }

  // ---------------------------------------------------------------------------
  // Table Columns
  // ---------------------------------------------------------------------------

  const columns: Column<AssetItem>[] = [
    {
      id: 'assetTag',
      header: 'Asset Tag',
      accessorKey: 'assetTag',
      sortable: true,
      cell: (row) => <span className="font-mono text-[13px] text-neutral-600">{row.assetTag}</span>,
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="font-semibold text-neutral-900">{row.name}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => <Badge variant="default">{categoryLabels[row.category]}</Badge>,
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const config = statusConfig[row.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'purchasePrice',
      header: 'Purchase Price',
      accessorKey: 'purchasePrice',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] text-neutral-600">{formatCurrency(row.purchasePrice)}</span>
      ),
    },
    {
      id: 'currentValue',
      header: 'Current Value',
      accessorKey: 'currentValue',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-medium text-neutral-900">
          {formatCurrency(row.currentValue)}
        </span>
      ),
    },
    {
      id: 'condition',
      header: 'Condition',
      accessorKey: 'condition',
      sortable: true,
      cell: (row) => {
        const config = conditionConfig[row.condition];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'warranty',
      header: 'Warranty',
      cell: (row) => {
        if (!row.warrantyExpiry) {
          return <span className="text-[13px] text-neutral-400">N/A</span>;
        }
        const expired = isWarrantyExpired(row.warrantyExpiry);
        return (
          <Badge variant={expired ? 'error' : 'success'}>{expired ? 'Expired' : 'Active'}</Badge>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageShell
      title="Assets"
      description="Track building assets, depreciation, and replacement schedules."
      actions={
        <>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <FileBox className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">Total Assets</p>
              <p className="text-[22px] font-bold text-neutral-900">{totalAssets}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="bg-success-50 text-success-600 flex h-10 w-10 items-center justify-center rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">In Service</p>
              <p className="text-success-700 text-[22px] font-bold">{inServiceCount}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="bg-info-50 text-info-600 flex h-10 w-10 items-center justify-center rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">Total Value</p>
              <p className="text-[22px] font-bold text-neutral-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, tag, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-600 ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                {[categoryFilter, statusFilter, conditionFilter].filter((f) => f !== 'all').length}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | 'all')}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-4 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-4 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Condition
              </label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as AssetCondition | 'all')}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-4 focus:outline-none"
              >
                <option value="all">All Conditions</option>
                {Object.entries(conditionConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="mt-6">
        {filteredAssets.length === 0 ? (
          <EmptyState
            icon={<FileBox className="h-6 w-6" />}
            title="No assets found"
            description={
              hasActiveFilters || searchQuery
                ? 'Try adjusting your search or filters.'
                : 'Add your first building asset to start tracking depreciation and replacements.'
            }
            action={
              hasActiveFilters || searchQuery ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              )
            }
          />
        ) : (
          <DataTable<AssetItem> columns={columns} data={filteredAssets} />
        )}
      </div>
    </PageShell>
  );
}
