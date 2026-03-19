'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Dog,
  Edit2,
  Key,
  Mail,
  Package,
  Phone,
  Plus,
  Shield,
  StickyNote,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Occupant {
  id: string;
  name: string;
  type: 'Owner' | 'Tenant' | 'Family';
  email: string;
  phone: string;
  moveInDate: string;
  status: 'active' | 'inactive';
}

interface UnitPackage {
  id: string;
  referenceNumber: string;
  courier: string;
  status: 'unreleased' | 'released' | 'returned';
  receivedAt: string;
  releasedTo: string | null;
}

interface MaintenanceRequest {
  id: string;
  referenceNumber: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface FOB {
  serial: string;
  type: string;
  status: 'active' | 'lost' | 'deactivated';
  issuedAt: string;
}

interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  parkingSpot: string;
}

interface Pet {
  type: string;
  breed: string;
  name: string;
  weight: string;
  registrationNumber: string;
}

interface Instruction {
  id: string;
  text: string;
  priority: 'normal' | 'important' | 'critical';
  createdBy: string;
  createdAt: string;
}

interface HistoryEvent {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_UNIT = {
  number: '1501',
  floor: 15,
  building: 'Tower A',
  type: 'Residential' as const,
  status: 'occupied' as const,
  sqft: 1850,
  enterPhoneCode: '*1501',
  parkingSpot: 'P1-15',
  locker: 'L-42',
  keyTag: 'KT-1501-A',
  customFields: {
    'Move-in Date': '2022-06-01',
    'Lease Expiry': '2027-05-31',
    'Insurance Policy': 'POL-88421',
    'Intercom Code': '1501#',
  },
};

const MOCK_INSTRUCTIONS: Instruction[] = [
  {
    id: '1',
    text: 'Has a small dog (Daisy) — may bark at visitors. Ring doorbell twice, resident is slightly hard of hearing.',
    priority: 'important',
    createdBy: 'Mike Johnson',
    createdAt: '2024-11-15T10:00:00',
  },
  {
    id: '2',
    text: 'Resident prefers packages left at the door. Do not buzz unless perishable.',
    priority: 'normal',
    createdBy: 'Sarah Lee',
    createdAt: '2025-01-20T14:30:00',
  },
  {
    id: '3',
    text: 'Water shut-off valve is behind the washer. Emergency plumber: 416-555-7777.',
    priority: 'critical',
    createdBy: 'Admin',
    createdAt: '2025-08-01T09:00:00',
  },
];

const MOCK_OCCUPANTS: Occupant[] = [
  {
    id: '1',
    name: 'Janet Smith',
    type: 'Owner',
    email: 'janet.smith@email.com',
    phone: '416-555-0123',
    moveInDate: '2022-06-01',
    status: 'active',
  },
  {
    id: '2',
    name: 'Tom Smith',
    type: 'Family',
    email: 'tom.s@email.com',
    phone: '416-555-0124',
    moveInDate: '2022-06-01',
    status: 'active',
  },
];

const MOCK_PACKAGES: UnitPackage[] = [
  {
    id: '1',
    referenceNumber: 'PKG-4821',
    courier: 'Amazon',
    status: 'unreleased',
    receivedAt: '2026-03-18T09:15:00',
    releasedTo: null,
  },
  {
    id: '2',
    referenceNumber: 'PKG-4798',
    courier: 'FedEx',
    status: 'released',
    receivedAt: '2026-03-16T14:30:00',
    releasedTo: 'Janet Smith',
  },
  {
    id: '3',
    referenceNumber: 'PKG-4755',
    courier: 'UPS',
    status: 'unreleased',
    receivedAt: '2026-03-15T11:00:00',
    releasedTo: null,
  },
];

const MOCK_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: '1',
    referenceNumber: 'MR-0841',
    category: 'Plumbing',
    status: 'open',
    priority: 'high',
    createdAt: '2026-03-18T08:00:00',
  },
  {
    id: '2',
    referenceNumber: 'MR-0790',
    category: 'HVAC',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-02-20T10:00:00',
  },
];

const MOCK_FOBS: FOB[] = [
  { serial: 'SN-3201', type: 'Main Entry', status: 'active', issuedAt: '2022-06-01' },
  { serial: 'SN-3202', type: 'Parking', status: 'active', issuedAt: '2022-06-01' },
];

const MOCK_BUZZER_CODES = [
  { code: '1501', type: 'Unit Buzzer', active: true },
  { code: '9901', type: 'Visitor Entry', active: true },
];

const MOCK_GARAGE_CLICKERS = [
  { serial: 'GC-0481', type: 'Underground Parking', status: 'active' as const },
];

const MOCK_EMERGENCY_CONTACTS = [
  { name: 'Michael Smith', relationship: 'Brother', phone: '416-555-9999' },
  { name: 'Lisa Johnson', relationship: 'Neighbour', phone: '416-555-8888' },
];

const MOCK_VEHICLE: Vehicle = {
  make: 'Tesla',
  model: 'Model 3',
  year: 2024,
  color: 'White',
  plate: 'ABCD 123',
  parkingSpot: 'P1-15',
};

const MOCK_PET: Pet = {
  type: 'Dog',
  breed: 'Pomeranian',
  name: 'Daisy',
  weight: '4.5 kg',
  registrationNumber: 'PET-2024-0312',
};

const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: '1',
    action: 'maintenance',
    detail: 'Maintenance request MR-0841 created — Plumbing',
    actor: 'Janet Smith',
    timestamp: '2026-03-18T08:00:00',
  },
  {
    id: '2',
    action: 'package',
    detail: 'Package PKG-4821 received from Amazon',
    actor: 'Mike Johnson',
    timestamp: '2026-03-18T09:15:00',
  },
  {
    id: '3',
    action: 'package',
    detail: 'Package PKG-4798 released to Janet Smith',
    actor: 'Mike Johnson',
    timestamp: '2026-03-16T15:00:00',
  },
  {
    id: '4',
    action: 'move_in',
    detail: 'Tom Smith added as Family member',
    actor: 'Admin',
    timestamp: '2022-06-01T10:00:00',
  },
  {
    id: '5',
    action: 'move_in',
    detail: 'Janet Smith moved in as Owner',
    actor: 'Admin',
    timestamp: '2022-06-01T09:00:00',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityBorderMap: Record<Instruction['priority'], string> = {
  normal: 'border-neutral-200',
  important: 'border-warning-300 bg-warning-50/30',
  critical: 'border-error-300 bg-error-50/30',
};

const priorityBadgeMap: Record<Instruction['priority'], 'default' | 'warning' | 'error'> = {
  normal: 'default',
  important: 'warning',
  critical: 'error',
};

function getHistoryIcon(action: string) {
  switch (action) {
    case 'package':
      return <Package className="text-info-600 h-4 w-4" />;
    case 'maintenance':
      return <Wrench className="text-warning-600 h-4 w-4" />;
    case 'move_in':
      return <Users className="text-success-600 h-4 w-4" />;
    case 'move_out':
      return <Users className="text-error-600 h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4 text-neutral-400" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UnitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('overview');

  // -- Occupants columns --
  const occupantColumns: Column<Occupant>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="text-[14px] font-medium text-neutral-900">{row.name}</span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => {
        const m: Record<string, 'primary' | 'info' | 'default'> = {
          Owner: 'primary',
          Tenant: 'info',
          Family: 'default',
        };
        return (
          <Badge variant={m[row.type] ?? 'default'} size="sm">
            {row.type}
          </Badge>
        );
      },
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: (row) => <span className="text-primary-600 text-[13px]">{row.email}</span>,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.phone}</span>,
    },
    {
      id: 'moveInDate',
      header: 'Move-in',
      accessorKey: 'moveInDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.moveInDate).toLocaleDateString('en-US', {
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
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm" dot>
          {row.status}
        </Badge>
      ),
    },
  ];

  // -- Package columns --
  const packageColumns: Column<UnitPackage>[] = [
    {
      id: 'ref',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <Link
          href={`/packages/${row.id}`}
          className="text-primary-600 font-mono text-[13px] font-semibold hover:underline"
        >
          {row.referenceNumber}
        </Link>
      ),
    },
    {
      id: 'courier',
      header: 'Courier',
      accessorKey: 'courier',
      sortable: true,
      cell: (row) => <span className="text-[14px] text-neutral-900">{row.courier}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const m = {
          unreleased: { v: 'warning' as const, l: 'Unreleased' },
          released: { v: 'success' as const, l: 'Released' },
          returned: { v: 'default' as const, l: 'Returned' },
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
      id: 'releasedTo',
      header: 'Released To',
      accessorKey: 'releasedTo',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.releasedTo ?? '—'}</span>,
    },
  ];

  // -- Maintenance columns --
  const maintenanceColumns: Column<MaintenanceRequest>[] = [
    {
      id: 'ref',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <Link
          href={`/maintenance/${row.id}`}
          className="text-primary-600 font-mono text-[13px] font-semibold hover:underline"
        >
          {row.referenceNumber}
        </Link>
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
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const m = {
          open: { v: 'warning' as const, l: 'Open' },
          in_progress: { v: 'info' as const, l: 'In Progress' },
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
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        const m = { low: 'default' as const, medium: 'warning' as const, high: 'error' as const };
        return (
          <Badge variant={m[row.priority]} size="sm" dot>
            {row.priority}
          </Badge>
        );
      },
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
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/units"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to units
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
              Unit {MOCK_UNIT.number}
            </h1>
            <Badge variant="success" size="lg" dot>
              Occupied
            </Badge>
          </div>
          <p className="text-[14px] text-neutral-500">
            {MOCK_UNIT.building} &middot; Floor {MOCK_UNIT.floor} &middot; {MOCK_UNIT.type} &middot;{' '}
            {MOCK_UNIT.sqft} sq ft
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Edit2 className="h-4 w-4" />
          Edit Unit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Unreleased Packages',
            value: MOCK_PACKAGES.filter((p) => p.status === 'unreleased').length,
            icon: Package,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Open Requests',
            value: MOCK_MAINTENANCE.filter((m) => m.status === 'open' || m.status === 'in_progress')
              .length,
            icon: Wrench,
            color: 'text-error-600',
            bg: 'bg-error-50',
          },
          {
            label: 'Occupants',
            value: MOCK_OCCUPANTS.length,
            icon: Users,
            color: 'text-info-600',
            bg: 'bg-info-50',
          },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{s.value}</p>
              <p className="text-[13px] text-neutral-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="occupants">Occupants</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="vehicles-pets">Vehicles &amp; Pets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="flex flex-col gap-6 xl:col-span-2">
              {/* Unit Details */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <h2 className="text-[14px] font-semibold text-neutral-900">Unit Details</h2>
                </div>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                    {[
                      { label: 'Number', value: MOCK_UNIT.number },
                      { label: 'Floor', value: String(MOCK_UNIT.floor) },
                      { label: 'Type', value: MOCK_UNIT.type },
                      { label: 'Status', value: 'Occupied' },
                      { label: 'Square Footage', value: `${MOCK_UNIT.sqft} sq ft` },
                      { label: 'Enter Phone Code', value: MOCK_UNIT.enterPhoneCode },
                      { label: 'Parking Spot', value: MOCK_UNIT.parkingSpot },
                      { label: 'Locker', value: MOCK_UNIT.locker },
                      { label: 'Key Tag', value: MOCK_UNIT.keyTag },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-neutral-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Front Desk Instructions */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-neutral-400" />
                  <h2 className="text-[14px] font-semibold text-neutral-900">
                    Front Desk Instructions ({MOCK_INSTRUCTIONS.length})
                  </h2>
                </div>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {MOCK_INSTRUCTIONS.map((instr) => (
                      <div
                        key={instr.id}
                        className={`rounded-xl border p-4 ${priorityBorderMap[instr.priority]}`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant={priorityBadgeMap[instr.priority]} size="sm">
                            {instr.priority}
                          </Badge>
                          <span className="text-[12px] text-neutral-400">
                            by {instr.createdBy} &middot;{' '}
                            {new Date(instr.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-neutral-700">{instr.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Custom Fields */}
            <div className="flex flex-col gap-6">
              <Card>
                <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Custom Fields</h2>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {Object.entries(MOCK_UNIT.customFields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          {key}
                        </p>
                        <p className="mt-1 text-[15px] text-neutral-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Occupants */}
        <TabsContent value="occupants">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              {MOCK_OCCUPANTS.length} resident{MOCK_OCCUPANTS.length !== 1 ? 's' : ''} in this unit
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Occupant
            </Button>
          </div>
          <DataTable columns={occupantColumns} data={MOCK_OCCUPANTS} emptyMessage="No occupants." />
        </TabsContent>

        {/* Tab 3: Packages */}
        <TabsContent value="packages">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              Packages from the last 30 days ({MOCK_PACKAGES.length})
            </p>
            <Link href={`/packages?unit=${MOCK_UNIT.number}`}>
              <Button variant="secondary" size="sm">
                View All Packages
              </Button>
            </Link>
          </div>
          <DataTable
            columns={packageColumns}
            data={MOCK_PACKAGES}
            emptyMessage="No recent packages."
            emptyIcon={<Package className="h-6 w-6" />}
          />
        </TabsContent>

        {/* Tab 4: Maintenance */}
        <TabsContent value="maintenance">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              {MOCK_MAINTENANCE.length} maintenance request
              {MOCK_MAINTENANCE.length !== 1 ? 's' : ''}
            </p>
            <Link href={`/maintenance?unit=${MOCK_UNIT.number}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </Link>
          </div>
          <DataTable
            columns={maintenanceColumns}
            data={MOCK_MAINTENANCE}
            emptyMessage="No maintenance requests."
            emptyIcon={<Wrench className="h-6 w-6" />}
          />
        </TabsContent>

        {/* Tab 5: Access */}
        <TabsContent value="access">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* FOBs */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Key className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  FOBs ({MOCK_FOBS.length})
                </h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {MOCK_FOBS.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                    >
                      <div>
                        <p className="font-mono text-[13px] font-medium text-neutral-900">
                          {f.serial}
                        </p>
                        <p className="text-[12px] text-neutral-500">
                          {f.type} &middot; Issued{' '}
                          {new Date(f.issuedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant={f.status === 'active' ? 'success' : 'error'} size="sm" dot>
                        {f.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buzzer Codes */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Buzzer Codes ({MOCK_BUZZER_CODES.length})
                </h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {MOCK_BUZZER_CODES.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                    >
                      <div>
                        <p className="font-mono text-[15px] font-medium text-neutral-900">
                          {b.code}
                        </p>
                        <p className="text-[12px] text-neutral-500">{b.type}</p>
                      </div>
                      <Badge variant={b.active ? 'success' : 'default'} size="sm" dot>
                        {b.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Garage Clickers */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Car className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Garage Clickers ({MOCK_GARAGE_CLICKERS.length})
                </h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {MOCK_GARAGE_CLICKERS.map((g, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                    >
                      <div>
                        <p className="font-mono text-[13px] font-medium text-neutral-900">
                          {g.serial}
                        </p>
                        <p className="text-[12px] text-neutral-500">{g.type}</p>
                      </div>
                      <Badge variant={g.status === 'active' ? 'success' : 'error'} size="sm" dot>
                        {g.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Emergency Contacts ({MOCK_EMERGENCY_CONTACTS.length})
                </h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {MOCK_EMERGENCY_CONTACTS.map((c, i) => (
                    <div key={i} className="rounded-xl border border-neutral-100 p-4">
                      <p className="text-[14px] font-medium text-neutral-900">{c.name}</p>
                      <p className="text-[13px] text-neutral-500">{c.relationship}</p>
                      <p className="mt-1 flex items-center gap-1 text-[13px] text-neutral-600">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Vehicles & Pets */}
        <TabsContent value="vehicles-pets">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Vehicles */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Car className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Vehicles (1)</h2>
              </div>
              <CardContent>
                <div className="rounded-xl border border-neutral-100 p-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'Make', value: MOCK_VEHICLE.make },
                      { label: 'Model', value: MOCK_VEHICLE.model },
                      { label: 'Year', value: String(MOCK_VEHICLE.year) },
                      { label: 'Color', value: MOCK_VEHICLE.color },
                      { label: 'Plate', value: MOCK_VEHICLE.plate },
                      { label: 'Parking Spot', value: MOCK_VEHICLE.parkingSpot },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[14px] font-medium text-neutral-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pets */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Dog className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Pets (1)</h2>
              </div>
              <CardContent>
                <div className="rounded-xl border border-neutral-100 p-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'Name', value: MOCK_PET.name },
                      { label: 'Type', value: MOCK_PET.type },
                      { label: 'Breed', value: MOCK_PET.breed },
                      { label: 'Weight', value: MOCK_PET.weight },
                      { label: 'Registration #', value: MOCK_PET.registrationNumber },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[14px] font-medium text-neutral-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 7: History */}
        <TabsContent value="history">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Unit Timeline</h2>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                <div className="flex flex-col gap-4">
                  {MOCK_HISTORY.map((event) => (
                    <div key={event.id} className="relative flex gap-3">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                        {getHistoryIcon(event.action)}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <p className="text-[13px] font-medium text-neutral-900">{event.detail}</p>
                        <p className="text-[12px] text-neutral-400">
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' \u00B7 '}
                          {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
