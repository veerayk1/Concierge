'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Wrench,
  Paperclip,
  X as XIcon,
  Loader2,
  ImageIcon,
  FileText,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { KpiTile } from '@/components/ui/kpi-tile';

// Test-seed regex shared with /my-packages and /dashboard. A real resident
// should never see "UX-015 verify-...", "UI-CHAIN-B:...", "CHAIN-B...",
// or "test xyz123" in their list of maintenance requests.
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|UI[-_]?TASK|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|UX[-_]?\d+|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;
const TEST_SUBSTRING_PATTERN = /\btest (event|notice|announcement|item|run|data|request|xyz)\b/i;

function isTestSeedTitle(title: string | undefined | null): boolean {
  if (!title) return false;
  const t = title.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/resident/maintenance)
// ---------------------------------------------------------------------------

interface RequestCategory {
  id: string;
  name: string;
}

interface RequestUnit {
  id: string;
  number: string;
}

interface MyRequest {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  permissionToEnter: string;
  createdAt: string;
  updatedAt: string;
  category: RequestCategory | null;
  unit: RequestUnit | null;
}

interface MaintenanceResponse {
  data: MyRequest[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// "Active" merges open + in_progress. Residents want one tab that says
// "what is still going on" without forcing them to mentally OR two statuses.
type ResidentFilter = 'active' | 'open' | 'in_progress' | 'resolved' | '';

export default function MyRequestsPage() {
  // Default to Active so the page opens on the things still being worked on.
  const [statusFilter, setStatusFilter] = useState<ResidentFilter>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // New request form state
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>('general');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [newPermissionToEnter, setNewPermissionToEnter] = useState(false);
  const [newEntryInstructions, setNewEntryInstructions] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 4 * 1024 * 1024;

  // Fetch all the resident's requests once; counts and the filtered table
  // both work from the same client-side list. Keeps the KPI tiles honest
  // as the user tabs through filters.
  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<MaintenanceResponse>(
    apiUrl('/api/v1/resident/maintenance', {
      propertyId: getPropertyId(),
    }),
  );

  const allRequests = useMemo<MyRequest[]>(() => {
    if (!response) return [];
    const raw =
      (response as unknown as { data?: MyRequest[] }).data ?? (response as unknown as MyRequest[]);
    const list = Array.isArray(raw) ? raw : [];
    // Drop test seed requests ("UX-015 verify-...", "UI-CHAIN-B: ...",
    // "CHAIN-B ...", "test xyz123 ...") — never a real resident's data.
    return list.filter((r) => !isTestSeedTitle(r.title || r.description));
  }, [response]);

  const statusCounts = useMemo(
    () => ({
      open: allRequests.filter((r) => r.status === 'open').length,
      in_progress: allRequests.filter((r) => r.status === 'in_progress').length,
      resolved: allRequests.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
    }),
    [allRequests],
  );

  const requests = useMemo<MyRequest[]>(() => {
    if (!statusFilter) return allRequests;
    if (statusFilter === 'active') {
      return allRequests.filter((r) => r.status === 'open' || r.status === 'in_progress');
    }
    if (statusFilter === 'resolved') {
      return allRequests.filter((r) => r.status === 'resolved' || r.status === 'closed');
    }
    return allRequests.filter((r) => r.status === statusFilter);
  }, [allRequests, statusFilter]);

  const handleNewRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFeedback(null);

      try {
        // 1. Upload files if any
        let uploadedAttachments: {
          fileName: string;
          contentType: string;
          fileSizeBytes: number;
          key: string;
        }[] = [];
        if (attachedFiles.length > 0) {
          setUploading(true);
          try {
            uploadedAttachments = await Promise.all(
              attachedFiles.map(async (file) => {
                const uploadResp = await apiRequest('/api/v1/upload', {
                  method: 'POST',
                  body: { module: 'maintenance', fileName: file.name, contentType: file.type },
                });
                const presigned = (await uploadResp.json()) as {
                  data: { url: string; key: string; fields?: Record<string, string> };
                };

                if (presigned.data.url.startsWith('https://')) {
                  const formData = new FormData();
                  if (presigned.data.fields) {
                    for (const [k, v] of Object.entries(presigned.data.fields)) {
                      formData.append(k, v);
                    }
                  }
                  formData.append('file', file);
                  await fetch(presigned.data.url, { method: 'POST', body: formData });
                }

                return {
                  fileName: file.name,
                  contentType: file.type,
                  fileSizeBytes: file.size,
                  key: presigned.data.key,
                };
              }),
            );
          } catch {
            setFeedback({ type: 'error', message: 'Failed to upload files. Please try again.' });
            setUploading(false);
            setSubmitting(false);
            return;
          }
          setUploading(false);
        }

        // 2. Create the request
        const resp = await apiRequest('/api/v1/resident/maintenance', {
          method: 'POST',
          body: {
            description: newDescription,
            category: newCategory,
            priority: newPriority,
            permissionToEnter: newPermissionToEnter,
            entryInstructions: newEntryInstructions || undefined,
            attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
          },
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: errData.message || 'Failed to create request.',
          });
          return;
        }

        const result = await resp.json();
        setFeedback({
          type: 'success',
          message: result.message || 'Request created successfully.',
        });

        // Reset form
        setNewDescription('');
        setNewCategory('general');
        setNewPriority('medium');
        setNewPermissionToEnter(false);
        setNewEntryInstructions('');
        setAttachedFiles([]);

        // Close dialog after brief delay and refetch
        setTimeout(() => {
          setDialogOpen(false);
          setFeedback(null);
          refetch();
        }, 1200);
      } catch {
        setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
      } finally {
        setSubmitting(false);
        setUploading(false);
      }
    },
    [
      newDescription,
      newCategory,
      newPriority,
      newPermissionToEnter,
      newEntryInstructions,
      attachedFiles,
      refetch,
    ],
  );

  const columns: Column<MyRequest>[] = [
    {
      id: 'description',
      header: 'Request',
      accessorKey: 'description',
      cell: (row) => {
        const categoryName = row.category?.name;
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="line-clamp-1 text-[14px] font-medium text-neutral-900">
              {row.title || row.description}
            </span>
            {categoryName && <span className="text-[11.5px] text-neutral-500">{categoryName}</span>}
          </div>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        // Once a request is resolved or closed, its priority is history —
        // a red HIGH dot on a closed ticket is just noise.
        if (row.status === 'resolved' || row.status === 'closed') {
          return <span className="text-[13px] text-neutral-300">—</span>;
        }
        const map: Record<string, 'default' | 'warning' | 'error'> = {
          low: 'default',
          medium: 'warning',
          high: 'error',
          urgent: 'error',
        };
        const label = row.priority.charAt(0).toUpperCase() + row.priority.slice(1);
        return (
          <Badge variant={map[row.priority] || 'default'} size="sm" dot>
            {label}
          </Badge>
        );
      },
    },
    {
      id: 'submittedAt',
      header: 'Submitted',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-right',
      cell: (row) => {
        // Treat resolved and closed as the same outcome — residents don't
        // need to learn the workflow distinction between them.
        const map: Record<
          string,
          { variant: 'warning' | 'primary' | 'success' | 'default'; label: string }
        > = {
          open: { variant: 'warning', label: 'Open' },
          in_progress: { variant: 'primary', label: 'In progress' },
          resolved: { variant: 'success', label: 'Resolved' },
          closed: { variant: 'success', label: 'Resolved' },
        };
        const s = map[row.status] || { variant: 'default' as const, label: row.status };
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        hero="emerald"
        title="My Requests"
        description="Track your maintenance and service requests."
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
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
      <PageShell
        hero="emerald"
        title="My Requests"
        description="Track your maintenance and service requests."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load requests"
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
      hero="emerald"
      title="My Requests"
      description="Track your maintenance and service requests."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setFeedback(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="Open"
          value={statusCounts.open}
          icon={AlertCircle}
          accent="warning"
          caption="Awaiting staff review."
        />
        <KpiTile
          label="In Progress"
          value={statusCounts.in_progress}
          icon={Clock}
          accent="primary"
          caption="Work happening now."
        />
        <KpiTile
          label="Resolved"
          value={statusCounts.resolved}
          icon={CheckCircle2}
          accent="success"
          caption="Closed out."
        />
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        {(
          [
            { value: 'active', label: 'Active' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: '', label: 'All' },
          ] as { value: ResidentFilter; label: string }[]
        ).map((filter) => (
          <button
            key={filter.value || 'all'}
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

      {/* Requests Table.
          NOTE: the row-click previously routed residents into the
          staff-side /maintenance/[id] detail page, which surfaces
          assignment, vendor, and SLA admin surfaces. Until we ship a
          resident-scoped detail route, the description is rendered in
          full inline and the click is intentionally a no-op. */}
      {requests.length > 0 ? (
        <DataTable
          columns={columns}
          data={requests}
          emptyMessage="You have no maintenance requests."
          emptyIcon={<Wrench className="h-6 w-6" />}
        />
      ) : (
        <EmptyState
          tone="emerald"
          icon={<Wrench className="h-6 w-6" />}
          title={
            statusFilter === 'active' || statusFilter === 'open' || statusFilter === 'in_progress'
              ? 'Nothing active.'
              : statusFilter === 'resolved'
                ? 'Nothing resolved yet.'
                : 'No requests yet.'
          }
          description={
            statusFilter === 'active' || statusFilter === 'open' || statusFilter === 'in_progress'
              ? 'Everything is taken care of. Submit a new request if something needs attention.'
              : statusFilter === 'resolved'
                ? 'Once a request is closed out it will appear here.'
                : 'Submit a request if something in your unit needs attention.'
          }
          action={
            statusFilter !== 'resolved' ? (
              <Button
                size="sm"
                onClick={() => {
                  setFeedback(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            ) : undefined
          }
        />
      )}

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>
            Describe the issue and we will get it resolved for you.
          </DialogDescription>

          {feedback && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
                feedback.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleNewRequest} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                minLength={10}
                maxLength={4000}
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={submitting}
                placeholder="Describe the issue in detail..."
                className="focus:border-primary-300 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-[12px] text-neutral-400">
                {newDescription.length}/4000 characters (minimum 10)
              </p>
            </div>

            {/* File Attachments */}
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Photos &amp; Documents
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/heic,image/webp,application/pdf,.doc,.docx,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const valid = Array.from(files).filter((f) => f.size <= MAX_FILE_SIZE);
                  setAttachedFiles((prev) => [...prev, ...valid]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
                Attach photos or documents
              </button>
              {attachedFiles.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-700">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={submitting}
                        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <p className="text-[12px] text-neutral-400">Max 4MB per file</p>
                </div>
              )}
              {uploading && (
                <div className="mt-2 flex items-center gap-2 text-[13px] text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading files...
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={submitting}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC / Heating / Cooling</option>
                <option value="appliance">Appliance</option>
                <option value="general">General / Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                disabled={submitting}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="permissionToEnter"
                checked={newPermissionToEnter}
                onChange={(e) => setNewPermissionToEnter(e.target.checked)}
                disabled={submitting}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="permissionToEnter" className="text-[14px] text-neutral-700">
                Permission to enter my unit when I am not home
              </label>
            </div>

            {newPermissionToEnter && (
              <Input
                label="Entry Instructions"
                value={newEntryInstructions}
                onChange={(e) => setNewEntryInstructions(e.target.value)}
                disabled={submitting}
                helperText="Optional. E.g., 'Key under mat' or 'Contact concierge for access'"
              />
            )}

            <div className="mt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading || newDescription.length < 10}
              >
                {uploading ? 'Uploading files...' : submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
