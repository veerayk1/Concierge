'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Package, AlertTriangle } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiTile } from '@/components/ui/kpi-tile';

// Demo seed data leaks test prefixes ("QA-TEST: ...", "CHAIN-C10: ...",
// "UI-CHAIN-E:...", "EXH-C:...") into a real resident's package list.
// Same regex pattern used by the dashboard; kept colocated rather than
// pulled into a shared helper because the helper would have to grow per
// page anyway.
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;
const TEST_SUBSTRING_PATTERN = /\btest (event|notice|announcement|item|run|data|package)\b/i;

function isTestSeedTitle(title: string | undefined | null): boolean {
  if (!title) return false;
  const t = title.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

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
  // Residents care about waiting packages first; pickup history is secondary.
  // Default the filter to "Waiting" so the page leads with what needs action.
  const [statusFilter, setStatusFilter] = useState<string>('unreleased');

  // Fetch ALL packages (no status filter) so the KPI counts stay accurate
  // regardless of which tab is active. Counts and list both filter
  // client-side; a resident's package list is small enough that there's
  // no payload cost to skipping the server-side filter.
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<PackagesResponse>(
    apiUrl('/api/v1/resident/packages', {
      propertyId: getPropertyId(),
    }),
  );

  const allPackages = useMemo<MyPackage[]>(() => {
    if (!response) return [];
    // useApi unwraps .data already, so response may be the inner object
    const raw =
      (response as unknown as { data?: MyPackage[] }).data ?? (response as unknown as MyPackage[]);
    const list = Array.isArray(raw) ? raw : [];
    // Drop seed/test packages — QA tests pollute the demo property's
    // package log heavily, and a real resident should never see
    // "QA-TEST: brown box 30x20" or "CHAIN-C10: Perishable grocery delivery".
    return list.filter((p) => !isTestSeedTitle(p.description));
  }, [response]);

  const waitingCount = useMemo(
    () => allPackages.filter((p) => p.status === 'unreleased').length,
    [allPackages],
  );
  const pickedUpCount = useMemo(
    () => allPackages.filter((p) => p.status === 'released').length,
    [allPackages],
  );

  const packages = useMemo<MyPackage[]>(() => {
    if (!statusFilter) return allPackages;
    return allPackages.filter((p) => p.status === statusFilter);
  }, [allPackages, statusFilter]);

  const columns: Column<MyPackage>[] = [
    {
      id: 'description',
      header: 'Package',
      accessorKey: 'description',
      cell: (row) => {
        const courierName = row.courier?.name;
        const showCourier = courierName && courierName !== 'Unknown';
        const colorClass = showCourier
          ? COURIER_COLORS[courierName] || 'bg-neutral-100 text-neutral-700'
          : '';
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[14px] font-medium text-neutral-900">
              {row.description || 'Package'}
            </span>
            {showCourier && (
              <span
                className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${colorClass}`}
              >
                {courierName}
              </span>
            )}
          </div>
        );
      },
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
      header: 'Waiting',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => {
        if (row.status === 'released') {
          return <span className="text-[13px] text-neutral-300">—</span>;
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
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-right',
      cell: (row) => {
        if (row.status === 'released') {
          // Roll the pickup timestamp into the status cell instead of a
          // separate column — residents want one glance: "picked up,
          // when".
          return (
            <div className="flex flex-col items-end gap-0.5">
              <Badge variant="success" size="sm" dot>
                Picked up
              </Badge>
              {row.releasedAt && (
                <span className="text-[11.5px] text-neutral-400">
                  {new Date(row.releasedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          );
        }
        return (
          <Badge variant="warning" size="sm" dot>
            Waiting
          </Badge>
        );
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
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiTile
          label="Waiting for pickup"
          value={waitingCount}
          icon={Clock}
          accent={waitingCount > 0 ? 'warning' : 'neutral'}
          caption={
            waitingCount > 0 ? 'Stop by the front desk to pick up.' : 'Nothing waiting for you.'
          }
        />
        <KpiTile
          label="Picked up"
          value={pickedUpCount}
          icon={CheckCircle2}
          accent="neutral"
          caption="Recent pickup history."
        />
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        {[
          { value: 'unreleased', label: 'Waiting' },
          { value: 'released', label: 'Picked up' },
          { value: '', label: 'All' },
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
          title={
            statusFilter === 'unreleased'
              ? 'Nothing waiting for you.'
              : statusFilter === 'released'
                ? 'No pickup history yet.'
                : 'No packages.'
          }
          description={
            statusFilter === 'unreleased'
              ? "We'll let you know the moment something arrives."
              : statusFilter === 'released'
                ? 'Once you pick up your first delivery it will show up here.'
                : 'You have no packages at this time.'
          }
        />
      )}
    </PageShell>
  );
}
