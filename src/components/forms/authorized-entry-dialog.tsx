'use client';

/**
 * Authorized Entry Dialog — GAP 3.3
 * Logs a staff entry into a unit with recorded authorization details.
 * Submits to POST /api/v1/events with type 'authorized-entry'.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const authorizedEntrySchema = z.object({
  unitId: z.string().min(1, 'Select a unit'),
  authorizationType: z.enum([
    'resident_present',
    'written_consent',
    'management_order',
    'emergency',
    'standing_permission',
  ]),
  authorizedBy: z
    .string()
    .min(1, 'Enter who authorized this entry')
    .max(100, 'Cannot exceed 100 characters'),
  entryReason: z
    .string()
    .min(1, 'Entry reason is required')
    .max(500, 'Cannot exceed 500 characters'),
  entryTime: z.string().min(1, 'Entry time is required'),
});

type AuthorizedEntryInput = z.infer<typeof authorizedEntrySchema>;

// ---------------------------------------------------------------------------
// Auth type labels
// ---------------------------------------------------------------------------

const AUTH_TYPE_LABELS: Record<string, string> = {
  resident_present: 'Resident Present',
  written_consent: 'Written Consent',
  management_order: 'Management Order',
  emergency: 'Emergency',
  standing_permission: 'Standing Permission',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuthorizedEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthorizedEntryDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: AuthorizedEntryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  // Default entryTime to now in local datetime-local format
  const nowLocal = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthorizedEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(authorizedEntrySchema) as any,
    defaultValues: {
      unitId: '',
      authorizationType: 'resident_present',
      authorizedBy: '',
      entryReason: '',
      entryTime: nowLocal(),
    },
  });

  async function onSubmit(data: AuthorizedEntryInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/events', {
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
          eventTypeSlug: 'authorized-entry',
          unitId: data.unitId || undefined,
          title: `Authorized Entry — ${AUTH_TYPE_LABELS[data.authorizationType]}`,
          description: data.entryReason,
          customFields: {
            authorizationType: data.authorizationType,
            authorizedBy: data.authorizedBy,
            entryTime: data.entryTime,
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to log authorized entry');
        return;
      }

      reset({
        unitId: '',
        authorizationType: 'resident_present',
        authorizedBy: '',
        entryReason: '',
        entryTime: nowLocal(),
      });
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
          <KeyRound className="h-5 w-5 text-purple-500" />
          Log Authorized Entry
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Record a staff entry into a resident unit. This creates an audit trail for liability and
          compliance.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Unit */}
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
              <option value="">{unitsLoading ? 'Loading units…' : 'Select unit…'}</option>
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

          {/* Authorization Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Authorization Type<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('authorizationType')}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            >
              {Object.entries(AUTH_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Authorized By */}
          <Input
            {...register('authorizedBy')}
            label="Authorized By"
            placeholder="Name of resident or person granting access"
            required
            error={errors.authorizedBy?.message}
          />

          {/* Entry Reason */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Entry Reason<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('entryReason')}
              rows={3}
              placeholder="e.g. Plumber accessing bathroom for leak repair — authorized by Unit 512 resident verbally"
              className={`focus:border-primary-500 focus:ring-primary-100 w-full resize-none rounded-xl border px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                errors.entryReason
                  ? 'border-error-300'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            />
            {errors.entryReason && (
              <p className="text-error-600 text-[13px] font-medium">{errors.entryReason.message}</p>
            )}
          </div>

          {/* Entry Time */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Entry Time<span className="text-error-500 ml-0.5">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('entryTime')}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
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
              {isSubmitting ? 'Logging…' : 'Log Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
