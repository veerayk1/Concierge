'use client';

import { useMemo } from 'react';
import { CheckCircle2, Clock, Package } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MyPackage {
  id: string;
  referenceNumber: string;
  courier: string;
  description: string;
  receivedAt: string;
  ageHours: number;
  storageSpot: string;
  status: 'waiting' | 'picked_up';
  pickedUpAt?: string;
}

// ---------------------------------------------------------------------------
// Courier Colors
// ---------------------------------------------------------------------------

const COURIER_COLORS: Record<string, string> = {
  Amazon: 'bg-orange-100 text-orange-700',
  'Canada Post': 'bg-red-100 text-red-700',
  FedEx: 'bg-purple-100 text-purple-700',
  UPS: 'bg-amber-100 text-amber-800',
};

// ---------------------------------------------------------------------------
// Mock Data — resident's own packages
// ---------------------------------------------------------------------------

const MOCK_MY_PACKAGES: MyPackage[] = [
  {
    id: '1',
    referenceNumber: 'PKG-4821',
    courier: 'Amazon',
    description: 'Medium Box',
    receivedAt: '2026-03-19T09:15:00',
    ageHours: 3,
    storageSpot: 'Shelf A-3',
    status: 'waiting',
  },
  {
    id: '2',
    referenceNumber: 'PKG-4830',
    courier: 'FedEx',
    description: 'Large Envelope',
    receivedAt: '2026-03-18T14:30:00',
    ageHours: 22,
    storageSpot: 'Shelf B-1',
    status: 'waiting',
  },
  {
    id: '3',
    referenceNumber: 'PKG-4798',
    courier: 'Canada Post',
    description: 'Small Parcel',
    receivedAt: '2026-03-15T11:00:00',
    ageHours: 0,
    storageSpot: 'Shelf C-2',
    status: 'picked_up',
    pickedUpAt: '2026-03-15T18:45:00',
  },
  {
    id: '4',
    referenceNumber: 'PKG-4785',
    courier: 'UPS',
    description: 'Large Box',
    receivedAt: '2026-03-12T08:00:00',
    ageHours: 0,
    storageSpot: 'Floor',
    status: 'picked_up',
    pickedUpAt: '2026-03-12T19:10:00',
  },
];

// ---------------------------------------------------------------------------
// Age Display Helper
// ---------------------------------------------------------------------------

function getAgeDisplay(hours: number): { text: string; variant: 'success' | 'warning' | 'error' } {
  if (hours < 24) {
    return { text: `${hours}h`, variant: 'success' };
  } else if (hours < 72) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h`, variant: 'warning' };
  } else {
    const days = Math.floor(hours / 24);
    return { text: `${days}d`, variant: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyPackagesPage() {
  const waitingPackages = useMemo(() => MOCK_MY_PACKAGES.filter((p) => p.status === 'waiting'), []);

  const pickedUpPackages = useMemo(
    () => MOCK_MY_PACKAGES.filter((p) => p.status === 'picked_up'),
    [],
  );

  const columns: Column<MyPackage>[] = [
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
      id: 'courier',
      header: 'Courier',
      accessorKey: 'courier',
      sortable: true,
      cell: (row) => {
        const colorClass = COURIER_COLORS[row.courier] || 'bg-neutral-100 text-neutral-700';
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {row.courier}
          </span>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="text-neutral-600">{row.description}</span>,
    },
    {
      id: 'receivedAt',
      header: 'Received',
      accessorKey: 'receivedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.receivedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      id: 'age',
      header: 'Age',
      accessorKey: 'ageHours',
      sortable: true,
      cell: (row) => {
        if (row.status === 'picked_up') {
          return <span className="text-[13px] text-neutral-400">&mdash;</span>;
        }
        const age = getAgeDisplay(row.ageHours);
        return (
          <Badge variant={age.variant} size="sm" dot>
            {age.text}
          </Badge>
        );
      },
    },
    {
      id: 'storage',
      header: 'Storage',
      accessorKey: 'storageSpot',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.storageSpot}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        if (row.status === 'picked_up') {
          return (
            <Badge variant="success" size="sm" dot>
              Picked Up
            </Badge>
          );
        }
        return (
          <Badge variant="warning" size="sm" dot>
            Waiting for Pickup
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => {
        if (row.status === 'waiting') {
          return (
            <Button variant="secondary" size="sm">
              Mark Picked Up
            </Button>
          );
        }
        return (
          <span className="text-[13px] text-neutral-400">
            {row.pickedUpAt
              ? new Date(row.pickedUpAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : ''}
          </span>
        );
      },
    },
  ];

  return (
    <PageShell title="My Packages" description="Track your deliveries and pickups.">
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Clock className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {waitingPackages.length}
            </p>
            <p className="text-[13px] text-neutral-500">Waiting for Pickup</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {pickedUpPackages.length}
            </p>
            <p className="text-[13px] text-neutral-500">Picked Up This Month</p>
          </div>
        </Card>
      </div>

      {/* Packages Table */}
      <DataTable
        columns={columns}
        data={MOCK_MY_PACKAGES}
        emptyMessage="You have no packages."
        emptyIcon={<Package className="h-6 w-6" />}
      />
    </PageShell>
  );
}
