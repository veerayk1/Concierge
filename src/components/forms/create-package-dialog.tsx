'use client';

/**
 * Package Intake Dialog — per PRD 04 Section 3.1.1
 * Single package intake with 13 fields including courier icon selector
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createPackageSchema, type CreatePackageInput } from '@/schemas/package';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';
import { useApi, apiUrl } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Courier style map — visual styling for well-known couriers
// ---------------------------------------------------------------------------

const COURIER_COLORS: Record<string, string> = {
  amazon: 'bg-orange-100 text-orange-700 border-orange-200',
  fedex: 'bg-purple-100 text-purple-700 border-purple-200',
  ups: 'bg-amber-100 text-amber-800 border-amber-200',
  'canada-post': 'bg-red-100 text-red-700 border-red-200',
  dhl: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  purolator: 'bg-red-100 text-red-700 border-red-200',
  usps: 'bg-blue-100 text-blue-700 border-blue-200',
  intelcom: 'bg-green-100 text-green-700 border-green-200',
  'uber-eats': 'bg-neutral-800 text-white border-neutral-700',
  doordash: 'bg-red-100 text-red-700 border-red-200',
  skip: 'bg-orange-100 text-orange-700 border-orange-200',
  personal: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  other: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const DEFAULT_COURIER_COLOR = 'bg-neutral-100 text-neutral-700 border-neutral-200';

interface ApiCourier {
  id: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreatePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreatePackageDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreatePackageDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const { data: couriers } = useApi<ApiCourier[]>(apiUrl('/api/v1/couriers', { propertyId }));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePackageInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPackageSchema) as any,
    defaultValues: {
      propertyId,
      unitId: '',
      direction: 'incoming',
      courierId: '',
      courierOtherName: '',
      trackingNumber: '',
      description: '',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'default',
    },
  });

  const selectedCourierId = watch('courierId');
  const isPerishable = watch('isPerishable');
  const isOversized = watch('isOversized');

  async function onSubmit(data: CreatePackageInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/packages', {
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
        body: JSON.stringify({ ...data, direction }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to log package');
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
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Package className="text-primary-500 h-5 w-5" />
          {direction === 'outgoing' ? 'Log Outgoing Package' : 'Log Package'}
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          {direction === 'outgoing'
            ? 'Record a package being dropped off by a resident for outbound delivery.'
            : 'Record a new package delivery for a resident.'}
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Direction Segmented Control */}
          <div className="flex rounded-xl bg-neutral-100 p-1">
            {(['incoming', 'outgoing'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDirection(d);
                  setValue('direction', d);
                }}
                className={`flex-1 rounded-lg py-2 text-[14px] font-medium capitalize transition-all ${
                  direction === d ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Unit + Recipient */}
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
            <Input
              {...register('trackingNumber')}
              label="Tracking #"
              placeholder="Optional"
              error={errors.trackingNumber?.message}
            />
          </div>

          {/* Courier Selector — Icon Grid per PRD 04 */}
          <div>
            <p className="mb-2 text-[14px] font-medium text-neutral-700">Courier</p>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {(couriers ?? []).map((c) => {
                const isSelected = selectedCourierId === c.id;
                const colorClass = COURIER_COLORS[c.slug] || DEFAULT_COURIER_COLOR;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue('courierId', c.id, { shouldValidate: true })}
                    className={`rounded-xl border px-2 py-2 text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'ring-primary-500 ring-2 ' + colorClass
                        : colorClass + ' opacity-70 hover:opacity-100'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other courier name — shown only when "Other" is selected */}
          {couriers?.find((c) => c.id === selectedCourierId)?.slug === 'other' && (
            <Input
              {...register('courierOtherName')}
              label="Courier Name"
              placeholder="e.g. Local delivery service"
              error={errors.courierOtherName?.message}
            />
          )}

          {/* Description + Notify */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('description')}
              label={direction === 'outgoing' ? 'Recipient / Destination' : 'Description'}
              placeholder={
                direction === 'outgoing' ? 'e.g. Jane Doe, 123 Main St' : 'e.g. Brown box, 30x20cm'
              }
              error={errors.description?.message}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                {direction === 'outgoing' ? 'Notify Sender' : 'Notify Resident'}
              </label>
              <select
                {...register('notifyChannel')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="default">Default (Email + Push)</option>
                <option value="email">Email only</option>
                <option value="sms">SMS only</option>
                <option value="push">Push only</option>
                <option value="all">All channels</option>
                <option value="none">Don&apos;t notify</option>
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-6">
            <Checkbox
              checked={isPerishable}
              onCheckedChange={(c) => setValue('isPerishable', c === true)}
              label="Perishable"
              description="Triggers escalation notifications"
              id="perishable"
            />
            <Checkbox
              checked={isOversized}
              onCheckedChange={(c) => setValue('isOversized', c === true)}
              label="Oversized"
              id="oversized"
            />
          </div>

          {/* Actions */}
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
              {isSubmitting
                ? 'Logging...'
                : direction === 'outgoing'
                  ? 'Log Outgoing Package'
                  : 'Log Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
