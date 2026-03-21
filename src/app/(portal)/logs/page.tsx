'use client';

import { useState, useMemo } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  ScrollText,
  Search,
  X,
  Download,
  Filter,
  User,
  Clock,
  Shield,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types matching the actual AuditEntry from /api/v1/audit-log
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string;
  propertyId: string;
  userId: string;
  actor?: string;
  action: string; // READ, CREATE, UPDATE, DELETE
  resource: string; // table name e.g. "event", "unit", "maintenance_request"
  resourceId: string;
  fields: unknown;
  ipAddress: string;
  userAgent?: string;
  piiAccessed: boolean;
  createdAt: string;
}

interface AuditResponse {
  data: AuditEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Badge Helpers
// ---------------------------------------------------------------------------

const ACTION_VARIANTS: Record<
  string,
  'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'
> = {
  READ: 'default',
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string | undefined> = {
    propertyId: getPropertyId(),
    page: String(page),
    pageSize: '50',
  };
  if (actionFilter !== 'all') queryParams.action = actionFilter;
  if (resourceFilter !== 'all') queryParams.resource = resourceFilter;

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<AuditResponse>(apiUrl('/api/v1/audit-log', queryParams));

  // The audit-log API returns { data: [...], meta: {...} } directly (not wrapped in another .data)
  // useApi extracts .data, so apiResponse is the full { data, meta } object
  const allLogs = useMemo<AuditEntry[]>(() => {
    if (!apiResponse) return [];
    // Handle both shapes: if apiResponse has .data array, use it; otherwise treat apiResponse as the array
    if (Array.isArray(apiResponse)) return apiResponse;
    if (
      apiResponse &&
      'data' in apiResponse &&
      Array.isArray((apiResponse as AuditResponse).data)
    ) {
      return (apiResponse as AuditResponse).data;
    }
    return [];
  }, [apiResponse]);

  const meta = useMemo(() => {
    if (!apiResponse) return null;
    if (apiResponse && 'meta' in apiResponse) return (apiResponse as AuditResponse).meta;
    return null;
  }, [apiResponse]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return allLogs;
    const q = searchQuery.toLowerCase();
    return allLogs.filter(
      (log) =>
        log.resource.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.userId.toLowerCase().includes(q) ||
        log.ipAddress.includes(q),
    );
  }, [allLogs, searchQuery]);

  const totalCount = meta?.total ?? allLogs.length;
  const piiCount = allLogs.filter((l) => l.piiAccessed).length;
  const deleteCount = allLogs.filter((l) => l.action === 'DELETE').length;

  const resources = [...new Set(allLogs.map((l) => l.resource))];

  const columns: Column<AuditEntry>[] = [
    {
      id: 'createdAt',
      header: 'Timestamp',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <Badge variant={ACTION_VARIANTS[row.action] || 'default'} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      accessorKey: 'resource',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-medium text-neutral-700">
          {(row.resource || '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'resourceId',
      header: 'Resource ID',
      accessorKey: 'resourceId',
      cell: (row) => (
        <span className="font-mono text-[12px] text-neutral-400">
          {(row.resourceId || '—').slice(0, 8)}
          {row.resourceId ? '...' : ''}
        </span>
      ),
    },
    {
      id: 'userId',
      header: 'User',
      accessorKey: 'userId',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          <span className="font-mono text-[12px]">
            {(row.userId || row.actor || '—').slice(0, 8)}
            {row.userId || row.actor ? '...' : ''}
          </span>
        </span>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-500">{row.ipAddress}</span>
      ),
    },
    {
      id: 'piiAccessed',
      header: 'PII',
      accessorKey: 'piiAccessed',
      cell: (row) =>
        row.piiAccessed ? (
          <Badge variant="warning" size="sm" dot>
            PII
          </Badge>
        ) : (
          <span className="text-[12px] text-neutral-300">--</span>
        ),
    },
  ];

  return (
    <PageShell
      title="Audit Log"
      description="Immutable record of all administrative actions across the platform."
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const headers = [
              'Timestamp',
              'Action',
              'Resource',
              'Resource ID',
              'User ID',
              'IP Address',
              'PII Accessed',
            ];
            const rows = filteredLogs.map((log) =>
              [
                new Date(log.createdAt).toISOString(),
                log.action,
                log.resource,
                log.resourceId,
                log.userId,
                log.ipAddress,
                log.piiAccessed ? 'Yes' : 'No',
              ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(','),
            );
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="sm" className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="mb-1 h-6 w-12" />
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
          title="Failed to load audit logs"
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
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <ScrollText className="text-primary-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {totalCount}
                </p>
                <p className="text-[13px] text-neutral-500">Total Entries</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Shield className="text-warning-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">{piiCount}</p>
                <p className="text-[13px] text-neutral-500">PII Access</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="text-error-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {deleteCount}
                </p>
                <p className="text-[13px] text-neutral-500">Deletions</p>
              </div>
            </Card>
          </div>

          {/* Search + Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search audit logs..."
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
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="READ">Read</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Resources</option>
                {resources.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionFilter('all');
                  setResourceFilter('all');
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Data Table */}
          {filteredLogs.length > 0 ? (
            <>
              <DataTable columns={columns} data={filteredLogs} />
              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[13px] text-neutral-500">
                    Page {meta.page} of {meta.totalPages} ({meta.total} total entries)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<ScrollText className="h-6 w-6" />}
              title="No audit log entries found"
              description="Audit entries will appear here as administrative actions are performed on the platform."
            />
          )}
        </>
      )}
    </PageShell>
  );
}
