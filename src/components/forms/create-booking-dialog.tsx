'use client';

/**
 * Amenity Booking Dialog — per PRD 06
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, Users } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const bookingSchema = z.object({
  amenityId: z.string().min(1, 'Select an amenity'),
  date: z.string().min(1, 'Select a date'),
  startTime: z.string().min(1, 'Select start time'),
  endTime: z.string().min(1, 'Select end time'),
  guestCount: z.number().min(0).max(50).default(0),
  notes: z.string().max(500).optional(),
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

const TIME_SLOTS = [
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
];

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBookingDialog({ open, onOpenChange, onSuccess }: CreateBookingDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      amenityId: '',
      date: '',
      startTime: '',
      endTime: '',
      guestCount: 0,
      notes: '',
    },
  });

  async function onSubmit(data: BookingInput) {
    setServerError(null);
    // TODO: Wire to API
    reset();
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Calendar className="text-primary-500 h-5 w-5" />
          Book Amenity
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Reserve a building amenity for your use.
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
              className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                errors.amenityId
                  ? 'border-error-300'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
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
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Start Time<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('startTime')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.startTime
                    ? 'border-error-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">Start...</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                End Time<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('endTime')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.endTime
                    ? 'border-error-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">End...</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            {...register('guestCount', { valueAsNumber: true })}
            type="number"
            label="Number of Guests"
            placeholder="0"
            min={0}
            max={50}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Any special requirements..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
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
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
