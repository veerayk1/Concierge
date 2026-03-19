'use client';

import { useState, useMemo } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
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
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogEntry {
  id: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import';
  module: string;
  description: string;
  user: string;
  userRole: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

// ---------------------------------------------------------------------------
// Badge Helpers
// ---------------------------------------------------------------------------

const ACTION_VARIANTS: Record<
  LogEntry['action'],
  'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'
> = {
  login: 'success',
  logout: 'default',
  create: 'primary',
  update: 'info',
  delete: 'error',
  view: 'default',
  export: 'warning',
  import: 'info',
};

const SEVERITY_VARIANTS: Record<LogEntry['severity'], 'default' | 'warning' | 'error'> = {
  info: 'default',
  warning: 'warning',
  error: 'error',
  critical: 'error',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: apiLogs,
    loading,
    error,
    refetch,
  } = useApi<LogEntry[]>(apiUrl('/api/v1/events', { propertyId: DEMO_PROPERTY_ID }));

  const allLogs = useMemo<LogEntry[]>(() => apiLogs ?? [], [apiLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.description.toLowerCase().includes(q) ||
          log.user.toLowerCase().includes(q) ||
          log.module.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allLogs, actionFilter, severityFilter, moduleFilter, searchQuery]);

  const totalEventsToday = allLogs.length;
  const warningCount = allLogs.filter((l) => l.severity === 'warning').length;
  const errorCount = allLogs.filter(
    (l) => l.severity === 'error' || l.severity === 'critical',
  ).length;

  const modules = [...new Set(allLogs.map((l) => l.module))];

  const columns: Column<LogEntry>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-500">
          {new Date(row.timestamp).toLocaleString('en-US', {
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
        <Badge variant={ACTION_VARIANTS[row.action]} size="sm">
          {row.action.charAt(0).toUpperCase() + row.action.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'module',
      header: 'Module',
      accessorKey: 'module',
      sortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.description}</span>,
    },
    {
      id: 'user',
      header: 'User',
      accessorKey: 'user',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-neutral-400" />
          {row.user}
        </span>
      ),
    },
    {
      id: 'userRole',
      header: 'Role',
      accessorKey: 'userRole',
      cell: (row) => (
        <Badge variant="default" size="sm">
          {row.userRole}
        </Badge>
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
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: (row) => (
        <Badge variant={SEVERITY_VARIANTS[row.severity]} size="sm" dot>
          {row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell
      title="Logs"
      description="System audit trail and activity logs."
      actions={
        <Button variant="secondary" size="sm">
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
          title="Failed to load logs"
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
                  {totalEventsToday}
                </p>
                <p className="text-[13px] text-neutral-500">Total Events Today</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Shield className="text-warning-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {warningCount}
                </p>
                <p className="text-[13px] text-neutral-500">Warnings</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="text-error-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {errorCount}
                </p>
                <p className="text-[13px] text-neutral-500">Errors</p>
              </div>
            </Card>
          </div>

          {/* Search + Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search logs..."
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
            <div className="flex items-center gap-1.5">
              {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${dateRange === range ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
                <option value="export">Export</option>
                <option value="import">Import</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Severity</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Modules</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionFilter('all');
                  setSeverityFilter('all');
                  setModuleFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Data Table */}
          {filteredLogs.length > 0 ? (
            <DataTable columns={columns} data={filteredLogs} />
          ) : (
            <EmptyState
              icon={<ScrollText className="h-6 w-6" />}
              title="No log entries found"
              description="System activity logs will appear here as users interact with the platform."
            />
          )}
        </>
      )}
    </PageShell>
  );
}
