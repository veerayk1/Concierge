'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  ipAddress: string;
  category: string;
}

const AUDIT_DATA: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2026-03-18 14:32:05',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Updated notification settings',
    target: 'Notification Settings',
    ipAddress: '192.168.1.45',
    category: 'Settings',
  },
  {
    id: '2',
    timestamp: '2026-03-18 13:15:22',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Created new role',
    target: 'Cleaning Staff',
    ipAddress: '192.168.1.45',
    category: 'Roles',
  },
  {
    id: '3',
    timestamp: '2026-03-18 11:48:10',
    user: 'James Rodriguez',
    role: 'Property Manager',
    action: 'Assigned vendor to work order',
    target: 'WO-2026-0147',
    ipAddress: '10.0.0.88',
    category: 'Maintenance',
  },
  {
    id: '4',
    timestamp: '2026-03-18 10:22:33',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Enabled AI auto-categorization',
    target: 'AI Configuration',
    ipAddress: '192.168.1.45',
    category: 'Settings',
  },
  {
    id: '5',
    timestamp: '2026-03-17 16:55:41',
    user: 'Mike Thompson',
    role: 'Front Desk',
    action: 'Logged package for unit 1205',
    target: 'PKG-2026-0892',
    ipAddress: '10.0.0.12',
    category: 'Events',
  },
  {
    id: '6',
    timestamp: '2026-03-17 15:30:19',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Updated property branding',
    target: 'General Settings',
    ipAddress: '192.168.1.45',
    category: 'Settings',
  },
  {
    id: '7',
    timestamp: '2026-03-17 14:12:07',
    user: 'James Rodriguez',
    role: 'Property Manager',
    action: 'Approved amenity booking',
    target: 'BK-2026-0234',
    ipAddress: '10.0.0.88',
    category: 'Amenities',
  },
  {
    id: '8',
    timestamp: '2026-03-17 11:05:55',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Connected Slack integration',
    target: 'Integrations',
    ipAddress: '192.168.1.45',
    category: 'Settings',
  },
  {
    id: '9',
    timestamp: '2026-03-17 09:45:30',
    user: 'David Kim',
    role: 'Security Guard',
    action: 'Filed incident report',
    target: 'INC-2026-0058',
    ipAddress: '10.0.0.15',
    category: 'Events',
  },
  {
    id: '10',
    timestamp: '2026-03-16 17:20:14',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Deactivated user account',
    target: 'john.doe@resident.com',
    ipAddress: '192.168.1.45',
    category: 'Users',
  },
  {
    id: '11',
    timestamp: '2026-03-16 14:55:02',
    user: 'James Rodriguez',
    role: 'Property Manager',
    action: 'Generated monthly report',
    target: 'March 2026 Operations Report',
    ipAddress: '10.0.0.88',
    category: 'Reports',
  },
  {
    id: '12',
    timestamp: '2026-03-16 10:10:48',
    user: 'Sarah Chen',
    role: 'Property Admin',
    action: 'Updated event type template',
    target: 'Package Arrival',
    ipAddress: '192.168.1.45',
    category: 'Settings',
  },
];

const ACTION_CATEGORIES = [
  'All Actions',
  'Settings',
  'Users',
  'Roles',
  'Events',
  'Maintenance',
  'Amenities',
  'Reports',
];

const AUDIT_COLUMNS: Column<AuditEntry>[] = [
  {
    id: 'timestamp',
    header: 'Timestamp',
    accessorKey: 'timestamp',
    sortable: true,
    cell: (row) => (
      <span className="font-mono text-[13px] whitespace-nowrap text-neutral-600">
        {row.timestamp}
      </span>
    ),
  },
  {
    id: 'user',
    header: 'User',
    accessorKey: 'user',
    sortable: true,
    cell: (row) => (
      <div>
        <span className="font-medium text-neutral-900">{row.user}</span>
        <span className="ml-2 text-[12px] text-neutral-400">{row.role}</span>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Action',
    accessorKey: 'action',
    sortable: true,
  },
  {
    id: 'target',
    header: 'Target',
    accessorKey: 'target',
    cell: (row) => <span className="font-mono text-[13px] text-neutral-600">{row.target}</span>,
  },
  {
    id: 'ipAddress',
    header: 'IP Address',
    accessorKey: 'ipAddress',
    cell: (row) => <span className="font-mono text-[13px] text-neutral-400">{row.ipAddress}</span>,
  },
  {
    id: 'category',
    header: 'Category',
    accessorKey: 'category',
    sortable: true,
    cell: (row) => {
      const variantMap: Record<
        string,
        'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
      > = {
        Settings: 'default',
        Users: 'primary',
        Roles: 'error',
        Events: 'info',
        Maintenance: 'warning',
        Amenities: 'success',
        Reports: 'default',
      };
      return (
        <Badge variant={variantMap[row.category] || 'default'} size="sm">
          {row.category}
        </Badge>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Actions');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredData = AUDIT_DATA.filter((entry) => {
    if (selectedCategory !== 'All Actions' && entry.category !== selectedCategory) {
      return false;
    }
    if (dateFrom && entry.timestamp < dateFrom) return false;
    if (dateTo && entry.timestamp > dateTo + ' 23:59:59') return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Audit Log</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            View system-wide audit trail of user actions and changes.
          </p>
        </div>
        <Button variant="secondary" size="sm">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Filters
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              {/* Date Range */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all hover:border-neutral-300 focus:ring-4 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all hover:border-neutral-300 focus:ring-4 focus:outline-none"
                />
              </div>

              {/* Action Type */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                  Action Type
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] rounded-xl border border-neutral-200 bg-white px-4 pr-8 text-[15px] text-neutral-900 transition-all hover:border-neutral-300 focus:ring-4 focus:outline-none"
                >
                  {ACTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear */}
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSelectedCategory('All Actions');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Count */}
      <p className="text-[13px] text-neutral-500">
        Showing <span className="font-semibold text-neutral-700">{filteredData.length}</span> of{' '}
        <span className="font-semibold text-neutral-700">{AUDIT_DATA.length}</span> entries
      </p>

      {/* Audit Table */}
      <DataTable
        columns={AUDIT_COLUMNS}
        data={filteredData}
        emptyMessage="No audit log entries match your filters."
        emptyIcon={<FileText className="h-5 w-5" />}
        compact
      />
    </div>
  );
}
