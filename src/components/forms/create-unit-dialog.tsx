'use client';

/**
 * Create Unit Dialog — per PRD 07 Unit Management
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const unitSchema = z.object({
  number: z.string().min(1, 'Unit number is required').max(20),
  floor: z.preprocess(
    (val) => (val === '' || val === undefined || Number.isNaN(val) ? undefined : Number(val)),
    z.number().int().min(0).max(200).optional(),
  ),
  buildingId: z.string().optional(),
  unitType: z.enum(['residential', 'commercial', 'storage', 'parking']).default('residential'),
  squareFootage: z.preprocess(
    (val) => (val === '' || val === undefined || Number.isNaN(val) ? undefined : Number(val)),
    z.number().min(0).optional(),
  ),
  enterPhoneCode: z.string().max(20).optional().or(z.literal('')),
  parkingSpot: z.string().max(20).optional().or(z.literal('')),
  locker: z.string().max(20).optional().or(z.literal('')),
  comments: z.string().max(2000).optional().or(z.literal('')),
});

type UnitInput = z.infer<typeof unitSchema>;

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateUnitDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateUnitDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      number: '',
      unitType: 'residential',
      enterPhoneCode: '',
      parkingSpot: '',
      locker: '',
      comments: '',
    },
  });

  async function onSubmit(data: UnitInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/units', {
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
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to create unit');
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
          <Building2 className="text-primary-500 h-5 w-5" />
          Add Unit
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Add a new unit to the building directory.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input
              {...register('number')}
              label="Unit Number"
              placeholder="e.g. 1501"
              required
              error={errors.number?.message}
            />
            <Input
              {...register('floor', { valueAsNumber: true })}
              type="number"
              label="Floor"
              placeholder="e.g. 15"
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Type</label>
              <select
                {...register('unitType')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="storage">Storage</option>
                <option value="parking">Parking</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('squareFootage', { valueAsNumber: true })}
              type="number"
              label="Square Footage"
              placeholder="e.g. 850"
            />
            <Input {...register('enterPhoneCode')} label="Buzzer Code" placeholder="e.g. #1501" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input {...register('parkingSpot')} label="Parking Spot" placeholder="e.g. P1-15" />
            <Input {...register('locker')} label="Locker" placeholder="e.g. L-42" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('comments')}
              placeholder="Any notes about this unit..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              maxLength={2000}
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
              {isSubmitting ? 'Creating...' : 'Add Unit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
