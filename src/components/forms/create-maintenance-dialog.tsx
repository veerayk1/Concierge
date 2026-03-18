'use client';

/**
 * Create Maintenance Request Dialog — per PRD 05
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createMaintenanceSchema, type CreateMaintenanceInput } from '@/schemas/maintenance';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'General',
  'Doors & Windows',
  'Flooring',
  'Painting',
  'Pest Control',
  'Other',
];

interface CreateMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateMaintenanceDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateMaintenanceDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaintenanceInput>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      propertyId,
      unitId: '',
      categoryId: '',
      description: '',
      priority: 'medium',
      permissionToEnter: false,
      entryInstructions: '',
      contactPhone: '',
    },
  });

  const permissionToEnter = watch('permissionToEnter');
  const selectedPriority = watch('priority');

  async function onSubmit(data: CreateMaintenanceInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to create request');
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
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Wrench className="text-primary-500 h-5 w-5" />
          New Maintenance Request
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Submit a new maintenance request for a unit.
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
                <option value="unit-6">1105</option>
                <option value="unit-7">1203</option>
                <option value="unit-8">1501</option>
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Category</label>
              <select
                {...register('categoryId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe the issue in detail (minimum 10 characters)..."
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.description
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
              maxLength={4000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                const colors = {
                  low: 'bg-neutral-100 text-neutral-600',
                  medium: 'bg-warning-50 text-warning-700',
                  high: 'bg-error-50 text-error-700',
                  urgent: 'bg-error-100 text-error-800',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={`flex-1 rounded-xl py-2 text-[13px] font-semibold capitalize transition-all ${
                      selectedPriority === p
                        ? 'ring-primary-500 ring-2 ' + colors[p]
                        : colors[p] + ' opacity-60'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Permission */}
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={permissionToEnter}
              onCheckedChange={(c) => setValue('permissionToEnter', c === true)}
              label="Permission to Enter"
              description="Staff can enter the unit without the resident being present"
              id="permission-enter"
            />

            {permissionToEnter && (
              <div className="ml-8">
                <Input
                  {...register('entryInstructions')}
                  label="Entry Instructions"
                  placeholder="e.g. Key at front desk, dog in bedroom"
                  error={errors.entryInstructions?.message}
                />
              </div>
            )}
          </div>

          {/* Contact */}
          <Input
            {...register('contactPhone')}
            label="Contact Phone"
            placeholder="Best number to reach resident"
            error={errors.contactPhone?.message}
          />

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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
