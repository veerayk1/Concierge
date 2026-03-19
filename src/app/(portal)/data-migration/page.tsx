'use client';

import { useState, useMemo } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  DatabaseZap,
  Upload,
  Download,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  ArrowRight,
  Play,
  Loader2,
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

interface MigrationJob {
  id: string;
  type: 'import' | 'export' | 'migration' | 'dsar';
  source: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  recordsTotal: number;
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string;
  completedAt: string | null;
  initiatedBy: string;
  errorLog: string | null;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_JOBS: MigrationJob[] = [
  {
    id: '1',
    type: 'import',
    source: 'residents_march_2026.csv',
    status: 'completed',
    recordsTotal: 342,
    recordsProcessed: 342,
    recordsFailed: 0,
    startedAt: '2026-03-18T09:15:00Z',
    completedAt: '2026-03-18T09:18:32Z',
    initiatedBy: 'Sarah Chen',
    errorLog: null,
  },
  {
    id: '2',
    type: 'export',
    source: 'Full Property Export',
    status: 'completed',
    recordsTotal: 1847,
    recordsProcessed: 1847,
    recordsFailed: 0,
    startedAt: '2026-03-17T14:30:00Z',
    completedAt: '2026-03-17T14:35:12Z',
    initiatedBy: 'David Park',
    errorLog: null,
  },
  {
    id: '3',
    type: 'import',
    source: 'units_bulk_update.csv',
    status: 'processing',
    recordsTotal: 1200,
    recordsProcessed: 450,
    recordsFailed: 3,
    startedAt: '2026-03-19T10:00:00Z',
    completedAt: null,
    initiatedBy: 'Sarah Chen',
    errorLog: null,
  },
  {
    id: '4',
    type: 'import',
    source: 'amenities_import.csv',
    status: 'failed',
    recordsTotal: 58,
    recordsProcessed: 12,
    recordsFailed: 46,
    startedAt: '2026-03-16T11:20:00Z',
    completedAt: '2026-03-16T11:20:45Z',
    initiatedBy: 'David Park',
    errorLog: 'Row 13: Invalid date format in "available_from". Expected YYYY-MM-DD.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  MigrationJob['type'],
  { variant: 'primary' | 'info' | 'warning' | 'default'; label: string }
> = {
  import: { variant: 'primary', label: 'Import' },
  export: { variant: 'info', label: 'Export' },
  migration: { variant: 'warning', label: 'Migration' },
  dsar: { variant: 'default', label: 'DSAR' },
};

const STATUS_CONFIG: Record<
  MigrationJob['status'],
  { variant: 'default' | 'info' | 'success' | 'error' | 'warning'; label: string }
> = {
  pending: { variant: 'default', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
};

function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataMigrationPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apiJobs } = useApi<MigrationJob[]>(
    apiUrl('/api/v1/data-migration/jobs', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allJobs = useMemo(() => {
    if (apiJobs && Array.isArray(apiJobs) && apiJobs.length > 0) {
      return apiJobs;
    }
    return MOCK_JOBS;
  }, [apiJobs]);

  const filteredJobs = useMemo(
    () =>
      allJobs.filter((j) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            j.source.toLowerCase().includes(q) ||
            j.initiatedBy.toLowerCase().includes(q) ||
            j.type.toLowerCase().includes(q) ||
            j.status.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [allJobs, searchQuery],
  );

  const totalMigrations = allJobs.length;
  const successfulCount = allJobs.filter((j) => j.status === 'completed').length;
  const totalRecordsImported = allJobs
    .filter((j) => j.type === 'import' && j.status === 'completed')
    .reduce((sum, j) => sum + j.recordsProcessed, 0);

  const columns: Column<MigrationJob>[] = [
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => {
        const cfg = TYPE_CONFIG[row.type];
        return (
          <Badge variant={cfg.variant} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'source',
      header: 'Source / Target',
      accessorKey: 'source',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-semibold text-neutral-900">{row.source}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status];
        if (row.status === 'processing') {
          const pct =
            row.recordsTotal > 0 ? Math.round((row.recordsProcessed / row.recordsTotal) * 100) : 0;
          return (
            <div className="flex items-center gap-2">
              <Loader2 className="text-info-500 h-3.5 w-3.5 animate-spin" />
              <div className="flex flex-col gap-0.5">
                <span className="text-info-700 text-[12px] font-semibold">{pct}%</span>
                <div className="bg-info-100 h-1.5 w-16 overflow-hidden rounded-full">
                  <div
                    className="bg-info-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        }
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'records',
      header: 'Records',
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">
          {row.recordsProcessed.toLocaleString()}/{row.recordsTotal.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'failed',
      header: 'Failed',
      accessorKey: 'recordsFailed',
      sortable: true,
      cell: (row) => (
        <span
          className={`text-[13px] font-medium ${
            row.recordsFailed > 0 ? 'text-error-600' : 'text-neutral-400'
          }`}
        >
          {row.recordsFailed}
        </span>
      ),
    },
    {
      id: 'startedAt',
      header: 'Started',
      accessorKey: 'startedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{formatDateTime(row.startedAt)}</span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.status === 'processing' ? (
            <span className="text-info-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(row.startedAt, null)}
            </span>
          ) : row.completedAt ? (
            formatDuration(row.startedAt, row.completedAt)
          ) : (
            '-'
          )}
        </span>
      ),
    },
    {
      id: 'initiatedBy',
      header: 'Initiated By',
      accessorKey: 'initiatedBy',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.initiatedBy}</span>,
    },
  ];

  const quickActions = [
    {
      icon: Upload,
      title: 'Import Data',
      description: 'Upload CSV, Excel, or JSON files',
      buttonLabel: 'Import',
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      icon: Download,
      title: 'Export Data',
      description: 'Download property data in various formats',
      buttonLabel: 'Export',
      color: 'text-info-600',
      bg: 'bg-info-50',
    },
    {
      icon: ArrowRight,
      title: 'Migrate from Another Platform',
      description: 'Import data from other property management platforms',
      buttonLabel: 'Migrate',
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      icon: FileSpreadsheet,
      title: 'DSAR Export',
      description: 'Generate data subject access request export',
      buttonLabel: 'Generate',
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
  ];

  return (
    <PageShell
      title="Data Migration"
      description="Import, export, and migrate data between systems."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Full Export
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4" />
            New Import
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Migrations',
            value: totalMigrations,
            icon: DatabaseZap,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
          },
          {
            label: 'Successful',
            value: successfulCount,
            icon: CheckCircle2,
            color: 'text-success-600',
            bg: 'bg-success-50',
          },
          {
            label: 'Records Imported',
            value: totalRecordsImported.toLocaleString(),
            icon: FileSpreadsheet,
            color: 'text-info-600',
            bg: 'bg-info-50',
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{stat.value}</p>
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Import/Export Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Card key={action.title} padding="md" hoverable className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.bg}`}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="text-[15px] font-semibold text-neutral-900">{action.title}</h3>
                <p className="text-[13px] text-neutral-500">{action.description}</p>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0 self-center">
                {action.buttonLabel}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Migrations */}
      <div>
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Recent Migrations</h2>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search migrations..."
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

        {/* Table */}
        {filteredJobs.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredJobs}
            emptyMessage="No migration jobs found."
            emptyIcon={<DatabaseZap className="h-6 w-6" />}
          />
        ) : (
          <EmptyState
            icon={<DatabaseZap className="h-6 w-6" />}
            title="No migration jobs found"
            description="Try adjusting your search or start a new import to get started."
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
