'use client';

/**
 * Create Booking Dialog — per PRD 06 Amenity Reservations
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const bookingSchema = z.object({
  amenityId: z.string().min(1, 'Select an amenity'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  unit: z.string().min(1, 'Unit is required').max(20),
  notes: z.string().max(1000).optional(),
  guests: z.number().min(0).max(100).default(0),
});

type BookingInput = z.infer<typeof bookingSchema>;

const AMENITIES = [
  { id: 'a-1', name: 'Rooftop Pool' },
  { id: 'a-2', name: 'Fitness Center' },
  { id: 'a-3', name: 'Party Room' },
  { id: 'a-4', name: 'Theatre Room' },
  { id: 'a-5', name: 'Guest Suite' },
  { id: 'a-6', name: 'BBQ Terrace' },
  { id: 'a-7', name: 'Yoga Studio' },
  { id: 'a-8', name: 'Business Center' },
];

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateBookingDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      amenityId: '',
      date: '',
      startTime: '',
      endTime: '',
      unit: '',
      notes: '',
      guests: 0,
    },
  });

  async function onSubmit(data: BookingInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/bookings', {
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
        setServerError(result.message || 'Failed to create booking');
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
          <Calendar className="text-primary-500 h-5 w-5" />
          New Booking
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Reserve a building amenity.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Amenity<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('amenityId')}
              className={errors.amenityId ? selectErrorClass : selectClass}
            >
              <option value="">Select amenity...</option>
              {AMENITIES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {errors.amenityId && (
              <p className="text-error-600 text-[13px] font-medium">{errors.amenityId.message}</p>
            )}
          </div>

          <Input
            {...register('date')}
            type="date"
            label="Date"
            required
            error={errors.date?.message}
          />

          <div className="grid grid-cols-2 gap-4">
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
              required
              error={errors.endTime?.message}
            />
          </div>

          <Input
            {...register('unit')}
            label="Unit"
            placeholder="e.g. 1501"
            required
            error={errors.unit?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Purpose / Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Any special requirements or purpose for the booking..."
              rows={3}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={1000}
            />
          </div>

          <Input
            {...register('guests', { valueAsNumber: true })}
            type="number"
            label="Guests"
            placeholder="0"
            min={0}
            max={100}
            error={errors.guests?.message}
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
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
