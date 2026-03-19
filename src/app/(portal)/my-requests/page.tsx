'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Clock, Plus, Wrench } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MyRequest {
  id: string;
  referenceNumber: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data — resident's own requests
// ---------------------------------------------------------------------------

const MOCK_MY_REQUESTS: MyRequest[] = [
  {
    id: '1',
    referenceNumber: 'MR-0841',
    category: 'Plumbing',
    description: 'Kitchen sink leaking under cabinet. Water pooling on floor near dishwasher.',
    status: 'open',
    priority: 'high',
    submittedAt: '2026-03-18T08:00:00',
    updatedAt: '2026-03-18T08:00:00',
  },
  {
    id: '2',
    referenceNumber: 'MR-0832',
    category: 'HVAC',
    description: 'Air conditioning not cooling properly. Thermostat set to 21 but reads 26.',
    status: 'in_progress',
    priority: 'medium',
    submittedAt: '2026-03-15T10:00:00',
    updatedAt: '2026-03-17T14:30:00',
  },
  {
    id: '3',
    referenceNumber: 'MR-0820',
    category: 'General',
    description: 'Front door deadbolt difficult to turn. Needs lubrication or replacement.',
    status: 'resolved',
    priority: 'low',
    submittedAt: '2026-03-10T16:00:00',
    updatedAt: '2026-03-14T11:00:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyRequestsPage() {
  const [showNewRequest, setShowNewRequest] = useState(false);

  const statusCounts = useMemo(
    () => ({
      open: MOCK_MY_REQUESTS.filter((r) => r.status === 'open').length,
      in_progress: MOCK_MY_REQUESTS.filter((r) => r.status === 'in_progress').length,
      resolved: MOCK_MY_REQUESTS.filter((r) => r.status === 'resolved').length,
    }),
    [],
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
          {row.category}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span className="line-clamp-1 max-w-[350px] text-[13px] text-neutral-600">
          {row.description}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const map = {
          open: { variant: 'warning' as const, label: 'Open' },
          in_progress: { variant: 'primary' as const, label: 'In Progress' },
          resolved: { variant: 'success' as const, label: 'Resolved' },
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
      id: 'submittedAt',
      header: 'Submitted',
      accessorKey: 'submittedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.submittedAt).toLocaleDateString('en-US', {
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

  return (
    <PageShell
      title="My Requests"
      description="Track your maintenance and service requests."
      actions={
        <Button size="sm" onClick={() => setShowNewRequest(!showNewRequest)}>
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

      {/* Requests Table */}
      <DataTable
        columns={columns}
        data={MOCK_MY_REQUESTS}
        emptyMessage="You have no maintenance requests."
        emptyIcon={<Wrench className="h-6 w-6" />}
      />
    </PageShell>
  );
}
