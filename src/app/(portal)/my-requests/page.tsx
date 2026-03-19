'use client';

import { useState, useMemo, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Plus, Wrench } from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

export default function MyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // New request form state
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [newPermissionToEnter, setNewPermissionToEnter] = useState(false);
  const [newEntryInstructions, setNewEntryInstructions] = useState('');

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useApi<MaintenanceResponse>(
    apiUrl('/api/v1/resident/maintenance', {
      propertyId: DEMO_PROPERTY_ID,
      status: statusFilter || null,
    }),
  );

  const requests = useMemo<MyRequest[]>(() => {
    if (!response) return [];
    const raw =
      (response as unknown as { data?: MyRequest[] }).data ?? (response as unknown as MyRequest[]);
    return Array.isArray(raw) ? raw : [];
  }, [response]);

  const statusCounts = useMemo(
    () => ({
      open: requests.filter((r) => r.status === 'open').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      resolved: requests.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
    }),
    [requests],
  );

  const handleNewRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFeedback(null);

      try {
        const resp = await apiRequest('/api/v1/resident/maintenance', {
          method: 'POST',
          body: {
            description: newDescription,
            priority: newPriority,
            permissionToEnter: newPermissionToEnter,
            entryInstructions: newEntryInstructions || undefined,
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
        setNewPriority('medium');
        setNewPermissionToEnter(false);
        setNewEntryInstructions('');

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
      }
    },
    [newDescription, newPriority, newPermissionToEnter, newEntryInstructions, refetch],
  );

  const columns: Column<MyRequest>[] = [
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
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant="default" size="sm">
          {row.category?.name || 'General'}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span className="line-clamp-1 max-w-[350px] text-[13px] text-neutral-600">
          {row.title || row.description}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const map: Record<
          string,
          { variant: 'warning' | 'primary' | 'success' | 'default'; label: string }
        > = {
          open: { variant: 'warning', label: 'Open' },
          in_progress: { variant: 'primary', label: 'In Progress' },
          resolved: { variant: 'success', label: 'Resolved' },
          closed: { variant: 'success', label: 'Closed' },
        };
        const s = map[row.status] || { variant: 'default' as const, label: row.status };
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        const map: Record<string, 'default' | 'warning' | 'error'> = {
          low: 'default',
          medium: 'warning',
          high: 'error',
          urgent: 'error',
        };
        return (
          <Badge variant={map[row.priority] || 'default'} size="sm" dot>
            {row.priority}
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
      id: 'updatedAt',
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <PageShell title="My Requests" description="Track your maintenance and service requests.">
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
      <PageShell title="My Requests" description="Track your maintenance and service requests.">
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertCircle className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {statusCounts.open}
            </p>
            <p className="text-[13px] text-neutral-500">Open</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Clock className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {statusCounts.in_progress}
            </p>
            <p className="text-[13px] text-neutral-500">In Progress</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {statusCounts.resolved}
            </p>
            <p className="text-[13px] text-neutral-500">Resolved</p>
          </div>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        {[
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
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

      {/* Requests Table */}
      {requests.length > 0 ? (
        <DataTable
          columns={columns}
          data={requests}
          emptyMessage="You have no maintenance requests."
          emptyIcon={<Wrench className="h-6 w-6" />}
        />
      ) : (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title="No maintenance requests"
          description={
            statusFilter
              ? 'No requests match the selected filter.'
              : 'You have no maintenance requests. Submit one if you need help.'
          }
          action={
            !statusFilter ? (
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
              <Button type="submit" disabled={submitting || newDescription.length < 10}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
