'use client';

/**
 * Create Parking Permit Dialog — per PRD 13
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const permitSchema = z.object({
  unitId: z.string().min(1, 'Select a unit'),
  type: z.enum(['resident', 'visitor', 'reserved']).default('resident'),
  vehicleMake: z.string().min(1, 'Vehicle make is required').max(50),
  vehicleModel: z.string().min(1, 'Vehicle model is required').max(50),
  vehicleColor: z.string().min(1, 'Vehicle color is required').max(30),
  licensePlate: z.string().min(1, 'License plate is required').max(20),
  spotNumber: z.string().max(20).optional().or(z.literal('')),
  areaId: z.string().optional(),
  expiresAt: z.string().optional().or(z.literal('')),
});

type PermitInput = z.infer<typeof permitSchema>;

const PARKING_AREAS = [
  { id: 'area-1', name: 'P1 Underground' },
  { id: 'area-2', name: 'P2 Underground' },
  { id: 'area-3', name: 'Visitor Lot' },
  { id: 'area-4', name: 'Surface Lot' },
];

interface CreateParkingPermitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateParkingPermitDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateParkingPermitDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PermitInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(permitSchema) as any,
    defaultValues: {
      unitId: '',
      type: 'resident',
      vehicleMake: '',
      vehicleModel: '',
      vehicleColor: '',
      licensePlate: '',
      spotNumber: '',
      expiresAt: '',
    },
  });

  const permitType = watch('type');

  async function onSubmit(data: PermitInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/parking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to issue parking permit');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Car className="text-primary-500 h-5 w-5" />
          New Parking Permit
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Issue a parking permit for a resident or visitor.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Type Selector */}
          <div className="flex rounded-xl bg-neutral-100 p-1">
            {(['resident', 'visitor', 'reserved'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`flex-1 rounded-lg py-2 text-[14px] font-medium capitalize transition-all ${
                  permitType === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Unit<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('unitId')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.unitId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">{unitsLoading ? 'Loading units...' : 'Select unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Parking Area</label>
              <select
                {...register('areaId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">Select area...</option>
                {PARKING_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              {...register('vehicleMake')}
              label="Make"
              placeholder="e.g. Tesla"
              required
              error={errors.vehicleMake?.message}
            />
            <Input
              {...register('vehicleModel')}
              label="Model"
              placeholder="e.g. Model 3"
              required
              error={errors.vehicleModel?.message}
            />
            <Input
              {...register('vehicleColor')}
              label="Color"
              placeholder="e.g. White"
              required
              error={errors.vehicleColor?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('licensePlate')}
              label="License Plate"
              placeholder="e.g. ABCD 123"
              required
              error={errors.licensePlate?.message}
            />
            <Input
              {...register('spotNumber')}
              label="Spot Number"
              placeholder="e.g. P1-15"
              error={errors.spotNumber?.message}
            />
          </div>

          {permitType === 'visitor' && (
            <Input
              {...register('expiresAt')}
              type="datetime-local"
              label="Expires At"
              error={errors.expiresAt?.message}
            />
          )}

          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Issuing...' : 'Issue Permit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
