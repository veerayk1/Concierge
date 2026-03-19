'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Building,
  Plus,
  Download,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateDirectoryEntryDialog } from '@/components/forms/create-directory-entry-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DirectoryEntry {
  id: string;
  name: string;
  category:
    | 'management'
    | 'security'
    | 'maintenance'
    | 'amenity'
    | 'emergency'
    | 'utility'
    | 'common_area';
  phone: string;
  email: string | null;
  location: string;
  hours: string;
  contactPerson: string | null;
  notes: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  DirectoryEntry['category'],
  { variant: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'; label: string }
> = {
  management: { variant: 'primary', label: 'Management' },
  security: { variant: 'info', label: 'Security' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  amenity: { variant: 'success', label: 'Amenity' },
  emergency: { variant: 'error', label: 'Emergency' },
  utility: { variant: 'default', label: 'Utility' },
  common_area: { variant: 'primary', label: 'Common Area' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BuildingDirectoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiEntries,
    loading,
    error,
    refetch,
  } = useApi<DirectoryEntry[]>(
    apiUrl('/api/v1/building-directory', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allEntries = useMemo(() => {
    if (apiEntries && Array.isArray(apiEntries)) {
      return apiEntries;
    }
    return [];
  }, [apiEntries]);

  const filteredEntries = useMemo(
    () =>
      allEntries.filter((entry) => {
        if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            entry.name.toLowerCase().includes(q) ||
            entry.phone.includes(q) ||
            (entry.email?.toLowerCase().includes(q) ?? false) ||
            entry.location.toLowerCase().includes(q) ||
            (entry.contactPerson?.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      }),
    [allEntries, searchQuery, categoryFilter],
  );

  const totalEntries = allEntries.length;
  const activeCount = allEntries.filter((e) => e.isActive).length;
  const emergencyCount = allEntries.filter((e) => e.category === 'emergency').length;

  const columns: Column<DirectoryEntry>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[13px] font-semibold text-neutral-900">{row.name}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => {
        const cfg = CATEGORY_CONFIG[row.category];
        return (
          <Badge variant={cfg.variant} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'contactPerson',
      header: 'Contact Person',
      accessorKey: 'contactPerson',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">
          {row.contactPerson ?? <span className="text-neutral-400">--</span>}
        </span>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600">
          <Phone className="h-3.5 w-3.5 text-neutral-400" />
          {row.phone}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: (row) =>
        row.email ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600">
            <Mail className="h-3.5 w-3.5 text-neutral-400" />
            {row.email}
          </span>
        ) : (
          <span className="text-[13px] text-neutral-400">--</span>
        ),
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600">
          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
          {row.location}
        </span>
      ),
    },
    {
      id: 'hours',
      header: 'Hours',
      accessorKey: 'hours',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.hours}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: (row) =>
        row.isActive ? (
          <Badge variant="success" size="sm" dot>
            Active
          </Badge>
        ) : (
          <Badge variant="default" size="sm" dot>
            Inactive
          </Badge>
        ),
    },
  ];

  return (
    <PageShell
      title="Building Directory"
      description="Contact information for building services, staff, and common areas."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="sm" className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-6 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </Card>
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load directory"
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
                label: 'Total Entries',
                value: totalEntries,
                icon: Building,
                color: 'text-primary-600',
                bg: 'bg-primary-50',
              },
              {
                label: 'Active Services',
                value: activeCount,
                icon: Building,
                color: 'text-success-600',
                bg: 'bg-success-50',
              },
              {
                label: 'Emergency Contacts',
                value: emergencyCount,
                icon: Phone,
                color: 'text-error-600',
                bg: 'bg-error-50',
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

          {/* Search + Category Filter */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search directory..."
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
          </div>

          {/* Category Filter Bar */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-medium tracking-wider text-neutral-500 uppercase">
              Category:
            </span>
            {[
              { key: 'all', label: 'All' },
              { key: 'management', label: 'Management' },
              { key: 'security', label: 'Security' },
              { key: 'maintenance', label: 'Maintenance' },
              { key: 'amenity', label: 'Amenity' },
              { key: 'emergency', label: 'Emergency' },
              { key: 'utility', label: 'Utility' },
              { key: 'common_area', label: 'Common Area' },
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

          {/* Directory Table */}
          {filteredEntries.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredEntries}
              emptyMessage="No directory entries found."
              emptyIcon={<Building className="h-6 w-6" />}
            />
          ) : (
            <EmptyState
              icon={<Building className="h-6 w-6" />}
              title="No entries found"
              description="Try adjusting your search or filters to find what you are looking for."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
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

      <CreateDirectoryEntryDialog
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
