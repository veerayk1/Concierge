'use client';

/**
 * Visitor Sign-In Dialog — per PRD 03 Section Visitor Management
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const visitorSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required').max(200),
  unitId: z.string().min(1, 'Select a unit'),
  residentName: z.string().max(200).optional(),
  purpose: z.enum(['personal', 'delivery', 'service', 'realtor', 'other']).default('personal'),
  vehiclePlate: z.string().max(20).optional().or(z.literal('')),
  idType: z.string().optional(),
  idVerified: z.boolean().default(false),
  parkingAssigned: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type VisitorInput = z.infer<typeof visitorSchema>;

interface VisitorSignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function VisitorSignInDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: VisitorSignInDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitorInput>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      visitorName: '',
      unitId: '',
      residentName: '',
      purpose: 'personal',
      vehiclePlate: '',
      idVerified: false,
      parkingAssigned: false,
      notes: '',
    },
  });

  const idVerified = watch('idVerified');
  const parkingAssigned = watch('parkingAssigned');
  const purpose = watch('purpose');

  async function onSubmit(data: VisitorInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          eventTypeId: 'type-visitor',
          unitId: data.unitId,
          title: `${data.visitorName} — Visiting Unit ${data.unitId}`,
          description: data.notes || `${data.purpose} visit`,
          priority: 'normal',
          customFields: {
            visitorName: data.visitorName,
            purpose: data.purpose,
            vehiclePlate: data.vehiclePlate,
            idVerified: data.idVerified,
            parkingAssigned: data.parkingAssigned,
            residentName: data.residentName,
          },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Users className="text-success-600 h-5 w-5" />
          Visitor Sign-In
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Register a visitor entering the building.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('visitorName')}
            label="Visitor Name"
            placeholder="Full name of the visitor"
            required
            error={errors.visitorName?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Visiting Unit<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('unitId')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.unitId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">Select unit...</option>
                <option value="unit-1">101 — Alice Wong</option>
                <option value="unit-2">305 — Robert Kim</option>
                <option value="unit-3">422 — Jane Doe</option>
                <option value="unit-4">710 — Sarah Wilson</option>
                <option value="unit-5">802 — David Chen</option>
                <option value="unit-6">1105 — Lisa Brown</option>
                <option value="unit-7">1203 — Maria Garcia</option>
                <option value="unit-8">1501 — Janet Smith</option>
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Purpose</label>
              <select
                {...register('purpose')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="personal">Personal Visit</option>
                <option value="delivery">Delivery</option>
                <option value="service">Service/Contractor</option>
                <option value="realtor">Realtor/Showing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <Input
            {...register('vehiclePlate')}
            label="Vehicle Plate"
            placeholder="Optional — if visitor has a vehicle"
            error={errors.vehiclePlate?.message}
          />

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={idVerified}
              onCheckedChange={(c) => setValue('idVerified', c === true)}
              label="ID Verified"
              description="Government-issued photo ID presented and verified"
              id="visitor-id"
            />
            <Checkbox
              checked={parkingAssigned}
              onCheckedChange={(c) => setValue('parkingAssigned', c === true)}
              label="Visitor Parking Assigned"
              description="Temporary visitor parking pass issued"
              id="visitor-parking"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Any additional notes..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              maxLength={500}
            />
          </div>

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
              {isSubmitting ? 'Signing in...' : 'Sign In Visitor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
