'use client';

/**
 * Create Community Event Dialog — per PRD Community Events
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().max(5000).optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200),
  category: z.enum(['social', 'educational', 'health', 'sports', 'cultural', 'meeting']),
  capacity: z.number().min(0).optional(),
  rsvpRequired: z.boolean().default(false),
  fee: z.number().min(0).default(0),
});

type EventInput = z.infer<typeof eventSchema>;

const CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'educational', label: 'Educational' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'meeting', label: 'Meeting' },
];

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateEventDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      category: 'social',
      capacity: undefined,
      rsvpRequired: false,
      fee: 0,
    },
  });

  const rsvpRequired = watch('rsvpRequired');

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  async function onSubmit(data: EventInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/events', {
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
        setServerError(result.message || 'Failed to create event');
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
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <CalendarDays className="text-primary-500 h-5 w-5" />
          New Event
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new community event for residents.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('name')}
            label="Event Name"
            placeholder="e.g. Summer BBQ on the Terrace"
            required
            error={errors.name?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Describe the event details..."
              rows={4}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              {...register('date')}
              type="date"
              label="Date"
              required
              error={errors.date?.message}
            />
            <Input
              {...register('startTime')}
              type="time"
              label="Start Time"
              required
              error={errors.startTime?.message}
            />
            <Input
              {...register('endTime')}
              type="time"
              label="End Time"
              error={errors.endTime?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('location')}
              label="Location"
              placeholder="e.g. Party Room, Rooftop"
              required
              error={errors.location?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={errors.category ? selectErrorClass : selectClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('capacity', { valueAsNumber: true })}
              type="number"
              label="Capacity"
              placeholder="Leave empty for unlimited"
              min={0}
              error={errors.capacity?.message}
            />
            <Input
              {...register('fee', { valueAsNumber: true })}
              type="number"
              label="Fee ($)"
              placeholder="0 = Free"
              min={0}
              step="0.01"
              error={errors.fee?.message}
            />
          </div>

          <Checkbox
            checked={rsvpRequired}
            onCheckedChange={(c) => setValue('rsvpRequired', c === true)}
            label="RSVP Required"
            description="Residents must RSVP to attend this event"
            id="rsvp-required"
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
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
