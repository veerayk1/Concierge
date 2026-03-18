'use client';

/**
 * Key/FOB Checkout Dialog — per PRD 03 Security Console
 * Track key and FOB issuance, returns, and inventory
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const keyCheckoutSchema = z.object({
  action: z.enum(['checkout', 'return']).default('checkout'),
  serialNumber: z.string().min(1, 'Serial number is required').max(50),
  keyType: z
    .enum(['main_entry', 'unit', 'parking', 'amenity', 'mailbox', 'other'])
    .default('main_entry'),
  unitId: z.string().min(1, 'Select a unit'),
  issuedToName: z.string().min(1, 'Name is required').max(200),
  idVerified: z.boolean().default(false),
  depositCollected: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type KeyCheckoutInput = z.infer<typeof keyCheckoutSchema>;

const KEY_TYPES = [
  { value: 'main_entry', label: 'Main Entry FOB' },
  { value: 'unit', label: 'Unit Key' },
  { value: 'parking', label: 'Parking FOB' },
  { value: 'amenity', label: 'Amenity Key' },
  { value: 'mailbox', label: 'Mailbox Key' },
  { value: 'other', label: 'Other' },
];

interface KeyCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function KeyCheckoutDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: KeyCheckoutDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KeyCheckoutInput>({
    resolver: zodResolver(keyCheckoutSchema),
    defaultValues: {
      action: 'checkout',
      serialNumber: '',
      keyType: 'main_entry',
      unitId: '',
      issuedToName: '',
      idVerified: false,
      depositCollected: false,
      notes: '',
    },
  });

  const action = watch('action');
  const idVerified = watch('idVerified');
  const depositCollected = watch('depositCollected');

  async function onSubmit(data: KeyCheckoutInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          eventTypeId: 'type-key',
          unitId: data.unitId,
          title: `${data.action === 'checkout' ? 'FOB Issued' : 'FOB Returned'} — ${data.serialNumber}`,
          description:
            `${data.keyType} ${data.action} for ${data.issuedToName}. ${data.notes || ''}`.trim(),
          priority: 'normal',
          customFields: {
            serialNumber: data.serialNumber,
            keyType: data.keyType,
            action: data.action,
            issuedToName: data.issuedToName,
            idVerified: data.idVerified,
            depositCollected: data.depositCollected,
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to process key');
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
          <Key className="h-5 w-5 text-purple-500" />
          Key / FOB {action === 'checkout' ? 'Checkout' : 'Return'}
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          {action === 'checkout'
            ? 'Issue a key or FOB to a resident.'
            : 'Process a key or FOB return.'}
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Action Toggle */}
          <div className="flex rounded-xl bg-neutral-100 p-1">
            {(['checkout', 'return'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setValue('action', a)}
                className={`flex-1 rounded-lg py-2 text-[14px] font-medium capitalize transition-all ${
                  action === a ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('serialNumber')}
              label="Serial Number"
              placeholder="e.g. SN-4589"
              required
              error={errors.serialNumber?.message}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Key Type</label>
              <select
                {...register('keyType')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                {KEY_TYPES.map((kt) => (
                  <option key={kt.value} value={kt.value}>
                    {kt.label}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="">Select unit...</option>
                <option value="unit-1">101</option>
                <option value="unit-2">305</option>
                <option value="unit-3">422</option>
                <option value="unit-4">710</option>
                <option value="unit-5">802</option>
                <option value="unit-6">1501</option>
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>
            <Input
              {...register('issuedToName')}
              label={action === 'checkout' ? 'Issued To' : 'Returned By'}
              placeholder="Full name"
              required
              error={errors.issuedToName?.message}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={idVerified}
              onCheckedChange={(c) => setValue('idVerified', c === true)}
              label="ID Verified"
              description="Government-issued photo ID checked"
              id="key-id"
            />
            {action === 'checkout' && (
              <Checkbox
                checked={depositCollected}
                onCheckedChange={(c) => setValue('depositCollected', c === true)}
                label="Deposit Collected"
                description="Key deposit fee collected from resident"
                id="key-deposit"
              />
            )}
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
              {isSubmitting
                ? 'Processing...'
                : action === 'checkout'
                  ? 'Issue Key'
                  : 'Process Return'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
