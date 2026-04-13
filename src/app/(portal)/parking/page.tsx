'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Car,
  Download,
  Loader2,
  MapPin,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { CreateParkingPermitDialog } from '@/components/forms/create-parking-permit-dialog';
import { CreateParkingViolationDialog } from '@/components/forms/create-parking-violation-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { exportToCsv } from '@/lib/export-csv';

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
// Component
// ---------------------------------------------------------------------------

export default function ParkingPage() {
  const [tab, setTab] = useState<'permits' | 'violations'>('permits');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermitDialog, setShowPermitDialog] = useState(false);
  const [showViolationDialog, setShowViolationDialog] = useState(false);

  const {
    data: apiPermits,
    loading: loadingPermits,
    error: errorPermits,
    refetch: refetchPermits,
  } = useApi<ParkingPermit[]>(
    apiUrl('/api/v1/parking', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
    }),
  );

  const {
    data: apiViolations,
    loading: loadingViolations,
    error: errorViolations,
    refetch: refetchViolations,
  } = useApi<ParkingViolation[]>(
    apiUrl('/api/v1/parking', {
      propertyId: getPropertyId(),
      type: 'violations',
      search: searchQuery || undefined,
    }),
  );

  const loading = tab === 'permits' ? loadingPermits : loadingViolations;
  const error = tab === 'permits' ? errorPermits : errorViolations;

  const allPermits = useMemo<ParkingPermit[]>(() => {
    if (!apiPermits) return [];
    return (apiPermits as unknown as Array<Record<string, unknown>>).map((p) => {
      const unit =
        typeof p.unit === 'object' && p.unit !== null
          ? (p.unit as Record<string, string>).number || ''
          : (p.unit as string) || '';
      const resident =
        typeof p.resident === 'object' && p.resident !== null
          ? `${(p.resident as Record<string, string>).firstName || ''} ${(p.resident as Record<string, string>).lastName || ''}`.trim()
          : (p.resident as string) || '';
      const permitType =
        typeof p.permitType === 'object' && p.permitType !== null
          ? (p.permitType as Record<string, string>).name || ''
          : '';
      return {
        id: (p.id as string) || '',
        permitNumber: (p.referenceNumber as string) || (p.permitNumber as string) || '',
        unit,
        resident,
        vehicle: (p.vehicle as string) || '',
        licensePlate: (p.licensePlate as string) || '',
        spotNumber: (p.spotNumber as string) || '',
        area: (p.area as string) || '',
        type: (permitType.toLowerCase().includes('visitor')
          ? 'visitor'
          : permitType.toLowerCase().includes('reserved')
            ? 'reserved'
            : 'resident') as ParkingPermit['type'],
        status: ((p.status as string) || 'active') as ParkingPermit['status'],
        expiresAt: (p.validUntil as string) || (p.expiresAt as string) || undefined,
      };
    });
  }, [apiPermits]);
  const allViolations = useMemo<ParkingViolation[]>(() => {
    if (!apiViolations) return [];
    return (apiViolations as unknown as Array<Record<string, unknown>>).map((v) => {
      const unit =
        typeof v.unit === 'object' && v.unit !== null
          ? (v.unit as Record<string, string>).number || ''
          : (v.unit as string) || '';
      return {
        id: (v.id as string) || '',
        licensePlate: (v.licensePlate as string) || '',
        location: (v.location as string) || (v.area as string) || '',
        violation: (v.violation as string) || (v.description as string) || '',
        status: ((v.status as string) || 'open') as ParkingViolation['status'],
        reportedBy: (v.reportedBy as string) || 'Staff',
        reportedAt: (v.reportedAt as string) || (v.createdAt as string) || new Date().toISOString(),
        unit,
      };
    });
  }, [apiViolations]);

  const filteredPermits = useMemo(() => {
    if (!searchQuery) return allPermits;
    const q = searchQuery.toLowerCase();
    return allPermits.filter(
      (p) =>
        p.resident.toLowerCase().includes(q) ||
        p.licensePlate.toLowerCase().includes(q) ||
        p.unit.includes(q) ||
        p.spotNumber.toLowerCase().includes(q),
    );
  }, [allPermits, searchQuery]);

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
      cell: (row) => (
        <span className="font-medium">
          {typeof row.unit === 'object' && row.unit !== null
            ? (row.unit as Record<string, string>).number
            : row.unit || '—'}
        </span>
      ),
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
        const m: Record<string, 'primary' | 'info' | 'warning'> = {
          resident: 'primary',
          visitor: 'info',
          reserved: 'warning',
        };
        return (
          <Badge variant={m[row.type] ?? 'default'} size="sm">
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
        const m: Record<string, 'error' | 'warning' | 'success'> = {
          open: 'error',
          warned: 'warning',
          resolved: 'success',
        };
        return (
          <Badge variant={m[row.status] ?? 'default'} size="sm" dot>
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
      description={
        !loading && !error
          ? `${allPermits.length} active permits \u00B7 ${allViolations.filter((v) => v.status === 'open').length} open violations`
          : 'Manage parking permits and violations.'
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (tab === 'permits') {
                exportToCsv(
                  allPermits,
                  [
                    { key: 'permitNumber', header: 'Permit #' },
                    { key: 'unit', header: 'Unit' },
                    { key: 'resident', header: 'Resident' },
                    { key: 'vehicle', header: 'Vehicle' },
                    { key: 'licensePlate', header: 'License Plate' },
                    { key: 'spotNumber', header: 'Spot' },
                    { key: 'area', header: 'Area' },
                    { key: 'type', header: 'Type' },
                    { key: 'status', header: 'Status' },
                  ],
                  'parking-permits',
                );
              } else {
                exportToCsv(
                  allViolations,
                  [
                    { key: 'licensePlate', header: 'License Plate' },
                    { key: 'location', header: 'Location' },
                    { key: 'violation', header: 'Violation' },
                    { key: 'status', header: 'Status' },
                    { key: 'reportedBy', header: 'Reported By' },
                    { key: 'reportedAt', header: 'Reported At' },
                  ],
                  'parking-violations',
                );
              }
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowViolationDialog(true)}>
            <AlertTriangle className="h-4 w-4" />
            Report Violation
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
          {!loadingPermits && (
            <Badge variant={tab === 'permits' ? 'primary' : 'default'} size="sm">
              {allPermits.length}
            </Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('violations')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-medium transition-all ${tab === 'violations' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'}`}
        >
          <AlertTriangle className="h-4 w-4" />
          Violations{' '}
          {!loadingViolations && (
            <Badge variant={tab === 'violations' ? 'error' : 'default'} size="sm">
              {allViolations.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">
            Loading {tab === 'permits' ? 'permits' : 'violations'}...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title={`Failed to load ${tab}`}
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (tab === 'permits' ? refetchPermits() : refetchViolations())}
            >
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
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
              data={allViolations}
              emptyMessage="No violations."
              emptyIcon={<AlertTriangle className="h-6 w-6" />}
            />
          )}
        </>
      )}

      <CreateParkingPermitDialog
        open={showPermitDialog}
        onOpenChange={setShowPermitDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowPermitDialog(false);
          refetchPermits();
          refetchViolations();
        }}
      />

      <CreateParkingViolationDialog
        open={showViolationDialog}
        onOpenChange={setShowViolationDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowViolationDialog(false);
          refetchPermits();
          refetchViolations();
        }}
      />
    </PageShell>
  );
}
