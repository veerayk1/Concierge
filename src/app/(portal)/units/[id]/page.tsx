'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
  History,
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
  AlertCircle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { useAuth } from '@/lib/hooks/use-auth';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EditUnitDialog } from '@/components/forms/edit-unit-dialog';

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

interface AuditEntry {
  id: string;
  action: string;
  actorName: string | null;
  fields: Record<string, unknown> | null;
  createdAt: string;
}

interface UnitDetail {
  id: string;
  number: string;
  floor: number;
  building: string;
  type: string;
  status: string;
  sqft: number;
  enterPhoneCode: string;
  parkingSpot: string;
  locker: string;
  keyTag: string;
  customFields: Record<string, string>;
  instructions: Instruction[];
  occupants: Occupant[];
  packages: UnitPackage[];
  maintenance: MaintenanceRequest[];
  fobs: FOB[];
  buzzerCodes: { code: string; type: string; active: boolean }[];
  garageClickers: { serial: string; type: string; status: string }[];
  emergencyContacts: { name: string; relationship: string; phone: string }[];
  vehicles: Vehicle[];
  pets: Pet[];
  history: HistoryEvent[];
}

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
// Skeleton Loader
// ---------------------------------------------------------------------------

function UnitDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 rounded bg-neutral-200" />
        <div className="h-8 w-48 rounded bg-neutral-200" />
        <div className="h-4 w-64 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
      <div className="h-10 w-full rounded bg-neutral-100" />
      <div className="h-64 rounded-xl bg-neutral-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Role detection (Gap 7.3) — works in demo mode where useAuth() returns null
  const { user: currentUser } = useAuth();
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
  const effectiveRole = currentUser?.role ?? demoRole ?? '';
  const isAdminOrManager = ['super_admin', 'property_admin', 'property_manager'].includes(
    effectiveRole,
  );

  const {
    data: unit,
    loading,
    error,
    refetch,
  } = useApi<UnitDetail>(apiUrl(`/api/v1/units/${id}`, { propertyId: getPropertyId() }));

  // Audit log (Gap 7.3) — admin/manager only
  const { data: auditData } = useApi<{ data: AuditEntry[]; total: number }>(
    apiUrl('/api/v1/audit-log', {
      propertyId: getPropertyId(),
      resource: 'units',
      resourceId: id,
      pageSize: '20',
    }),
    { enabled: isAdminOrManager },
  );
  const auditEntries: AuditEntry[] = auditData?.data ?? [];

  // -- Loading State --
  if (loading) {
    return <UnitDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Unit Not Found' : 'Failed to Load Unit'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/units">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to units
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Building2 className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Unit Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The unit you are looking for does not exist or has been removed.
        </p>
        <Link href="/units">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to units
          </Button>
        </Link>
      </div>
    );
  }

  const occupants = unit.occupants ?? [];
  const packages = unit.packages ?? [];
  const maintenance = unit.maintenance ?? [];
  const instructions = unit.instructions ?? [];
  const fobs = unit.fobs ?? [];
  const buzzerCodes = unit.buzzerCodes ?? [];
  const garageClickers = unit.garageClickers ?? [];
  const emergencyContacts = unit.emergencyContacts ?? [];
  const vehicles = unit.vehicles ?? [];
  const pets = unit.pets ?? [];
  const history = unit.history ?? [];
  const customFields = unit.customFields ?? {};

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
              Unit {unit.number}
            </h1>
            <Badge variant={unit.status === 'occupied' ? 'success' : 'default'} size="lg" dot>
              {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
            </Badge>
          </div>
          <p className="text-[14px] text-neutral-500">
            {unit.building} &middot; Floor {unit.floor} &middot; {unit.type} &middot; {unit.sqft} sq
            ft
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
          <Edit2 className="h-4 w-4" />
          Edit Unit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Unreleased Packages',
            value: packages.filter((p) => p.status === 'unreleased').length,
            icon: Package,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Open Requests',
            value: maintenance.filter((m) => m.status === 'open' || m.status === 'in_progress')
              .length,
            icon: Wrench,
            color: 'text-error-600',
            bg: 'bg-error-50',
          },
          {
            label: 'Occupants',
            value: occupants.length,
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
                      { label: 'Number', value: unit.number },
                      { label: 'Floor', value: String(unit.floor) },
                      { label: 'Type', value: unit.type },
                      {
                        label: 'Status',
                        value: unit.status.charAt(0).toUpperCase() + unit.status.slice(1),
                      },
                      { label: 'Square Footage', value: `${unit.sqft} sq ft` },
                      { label: 'Enter Phone Code', value: unit.enterPhoneCode },
                      { label: 'Parking Spot', value: unit.parkingSpot },
                      { label: 'Locker', value: unit.locker },
                      { label: 'Key Tag', value: unit.keyTag },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-neutral-900">
                          {item.value || '—'}
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
                    Front Desk Instructions ({instructions.length})
                  </h2>
                </div>
                <CardContent>
                  {instructions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {instructions.map((instr) => (
                        <div
                          key={instr.id}
                          className={`rounded-xl border p-4 ${priorityBorderMap[instr.priority] ?? 'border-neutral-200'}`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <Badge
                              variant={priorityBadgeMap[instr.priority] ?? 'default'}
                              size="sm"
                            >
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
                          <p className="text-[14px] leading-relaxed text-neutral-700">
                            {instr.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[14px] text-neutral-400">No front desk instructions.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Custom Fields */}
            <div className="flex flex-col gap-6">
              <Card>
                <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Custom Fields</h2>
                <CardContent>
                  {Object.keys(customFields).length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {Object.entries(customFields).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                            {key}
                          </p>
                          <p className="mt-1 text-[15px] text-neutral-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[14px] text-neutral-400">No custom fields configured.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Occupants */}
        <TabsContent value="occupants">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              {occupants.length} resident{occupants.length !== 1 ? 's' : ''} in this unit
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Occupant
            </Button>
          </div>
          <DataTable columns={occupantColumns} data={occupants} emptyMessage="No occupants." />
        </TabsContent>

        {/* Tab 3: Packages */}
        <TabsContent value="packages">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              Packages from the last 30 days ({packages.length})
            </p>
            <Link href={`/packages?unit=${unit.number}`}>
              <Button variant="secondary" size="sm">
                View All Packages
              </Button>
            </Link>
          </div>
          <DataTable
            columns={packageColumns}
            data={packages}
            emptyMessage="No recent packages."
            emptyIcon={<Package className="h-6 w-6" />}
          />
        </TabsContent>

        {/* Tab 4: Maintenance */}
        <TabsContent value="maintenance">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-neutral-500">
              {maintenance.length} maintenance request
              {maintenance.length !== 1 ? 's' : ''}
            </p>
            <Link href={`/maintenance?unit=${unit.number}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </Link>
          </div>
          <DataTable
            columns={maintenanceColumns}
            data={maintenance}
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
                <h2 className="text-[14px] font-semibold text-neutral-900">FOBs ({fobs.length})</h2>
              </div>
              <CardContent>
                {fobs.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {fobs.map((f, i) => (
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
                ) : (
                  <p className="text-[14px] text-neutral-400">No FOBs assigned.</p>
                )}
              </CardContent>
            </Card>

            {/* Buzzer Codes */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Buzzer Codes ({buzzerCodes.length})
                </h2>
              </div>
              <CardContent>
                {buzzerCodes.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {buzzerCodes.map((b, i) => (
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
                ) : (
                  <p className="text-[14px] text-neutral-400">No buzzer codes.</p>
                )}
              </CardContent>
            </Card>

            {/* Garage Clickers */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Car className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Garage Clickers ({garageClickers.length})
                </h2>
              </div>
              <CardContent>
                {garageClickers.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {garageClickers.map((g, i) => (
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
                ) : (
                  <p className="text-[14px] text-neutral-400">No garage clickers.</p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Emergency Contacts ({emergencyContacts.length})
                </h2>
              </div>
              <CardContent>
                {emergencyContacts.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {emergencyContacts.map((c, i) => (
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
                ) : (
                  <p className="text-[14px] text-neutral-400">No emergency contacts.</p>
                )}
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
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Vehicles ({vehicles.length})
                </h2>
              </div>
              <CardContent>
                {vehicles.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {vehicles.map((v, i) => (
                      <div key={i} className="rounded-xl border border-neutral-100 p-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {[
                            { label: 'Make', value: v.make },
                            { label: 'Model', value: v.model },
                            { label: 'Year', value: String(v.year) },
                            { label: 'Color', value: v.color },
                            { label: 'Plate', value: v.plate },
                            { label: 'Parking Spot', value: v.parkingSpot },
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
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-neutral-400">No vehicles registered.</p>
                )}
              </CardContent>
            </Card>

            {/* Pets */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Dog className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Pets ({pets.length})</h2>
              </div>
              <CardContent>
                {pets.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {pets.map((p, i) => (
                      <div key={i} className="rounded-xl border border-neutral-100 p-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {[
                            { label: 'Name', value: p.name },
                            { label: 'Type', value: p.type },
                            { label: 'Breed', value: p.breed },
                            { label: 'Weight', value: p.weight },
                            { label: 'Registration #', value: p.registrationNumber },
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
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-neutral-400">No pets registered.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 7: History */}
        <TabsContent value="history">
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Unit Timeline</h2>
              <CardContent>
                {history.length > 0 ? (
                  <div className="relative">
                    <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                    <div className="flex flex-col gap-4">
                      {history.map((event) => (
                        <div key={event.id} className="relative flex gap-3">
                          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                            {getHistoryIcon(event.action)}
                          </div>
                          <div className="flex flex-col gap-0.5 pt-0.5">
                            <p className="text-[13px] font-medium text-neutral-900">
                              {event.detail}
                            </p>
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
                ) : (
                  <p className="text-[14px] text-neutral-400">No history events.</p>
                )}
              </CardContent>
            </Card>

            {/* Change History (audit log) — admin/manager only (Gap 7.3) */}
            {isAdminOrManager && (
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-neutral-400" />
                  <h2 className="text-[14px] font-semibold text-neutral-900">Change History</h2>
                  <span className="ml-auto text-[12px] text-neutral-400">Last 20 changes</span>
                </div>
                <CardContent>
                  {auditEntries.length > 0 ? (
                    <div className="flex flex-col divide-y divide-neutral-100">
                      {auditEntries.map((entry) => (
                        <div key={entry.id} className="py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-neutral-900 capitalize">
                                {entry.action.replace(/_/g, ' ')}
                              </p>
                              {entry.fields && Object.keys(entry.fields).length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Object.keys(entry.fields).map((field) => (
                                    <span
                                      key={field}
                                      className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600"
                                    >
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[12px] text-neutral-500">
                                {entry.actorName ?? 'System'}
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                {new Date(entry.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[14px] text-neutral-400">No change history recorded.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Unit Dialog */}
      {unit && (
        <EditUnitDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          unit={unit}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
