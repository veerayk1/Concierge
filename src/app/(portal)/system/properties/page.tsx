'use client';

import { useState, useMemo } from 'react';
import { Building2, Plus, Upload, Search, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/properties)
// ---------------------------------------------------------------------------

interface PropertyFromApi {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  unitCount: number;
  timezone: string;
  logo: string | null;
  type: string; // PRODUCTION, DEMO, SANDBOX
  subscriptionTier: string | null;
  slug: string | null;
  branding: unknown;
  propertyCode: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeVariant(type: string): 'primary' | 'info' | 'warning' | 'default' {
  switch (type.toUpperCase()) {
    case 'PRODUCTION':
      return 'primary';
    case 'DEMO':
      return 'info';
    case 'SANDBOX':
      return 'warning';
    default:
      return 'default';
  }
}

function subscriptionVariant(sub: string | null): 'default' | 'primary' | 'info' {
  switch (sub?.toUpperCase()) {
    case 'STARTER':
      return 'default';
    case 'PROFESSIONAL':
      return 'primary';
    case 'ENTERPRISE':
      return 'info';
    default:
      return 'default';
  }
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: Column<PropertyFromApi>[] = [
  {
    id: 'name',
    header: 'Property',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium text-neutral-900">{row.name}</p>
        <p className="text-[12px] text-neutral-500">
          {row.address}, {row.city}
          {row.province ? `, ${row.province}` : ''}
        </p>
      </div>
    ),
  },
  {
    id: 'unitCount',
    header: 'Units',
    accessorKey: 'unitCount',
    sortable: true,
    cell: (row) => <span className="font-medium text-neutral-900">{row.unitCount}</span>,
  },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    sortable: true,
    cell: (row) => (
      <Badge variant={typeVariant(row.type)} size="sm">
        {row.type.charAt(0) + row.type.slice(1).toLowerCase()}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={row.isActive ? 'success' : 'default'} size="sm" dot>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'subscription',
    header: 'Subscription',
    accessorKey: 'subscriptionTier',
    sortable: true,
    cell: (row) => {
      if (!row.subscriptionTier) {
        return <span className="text-[13px] text-neutral-400">--</span>;
      }
      const tierLabel =
        row.subscriptionTier.charAt(0).toUpperCase() + row.subscriptionTier.slice(1).toLowerCase();
      return (
        <Badge variant={subscriptionVariant(row.subscriptionTier)} size="sm">
          {tierLabel}
        </Badge>
      );
    },
  },
  {
    id: 'createdAt',
    header: 'Created',
    accessorKey: 'createdAt',
    sortable: true,
    cell: (row) => (
      <span className="text-[13px] text-neutral-500">{formatRelativeTime(row.createdAt)}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch properties from API with search param
  const {
    data: apiProperties,
    loading,
    error,
    refetch,
  } = useApi<PropertyFromApi[]>(
    apiUrl('/api/v1/properties', {
      search: searchQuery || null,
    }),
  );

  const properties: PropertyFromApi[] = useMemo(() => {
    if (!apiProperties) return [];
    return Array.isArray(apiProperties) ? apiProperties : [];
  }, [apiProperties]);

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.isActive).length;
  const demoProperties = properties.filter((p) => p.type === 'DEMO' || p.type === 'SANDBOX').length;
  const totalUnits = properties.reduce((sum, p) => sum + p.unitCount, 0);

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Properties"
        description="Manage all properties in your portfolio."
        actions={
          <>
            <Button variant="secondary">
              <Upload className="h-4 w-4" />
              Import Property
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Properties" description="Manage all properties in your portfolio.">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load properties"
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
    <PageShell
      title="Properties"
      description="Manage all properties in your portfolio."
      actions={
        <>
          <Button variant="secondary">
            <Upload className="h-4 w-4" />
            Import Property
          </Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Total Properties</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Activity className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {activeProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Active</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <BarChart3 className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {demoProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Demo / Sandbox</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalUnits}</p>
            <p className="text-[13px] text-neutral-500">Total Units</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
        </div>
      </div>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties found"
          description={
            searchQuery
              ? 'No properties match your search. Try a different query.'
              : 'Add your first property to get started.'
          }
          action={
            !searchQuery ? (
              <Button>
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable<PropertyFromApi>
          columns={columns}
          data={properties}
          emptyMessage="No properties found."
          emptyIcon={<Building2 className="h-6 w-6" />}
          onRowClick={(row) => {
            console.log('Navigate to property:', row.id);
          }}
        />
      )}
    </PageShell>
  );
}
