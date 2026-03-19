'use client';

/**
 * Create Resident Card Dialog — Issue resident identification cards
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdCard } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const residentCardSchema = z.object({
  residentName: z.string().min(2, 'Resident name is required').max(200),
  unit: z.string().min(1, 'Unit is required').max(20),
  cardType: z.string().min(1, 'Select a card type'),
  photoOnFile: z.boolean().optional(),
});

type ResidentCardInput = z.infer<typeof residentCardSchema>;

const CARD_TYPES = [
  { value: 'resident', label: 'Resident' },
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'family_member', label: 'Family Member' },
  { value: 'staff', label: 'Staff' },
];

interface CreateResidentCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateResidentCardDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateResidentCardDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResidentCardInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(residentCardSchema) as any,
    defaultValues: {
      residentName: '',
      unit: '',
      cardType: '',
      photoOnFile: false,
    },
  });

  async function onSubmit(data: ResidentCardInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/resident-cards', {
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
        setServerError(result.message || 'Failed to issue resident card');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <IdCard className="text-primary-500 h-5 w-5" />
          Issue Resident Card
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Issue a new identification card for a resident.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('residentName')}
            label="Resident Name"
            placeholder="Full name"
            required
            error={errors.residentName?.message}
          />

          <Input
            {...register('unit')}
            label="Unit"
            placeholder="e.g. 1204"
            required
            error={errors.unit?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Card Type<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('cardType')}
              className={errors.cardType ? selectErrorClass : selectClass}
            >
              <option value="">Select card type...</option>
              {CARD_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
            {errors.cardType && (
              <p className="text-error-600 text-[13px] font-medium">{errors.cardType.message}</p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register('photoOnFile')}
              className="text-primary-600 focus:ring-primary-500 h-5 w-5 rounded border-neutral-300 transition-colors"
            />
            <span className="text-[14px] font-medium text-neutral-700">Photo on File</span>
          </label>

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
              {isSubmitting ? 'Issuing...' : 'Issue Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
