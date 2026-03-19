'use client';

import { useState } from 'react';
import { Building2, Plus, Upload, Search, Activity, BarChart3 } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  type: 'production' | 'demo' | 'sandbox';
  status: 'active' | 'inactive';
  subscription: 'Starter' | 'Professional' | 'Enterprise';
  healthScore: number;
  lastActive: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Queensway Park Condos',
    address: '100 Queensway Park Dr, Toronto, ON',
    units: 171,
    type: 'production',
    status: 'active',
    subscription: 'Professional',
    healthScore: 94,
    lastActive: '2026-03-19T10:30:00Z',
  },
  {
    id: '2',
    name: 'Harbourfront Towers',
    address: '250 Queens Quay W, Toronto, ON',
    units: 340,
    type: 'production',
    status: 'active',
    subscription: 'Enterprise',
    healthScore: 88,
    lastActive: '2026-03-19T09:15:00Z',
  },
  {
    id: '3',
    name: 'Demo Property',
    address: '1 Demo Street, Toronto, ON',
    units: 50,
    type: 'demo',
    status: 'active',
    subscription: 'Professional',
    healthScore: 100,
    lastActive: '2026-03-18T16:45:00Z',
  },
  {
    id: '4',
    name: 'Sandbox - Testing',
    address: '999 Test Ave, Toronto, ON',
    units: 10,
    type: 'sandbox',
    status: 'inactive',
    subscription: 'Starter',
    healthScore: 72,
    lastActive: '2026-03-10T08:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeVariant(type: Property['type']): 'primary' | 'info' | 'warning' {
  switch (type) {
    case 'production':
      return 'primary';
    case 'demo':
      return 'info';
    case 'sandbox':
      return 'warning';
  }
}

function subscriptionVariant(sub: Property['subscription']): 'default' | 'primary' | 'info' {
  switch (sub) {
    case 'Starter':
      return 'default';
    case 'Professional':
      return 'primary';
    case 'Enterprise':
      return 'info';
  }
}

function healthColor(score: number) {
  if (score >= 90) return 'text-success-600';
  if (score >= 75) return 'text-warning-600';
  return 'text-error-600';
}

function healthBg(score: number) {
  if (score >= 90) return 'bg-success-500';
  if (score >= 75) return 'bg-warning-500';
  return 'bg-error-500';
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: Column<Property>[] = [
  {
    id: 'name',
    header: 'Property',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium text-neutral-900">{row.name}</p>
        <p className="text-[12px] text-neutral-500">{row.address}</p>
      </div>
    ),
  },
  {
    id: 'units',
    header: 'Units',
    accessorKey: 'units',
    sortable: true,
    cell: (row) => <span className="font-medium text-neutral-900">{row.units}</span>,
  },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    sortable: true,
    cell: (row) => (
      <Badge variant={typeVariant(row.type)} size="sm">
        {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    sortable: true,
    cell: (row) => (
      <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm" dot>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
  {
    id: 'subscription',
    header: 'Subscription',
    accessorKey: 'subscription',
    sortable: true,
    cell: (row) => (
      <Badge variant={subscriptionVariant(row.subscription)} size="sm">
        {row.subscription}
      </Badge>
    ),
  },
  {
    id: 'healthScore',
    header: 'Health',
    accessorKey: 'healthScore',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${healthBg(row.healthScore)}`}
            style={{ width: `${row.healthScore}%` }}
          />
        </div>
        <span className={`text-[13px] font-medium ${healthColor(row.healthScore)}`}>
          {row.healthScore}%
        </span>
      </div>
    ),
  },
  {
    id: 'lastActive',
    header: 'Last Active',
    accessorKey: 'lastActive',
    sortable: true,
    cell: (row) => (
      <span className="text-[13px] text-neutral-500">{formatRelativeTime(row.lastActive)}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const totalProperties = MOCK_PROPERTIES.length;
  const activeProperties = MOCK_PROPERTIES.filter((p) => p.status === 'active').length;
  const demoProperties = MOCK_PROPERTIES.filter(
    (p) => p.type === 'demo' || p.type === 'sandbox',
  ).length;
  const totalUnits = MOCK_PROPERTIES.reduce((sum, p) => sum + p.units, 0);

  const filteredProperties = searchQuery
    ? MOCK_PROPERTIES.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : MOCK_PROPERTIES;

  return (
    <PageShell
      title="Properties"
      description="Manage all properties in your portfolio."
      actions={
        <>
          <Button variant="secondary">
            <Upload className="h-4 w-4" />
            Import Property
          </Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Total Properties</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Activity className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {activeProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Active</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <BarChart3 className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {demoProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Demo / Sandbox</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalUnits}</p>
            <p className="text-[13px] text-neutral-500">Total Units</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
        </div>
      </div>

      {/* Properties Table */}
      <DataTable<Property>
        columns={columns}
        data={filteredProperties}
        emptyMessage="No properties found."
        emptyIcon={<Building2 className="h-6 w-6" />}
        onRowClick={(row) => {
          // Navigate to property detail - placeholder
          console.log('Navigate to property:', row.id);
        }}
      />
    </PageShell>
  );
}
