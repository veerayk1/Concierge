'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CreateMaintenanceDialog } from '@/components/forms/create-maintenance-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
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
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REQUESTS: MaintenanceRequest[] = [
  {
    id: '1',
    referenceNumber: 'MR-0841',
    unit: '1501',
    resident: 'Janet Smith',
    category: 'Plumbing',
    description: 'Kitchen sink leaking under cabinet. Water pooling on floor.',
    status: 'open',
    priority: 'high',
    createdAt: '2026-03-18T08:00:00',
    updatedAt: '2026-03-18T08:00:00',
    permissionToEnter: true,
  },
  {
    id: '2',
    referenceNumber: 'MR-0840',
    unit: '305',
    resident: 'Robert Kim',
    category: 'Electrical',
    description: 'Bathroom light fixture flickering intermittently.',
    status: 'assigned',
    priority: 'medium',
    assignedTo: 'Mike Thompson',
    createdAt: '2026-03-17T14:30:00',
    updatedAt: '2026-03-17T16:00:00',
    permissionToEnter: true,
  },
  {
    id: '3',
    referenceNumber: 'MR-0839',
    unit: '802',
    resident: 'David Chen',
    category: 'HVAC',
    description: 'Air conditioning not cooling. Thermostat set to 21 but reads 26.',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'Mike Thompson',
    vendor: 'CoolAir HVAC Services',
    createdAt: '2026-03-16T10:00:00',
    updatedAt: '2026-03-18T09:00:00',
    permissionToEnter: false,
  },
  {
    id: '4',
    referenceNumber: 'MR-0838',
    unit: '1105',
    resident: 'Lisa Brown',
    category: 'Appliance',
    description: 'Dishwasher making grinding noise during wash cycle.',
    status: 'on_hold',
    priority: 'low',
    assignedTo: 'James Wilson',
    createdAt: '2026-03-15T09:00:00',
    updatedAt: '2026-03-17T11:00:00',
    permissionToEnter: true,
  },
  {
    id: '5',
    referenceNumber: 'MR-0835',
    unit: '422',
    resident: 'Jane Doe',
    category: 'General',
    description: 'Front door deadbolt difficult to turn. Needs lubrication or replacement.',
    status: 'resolved',
    priority: 'medium',
    assignedTo: 'Mike Thompson',
    createdAt: '2026-03-14T16:00:00',
    updatedAt: '2026-03-16T14:00:00',
    permissionToEnter: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MaintenancePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiRequests, refetch } = useApi<MaintenanceRequest[]>(
    apiUrl('/api/v1/maintenance', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allRequests = useMemo(() => {
    if (apiRequests && Array.isArray(apiRequests) && apiRequests.length > 0) {
      return apiRequests.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        referenceNumber: r.referenceNumber as string,
        unit: (r.unit as Record<string, string>)?.number || '',
        resident: '',
        category: (r.category as Record<string, string>)?.name || 'General',
        description: r.description as string,
        status: r.status as MaintenanceRequest['status'],
        priority: r.priority as MaintenanceRequest['priority'],
        assignedTo: r.assignedEmployeeId as string | undefined,
        createdAt: r.createdAt as string,
        updatedAt: r.updatedAt as string,
        permissionToEnter: (r.permissionToEnter as boolean) || false,
      }));
    }
    return MOCK_REQUESTS;
  }, [apiRequests]);

  const filteredRequests = useMemo(
    () =>
      allRequests.filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            r.referenceNumber.toLowerCase().includes(q) ||
            r.resident.toLowerCase().includes(q) ||
            r.unit.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [searchQuery, statusFilter],
  );

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
      cell: (row) => <span className="font-medium">{row.unit}</span>,
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
          <Button variant="secondary" size="sm">
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
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{stat.value}</p>
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

      {/* Request Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        emptyMessage="No maintenance requests found."
        emptyIcon={<Wrench className="h-6 w-6" />}
        onRowClick={(row) => router.push(`/maintenance/${row.id}`)}
      />

      <CreateMaintenanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
