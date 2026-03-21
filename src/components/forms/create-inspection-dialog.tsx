'use client';

/**
 * Create Inspection Dialog — per PRD 09 Inspections
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const inspectionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  type: z.string().min(1, 'Select an inspection type'),
  priority: z.string().min(1, 'Select a priority'),
  assignedTo: z.string().min(2, 'Inspector name is required').max(100),
  location: z.string().min(2, 'Location is required').max(200),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().optional(),
  notes: z.string().max(2000).optional(),
  checklistTemplate: z.string().optional(),
});

type InspectionInput = z.infer<typeof inspectionSchema>;

const INSPECTION_TYPES = [
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural' },
  { value: 'general', label: 'General' },
  { value: 'move_in', label: 'Move-In' },
  { value: 'move_out', label: 'Move-Out' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CHECKLIST_TEMPLATES = [
  { value: 'standard', label: 'Standard' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'move_in_out', label: 'Move-In/Out' },
];

interface CreateInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateInspectionDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateInspectionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InspectionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(inspectionSchema) as any,
    defaultValues: {
      title: '',
      type: '',
      priority: 'medium',
      assignedTo: '',
      location: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      checklistTemplate: '',
    },
  });

  async function onSubmit(data: InspectionInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/inspections', {
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
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to schedule inspection');
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
          <ClipboardCheck className="text-primary-500 h-5 w-5" />
          Schedule Inspection
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Schedule a new building inspection.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('title')}
            label="Title"
            placeholder="e.g. Annual Fire Safety Inspection"
            required
            error={errors.title?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('type')}
                className={errors.type ? selectErrorClass : selectClass}
              >
                <option value="">Select type...</option>
                {INSPECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-error-600 text-[13px] font-medium">{errors.type.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Priority<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('priority')}
                className={errors.priority ? selectErrorClass : selectClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="text-error-600 text-[13px] font-medium">{errors.priority.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('assignedTo')}
              label="Inspector / Assigned To"
              placeholder="Inspector name"
              required
              error={errors.assignedTo?.message}
            />
            <Input
              {...register('location')}
              label="Location"
              placeholder="e.g. Lobby, Floor 12, Parking P2"
              required
              error={errors.location?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('scheduledDate')}
              type="date"
              label="Scheduled Date"
              required
              error={errors.scheduledDate?.message}
            />
            <Input
              {...register('scheduledTime')}
              type="time"
              label="Scheduled Time"
              error={errors.scheduledTime?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Checklist Template</label>
            <select {...register('checklistTemplate')} className={selectClass}>
              <option value="">None</option>
              {CHECKLIST_TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional notes or special instructions..."
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
              {isSubmitting ? 'Scheduling...' : 'Schedule Inspection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
