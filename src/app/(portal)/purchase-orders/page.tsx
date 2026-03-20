'use client';

import { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreatePurchaseOrderDialog } from '@/components/forms/create-purchase-order-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type POCategory = 'maintenance' | 'cleaning' | 'office' | 'safety' | 'landscaping' | 'other';
type POStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled';
type POPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Raw shape from GET /api/v1/purchase-orders */
interface ApiPurchaseOrder {
  id: string;
  referenceNumber: string;
  status: string;
  budgetCategory: string;
  priority: string;
  totalAmount: number;
  notes: string | null;
  expectedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  vendor: { id: string; companyName: string } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  attachments: unknown[];
}

interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  vendor: string;
  description: string;
  category: POCategory;
  status: POStatus;
  amount: number;
  requestedBy: string;
  requestedDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
  expectedDelivery: string | null;
  priority: POPriority;
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizePO(raw: ApiPurchaseOrder): PurchaseOrderItem {
  const categoryMap: Record<string, POCategory> = {
    maintenance: 'maintenance',
    cleaning: 'cleaning',
    office: 'office',
    safety: 'safety',
    landscaping: 'landscaping',
  };

  return {
    id: raw.id,
    poNumber: raw.referenceNumber,
    vendor: raw.vendor?.companyName ?? 'Unknown Vendor',
    description: raw.items?.[0]?.description ?? raw.notes ?? '',
    category: categoryMap[raw.budgetCategory?.toLowerCase()] ?? 'other',
    status: raw.status as POStatus,
    amount: raw.totalAmount,
    requestedBy: raw.createdById ?? 'System',
    requestedDate: raw.createdAt,
    approvedBy: raw.approvedById ?? null,
    approvedDate: raw.approvedAt ?? null,
    expectedDelivery: raw.expectedDelivery,
    priority: (raw.priority as POPriority) || 'normal',
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<POCategory, 'info' | 'warning' | 'success' | 'error'> = {
  maintenance: 'info',
  cleaning: 'success',
  office: 'warning',
  safety: 'error',
  landscaping: 'success',
  other: 'info',
};

const CATEGORY_LABELS: Record<POCategory, string> = {
  maintenance: 'Maintenance',
  cleaning: 'Cleaning',
  office: 'Office',
  safety: 'Safety',
  landscaping: 'Landscaping',
  other: 'Other',
};

const STATUS_COLORS: Record<POStatus, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
  draft: 'default',
  pending_approval: 'warning',
  approved: 'success',
  ordered: 'info',
  received: 'success',
  cancelled: 'error',
};

const STATUS_LABELS: Record<POStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ordered: 'Ordered',
  received: 'Received',
  cancelled: 'Cancelled',
};

const PRIORITY_COLORS: Record<POPriority, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
};

const PRIORITY_LABELS: Record<POPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<POCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<POPriority | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiPurchaseOrders,
    loading,
    error,
    refetch,
  } = useApi<ApiPurchaseOrder[]>(
    apiUrl('/api/v1/purchase-orders', { propertyId: getPropertyId(), pageSize: '200' }),
  );

  const allPurchaseOrders = useMemo<PurchaseOrderItem[]>(
    () => (apiPurchaseOrders ?? []).map(normalizePO),
    [apiPurchaseOrders],
  );

  const filteredPurchaseOrders = useMemo(() => {
    return allPurchaseOrders.filter((po) => {
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && po.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && po.priority !== priorityFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.vendor.toLowerCase().includes(q) ||
        po.description.toLowerCase().includes(q) ||
        po.requestedBy.toLowerCase().includes(q)
      );
    });
  }, [allPurchaseOrders, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const totalCount = allPurchaseOrders.length;
  const pendingCount = allPurchaseOrders.filter((po) => po.status === 'pending_approval').length;
  const totalSpend = allPurchaseOrders
    .filter((po) => po.status !== 'cancelled' && po.status !== 'draft')
    .reduce((sum, po) => sum + po.amount, 0);

  const hasActiveFilters =
    statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all';

  const columns: Column<PurchaseOrderItem>[] = [
    {
      id: 'poNumber',
      header: 'PO #',
      accessorKey: 'poNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 font-mono text-[13px] font-semibold">{row.poNumber}</span>
      ),
    },
    {
      id: 'vendor',
      header: 'Vendor',
      accessorKey: 'vendor',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-semibold text-neutral-900">{row.vendor}</span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span
          className="block max-w-[240px] truncate text-[13px] text-neutral-600"
          title={row.description}
        >
          {row.description}
        </span>
      ),
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
      id: 'amount',
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-semibold text-neutral-900">
          {formatCurrency(row.amount)}
        </span>
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
      id: 'requestedDate',
      header: 'Date',
      accessorKey: 'requestedDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.requestedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => (
        <Badge variant={PRIORITY_COLORS[row.priority]} size="sm">
          {PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell
      title="Purchase Orders"
      description="Create and track purchase orders for building supplies and services."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New PO
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <ShoppingCart className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            )}
            <p className="text-[13px] text-neutral-500">Total POs</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Clock className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {pendingCount}
              </p>
            )}
            <p className="text-[13px] text-neutral-500">Pending Approval</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <DollarSign className="text-success-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {formatCurrency(totalSpend)}
              </p>
            )}
            <p className="text-[13px] text-neutral-500">Total Spend</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search purchase orders..."
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
                (categoryFilter !== 'all' ? 1 : 0) +
                (priorityFilter !== 'all' ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
              setPriorityFilter('all');
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
              onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-[13px] font-medium text-neutral-600">
              Category:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as POCategory | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="office">Office</option>
              <option value="safety">Safety</option>
              <option value="landscaping">Landscaping</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="priority-filter" className="text-[13px] font-medium text-neutral-600">
              Priority:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as POPriority | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading purchase orders...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">
            Failed to load purchase orders
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allPurchaseOrders.length === 0 && (
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="No purchase orders yet"
          description="Create your first purchase order to track building expenses."
          action={
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              New PO
            </Button>
          }
        />
      )}

      {/* Data Table */}
      {!loading && !error && allPurchaseOrders.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredPurchaseOrders}
          emptyMessage="No purchase orders found."
          emptyIcon={<ShoppingCart className="h-6 w-6" />}
        />
      )}

      <CreatePurchaseOrderDialog
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
