'use client';

/**
 * Create Alteration Request Dialog — per PRD 13 Alterations
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HardHat } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const alterationSchema = z.object({
  unit: z.string().min(1, 'Unit is required').max(20),
  type: z.string().min(1, 'Select an alteration type'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  contractorName: z.string().max(100).optional(),
  contractorPhone: z.string().max(20).optional(),
  contractorEmail: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  hasPermit: z.boolean().default(false),
  permitNumber: z.string().max(50).optional(),
  hasInsurance: z.boolean().default(false),
  expectedStartDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type AlterationInput = z.infer<typeof alterationSchema>;

const ALTERATION_TYPES = [
  { value: 'renovation', label: 'Renovation' },
  { value: 'repair', label: 'Repair' },
  { value: 'addition', label: 'Addition' },
  { value: 'removal', label: 'Removal' },
];

interface CreateAlterationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateAlterationDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateAlterationDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlterationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(alterationSchema) as any,
    defaultValues: {
      unit: '',
      type: '',
      description: '',
      contractorName: '',
      contractorPhone: '',
      contractorEmail: '',
      hasPermit: false,
      permitNumber: '',
      hasInsurance: false,
      expectedStartDate: '',
      expectedEndDate: '',
      notes: '',
    },
  });

  const hasPermit = watch('hasPermit');
  const hasInsurance = watch('hasInsurance');

  async function onSubmit(data: AlterationInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/alterations', {
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
        setServerError(result.message || 'Failed to submit alteration request');
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
  const textareaError = 'border-error-300 focus:border-error-500 focus:ring-error-100';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <HardHat className="text-primary-500 h-5 w-5" />
          New Alteration Request
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Submit a renovation or alteration request.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('unit')}
              label="Unit"
              placeholder="e.g. 1205"
              required
              error={errors.unit?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('type')}
                className={errors.type ? selectErrorClass : selectClass}
              >
                <option value="">Select type...</option>
                {ALTERATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-error-600 text-[13px] font-medium">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe the planned renovation or alteration..."
              rows={4}
              className={`${textareaBase} ${errors.description ? textareaError : textareaDefault}`}
              maxLength={4000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              {...register('contractorName')}
              label="Contractor Name"
              placeholder="Company or person"
              error={errors.contractorName?.message}
            />
            <Input
              {...register('contractorPhone')}
              label="Contractor Phone"
              placeholder="(416) 555-0100"
              error={errors.contractorPhone?.message}
            />
            <Input
              {...register('contractorEmail')}
              type="email"
              label="Contractor Email"
              placeholder="email@company.com"
              error={errors.contractorEmail?.message}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={hasPermit}
              onCheckedChange={(c) => setValue('hasPermit', c === true)}
              label="Has Permit"
              description="A building or city permit has been obtained for this work"
              id="has-permit"
            />

            {hasPermit && (
              <div className="ml-8">
                <Input
                  {...register('permitNumber')}
                  label="Permit Number"
                  placeholder="Enter permit number"
                  error={errors.permitNumber?.message}
                />
              </div>
            )}
          </div>

          <Checkbox
            checked={hasInsurance}
            onCheckedChange={(c) => setValue('hasInsurance', c === true)}
            label="Has Insurance"
            description="Contractor has valid liability insurance on file"
            id="has-insurance"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('expectedStartDate')}
              type="date"
              label="Expected Start Date"
              error={errors.expectedStartDate?.message}
            />
            <Input
              {...register('expectedEndDate')}
              type="date"
              label="Expected End Date"
              error={errors.expectedEndDate?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Any additional details or special requirements..."
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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
