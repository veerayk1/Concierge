'use client';

/**
 * Create Visitor Dialog — Sign In Visitor
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const visitorSchema = z
  .object({
    visitorName: z.string().min(2, 'Visitor name is required').max(200),
    visitorType: z.string().min(1, 'Select a visitor type'),
    unitId: z.string().uuid('Select a unit'),
    residentName: z.string().max(200).optional(),
    expectedDeparture: z.string().optional(),
    parkingPermitNeeded: z.boolean().optional(),
    vehiclePlate: z.string().max(20).optional(),
    comments: z.string().max(2000).optional(),
  })
  .refine(
    (data) =>
      !data.parkingPermitNeeded || (data.vehiclePlate && data.vehiclePlate.trim().length > 0),
    {
      message: 'Vehicle plate is required when a parking permit is needed',
      path: ['vehiclePlate'],
    },
  );

type VisitorInput = z.infer<typeof visitorSchema>;

const VISITOR_TYPES = [
  { value: 'visitor', label: 'Visitor' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'delivery_person', label: 'Delivery Person' },
  { value: 'real_estate_agent', label: 'Real Estate Agent' },
  { value: 'emergency_service', label: 'Emergency Service' },
  { value: 'other', label: 'Other' },
];

interface CreateVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateVisitorDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateVisitorDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(visitorSchema) as any,
    defaultValues: {
      visitorName: '',
      visitorType: '',
      unitId: '',
      residentName: '',
      expectedDeparture: '',
      parkingPermitNeeded: false,
      vehiclePlate: '',
      comments: '',
    },
  });

  const parkingPermitNeeded = watch('parkingPermitNeeded');

  async function onSubmit(data: VisitorInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          visitorName: data.visitorName,
          visitorType: data.visitorType,
          unitId: data.unitId,
          expectedDepartureAt: data.expectedDeparture
            ? new Date(data.expectedDeparture).toISOString()
            : undefined,
          comments:
            [data.residentName ? `Visiting: ${data.residentName}` : '', data.comments || '']
              .filter(Boolean)
              .join(' — ') || undefined,
          vehiclePlate: data.parkingPermitNeeded ? data.vehiclePlate : undefined,
          notifyResident: true,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to sign in visitor');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <UserCheck className="text-primary-500 h-5 w-5" />
          Sign In Visitor
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Register a visitor arriving at the property.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('visitorName')}
              label="Visitor Name"
              placeholder="Full name"
              required
              error={errors.visitorName?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Visitor Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('visitorType')}
                className={errors.visitorType ? selectErrorClass : selectClass}
              >
                <option value="">Select type...</option>
                {VISITOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.visitorType && (
                <p className="text-error-600 text-[13px] font-medium">
                  {errors.visitorType.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Unit Visiting<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('unitId')}
                className={`${errors.unitId ? selectErrorClass : selectClass}`}
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
            <Input
              {...register('residentName')}
              label="Resident Name"
              placeholder="Name of resident being visited"
              error={errors.residentName?.message}
            />
          </div>

          <Input
            {...register('expectedDeparture')}
            type="datetime-local"
            label="Expected Departure Time"
            error={errors.expectedDeparture?.message}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="parkingPermitNeeded"
              {...register('parkingPermitNeeded')}
              className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300"
            />
            <label
              htmlFor="parkingPermitNeeded"
              className="text-[14px] font-medium text-neutral-700"
            >
              Parking Permit Needed
            </label>
          </div>

          {parkingPermitNeeded && (
            <Input
              {...register('vehiclePlate')}
              label="Vehicle Plate"
              placeholder="e.g. ABCD 123"
              error={errors.vehiclePlate?.message}
            />
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Comments</label>
            <textarea
              {...register('comments')}
              placeholder="Additional notes about this visit..."
              rows={3}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={2000}
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
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
              {isSubmitting ? 'Signing In...' : 'Sign In Visitor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
