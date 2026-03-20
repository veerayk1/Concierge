'use client';

import { useMemo, useCallback, useState } from 'react';
import { CheckCircle2, Clock, Package, AlertTriangle } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/resident/packages)
// ---------------------------------------------------------------------------

interface PackageCourier {
  id: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
}

interface PackageStorageSpot {
  id: string;
  name: string;
  code: string | null;
}

interface PackageUnit {
  id: string;
  number: string;
}

interface MyPackage {
  id: string;
  referenceNumber: string;
  description: string | null;
  status: string;
  isPerishable: boolean;
  createdAt: string;
  releasedAt: string | null;
  courier: PackageCourier | null;
  storageSpot: PackageStorageSpot | null;
  unit: PackageUnit | null;
}

interface PackagesResponse {
  data: MyPackage[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
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
};

// ---------------------------------------------------------------------------
// Age Display Helper
// ---------------------------------------------------------------------------

function getAgeDisplay(createdAt: string): {
  text: string;
  variant: 'success' | 'warning' | 'error';
} {
  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
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

export default function MyPackagesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<PackagesResponse>(
    apiUrl('/api/v1/resident/packages', {
      propertyId: getPropertyId(),
      status: statusFilter || null,
    }),
  );

  const packages = useMemo<MyPackage[]>(() => {
    if (!response) return [];
    // useApi unwraps .data already, so response may be the inner object
    const raw =
      (response as unknown as { data?: MyPackage[] }).data ?? (response as unknown as MyPackage[]);
    return Array.isArray(raw) ? raw : [];
  }, [response]);

  const waitingCount = useMemo(
    () => packages.filter((p) => p.status === 'unreleased').length,
    [packages],
  );
  const pickedUpCount = useMemo(
    () => packages.filter((p) => p.status === 'released').length,
    [packages],
  );

  const columns: Column<MyPackage>[] = [
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
      id: 'courier',
      header: 'Courier',
      accessorKey: 'courier',
      sortable: true,
      cell: (row) => {
        const name = row.courier?.name || 'Unknown';
        const colorClass = COURIER_COLORS[name] || 'bg-neutral-100 text-neutral-700';
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {name}
          </span>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="text-neutral-600">{row.description || 'Package'}</span>,
    },
    {
      id: 'receivedAt',
      header: 'Received',
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
    {
      id: 'age',
      header: 'Age',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => {
        if (row.status === 'released') {
          return <span className="text-[13px] text-neutral-400">&mdash;</span>;
        }
        const age = getAgeDisplay(row.createdAt);
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
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.storageSpot?.name || row.storageSpot?.code || '--'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        if (row.status === 'released') {
          return (
            <Badge variant="success" size="sm" dot>
              Picked Up
            </Badge>
          );
        }
        return (
          <Badge variant="warning" size="sm" dot>
            Waiting for Pickup
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => {
        if (row.status !== 'released' && row.releasedAt) {
          return null;
        }
        if (row.releasedAt) {
          return (
            <span className="text-[13px] text-neutral-400">
              {new Date(row.releasedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          );
        }
        return null;
      },
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <PageShell title="My Packages" description="Track your deliveries and pickups.">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="My Packages" description="Track your deliveries and pickups.">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load packages"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="My Packages" description="Track your deliveries and pickups.">
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Clock className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{waitingCount}</p>
            <p className="text-[13px] text-neutral-500">Waiting for Pickup</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{pickedUpCount}</p>
            <p className="text-[13px] text-neutral-500">Picked Up</p>
          </div>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        {[
          { value: '', label: 'All' },
          { value: 'unreleased', label: 'Waiting' },
          { value: 'released', label: 'Picked Up' },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
              statusFilter === filter.value
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Packages Table */}
      {packages.length > 0 ? (
        <DataTable
          columns={columns}
          data={packages}
          emptyMessage="You have no packages."
          emptyIcon={<Package className="h-6 w-6" />}
        />
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No packages"
          description={
            statusFilter
              ? 'No packages match the selected filter.'
              : 'You have no packages at this time.'
          }
        />
      )}
    </PageShell>
  );
}
