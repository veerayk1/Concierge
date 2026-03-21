'use client';

/**
 * Create Key Checkout Dialog — Check Out Key/FOB
 * Posts to /api/v1/keys/checkouts
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const keyCheckoutSchema = z.object({
  keyId: z.string().min(1, 'Select a key or FOB'),
  unitId: z.string().optional(),
  checkedOutTo: z.string().min(2, 'Name is required').max(200),
  idType: z.string().min(1, 'Select an ID type'),
  idNumber: z.string().max(100).optional(),
  reason: z.string().min(1, 'Reason is required').max(500),
  expectedReturn: z.string().optional(),
});

type KeyCheckoutInput = z.infer<typeof keyCheckoutSchema>;

interface ApiKey {
  id: string;
  keyName: string;
  keyNumber: string | null;
  category: string;
  status: string;
}

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
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const { data: keys, loading: keysLoading } = useApi<ApiKey[]>(
    apiUrl('/api/v1/keys', { propertyId, status: 'available' }),
  );

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
      unitId: '',
      checkedOutTo: '',
      idType: '',
      idNumber: '',
      reason: '',
      expectedReturn: '',
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
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          keyId: data.keyId,
          checkedOutTo: data.checkedOutTo,
          unitId: data.unitId || undefined,
          idType: data.idType,
          idNumber: data.idNumber || undefined,
          reason: data.reason,
          expectedReturn: data.expectedReturn || undefined,
        }),
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

  const availableKeys = (keys ?? []).filter((k) => k.status === 'available');

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

          {availableKeys.length === 0 && !keysLoading && (
            <div className="border-warning-200 bg-warning-50 text-warning-700 rounded-xl border px-4 py-3 text-[14px]">
              No keys available for checkout. Add keys to inventory first.
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
                <option value="">{keysLoading ? 'Loading keys...' : 'Select key...'}</option>
                {availableKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.keyName}
                    {k.keyNumber ? ` (${k.keyNumber})` : ''}
                    {` — ${k.category}`}
                  </option>
                ))}
              </select>
              {errors.keyId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.keyId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Unit</label>
              <select {...register('unitId')} className={selectClass}>
                <option value="">{unitsLoading ? 'Loading...' : 'Select unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            {...register('checkedOutTo')}
            label="Checked Out To"
            placeholder="Full name"
            required
            error={errors.checkedOutTo?.message}
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
            {...register('reason')}
            label="Reason"
            placeholder="e.g. Move-in, lockout, maintenance access"
            required
            error={errors.reason?.message}
          />

          <Input
            {...register('expectedReturn')}
            type="datetime-local"
            label="Expected Return"
            error={errors.expectedReturn?.message}
          />

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
