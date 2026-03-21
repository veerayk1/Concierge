'use client';

/**
 * Key/FOB Checkout Dialog — per PRD 03 Security Console
 * Track key and FOB issuance, returns, and inventory
 * Posts to /api/v1/keys/checkouts (not /api/v1/events)
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
import { usePropertyUnits } from '@/lib/hooks/use-property-units';
import { useApi, apiUrl } from '@/lib/hooks/use-api';

const keyCheckoutSchema = z.object({
  keyId: z.string().min(1, 'Select a key'),
  unitId: z.string().optional(),
  checkedOutTo: z.string().min(1, 'Name is required').max(200),
  idType: z.string().min(1, 'ID type is required').max(50),
  idNumber: z.string().max(30).optional().or(z.literal('')),
  reason: z.string().min(1, 'Reason is required').max(500),
  expectedReturn: z.string().optional(),
  idVerified: z.boolean().default(false),
  depositCollected: z.boolean().default(false),
});

type KeyCheckoutInput = z.infer<typeof keyCheckoutSchema>;

interface ApiKey {
  id: string;
  keyName: string;
  keyNumber: string | null;
  category: string;
  status: string;
}

const KEY_ID_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'Passport' },
  { value: 'building_id', label: 'Building ID' },
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
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const { data: keys, loading: keysLoading } = useApi<ApiKey[]>(
    apiUrl('/api/v1/keys', { propertyId, status: 'available' }),
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      idVerified: false,
      depositCollected: false,
    },
  });

  const idVerified = watch('idVerified');
  const depositCollected = watch('depositCollected');

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

  const availableKeys = (keys ?? []).filter((k) => k.status === 'available');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Key className="h-5 w-5 text-purple-500" />
          Key / FOB Checkout
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Issue a key or FOB to a resident.
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
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.keyId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">{keysLoading ? 'Loading keys...' : 'Select key...'}</option>
                {availableKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.keyName}
                    {k.keyNumber ? ` (${k.keyNumber})` : ''}
                  </option>
                ))}
              </select>
              {errors.keyId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.keyId.message}</p>
              )}
            </div>

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
                <option value="">{unitsLoading ? 'Loading...' : 'Select unit...'}</option>
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
          </div>

          <Input
            {...register('checkedOutTo')}
            label="Issued To"
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
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.idType ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">Select ID type...</option>
                {KEY_ID_TYPES.map((t) => (
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
              placeholder="Optional"
              error={errors.idNumber?.message}
            />
          </div>

          <Input
            {...register('reason')}
            label="Reason"
            placeholder="e.g. Move-in, lockout, maintenance"
            required
            error={errors.reason?.message}
          />

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={idVerified}
              onCheckedChange={(c) => setValue('idVerified', c === true)}
              label="ID Verified"
              description="Government-issued photo ID checked"
              id="key-id"
            />
            <Checkbox
              checked={depositCollected}
              onCheckedChange={(c) => setValue('depositCollected', c === true)}
              label="Deposit Collected"
              description="Key deposit fee collected from resident"
              id="key-deposit"
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
              {isSubmitting ? 'Processing...' : 'Issue Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
