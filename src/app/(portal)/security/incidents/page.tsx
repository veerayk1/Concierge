'use client';

import { useState } from 'react';
import { AlertTriangle, Download, Filter, Plus, Search, ShieldAlert, X } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Incident {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: string;
  unit?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  assignedTo?: string;
  reportedAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    referenceNumber: 'INC-0089',
    title: 'Noise Complaint — Floor 8',
    description: 'Resident in 803 reports excessive noise from 805. Verbal warning issued.',
    category: 'Noise',
    unit: '805',
    status: 'investigating',
    priority: 'medium',
    reportedBy: 'Guard Patel',
    assignedTo: 'Guard Patel',
    reportedAt: '2026-03-18T08:15:00',
  },
  {
    id: '2',
    referenceNumber: 'INC-0090',
    title: 'Suspicious Vehicle — P2 Parking',
    description: 'White sedan with no visible permit parked in reserved spot P2-45.',
    category: 'Security',
    status: 'open',
    priority: 'high',
    reportedBy: 'Guard Chen',
    reportedAt: '2026-03-18T10:00:00',
  },
  {
    id: '3',
    referenceNumber: 'INC-0088',
    title: 'Lobby Camera #2 Offline',
    description: 'Security camera feed lost at 6:15 AM. IT team notified.',
    category: 'Equipment',
    status: 'investigating',
    priority: 'high',
    reportedBy: 'Guard Martinez',
    assignedTo: 'IT Team',
    reportedAt: '2026-03-17T06:15:00',
  },
  {
    id: '4',
    referenceNumber: 'INC-0087',
    title: 'Water Leak — Parking Level P1',
    description:
      'Water dripping from ceiling near spots P1-20 through P1-25. Appears to be from floor above.',
    category: 'Maintenance',
    status: 'resolved',
    priority: 'medium',
    reportedBy: 'Guard Chen',
    assignedTo: 'Mike Thompson',
    reportedAt: '2026-03-16T22:00:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = MOCK_INCIDENTS.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.referenceNumber.toLowerCase().includes(q)
    );
  });

  const openCount = MOCK_INCIDENTS.filter(
    (i) => i.status === 'open' || i.status === 'investigating',
  ).length;

  const columns: Column<Incident>[] = [
    {
      id: 'ref',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-error-600 font-mono text-[13px] font-semibold">
          {row.referenceNumber}
        </span>
      ),
    },
    {
      id: 'title',
      header: 'Incident',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-neutral-900">{row.title}</span>
          <span className="line-clamp-1 text-[13px] text-neutral-500">{row.description}</span>
        </div>
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
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        const m = {
          low: 'default' as const,
          medium: 'warning' as const,
          high: 'error' as const,
          critical: 'error' as const,
        };
        return (
          <Badge variant={m[row.priority]} size="sm" dot>
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
        const m = {
          open: { v: 'warning' as const, l: 'Open' },
          investigating: { v: 'info' as const, l: 'Investigating' },
          resolved: { v: 'success' as const, l: 'Resolved' },
          closed: { v: 'default' as const, l: 'Closed' },
        };
        const s = m[row.status];
        return (
          <Badge variant={s.v} size="sm" dot>
            {s.l}
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
      id: 'reportedAt',
      header: 'Reported',
      accessorKey: 'reportedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.reportedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Incident Reports"
      description={`${MOCK_INCIDENTS.length} incidents \u00B7 ${openCount} active`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search incidents..."
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
      <DataTable
        columns={columns}
        data={filteredIncidents}
        emptyMessage="No incidents found."
        emptyIcon={<ShieldAlert className="h-6 w-6" />}
      />
    </PageShell>
  );
}
