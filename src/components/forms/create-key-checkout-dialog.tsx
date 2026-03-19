'use client';

/**
 * Create Key Checkout Dialog — Check Out Key/FOB
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const keyCheckoutSchema = z.object({
  keyId: z.string().min(1, 'Select a key or FOB'),
  unit: z.string().max(20).optional(),
  residentName: z.string().min(2, 'Resident name is required').max(200),
  idType: z.string().min(1, 'Select an ID type'),
  idNumber: z.string().max(100).optional(),
  expectedReturn: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type KeyCheckoutInput = z.infer<typeof keyCheckoutSchema>;

const ID_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'building_id', label: 'Building ID' },
  { value: 'other', label: 'Other' },
];

interface CreateKeyCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateKeyCheckoutDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateKeyCheckoutDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KeyCheckoutInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(keyCheckoutSchema) as any,
    defaultValues: {
      keyId: '',
      unit: '',
      residentName: '',
      idType: '',
      idNumber: '',
      expectedReturn: '',
      notes: '',
    },
  });

  async function onSubmit(data: KeyCheckoutInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/keys/checkouts', {
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
        setServerError(result.message || 'Failed to check out key');
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
          <Key className="text-primary-500 h-5 w-5" />
          Check Out Key
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Record a key or FOB checkout for a resident or visitor.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Key / FOB<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('keyId')}
                className={errors.keyId ? selectErrorClass : selectClass}
              >
                <option value="">Select key...</option>
                <option value="master-1">Master Key #1</option>
                <option value="master-2">Master Key #2</option>
                <option value="amenity-gym">Amenity - Gym</option>
                <option value="amenity-pool">Amenity - Pool</option>
                <option value="amenity-party">Amenity - Party Room</option>
                <option value="storage-1">Storage Room Key</option>
                <option value="mechanical">Mechanical Room Key</option>
                <option value="fob-spare-1">Spare FOB #1</option>
                <option value="fob-spare-2">Spare FOB #2</option>
              </select>
              {errors.keyId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.keyId.message}</p>
              )}
            </div>

            <Input
              {...register('unit')}
              label="Unit"
              placeholder="e.g. 1204"
              error={errors.unit?.message}
            />
          </div>

          <Input
            {...register('residentName')}
            label="Resident Name"
            placeholder="Full name"
            required
            error={errors.residentName?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                ID Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('idType')}
                className={errors.idType ? selectErrorClass : selectClass}
              >
                <option value="">Select ID type...</option>
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.idType && (
                <p className="text-error-600 text-[13px] font-medium">{errors.idType.message}</p>
              )}
            </div>

            <Input
              {...register('idNumber')}
              label="ID Number"
              placeholder="ID or badge number"
              error={errors.idNumber?.message}
            />
          </div>

          <Input
            {...register('expectedReturn')}
            type="datetime-local"
            label="Expected Return"
            error={errors.expectedReturn?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Reason for checkout, special instructions..."
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
              {isSubmitting ? 'Checking Out...' : 'Check Out Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
