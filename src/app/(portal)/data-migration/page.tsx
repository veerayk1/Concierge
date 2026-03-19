'use client';

import { useState, useMemo } from 'react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
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
  Loader2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Types (aligned with API response)
// ---------------------------------------------------------------------------

interface MigrationJob {
  id: string;
  jobType: string; // 'import' | 'export' | 'migration' | 'dsar'
  type?: string;
  fileName?: string;
  status: string; // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  createdAt: string;
  completedAt?: string | null;
  createdBy?: string;
  errorLog?: string | null;
  // Fallback fields from different table shapes
  recordsTotal?: number;
  recordsProcessed?: number;
  recordsFailed?: number;
  startedAt?: string;
  initiatedBy?: string;
  source?: string;
}

interface MigrationResponse {
  data: MigrationJob[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  string,
  { variant: 'primary' | 'info' | 'warning' | 'default'; label: string }
> = {
  import: { variant: 'primary', label: 'Import' },
  export: { variant: 'info', label: 'Export' },
  migration: { variant: 'warning', label: 'Migration' },
  dsar: { variant: 'default', label: 'DSAR' },
};

const STATUS_CONFIG: Record<
  string,
  { variant: 'default' | 'info' | 'success' | 'error' | 'warning'; label: string }
> = {
  pending: { variant: 'default', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
};

function getJobType(job: MigrationJob): string {
  return job.jobType || job.type || 'import';
}

function getJobSource(job: MigrationJob): string {
  return job.source || job.fileName || job.type || '--';
}

function getRecordsTotal(job: MigrationJob): number {
  return job.recordsTotal ?? job.totalRecords ?? 0;
}

function getRecordsProcessed(job: MigrationJob): number {
  return job.recordsProcessed ?? job.processedRecords ?? 0;
}

function getRecordsFailed(job: MigrationJob): number {
  return job.recordsFailed ?? job.failedRecords ?? 0;
}

function getStartedAt(job: MigrationJob): string {
  return job.startedAt || job.createdAt;
}

function getInitiatedBy(job: MigrationJob): string {
  return job.initiatedBy || job.createdBy || '--';
}

function formatDuration(startedAt: string, completedAt: string | null | undefined): string {
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
// Start Import Dialog
// ---------------------------------------------------------------------------

const IMPORT_DATA_TYPES = [
  { value: 'units', label: 'Units' },
  { value: 'residents', label: 'Residents' },
  { value: 'packages', label: 'Packages' },
  { value: 'maintenance', label: 'Maintenance Requests' },
  { value: 'fobs', label: 'FOBs / Keys' },
  { value: 'emergency_contacts', label: 'Emergency Contacts' },
];

function StartImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const dataType = form.get('dataType') as string;
    const fileName = (form.get('fileName') as string).trim();
    const fileFormat = form.get('fileFormat') as string;

    if (!dataType || !fileName) {
      setError('Data type and file name are required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest('/api/v1/data-migration', {
        method: 'POST',
        body: {
          propertyId: DEMO_PROPERTY_ID,
          type: 'import',
          dataType,
          fileName,
          fileFormat: fileFormat || 'csv',
        },
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || 'Failed to create import job');
        return;
      }

      setSuccessMsg('Import job created successfully. Processing will begin shortly.');
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
        onSuccess();
      }, 1200);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Upload className="text-primary-500 h-5 w-5" />
          Start Import
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new data import job. Select the data type and provide the file name.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {error && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]">
              {successMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Data Type<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              name="dataType"
              required
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
            >
              <option value="">Select data type...</option>
              {IMPORT_DATA_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="fileName"
            label="File Name"
            placeholder="e.g. residents-march-2026.csv"
            required
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">File Format</label>
            <select
              name="fileFormat"
              defaultValue="csv"
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:ring-4 focus:outline-none"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataMigrationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<MigrationJob[] | MigrationResponse>(
    apiUrl('/api/v1/data-migration', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allJobs: MigrationJob[] = useMemo(() => {
    if (!apiResponse) return [];
    // Handle both array response and { data: [...] } response
    if (Array.isArray(apiResponse)) return apiResponse;
    if (Array.isArray((apiResponse as MigrationResponse).data)) {
      return (apiResponse as MigrationResponse).data;
    }
    return [];
  }, [apiResponse]);

  const filteredJobs = useMemo(
    () =>
      allJobs.filter((j) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            getJobSource(j).toLowerCase().includes(q) ||
            getInitiatedBy(j).toLowerCase().includes(q) ||
            getJobType(j).toLowerCase().includes(q) ||
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
    .filter((j) => getJobType(j) === 'import' && j.status === 'completed')
    .reduce((sum, j) => sum + getRecordsProcessed(j), 0);

  const columns: Column<MigrationJob>[] = [
    {
      id: 'type',
      header: 'Type',
      cell: (row) => {
        const jobType = getJobType(row);
        const cfg = TYPE_CONFIG[jobType] ?? { variant: 'default' as const, label: jobType };
        return (
          <Badge variant={cfg.variant} size="sm">
            {cfg.label}
          </Badge>
        );
      },
      sortable: true,
      accessorKey: 'jobType',
    },
    {
      id: 'source',
      header: 'Source / Target',
      cell: (row) => (
        <span className="text-[13px] font-semibold text-neutral-900">{getJobSource(row)}</span>
      ),
      sortable: true,
      accessorKey: 'fileName',
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status] ?? { variant: 'default' as const, label: row.status };
        if (row.status === 'processing') {
          const total = getRecordsTotal(row);
          const processed = getRecordsProcessed(row);
          const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
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
          {getRecordsProcessed(row).toLocaleString()}/{getRecordsTotal(row).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'failed',
      header: 'Failed',
      cell: (row) => {
        const failed = getRecordsFailed(row);
        return (
          <span
            className={`text-[13px] font-medium ${
              failed > 0 ? 'text-error-600' : 'text-neutral-400'
            }`}
          >
            {failed}
          </span>
        );
      },
    },
    {
      id: 'startedAt',
      header: 'Started',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{formatDateTime(getStartedAt(row))}</span>
      ),
      sortable: true,
      accessorKey: 'createdAt',
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.status === 'processing' ? (
            <span className="text-info-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(getStartedAt(row), null)}
            </span>
          ) : row.completedAt ? (
            formatDuration(getStartedAt(row), row.completedAt)
          ) : (
            '-'
          )}
        </span>
      ),
    },
    {
      id: 'initiatedBy',
      header: 'Initiated By',
      cell: (row) => <span className="text-[13px] text-neutral-700">{getInitiatedBy(row)}</span>,
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

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Data Migration"
        description="Import, export, and migrate data between systems."
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="mb-8 h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell
        title="Data Migration"
        description="Import, export, and migrate data between systems."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load migration jobs"
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
      title="Data Migration"
      description="Import, export, and migrate data between systems."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Full Export
          </Button>
          <Button size="sm" onClick={() => setShowImportDialog(true)}>
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
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 self-center"
                onClick={() => {
                  if (action.buttonLabel === 'Import') setShowImportDialog(true);
                }}
              >
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
            description={
              searchQuery
                ? 'Try adjusting your search or start a new import to get started.'
                : 'Start an import or export to see migration jobs here.'
            }
            action={
              searchQuery ? (
                <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4" />
                  New Import
                </Button>
              )
            }
          />
        )}
      </div>

      {/* Start Import Dialog */}
      <StartImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => refetch()}
      />
    </PageShell>
  );
}
