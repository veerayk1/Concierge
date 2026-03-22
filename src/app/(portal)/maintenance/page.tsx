'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateMaintenanceDialog } from '@/components/forms/create-maintenance-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Loader2,
  Pause,
  Plus,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { exportToCsv } from '@/lib/export-csv';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaintenanceRequest {
  id: string;
  referenceNumber: string;
  unit: string;
  resident: string;
  category: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  vendor?: string;
  createdAt: string;
  updatedAt: string;
  permissionToEnter: boolean;
}

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface MaintenanceApiResponse {
  data: Array<Record<string, unknown>>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MaintenancePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Debounce search input to avoid firing API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build API URL with search/filter params passed to the server
  const requestUrl = useMemo(() => {
    const params: Record<string, string | undefined | null> = {
      propertyId: getPropertyId(),
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter !== 'all') params.status = statusFilter;
    return apiUrl('/api/v1/maintenance', params);
  }, [debouncedSearch, statusFilter]);

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<MaintenanceApiResponse | Array<Record<string, unknown>>>(requestUrl);

  // Normalize API response — the API returns { data: [...], meta: {...} }
  // but useApi already extracts .data, so apiResponse could be the array
  // directly OR the full response object depending on shape.
  const allRequests: MaintenanceRequest[] = useMemo(() => {
    if (!apiResponse) return [];

    // useApi extracts .data from the response, so apiResponse is the array of requests
    const rawList: Array<Record<string, unknown>> = Array.isArray(apiResponse)
      ? apiResponse
      : ((apiResponse as MaintenanceApiResponse).data ?? []);

    return rawList.map((r) => ({
      id: (r.id as string) || '',
      referenceNumber: (r.referenceNumber as string) || '',
      unit: (r.unit as Record<string, string>)?.number || (r.unitId as string) || '',
      resident: (() => {
        const res = r.resident as Record<string, string> | undefined;
        if (res?.firstName && res?.lastName) return `${res.firstName} ${res.lastName}`;
        if (res?.firstName) return res.firstName;
        // Show friendly label instead of raw UUID
        const unitNum = (r.unit as Record<string, string>)?.number;
        if (r.residentId) return unitNum ? `Unit ${unitNum} Resident` : 'Resident';
        return '';
      })(),
      category: (r.category as Record<string, string>)?.name || 'General',
      description: (r.description as string) || '',
      status: (r.status as MaintenanceRequest['status']) || 'open',
      priority: (r.priority as MaintenanceRequest['priority']) || 'medium',
      assignedTo: (r.assignedEmployeeId as string) || undefined,
      vendor: (r.assignedVendorId as string) || undefined,
      createdAt: (r.createdAt as string) || '',
      updatedAt: (r.updatedAt as string) || '',
      permissionToEnter: r.permissionToEnter === true || r.permissionToEnter === 'yes',
    }));
  }, [apiResponse]);

  // Client-side search filtering is no longer needed since the API handles
  // search and status filtering. We pass the full list to the table.
  const filteredRequests = allRequests;

  const statusCounts = {
    open: allRequests.filter((r) => r.status === 'open').length,
    assigned: allRequests.filter((r) => r.status === 'assigned').length,
    in_progress: allRequests.filter((r) => r.status === 'in_progress').length,
    on_hold: allRequests.filter((r) => r.status === 'on_hold').length,
  };

  const columns: Column<MaintenanceRequest>[] = [
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
      cell: (row) => (
        <span className="font-medium">
          {typeof row.unit === 'object' && row.unit !== null
            ? (row.unit as Record<string, string>).number
            : row.unit || '—'}
        </span>
      ),
    },
    {
      id: 'resident',
      header: 'Resident',
      accessorKey: 'resident',
      sortable: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant="default" size="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Issue',
      accessorKey: 'description',
      cell: (row) => (
        <span className="line-clamp-1 max-w-[300px] text-[13px] text-neutral-600">
          {row.description}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        const map = {
          low: 'default' as const,
          medium: 'warning' as const,
          high: 'error' as const,
          urgent: 'error' as const,
        };
        return (
          <Badge variant={map[row.priority]} size="sm" dot>
            {row.priority}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const map = {
          open: { variant: 'warning' as const, label: 'Open' },
          assigned: { variant: 'info' as const, label: 'Assigned' },
          in_progress: { variant: 'primary' as const, label: 'In Progress' },
          on_hold: { variant: 'default' as const, label: 'On Hold' },
          resolved: { variant: 'success' as const, label: 'Resolved' },
          closed: { variant: 'default' as const, label: 'Closed' },
        };
        const s = map[row.status];
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'assignedTo',
      header: 'Assigned',
      accessorKey: 'assignedTo',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{row.assignedTo || 'Unassigned'}</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Maintenance Requests"
      description="Track and manage all maintenance requests across the building."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportToCsv(
                allRequests,
                [
                  { key: 'referenceNumber', header: 'Reference #' },
                  { key: 'unit', header: 'Unit' },
                  { key: 'resident', header: 'Resident' },
                  { key: 'category', header: 'Category' },
                  { key: 'description', header: 'Description' },
                  { key: 'status', header: 'Status' },
                  { key: 'priority', header: 'Priority' },
                  { key: 'createdAt', header: 'Created At' },
                ],
                'maintenance-requests',
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      }
    >
      {/* Status Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Open',
            value: statusCounts.open,
            icon: AlertCircle,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Assigned',
            value: statusCounts.assigned,
            icon: Wrench,
            color: 'text-info-600',
            bg: 'bg-info-50',
          },
          {
            label: 'In Progress',
            value: statusCounts.in_progress,
            icon: Clock,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
          },
          {
            label: 'On Hold',
            value: statusCounts.on_hold,
            icon: Pause,
            color: 'text-neutral-600',
            bg: 'bg-neutral-100',
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {loading ? '-' : stat.value}
              </p>
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search requests..."
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
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'on_hold', label: 'On Hold' },
            { key: 'resolved', label: 'Resolved' },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                statusFilter === s.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading maintenance requests...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="mt-3 text-[14px] font-medium text-red-700">Failed to load requests</p>
          <p className="mt-1 text-[13px] text-red-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Request Table — shown when not loading and no error */}
      {!loading && !error && (
        <DataTable
          columns={columns}
          data={filteredRequests}
          emptyMessage="No maintenance requests found."
          emptyIcon={<Wrench className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/maintenance/${row.id}` as never)}
        />
      )}

      <CreateMaintenanceDialog
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
