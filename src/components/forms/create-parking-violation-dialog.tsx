'use client';

/**
 * Create Parking Violation Dialog — per PRD 13
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const violationSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required').max(15),
  violationType: z.enum(['notice', 'warning', 'ticket', 'ban', 'vehicle_towed']),
  location: z.string().max(100).optional().or(z.literal('')),
  unitId: z.string().optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  notifyOwner: z.boolean().default(true),
});

type ViolationInput = z.infer<typeof violationSchema>;

const VIOLATION_TYPES = [
  { value: 'notice', label: 'Notice' },
  { value: 'warning', label: 'Warning' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'ban', label: 'Ban' },
  { value: 'vehicle_towed', label: 'Vehicle Towed' },
] as const;

interface CreateParkingViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateParkingViolationDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateParkingViolationDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ViolationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(violationSchema) as any,
    defaultValues: {
      licensePlate: '',
      violationType: 'notice',
      location: '',
      unitId: '',
      description: '',
      notifyOwner: true,
    },
  });

  async function onSubmit(data: ViolationInput) {
    setServerError(null);
    try {
      const payload = {
        ...data,
        propertyId,
      };
      const response = await fetch('/api/v1/parking/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to report parking violation');
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
          <AlertTriangle className="text-error-500 h-5 w-5" />
          Report Parking Violation
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Document a parking violation for enforcement.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('licensePlate')}
              label="License Plate"
              placeholder="e.g. ABCD 123"
              maxLength={15}
              required
              error={errors.licensePlate?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Violation Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('violationType')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.violationType
                    ? 'border-error-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {VIOLATION_TYPES.map((vt) => (
                  <option key={vt.value} value={vt.value}>
                    {vt.label}
                  </option>
                ))}
              </select>
              {errors.violationType && (
                <p className="text-error-600 text-[13px] font-medium">
                  {errors.violationType.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('location')}
              label="Location"
              placeholder="e.g. P1 Spot 42, Visitor Area"
              error={errors.location?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Related Unit</label>
              <select
                {...register('unitId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">{unitsLoading ? 'Loading units...' : 'No unit (unknown)'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Describe the violation..."
              rows={3}
              maxLength={2000}
              className={`focus:border-primary-500 focus:ring-primary-100 w-full resize-none rounded-xl border bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.description
                  ? 'border-error-300'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register('notifyOwner')}
              className="text-primary-500 focus:ring-primary-200 h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-[14px] text-neutral-700">Notify unit owner</span>
          </label>

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
            <Button type="submit" variant="danger" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Reporting...' : 'Report Violation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
