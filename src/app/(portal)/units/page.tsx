'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Download, Grid3X3, List, Search, Users, X } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnitItem {
  id: string;
  number: string;
  floor: number;
  building: string;
  type: 'studio' | '1br' | '2br' | '3br' | 'penthouse';
  occupantCount: number;
  primaryResident: string;
  status: 'occupied' | 'vacant' | 'owner_occupied' | 'rented';
  unreleasedPackages: number;
  openRequests: number;
  hasInstructions: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_UNITS: UnitItem[] = [
  {
    id: '1',
    number: '101',
    floor: 1,
    building: 'Tower A',
    type: '1br',
    occupantCount: 1,
    primaryResident: 'Alice Wong',
    status: 'occupied',
    unreleasedPackages: 0,
    openRequests: 0,
    hasInstructions: false,
  },
  {
    id: '2',
    number: '305',
    floor: 3,
    building: 'Tower A',
    type: '2br',
    occupantCount: 2,
    primaryResident: 'Robert Kim',
    status: 'rented',
    unreleasedPackages: 1,
    openRequests: 1,
    hasInstructions: true,
  },
  {
    id: '3',
    number: '422',
    floor: 4,
    building: 'Tower A',
    type: '1br',
    occupantCount: 1,
    primaryResident: 'Jane Doe',
    status: 'owner_occupied',
    unreleasedPackages: 0,
    openRequests: 0,
    hasInstructions: false,
  },
  {
    id: '4',
    number: '710',
    floor: 7,
    building: 'Tower A',
    type: '2br',
    occupantCount: 3,
    primaryResident: 'Sarah Wilson',
    status: 'occupied',
    unreleasedPackages: 0,
    openRequests: 0,
    hasInstructions: true,
  },
  {
    id: '5',
    number: '802',
    floor: 8,
    building: 'Tower A',
    type: '3br',
    occupantCount: 4,
    primaryResident: 'David Chen',
    status: 'occupied',
    unreleasedPackages: 1,
    openRequests: 1,
    hasInstructions: false,
  },
  {
    id: '6',
    number: '910',
    floor: 9,
    building: 'Tower A',
    type: 'studio',
    occupantCount: 0,
    primaryResident: '',
    status: 'vacant',
    unreleasedPackages: 0,
    openRequests: 0,
    hasInstructions: false,
  },
  {
    id: '7',
    number: '1105',
    floor: 11,
    building: 'Tower A',
    type: '2br',
    occupantCount: 2,
    primaryResident: 'Lisa Brown',
    status: 'rented',
    unreleasedPackages: 0,
    openRequests: 1,
    hasInstructions: false,
  },
  {
    id: '8',
    number: '1203',
    floor: 12,
    building: 'Tower A',
    type: '1br',
    occupantCount: 1,
    primaryResident: 'Maria Garcia',
    status: 'occupied',
    unreleasedPackages: 1,
    openRequests: 0,
    hasInstructions: false,
  },
  {
    id: '9',
    number: '1501',
    floor: 15,
    building: 'Tower A',
    type: 'penthouse',
    occupantCount: 2,
    primaryResident: 'Janet Smith',
    status: 'owner_occupied',
    unreleasedPackages: 2,
    openRequests: 1,
    hasInstructions: true,
  },
];

const TYPE_LABELS: Record<string, string> = {
  studio: 'Studio',
  '1br': '1 Bed',
  '2br': '2 Bed',
  '3br': '3 Bed',
  penthouse: 'Penthouse',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UnitsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data: apiUnits } = useApi<UnitItem[]>(
    apiUrl('/api/v1/units', { propertyId: DEMO_PROPERTY_ID }),
  );

  const dbUnits = useMemo(() => {
    if (apiUnits && Array.isArray(apiUnits) && apiUnits.length > 0) {
      return apiUnits.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        number: u.number as string,
        floor: (u.floor as number) || 1,
        building: (u.building as Record<string, string>)?.name || 'Tower A',
        type: ((u.unitType as string) || 'residential') as UnitItem['type'],
        occupantCount: 0,
        primaryResident: '',
        status: (u.status as string) === 'occupied' ? ('occupied' as const) : ('vacant' as const),
        unreleasedPackages: 0,
        openRequests: 0,
        hasInstructions: ((u.unitInstructions as unknown[]) || []).length > 0,
      }));
    }
    return MOCK_UNITS;
  }, [apiUnits]);

  const filteredUnits = useMemo(
    () =>
      dbUnits.filter((u) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          u.number.toLowerCase().includes(q) ||
          u.primaryResident.toLowerCase().includes(q) ||
          u.building.toLowerCase().includes(q)
        );
      }),
    [searchQuery],
  );

  const occupiedCount = dbUnits.filter((u) => u.status !== 'vacant').length;

  const columns: Column<UnitItem>[] = [
    {
      id: 'number',
      header: 'Unit',
      accessorKey: 'number',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-neutral-900">{row.number}</span>
          {row.hasInstructions && (
            <span
              className="bg-warning-500 h-1.5 w-1.5 rounded-full"
              title="Has front desk instructions"
            />
          )}
        </div>
      ),
    },
    {
      id: 'floor',
      header: 'Floor',
      accessorKey: 'floor',
      sortable: true,
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => <span className="text-neutral-600">{TYPE_LABELS[row.type]}</span>,
    },
    {
      id: 'primaryResident',
      header: 'Primary Resident',
      accessorKey: 'primaryResident',
      sortable: true,
      cell: (row) => (
        <span className={row.primaryResident ? 'text-neutral-900' : 'text-neutral-400 italic'}>
          {row.primaryResident || 'Vacant'}
        </span>
      ),
    },
    {
      id: 'occupantCount',
      header: 'Occupants',
      accessorKey: 'occupantCount',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-neutral-400" />
          <span>{row.occupantCount}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const map = {
          occupied: { variant: 'success' as const, label: 'Occupied' },
          vacant: { variant: 'default' as const, label: 'Vacant' },
          owner_occupied: { variant: 'primary' as const, label: 'Owner' },
          rented: { variant: 'info' as const, label: 'Rented' },
        };
        const s = map[row.status];
        return (
          <Badge variant={s.variant} size="sm">
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'packages',
      header: 'Packages',
      accessorKey: 'unreleasedPackages',
      cell: (row) =>
        row.unreleasedPackages > 0 ? (
          <Badge variant="warning" size="sm" dot>
            {row.unreleasedPackages}
          </Badge>
        ) : (
          <span className="text-neutral-300">\u2014</span>
        ),
    },
    {
      id: 'requests',
      header: 'Requests',
      accessorKey: 'openRequests',
      cell: (row) =>
        row.openRequests > 0 ? (
          <Badge variant="error" size="sm" dot>
            {row.openRequests}
          </Badge>
        ) : (
          <span className="text-neutral-300">\u2014</span>
        ),
    },
  ];

  return (
    <PageShell
      title="Unit Directory"
      description={`${dbUnits.length} units \u00B7 ${occupiedCount} occupied \u00B7 ${dbUnits.length - occupiedCount} vacant`}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'table' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-all ${viewMode === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by unit number or resident..."
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

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredUnits}
          emptyMessage="No units found."
          emptyIcon={<Building2 className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/units/${row.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUnits.map((unit) => (
            <Card
              key={unit.id}
              hoverable
              className="cursor-pointer"
              onClick={() => router.push(`/units/${unit.id}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[20px] font-bold text-neutral-900">{unit.number}</p>
                  <p className="text-[13px] text-neutral-500">
                    Floor {unit.floor} &middot; {TYPE_LABELS[unit.type]}
                  </p>
                </div>
                <Badge variant={unit.status === 'vacant' ? 'default' : 'success'} size="sm">
                  {unit.status === 'vacant' ? 'Vacant' : 'Occupied'}
                </Badge>
              </div>
              {unit.primaryResident && (
                <p className="mt-3 text-[14px] text-neutral-700">{unit.primaryResident}</p>
              )}
              <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {unit.occupantCount}
                </span>
                {unit.unreleasedPackages > 0 && (
                  <Badge variant="warning" size="sm">
                    {unit.unreleasedPackages} pkg
                  </Badge>
                )}
                {unit.openRequests > 0 && (
                  <Badge variant="error" size="sm">
                    {unit.openRequests} req
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
