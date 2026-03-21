'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Download,
  Grid3X3,
  List,
  Plus,
  Search,
  Upload,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUnitDialog } from '@/components/forms/create-unit-dialog';
import { ImportWizard } from '@/components/import/import-wizard';
import { GenerateUnitsDialog } from '@/components/forms/generate-units-dialog';

// ---------------------------------------------------------------------------
// Types — matches API response shape from GET /api/v1/units
// ---------------------------------------------------------------------------

interface ApiUnit {
  id: string;
  number: string;
  floor: number | null;
  unitType: string;
  status: string;
  squareFootage: string | null;
  building: { id: string; name: string } | null;
  unitInstructions: { id: string; instructionText: string; priority: string }[];
  occupantCount?: number;
  primaryResident?: { id: string; name: string; email: string } | null;
}

interface ApiResponse {
  data: ApiUnit[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UnitItem {
  id: string;
  number: string;
  floor: number;
  building: string;
  type: string;
  occupantCount: number;
  primaryResident: string;
  status: 'occupied' | 'vacant' | 'owner_occupied' | 'rented' | 'under_renovation';
  hasInstructions: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  storage: 'Storage',
  parking: 'Parking',
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showGenerateUnits, setShowGenerateUnits] = useState(false);

  // Debounce search input to avoid firing API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const propertyId = getPropertyId();

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<ApiResponse>(
    apiUrl('/api/v1/units', {
      propertyId,
      search: debouncedSearch || undefined,
      pageSize: '200',
    }),
  );

  const units = useMemo<UnitItem[]>(() => {
    const rawUnits = apiResponse?.data ?? (apiResponse as unknown as ApiUnit[]);
    if (!rawUnits || !Array.isArray(rawUnits)) return [];

    return rawUnits.map((u) => ({
      id: u.id,
      number: u.number,
      floor: u.floor ?? 1,
      building: u.building?.name || 'Main',
      type: u.unitType || 'residential',
      occupantCount: u.occupantCount ?? 0,
      primaryResident: u.primaryResident?.name || '',
      status: normalizeUnitStatus(u.status),
      hasInstructions: (u.unitInstructions?.length ?? 0) > 0,
    }));
  }, [apiResponse]);

  const occupiedCount = units.filter((u) => u.status !== 'vacant').length;

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
      id: 'building',
      header: 'Building',
      accessorKey: 'building',
      sortable: true,
      cell: (row) => <span className="text-neutral-600">{row.building}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => <span className="text-neutral-600">{TYPE_LABELS[row.type] || row.type}</span>,
    },
    {
      id: 'occupants',
      header: 'Occupants',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-neutral-600">{row.occupantCount}</span>
          {row.primaryResident && (
            <span className="ml-1 text-xs text-neutral-400">{row.primaryResident}</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const map: Record<
          string,
          {
            variant: 'success' | 'default' | 'primary' | 'info' | 'warning';
            label: string;
          }
        > = {
          occupied: { variant: 'success', label: 'Occupied' },
          vacant: { variant: 'default', label: 'Vacant' },
          owner_occupied: { variant: 'primary', label: 'Owner' },
          rented: { variant: 'info', label: 'Rented' },
          under_renovation: { variant: 'warning', label: 'Renovation' },
        };
        const s = map[row.status] || {
          variant: 'default' as const,
          label: row.status,
        };
        return (
          <Badge variant={s.variant} size="sm">
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'instructions',
      header: '',
      cell: (row) =>
        row.hasInstructions ? (
          <Badge variant="warning" size="sm">
            Instructions
          </Badge>
        ) : null,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <PageShell title="Unit Directory" description="Loading...">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Unit Directory" description="Error loading units">
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="Failed to load units"
          description={error}
          action={
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <>
      <PageShell
        title="Unit Directory"
        description={`${units.length} units \u00B7 ${occupiedCount} occupied \u00B7 ${units.length - occupiedCount} vacant`}
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
            <Button variant="secondary" size="sm" onClick={() => setShowImportWizard(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowGenerateUnits(true)}>
              <Wand2 className="h-4 w-4" />
              Auto-Generate
            </Button>
            <Button size="sm" onClick={() => setShowCreateUnit(true)}>
              <Plus className="h-4 w-4" />
              Add Unit
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
              placeholder="Search by unit number..."
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

        {units.length === 0 && !searchQuery ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No units found"
            description="Get started by adding units to this property. You can add them one by one or import from a spreadsheet."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowImportWizard(true)}>
                  <Upload className="h-4 w-4" />
                  Import from Spreadsheet
                </Button>
                <Button size="sm" onClick={() => setShowCreateUnit(true)}>
                  <Plus className="h-4 w-4" />
                  Add Unit
                </Button>
              </div>
            }
          />
        ) : viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={units}
            emptyMessage="No units match your search."
            emptyIcon={<Building2 className="h-6 w-6" />}
            onRowClick={(row) => router.push(`/units/${row.id}` as never)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {units.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<Building2 className="h-6 w-6" />}
                  title="No units match your search"
                />
              </div>
            ) : (
              units.map((unit) => (
                <Card
                  key={unit.id}
                  hoverable
                  className="cursor-pointer"
                  onClick={() => router.push(`/units/${unit.id}` as never)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[20px] font-bold text-neutral-900">{unit.number}</p>
                      <p className="text-[13px] text-neutral-500">
                        Floor {unit.floor} &middot; {TYPE_LABELS[unit.type] || unit.type}
                      </p>
                    </div>
                    <Badge variant={unit.status === 'vacant' ? 'default' : 'success'} size="sm">
                      {unit.status === 'vacant' ? 'Vacant' : 'Occupied'}
                    </Badge>
                  </div>
                  {unit.occupantCount > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-500">
                      <Users className="h-3 w-3" />
                      {unit.occupantCount} occupant
                      {unit.occupantCount !== 1 ? 's' : ''}
                      {unit.primaryResident && ` · ${unit.primaryResident}`}
                    </div>
                  )}
                  <p className="mt-2 text-[13px] text-neutral-500">{unit.building}</p>
                  {unit.hasInstructions && (
                    <div className="mt-2">
                      <Badge variant="warning" size="sm">
                        Has Instructions
                      </Badge>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </PageShell>

      {/* Dialogs */}
      <CreateUnitDialog
        open={showCreateUnit}
        onOpenChange={setShowCreateUnit}
        propertyId={propertyId}
        onSuccess={() => {
          setShowCreateUnit(false);
          refetch();
        }}
      />

      <ImportWizard
        open={showImportWizard}
        onOpenChange={setShowImportWizard}
        entityType="units"
        propertyId={propertyId}
        onSuccess={() => refetch()}
      />

      <GenerateUnitsDialog
        open={showGenerateUnits}
        onOpenChange={setShowGenerateUnits}
        propertyId={propertyId}
        onSuccess={() => refetch()}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeUnitStatus(status: string): UnitItem['status'] {
  const map: Record<string, UnitItem['status']> = {
    occupied: 'occupied',
    vacant: 'vacant',
    owner_occupied: 'owner_occupied',
    rented: 'rented',
    under_renovation: 'under_renovation',
  };
  return map[status] || 'vacant';
}
