'use client';

/**
 * Package Release Dialog — per PRD 04 Section 3.1.2
 * Release flow: verify identity, optional signature, release
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { releasePackageSchema, type ReleasePackageInput } from '@/schemas/package';

interface ReleasePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageRef: string;
  recipientName: string;
  unitNumber: string;
  onSuccess?: () => void;
}

export function ReleasePackageDialog({
  open,
  onOpenChange,
  packageId,
  packageRef,
  recipientName,
  unitNumber,
  onSuccess,
}: ReleasePackageDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [released, setReleased] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReleasePackageInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(releasePackageSchema) as any,
    defaultValues: {
      releasedToName: recipientName,
      idVerified: false,
      isAuthorizedDelegate: false,
      releaseComments: '',
    },
  });

  const idVerified = watch('idVerified');
  const isDelegate = watch('isAuthorizedDelegate');

  async function onSubmit(data: ReleasePackageInput) {
    setServerError(null);
    try {
      const response = await fetch(`/api/v1/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({ action: 'release', ...data }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to release package');
        return;
      }

      setReleased(true);
      setTimeout(() => {
        reset();
        setReleased(false);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  if (released) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
              <CheckCircle2 className="text-success-600 h-8 w-8" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">Package Released</h2>
              <p className="mt-1 text-[14px] text-neutral-500">
                {packageRef} has been released successfully.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <CheckCircle2 className="text-success-600 h-5 w-5" />
          Release Package
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Release {packageRef} for Unit {unitNumber}
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('releasedToName')}
            label="Releasing to"
            placeholder="Name of person picking up"
            required
            error={errors.releasedToName?.message}
          />

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={idVerified}
              onCheckedChange={(c) => setValue('idVerified', c === true)}
              label="ID Verified"
              description="Government-issued photo ID checked and matches name"
              id="id-verified"
            />

            <Checkbox
              checked={isDelegate}
              onCheckedChange={(c) => setValue('isAuthorizedDelegate', c === true)}
              label="Authorized Delegate"
              description="Person is an authorized pickup representative for this unit"
              id="authorized-delegate"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Comments</label>
            <textarea
              {...register('releaseComments')}
              placeholder="Optional release notes..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              maxLength={500}
            />
          </div>

          {/* Security reminder */}
          <div className="bg-info-50 flex items-start gap-2 rounded-xl p-3">
            <ShieldCheck className="text-info-600 mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-info-700 text-[13px] leading-relaxed">
              By releasing this package, you confirm the recipient&apos;s identity has been verified
              per building security policy.
            </p>
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
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-success-600 hover:bg-success-700"
            >
              {isSubmitting ? 'Releasing...' : 'Release Package'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
