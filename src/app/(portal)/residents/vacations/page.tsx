'use client';

/**
 * Vacation Tracking Page — per GAP feature request
 * Track resident vacation periods with package hold and notification pause options
 */

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Calendar, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const vacationSchema = z.object({
  residentId: z.string().min(1, 'Select a resident'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: z.string().max(500).optional(),
  holdPackages: z.boolean().default(false),
  pauseNotifications: z.boolean().default(true),
});

type VacationInput = z.infer<typeof vacationSchema>;

interface ApiVacation {
  id: string;
  residentId: string;
  resident?: { firstName: string; lastName: string; unit?: { number: string } };
  startDate: string;
  endDate: string;
  notes: string | null;
  holdPackages: boolean;
  pauseNotifications: boolean;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
}

interface ApiResident {
  id: string;
  firstName: string;
  lastName: string;
}

interface VacationDisplay {
  id: string;
  resident: string;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  daysRemaining: number;
  holdPackages: boolean;
  pauseNotifications: boolean;
  notes: string | null;
}

export default function VacationsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const propertyId = getPropertyId();

  const { units } = usePropertyUnits(propertyId);
  const { data: apiVacations, loading, error, refetch } = useApi<ApiVacation[]>(
    apiUrl('/api/v1/vacations', { propertyId }),
  );
  const { data: residents } = useApi<ApiResident[]>(
    apiUrl('/api/v1/residents', { propertyId, limit: '1000' }),
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VacationInput>({
    resolver: zodResolver(vacationSchema) as any,
    defaultValues: {
      residentId: '',
      startDate: '',
      endDate: '',
      notes: '',
      holdPackages: false,
      pauseNotifications: true,
    },
  });

  const holdPackages = watch('holdPackages');
  const pauseNotifications = watch('pauseNotifications');

  const vacations: VacationDisplay[] = useMemo(() => {
    if (!apiVacations || !Array.isArray(apiVacations)) return [];

    return apiVacations.map((v) => {
      const startDate = new Date(v.startDate);
      const endDate = new Date(v.endDate);
      const today = new Date();

      let status: 'upcoming' | 'active' | 'completed' = 'upcoming';
      if (today >= endDate) status = 'completed';
      else if (today >= startDate && today < endDate) status = 'active';

      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: v.id,
        resident: `${v.resident?.firstName || ''} ${v.resident?.lastName || ''}`.trim(),
        unit: v.resident?.unit?.number || '—',
        startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status,
        daysRemaining: Math.max(-999, daysRemaining),
        holdPackages: v.holdPackages,
        pauseNotifications: v.pauseNotifications,
        notes: v.notes,
      };
    });
  }, [apiVacations]);

  const activeCount = vacations.filter((v) => v.status === 'active').length;
  const upcomingCount = vacations.filter((v) => v.status === 'upcoming').length;

  async function onSubmit(data: VacationInput) {
    setServerError(null);
    try {
      // Find the resident's unit for the API payload
      const selectedResident = residents?.find((r) => r.id === data.residentId);
      const residentUnit = units?.find((u: any) =>
        u.residents?.some((r: any) => r.id === data.residentId),
      );

      const payload = {
        propertyId,
        userId: data.residentId, // residentId IS the userId in this context
        unitId: residentUnit?.id || null,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes || null,
        holdMail: data.holdPackages,
      };

      const response = await apiRequest('/api/v1/vacations', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Failed to create vacation (${response.status})`);
        return;
      }

      reset();
      setShowCreateDialog(false);
      refetch();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const columns: Column<VacationDisplay>[] = [
    {
      id: 'resident',
      header: 'Resident',
      accessorKey: 'resident',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-neutral-900">{row.resident}</span>
          <span className="text-[13px] text-neutral-500">Unit {row.unit}</span>
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Dates',
      accessorKey: 'startDate',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 text-[14px] text-neutral-700">
          <Calendar className="h-4 w-4 text-neutral-400" />
          {row.startDate} – {row.endDate}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const statusConfig: Record<string, { label: string; variant: 'success' | 'info' | 'default' }> = {
          active: { label: 'Active', variant: 'success' },
          upcoming: { label: 'Upcoming', variant: 'info' },
          completed: { label: 'Completed', variant: 'default' },
        };
        const config = statusConfig[row.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'daysRemaining',
      header: 'Days Remaining',
      accessorKey: 'daysRemaining',
      sortable: true,
      cell: (row) =>
        row.status === 'completed' ? (
          <span className="text-[13px] text-neutral-500">—</span>
        ) : (
          <span className="text-[14px] font-medium text-neutral-900">
            {Math.max(0, row.daysRemaining)} days
          </span>
        ),
    },
    {
      id: 'actions',
      header: '',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.holdPackages && (
            <Badge variant="default" size="sm" className="bg-warning-100 text-warning-700">
              Packages on Hold
            </Badge>
          )}
          {row.pauseNotifications && (
            <Badge variant="default" size="sm" className="bg-info-100 text-info-700">
              Notifications Paused
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Vacation Tracking"
      description="Monitor resident vacations and manage package holds and notifications."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Vacation
        </Button>
      }
    >
      {loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} padding="sm">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load vacations"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Active Vacations',
                value: activeCount,
                color: 'text-success-600',
                bg: 'bg-success-50',
              },
              {
                label: 'Upcoming',
                value: upcomingCount,
                color: 'text-info-600',
                bg: 'bg-info-50',
              },
            ].map((stat) => (
              <Card key={stat.label} padding="sm" className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Calendar className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                    {stat.value}
                  </p>
                  <p className="text-[13px] text-neutral-500">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={vacations}
            emptyMessage="No vacations recorded. Add one to track resident absences."
            emptyIcon={<MapPin className="h-6 w-6" />}
          />
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
            <Calendar className="text-primary-500 h-5 w-5" />
            Add Vacation
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-500">
            Record a resident vacation period with package and notification settings.
          </DialogDescription>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
            {serverError && (
              <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
                {serverError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Resident<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('residentId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
              >
                <option value="">Select a resident...</option>
                {residents &&
                  Array.isArray(residents) &&
                  residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName} {r.lastName}
                    </option>
                  ))}
              </select>
              {errors.residentId && (
                <span className="text-[12px] text-error-600">{errors.residentId.message}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Start Date<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
                {errors.startDate && (
                  <span className="text-[12px] text-error-600">{errors.startDate.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  End Date<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
                {errors.endDate && (
                  <span className="text-[12px] text-error-600">{errors.endDate.message}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Notes</label>
              <textarea
                {...register('notes')}
                placeholder="e.g., Destination, emergency contact details..."
                className="focus:border-primary-500 focus:ring-primary-100 min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none resize-none"
              />
            </div>

            <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
              <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Options</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox {...register('holdPackages')} checked={holdPackages} />
                  <span className="text-[14px] text-neutral-700">Hold packages during vacation</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox {...register('pauseNotifications')} checked={pauseNotifications} />
                  <span className="text-[14px] text-neutral-700">Pause notifications</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t border-neutral-200 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Vacation'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
