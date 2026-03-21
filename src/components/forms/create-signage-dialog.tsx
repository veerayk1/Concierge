'use client';

/**
 * Create Signage Dialog — New Display Content
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Monitor } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const signageSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  content: z.string().min(5, 'Content is required').max(4000),
  type: z.string().min(1, 'Select a content type'),
  screen: z.string().min(1, 'Select a screen location'),
  priority: z.string().min(1, 'Select a priority'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rotation: z.coerce.number().min(1).max(300).optional(),
});

type SignageInput = z.infer<typeof signageSchema>;

const CONTENT_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'weather', label: 'Weather' },
  { value: 'event', label: 'Event' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'directory', label: 'Directory' },
];

const SCREEN_LOCATIONS = [
  { value: 'lobby', label: 'Lobby' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'parking', label: 'Parking' },
  { value: 'pool', label: 'Pool' },
  { value: 'gym', label: 'Gym' },
  { value: 'mailroom', label: 'Mailroom' },
];

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'emergency', label: 'Emergency' },
];

interface CreateSignageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateSignageDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateSignageDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignageInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(signageSchema) as any,
    defaultValues: {
      name: '',
      content: '',
      type: '',
      screen: '',
      priority: '',
      startDate: '',
      endDate: '',
      rotation: 15,
    },
  });

  async function onSubmit(data: SignageInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/digital-signage', {
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
        setServerError(result.message || 'Failed to create display content');
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
          <Monitor className="text-primary-500 h-5 w-5" />
          New Display Content
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create content for digital signage screens throughout the building.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('name')}
            label="Name"
            placeholder="e.g. Holiday Hours Notice"
            required
            error={errors.name?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Content<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('content')}
              placeholder="Display content text..."
              rows={4}
              className={`${textareaBase} ${errors.content ? 'border-error-300 focus:border-primary-500' : textareaDefault}`}
              maxLength={4000}
            />
            {errors.content && (
              <p className="text-error-600 text-[13px] font-medium">{errors.content.message}</p>
            )}
          </div>

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
                {CONTENT_TYPES.map((t) => (
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
                Screen<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('screen')}
                className={errors.screen ? selectErrorClass : selectClass}
              >
                <option value="">Select screen...</option>
                {SCREEN_LOCATIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {errors.screen && (
                <p className="text-error-600 text-[13px] font-medium">{errors.screen.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Priority<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('priority')}
              className={errors.priority ? selectErrorClass : selectClass}
            >
              <option value="">Select priority...</option>
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('startDate')}
              type="date"
              label="Start Date"
              error={errors.startDate?.message}
            />
            <Input
              {...register('endDate')}
              type="date"
              label="End Date"
              error={errors.endDate?.message}
            />
          </div>

          <Input
            {...register('rotation', { valueAsNumber: true })}
            type="number"
            min="1"
            max="300"
            label="Rotation Duration (seconds)"
            placeholder="15"
            error={errors.rotation?.message}
          />

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
              {isSubmitting ? 'Creating...' : 'Create Content'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
