'use client';

/**
 * Shift Log Entry Dialog — per PRD 03 Section 3.1.6
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const shiftEntrySchema = z.object({
  content: z.string().min(1, 'Entry content is required').max(4000),
  shift: z.enum(['morning', 'afternoon', 'night']),
  isImportant: z.boolean().default(false),
});

type ShiftEntryInput = z.infer<typeof shiftEntrySchema>;

interface CreateShiftEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateShiftEntryDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateShiftEntryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  // Auto-detect current shift
  const hour = new Date().getHours();
  const defaultShift = hour < 14 ? 'morning' : hour < 22 ? 'afternoon' : 'night';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(shiftEntrySchema) as any,
    defaultValues: {
      content: '',
      shift: defaultShift as 'morning' | 'afternoon' | 'night',
      isImportant: false,
    },
  });

  const selectedShift = watch('shift');
  const isImportant = watch('isImportant');

  async function onSubmit(data: ShiftEntryInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/shift-log', {
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
          content: `[${data.shift.toUpperCase()} SHIFT] ${data.content}`,
          category: 'general',
          priority: data.isImportant ? 'important' : 'normal',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to add entry');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const SHIFTS = [
    {
      value: 'morning',
      label: 'Morning',
      time: '6am–2pm',
      color: 'bg-warning-50 text-warning-700',
    },
    {
      value: 'afternoon',
      label: 'Afternoon',
      time: '2pm–10pm',
      color: 'bg-primary-50 text-primary-700',
    },
    { value: 'night', label: 'Night', time: '10pm–6am', color: 'bg-neutral-800 text-white' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Clock className="text-primary-500 h-5 w-5" />
          Add Shift Entry
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Leave a note for the next shift. Important entries are highlighted.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Shift Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Shift</label>
            <div className="flex gap-2">
              {SHIFTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setValue('shift', s.value as ShiftEntryInput['shift'])}
                  className={`flex-1 rounded-xl py-2.5 text-center transition-all ${
                    selectedShift === s.value
                      ? 'ring-primary-500 ring-2 ' + s.color
                      : s.color + ' opacity-50'
                  }`}
                >
                  <p className="text-[14px] font-semibold">{s.label}</p>
                  <p className="text-[11px] opacity-80">{s.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Entry<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('content')}
              placeholder="What does the next shift need to know?&#10;&#10;e.g. Elevator B out of service, technician expected by 2pm. Route residents to Elevator A."
              rows={5}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.content
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
              maxLength={4000}
            />
            {errors.content && (
              <p className="text-error-600 text-[13px] font-medium">{errors.content.message}</p>
            )}
          </div>

          <Checkbox
            checked={isImportant}
            onCheckedChange={(c) => setValue('isImportant', c === true)}
            label="Mark as Important"
            description="Important entries are highlighted and pinned to the top of the shift log."
            id="important"
          />

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
              {isSubmitting ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
