'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Mail, Phone, Plus, Search, Users, X } from 'lucide-react';
import { AddResidentDialog } from '@/components/forms/add-resident-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unit: string;
  role: 'owner' | 'tenant' | 'family_member';
  status: 'active' | 'inactive';
  moveInDate: string;
  hasPets: boolean;
  hasVehicle: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_RESIDENTS: Resident[] = [
  {
    id: '1',
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet.smith@email.com',
    phone: '416-555-0123',
    unit: '1501',
    role: 'owner',
    status: 'active',
    moveInDate: '2022-06-01',
    hasPets: true,
    hasVehicle: true,
  },
  {
    id: '2',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@email.com',
    phone: '416-555-0456',
    unit: '802',
    role: 'tenant',
    status: 'active',
    moveInDate: '2024-01-15',
    hasPets: false,
    hasVehicle: true,
  },
  {
    id: '3',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.g@email.com',
    phone: '416-555-0789',
    unit: '1203',
    role: 'tenant',
    status: 'active',
    moveInDate: '2023-09-01',
    hasPets: true,
    hasVehicle: false,
  },
  {
    id: '4',
    firstName: 'Robert',
    lastName: 'Kim',
    email: 'rkim@email.com',
    phone: '416-555-1234',
    unit: '305',
    role: 'tenant',
    status: 'active',
    moveInDate: '2025-02-01',
    hasPets: false,
    hasVehicle: false,
  },
  {
    id: '5',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 's.wilson@email.com',
    phone: '416-555-5678',
    unit: '710',
    role: 'owner',
    status: 'active',
    moveInDate: '2021-03-15',
    hasPets: false,
    hasVehicle: true,
  },
  {
    id: '6',
    firstName: 'Lisa',
    lastName: 'Brown',
    email: 'lisa.brown@email.com',
    phone: '416-555-9012',
    unit: '1105',
    role: 'tenant',
    status: 'active',
    moveInDate: '2024-06-01',
    hasPets: false,
    hasVehicle: false,
  },
  {
    id: '7',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@email.com',
    phone: '416-555-3456',
    unit: '422',
    role: 'owner',
    status: 'active',
    moveInDate: '2020-11-01',
    hasPets: true,
    hasVehicle: true,
  },
  {
    id: '8',
    firstName: 'Alice',
    lastName: 'Wong',
    email: 'alice.w@email.com',
    phone: '416-555-7890',
    unit: '101',
    role: 'tenant',
    status: 'active',
    moveInDate: '2025-01-01',
    hasPets: false,
    hasVehicle: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResidentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: apiResidents, refetch } = useApi<Resident[]>(
    apiUrl('/api/v1/residents', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allResidents = useMemo(() => {
    if (apiResidents && Array.isArray(apiResidents) && apiResidents.length > 0) {
      return apiResidents.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        firstName: r.firstName as string,
        lastName: r.lastName as string,
        email: r.email as string,
        phone: (r.phone as string) || '',
        unit: '',
        role: ((r.role as Record<string, string>)?.slug as Resident['role']) || 'tenant',
        status: 'active' as const,
        moveInDate: (r.createdAt as string) || '2025-01-01',
        hasPets: false,
        hasVehicle: false,
      }));
    }
    return MOCK_RESIDENTS;
  }, [apiResidents]);

  const filteredResidents = useMemo(
    () =>
      allResidents.filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        return fullName.includes(q) || r.unit.includes(q) || r.email.toLowerCase().includes(q);
      }),
    [searchQuery],
  );

  const columns: Column<Resident>[] = [
    {
      id: 'name',
      header: 'Resident',
      accessorKey: 'lastName',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-[12px] text-neutral-500">{row.email}</p>
          </div>
        </div>
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
      id: 'role',
      header: 'Type',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => {
        const map = {
          owner: { variant: 'primary' as const, label: 'Owner' },
          tenant: { variant: 'info' as const, label: 'Tenant' },
          family_member: { variant: 'default' as const, label: 'Family' },
        };
        const r = map[row.role];
        return (
          <Badge variant={r.variant} size="sm">
            {r.label}
          </Badge>
        );
      },
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => (
        <span className="flex items-center gap-1 text-[13px] text-neutral-600">
          <Phone className="h-3 w-3 text-neutral-400" />
          {row.phone}
        </span>
      ),
    },
    {
      id: 'moveIn',
      header: 'Move-in',
      accessorKey: 'moveInDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.moveInDate).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'flags',
      header: '',
      cell: (row) => (
        <div className="flex gap-1">
          {row.hasPets && (
            <Badge variant="default" size="sm">
              Pets
            </Badge>
          )}
          {row.hasVehicle && (
            <Badge variant="default" size="sm">
              Vehicle
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm" dot>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell
      title="Resident Directory"
      description={`${allResidents.length} residents across ${new Set(allResidents.map((r) => r.unit)).size} units`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Resident
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, unit, or email..."
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
        data={filteredResidents}
        emptyMessage="No residents found."
        emptyIcon={<Users className="h-6 w-6" />}
        onRowClick={(row) => router.push(`/residents/${row.id}`)}
      />

      <AddResidentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        propertyId="00000000-0000-4000-b000-000000000001"
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
