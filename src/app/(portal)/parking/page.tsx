'use client';

import { useState } from 'react';
import { AlertTriangle, Car, Download, MapPin, Plus, Search, X } from 'lucide-react';
import { CreateParkingPermitDialog } from '@/components/forms/create-parking-permit-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParkingPermit {
  id: string;
  permitNumber: string;
  unit: string;
  resident: string;
  vehicle: string;
  licensePlate: string;
  spotNumber: string;
  area: string;
  type: 'resident' | 'visitor' | 'reserved';
  status: 'active' | 'expired' | 'suspended';
  expiresAt?: string;
}

interface ParkingViolation {
  id: string;
  licensePlate: string;
  location: string;
  violation: string;
  status: 'open' | 'warned' | 'resolved';
  reportedBy: string;
  reportedAt: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PERMITS: ParkingPermit[] = [
  {
    id: '1',
    permitNumber: 'P-001',
    unit: '1501',
    resident: 'Janet Smith',
    vehicle: 'Tesla Model 3',
    licensePlate: 'ABCD 123',
    spotNumber: 'P1-15',
    area: 'P1 Underground',
    type: 'resident',
    status: 'active',
  },
  {
    id: '2',
    permitNumber: 'P-002',
    unit: '802',
    resident: 'David Chen',
    vehicle: 'Honda Civic',
    licensePlate: 'EFGH 456',
    spotNumber: 'P1-08',
    area: 'P1 Underground',
    type: 'resident',
    status: 'active',
  },
  {
    id: '3',
    permitNumber: 'P-003',
    unit: '710',
    resident: 'Sarah Wilson',
    vehicle: 'BMW X3',
    licensePlate: 'IJKL 789',
    spotNumber: 'P2-22',
    area: 'P2 Underground',
    type: 'reserved',
    status: 'active',
  },
  {
    id: '4',
    permitNumber: 'V-101',
    unit: '422',
    resident: 'Jane Doe',
    vehicle: 'Guest Vehicle',
    licensePlate: 'MNOP 012',
    spotNumber: 'V-03',
    area: 'Visitor Lot',
    type: 'visitor',
    status: 'active',
    expiresAt: '2026-03-18T23:59:00',
  },
];

const MOCK_VIOLATIONS: ParkingViolation[] = [
  {
    id: '1',
    licensePlate: 'WXYZ 999',
    location: 'P2-45 (Reserved)',
    violation: 'Parked in reserved spot without permit',
    status: 'open',
    reportedBy: 'Guard Chen',
    reportedAt: '2026-03-18T10:00:00',
  },
  {
    id: '2',
    licensePlate: 'QRST 555',
    location: 'Fire Lane',
    violation: 'Parked in fire lane',
    status: 'warned',
    reportedBy: 'Guard Patel',
    reportedAt: '2026-03-17T14:30:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParkingPage() {
  const [tab, setTab] = useState<'permits' | 'violations'>('permits');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermitDialog, setShowPermitDialog] = useState(false);

  const filteredPermits = MOCK_PERMITS.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.resident.toLowerCase().includes(q) ||
      p.licensePlate.toLowerCase().includes(q) ||
      p.unit.includes(q) ||
      p.spotNumber.toLowerCase().includes(q)
    );
  });

  const permitColumns: Column<ParkingPermit>[] = [
    {
      id: 'permitNumber',
      header: 'Permit #',
      accessorKey: 'permitNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 font-mono text-[13px] font-semibold">
          {row.permitNumber}
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
    { id: 'resident', header: 'Resident', accessorKey: 'resident', sortable: true },
    { id: 'vehicle', header: 'Vehicle', accessorKey: 'vehicle' },
    {
      id: 'plate',
      header: 'Plate',
      accessorKey: 'licensePlate',
      cell: (row) => <span className="font-mono text-[13px]">{row.licensePlate}</span>,
    },
    {
      id: 'spot',
      header: 'Spot',
      accessorKey: 'spotNumber',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-neutral-400" />
          {row.spotNumber}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (row) => {
        const m = {
          resident: 'primary' as const,
          visitor: 'info' as const,
          reserved: 'warning' as const,
        };
        return (
          <Badge variant={m[row.type]} size="sm">
            {row.type}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'error'} size="sm" dot>
          {row.status}
        </Badge>
      ),
    },
  ];

  const violationColumns: Column<ParkingViolation>[] = [
    {
      id: 'plate',
      header: 'Plate',
      accessorKey: 'licensePlate',
      cell: (row) => (
        <span className="font-mono text-[13px] font-semibold">{row.licensePlate}</span>
      ),
    },
    { id: 'location', header: 'Location', accessorKey: 'location' },
    { id: 'violation', header: 'Violation', accessorKey: 'violation' },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        const m = {
          open: 'error' as const,
          warned: 'warning' as const,
          resolved: 'success' as const,
        };
        return (
          <Badge variant={m[row.status]} size="sm" dot>
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: 'by',
      header: 'Reported By',
      accessorKey: 'reportedBy',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.reportedBy}</span>,
    },
    {
      id: 'at',
      header: 'Time',
      accessorKey: 'reportedAt',
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
      title="Parking Management"
      description={`${MOCK_PERMITS.length} active permits \u00B7 ${MOCK_VIOLATIONS.filter((v) => v.status === 'open').length} open violations`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowPermitDialog(true)}>
            <Plus className="h-4 w-4" />
            New Permit
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setTab('permits')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-medium transition-all ${tab === 'permits' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
        >
          <Car className="h-4 w-4" />
          Permits{' '}
          <Badge variant={tab === 'permits' ? 'primary' : 'default'} size="sm">
            {MOCK_PERMITS.length}
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => setTab('violations')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-medium transition-all ${tab === 'violations' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
        >
          <AlertTriangle className="h-4 w-4" />
          Violations{' '}
          <Badge variant={tab === 'violations' ? 'error' : 'default'} size="sm">
            {MOCK_VIOLATIONS.length}
          </Badge>
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={tab === 'permits' ? 'Search permits...' : 'Search violations...'}
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

      {tab === 'permits' ? (
        <DataTable
          columns={permitColumns}
          data={filteredPermits}
          emptyMessage="No permits found."
          emptyIcon={<Car className="h-6 w-6" />}
        />
      ) : (
        <DataTable
          columns={violationColumns}
          data={MOCK_VIOLATIONS}
          emptyMessage="No violations."
          emptyIcon={<AlertTriangle className="h-6 w-6" />}
        />
      )}

      <CreateParkingPermitDialog
        open={showPermitDialog}
        onOpenChange={setShowPermitDialog}
        propertyId="prop-1"
        onSuccess={() => setShowPermitDialog(false)}
      />
    </PageShell>
  );
}
