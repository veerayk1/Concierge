'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  Plus,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { CreateVendorDialog } from '@/components/forms/create-vendor-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { exportToCsv } from '@/lib/export-csv';

// ---------------------------------------------------------------------------
// Types — mapped from API response (Prisma Vendor + relations)
// ---------------------------------------------------------------------------

interface VendorDocument {
  id: string;
  documentType: string;
  expiryDate: string | null;
}

interface VendorItem {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  complianceStatus: 'compliant' | 'not_compliant' | 'expiring' | 'expired' | 'not_tracking';
  serviceCategory: { id: string; name: string } | null;
  documents: VendorDocument[];
  streetAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  compliant: { variant: 'success', label: 'Compliant' },
  not_compliant: { variant: 'error', label: 'Non-Compliant' },
  expiring: { variant: 'warning', label: 'Expiring' },
  expired: { variant: 'error', label: 'Expired' },
  not_tracking: { variant: 'default', label: 'Not Tracking' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiVendors,
    loading,
    error,
    refetch,
  } = useApi<VendorItem[]>(
    apiUrl('/api/v1/vendors', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  );

  const allVendors = useMemo<VendorItem[]>(() => apiVendors ?? [], [apiVendors]);

  // Client-side category filter (API uses categoryId, we filter by name here)
  const filteredVendors = useMemo(
    () =>
      allVendors.filter((v) => {
        if (categoryFilter !== 'all') {
          const catName = v.serviceCategory?.name?.toLowerCase() ?? '';
          if (catName !== categoryFilter.toLowerCase()) return false;
        }
        return true;
      }),
    [allVendors, categoryFilter],
  );

  const totalVendors = allVendors.length;
  const compliantCount = allVendors.filter((v) => v.complianceStatus === 'compliant').length;
  const expiringCount = allVendors.filter((v) => v.complianceStatus === 'expiring').length;

  // Find the nearest expiring document for display
  function getNextExpiry(docs: VendorDocument[]): string | null {
    const expiring = docs
      .filter((d) => d.expiryDate)
      .map((d) => d.expiryDate!)
      .sort();
    return expiring[0] ?? null;
  }

  const columns: Column<VendorItem>[] = [
    {
      id: 'companyName',
      header: 'Name',
      accessorKey: 'companyName',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-semibold text-neutral-900">{row.companyName}</span>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => (
        <Badge variant="default" size="sm">
          {row.serviceCategory?.name ?? 'Uncategorized'}
        </Badge>
      ),
    },
    {
      id: 'contactName',
      header: 'Contact',
      accessorKey: 'contactName',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">{row.contactName ?? '\u2014'}</span>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.phone ?? '\u2014'}</span>,
    },
    {
      id: 'complianceStatus',
      header: 'Compliance',
      accessorKey: 'complianceStatus',
      sortable: true,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.complianceStatus] ?? {
          variant: 'default' as const,
          label: row.complianceStatus,
        };
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'nextExpiry',
      header: 'Next Expiry',
      cell: (row) => {
        const expiry = getNextExpiry(row.documents);
        return expiry ? (
          <span className="text-[13px] text-neutral-500">
            {new Date(expiry).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-[13px] text-neutral-400">{'\u2014'}</span>
        );
      },
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.email ?? '\u2014'}</span>,
    },
  ];

  return (
    <PageShell
      title="Vendors"
      description="Manage vendor relationships, contracts, and compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportToCsv(
                filteredVendors,
                [
                  { key: 'companyName', header: 'Company Name' },
                  { key: 'contactName', header: 'Contact Name' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'email', header: 'Email' },
                  { key: 'complianceStatus', header: 'Compliance Status' },
                ],
                'vendors',
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading vendors...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load vendors"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Total Vendors',
                value: totalVendors,
                icon: Truck,
                color: 'text-primary-600',
                bg: 'bg-primary-50',
              },
              {
                label: 'Compliant',
                value: compliantCount,
                icon: CheckCircle2,
                color: 'text-success-600',
                bg: 'bg-success-50',
              },
              {
                label: 'Expiring Soon',
                value: expiringCount,
                icon: AlertTriangle,
                color: 'text-warning-600',
                bg: 'bg-warning-50',
              },
            ].map((stat) => (
              <Card key={stat.label} padding="sm" className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                    {stat.value}
                  </p>
                  <p className="text-[13px] text-neutral-500">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Search + Filter Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search vendors..."
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
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                showFilters
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium tracking-wider text-neutral-500 uppercase">
                  Status:
                </span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'compliant', label: 'Compliant' },
                  { key: 'non_compliant', label: 'Non-Compliant' },
                  { key: 'expiring', label: 'Expiring' },
                  { key: 'expired', label: 'Expired' },
                  { key: 'not_tracking', label: 'Not Tracking' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatusFilter(s.key)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                      statusFilter === s.key
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-white text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium tracking-wider text-neutral-500 uppercase">
                  Category:
                </span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'plumbing', label: 'Plumbing' },
                  { key: 'electrical', label: 'Electrical' },
                  { key: 'elevator', label: 'Elevator' },
                  { key: 'hvac', label: 'HVAC' },
                  { key: 'cleaning', label: 'Cleaning' },
                  { key: 'landscaping', label: 'Landscaping' },
                  { key: 'general', label: 'General' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategoryFilter(c.key)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                      categoryFilter === c.key
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-white text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Table */}
          {filteredVendors.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredVendors}
              emptyMessage="No vendors found."
              emptyIcon={<Truck className="h-6 w-6" />}
              onRowClick={(row) => router.push(`/vendors/${row.id}` as never)}
            />
          ) : (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No vendors found"
              description="Try adjusting your search or filters to find what you are looking for."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          )}
        </>
      )}
      <CreateVendorDialog
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
