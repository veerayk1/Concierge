'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { CreatePackageDialog } from '@/components/forms/create-package-dialog';
import { BatchPackageDialog } from '@/components/forms/batch-package-dialog';
import { ReleasePackageDialog } from '@/components/forms/release-package-dialog';
import {
  Download,
  Filter,
  Inbox,
  Loader2,
  Package,
  Plus,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
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

/** Shape after normalizing the API response for display */
interface PackageItem {
  id: string;
  referenceNumber: string;
  unit: string;
  recipient: string;
  courier: string;
  description: string;
  receivedAt: string;
  ageHours: number;
  storageSpot: string;
  isPerishable: boolean;
  isOversized: boolean;
  status: 'unreleased' | 'released' | 'returned' | 'disposed';
  releasedTo?: string;
  releasedAt?: string;
  releasedBy?: string;
}

/** Raw shape returned from GET /api/v1/packages */
interface ApiPackage {
  id: string;
  referenceNumber: string;
  status: string;
  description: string | null;
  isPerishable: boolean;
  isOversized: boolean;
  createdAt: string;
  releasedAt: string | null;
  releasedToName: string | null;
  releasedById: string | null;
  unit: { id: string; number: string } | null;
  courier: { id: string; name: string; iconUrl?: string; color?: string } | null;
  storageSpot: { id: string; name: string; code?: string } | null;
  parcelCategory: { id: string; name: string } | null;
}

/**
 * Normalize the API response into the flat PackageItem shape used by the UI.
 */
function normalizePackage(raw: ApiPackage): PackageItem {
  const receivedDate = new Date(raw.createdAt);
  const ageMs = Date.now() - receivedDate.getTime();
  const ageHours =
    raw.status === 'unreleased' ? Math.max(0, Math.floor(ageMs / (1000 * 60 * 60))) : 0;

  return {
    id: raw.id,
    referenceNumber: raw.referenceNumber,
    unit: raw.unit?.number ?? 'N/A',
    recipient: raw.releasedToName ?? '',
    courier: raw.courier?.name ?? 'Other',
    description: raw.parcelCategory?.name ?? raw.description ?? '',
    receivedAt: raw.createdAt,
    ageHours,
    storageSpot: raw.storageSpot?.name ?? '',
    isPerishable: raw.isPerishable,
    isOversized: raw.isOversized,
    status: raw.status as PackageItem['status'],
    releasedTo: raw.releasedToName ?? undefined,
    releasedAt: raw.releasedAt ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Courier Colors
// ---------------------------------------------------------------------------

const COURIER_COLORS: Record<string, string> = {
  Amazon: 'bg-orange-100 text-orange-700',
  'Canada Post': 'bg-red-100 text-red-700',
  FedEx: 'bg-purple-100 text-purple-700',
  UPS: 'bg-amber-100 text-amber-800',
  DHL: 'bg-yellow-100 text-yellow-700',
  'Uber Eats': 'bg-neutral-800 text-white',
  DoorDash: 'bg-red-100 text-red-700',
  Purolator: 'bg-red-100 text-red-700',
  USPS: 'bg-blue-100 text-blue-700',
};

// ---------------------------------------------------------------------------
// Age Display Helper
// ---------------------------------------------------------------------------

function getAgeDisplay(hours: number): { text: string; variant: 'success' | 'warning' | 'error' } {
  if (hours < 24) {
    return { text: `${hours}h`, variant: 'success' };
  } else if (hours < 72) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h`, variant: 'warning' };
  } else {
    const days = Math.floor(hours / 24);
    return { text: `${days}d`, variant: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PackagesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('');
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<PackageItem | null>(null);

  // Debounce search input so we don't fire API calls on every keystroke
  const searchTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef[0]) clearTimeout(searchTimerRef[0]);
    searchTimerRef[0] = setTimeout(() => setDebouncedSearch(value), 300);
  };

  // Build API URL with all active filters
  const fetchUrl = useMemo(
    () =>
      apiUrl('/api/v1/packages', {
        propertyId: DEMO_PROPERTY_ID,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        courierId: courierFilter || undefined,
        perishable: perishableOnly ? 'true' : undefined,
        pageSize: '200',
      }),
    [debouncedSearch, statusFilter, courierFilter, perishableOnly],
  );

  const { data: apiPackages, loading, error, refetch } = useApi<ApiPackage[]>(fetchUrl);

  const allPackages = useMemo<PackageItem[]>(
    () => (apiPackages ?? []).map(normalizePackage),
    [apiPackages],
  );

  const unreleasedPackages = useMemo(
    () => allPackages.filter((p) => p.status === 'unreleased'),
    [allPackages],
  );

  const releasedPackages = useMemo(
    () => allPackages.filter((p) => p.status === 'released'),
    [allPackages],
  );

  const unreleasedColumns: Column<PackageItem>[] = [
    {
      id: 'referenceNumber',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 font-mono text-[13px] font-semibold">
          {row.referenceNumber}
        </span>
      ),
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.unit}</span>,
    },
    {
      id: 'recipient',
      header: 'Recipient',
      accessorKey: 'recipient',
      sortable: true,
    },
    {
      id: 'courier',
      header: 'Courier',
      accessorKey: 'courier',
      sortable: true,
      cell: (row) => {
        const colorClass = COURIER_COLORS[row.courier] || 'bg-neutral-100 text-neutral-700';
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {row.courier}
          </span>
        );
      },
    },
    {
      id: 'description',
      header: 'Type',
      accessorKey: 'description',
      cell: (row) => <span className="text-neutral-500">{row.description}</span>,
    },
    {
      id: 'receivedAt',
      header: 'Received',
      accessorKey: 'receivedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.receivedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      id: 'age',
      header: 'Age',
      accessorKey: 'ageHours',
      sortable: true,
      cell: (row) => {
        const age = getAgeDisplay(row.ageHours);
        return (
          <Badge variant={age.variant} size="sm" dot>
            {age.text}
          </Badge>
        );
      },
    },
    {
      id: 'storage',
      header: 'Storage',
      accessorKey: 'storageSpot',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.storageSpot}</span>,
    },
    {
      id: 'flags',
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.isPerishable && (
            <Badge variant="error" size="sm">
              Perishable
            </Badge>
          )}
          {row.isOversized && (
            <Badge variant="warning" size="sm">
              Oversized
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setReleaseTarget(row);
          }}
        >
          Release
        </Button>
      ),
    },
  ];

  const releasedColumns: Column<PackageItem>[] = [
    {
      id: 'referenceNumber',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-500">{row.referenceNumber}</span>
      ),
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
    },
    {
      id: 'recipient',
      header: 'Recipient',
      accessorKey: 'recipient',
      sortable: true,
    },
    {
      id: 'courier',
      header: 'Courier',
      accessorKey: 'courier',
      sortable: true,
    },
    {
      id: 'releasedTo',
      header: 'Released To',
      accessorKey: 'releasedTo',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="text-success-500 h-3.5 w-3.5" />
          {row.releasedTo}
        </span>
      ),
    },
    {
      id: 'releasedAt',
      header: 'Released',
      accessorKey: 'releasedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.releasedAt
            ? new Date(row.releasedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : '\u2014'}
        </span>
      ),
    },
    {
      id: 'releasedBy',
      header: 'By',
      accessorKey: 'releasedBy',
      cell: (row) => <span className="text-neutral-500">{row.releasedBy}</span>,
    },
  ];

  return (
    <PageShell
      title="Packages"
      description="Track and manage all deliveries across the building."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBatchDialog(true)}>
            <Package className="h-4 w-4" />
            Batch Intake
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Package
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Clock className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {unreleasedPackages.length}
            </p>
            <p className="text-[13px] text-neutral-500">Unreleased</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {releasedPackages.length}
            </p>
            <p className="text-[13px] text-neutral-500">Released today</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {allPackages.filter((p) => p.isPerishable && p.status === 'unreleased').length}
            </p>
            <p className="text-[13px] text-neutral-500">Perishable</p>
          </div>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, unit, ref #, or courier..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="unreleased">Unreleased</option>
            <option value="released">Released</option>
          </select>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
          >
            <option value="">All Couriers</option>
            <option value="amazon">Amazon</option>
            <option value="fedex">FedEx</option>
            <option value="ups">UPS</option>
            <option value="canada-post">Canada Post</option>
            <option value="dhl">DHL</option>
          </select>
          <label className="flex items-center gap-2 text-[13px] text-neutral-600">
            <input
              type="checkbox"
              checked={perishableOnly}
              onChange={(e) => setPerishableOnly(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Perishable only
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setCourierFilter('');
              setPerishableOnly(false);
              setSearchQuery('');
              setDebouncedSearch('');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading packages...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">Failed to load packages</p>
          <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty State — no packages at all */}
      {!loading && !error && allPackages.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No packages found"
          description={
            debouncedSearch || statusFilter !== 'all' || courierFilter || perishableOnly
              ? 'No packages match your current filters. Try adjusting your search or clearing filters.'
              : 'No packages have been logged yet. Click "New Package" to get started.'
          }
        />
      )}

      {/* Package Tables — only shown when data is loaded */}
      {!loading && !error && allPackages.length > 0 && (
        <>
          {/* Unreleased Section */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-neutral-900">Unreleased Packages</h2>
              <Badge variant="warning" size="sm">
                {unreleasedPackages.length}
              </Badge>
            </div>
            {unreleasedPackages.length > 0 ? (
              <DataTable
                columns={unreleasedColumns}
                data={unreleasedPackages}
                onRowClick={(row) => router.push(`/packages/${row.id}` as never)}
              />
            ) : (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="No unreleased packages"
                description="All packages have been released. New deliveries will appear here."
              />
            )}
          </div>

          {/* Released Section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-neutral-900">Released Packages</h2>
              <Badge variant="success" size="sm">
                {releasedPackages.length}
              </Badge>
              <span className="text-[12px] text-neutral-400">Past 30 days</span>
            </div>
            {releasedPackages.length > 0 ? (
              <DataTable
                columns={releasedColumns}
                data={releasedPackages}
                onRowClick={(row) => router.push(`/packages/${row.id}` as never)}
              />
            ) : (
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="No released packages"
                description="Released packages from the past 30 days will appear here."
              />
            )}
          </div>
        </>
      )}

      <CreatePackageDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
      <BatchPackageDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowBatchDialog(false);
          refetch();
        }}
      />
      {releaseTarget && (
        <ReleasePackageDialog
          open={!!releaseTarget}
          onOpenChange={(open) => {
            if (!open) setReleaseTarget(null);
          }}
          packageId={releaseTarget.id}
          packageRef={releaseTarget.referenceNumber}
          recipientName={releaseTarget.recipient}
          unitNumber={releaseTarget.unit}
          onSuccess={() => {
            setReleaseTarget(null);
            refetch();
          }}
        />
      )}
    </PageShell>
  );
}
