'use client';

/**
 * Log Event Dialog — Create a unified event entry
 * Posts to /api/v1/events with an event type from the property's configured types
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';
import { useApi, apiUrl } from '@/lib/hooks/use-api';

const logEventSchema = z.object({
  eventTypeId: z.string().uuid('Select an event type'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000).optional(),
  unitId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).default('normal'),
});

type LogEventInput = z.infer<typeof logEventSchema>;

interface ApiEventType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface LogEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function LogEventDialog({ open, onOpenChange, propertyId, onSuccess }: LogEventDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const { data: eventTypes } = useApi<ApiEventType[]>(
    apiUrl('/api/v1/event-types', { propertyId }),
    { enabled: open },
  );

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
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogEventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(logEventSchema) as any,
    defaultValues: {
      eventTypeId: '',
      title: '',
      description: '',
      unitId: '',
      priority: 'normal',
    },
  });

  const selectedPriority = watch('priority');

  async function onSubmit(data: LogEventInput) {
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
        body: JSON.stringify({
          propertyId,
          eventTypeId: data.eventTypeId,
          title: data.title,
          description: data.description,
          unitId: data.unitId || undefined,
          priority: data.priority,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to log event');
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
          <Layers className="text-primary-500 h-5 w-5" />
          Log Event
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Record a new event in the unified event log.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Event Type<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('eventTypeId')}
              className={errors.eventTypeId ? selectErrorClass : selectClass}
            >
              <option value="">Select event type...</option>
              {(eventTypes ?? []).map((et) => (
                <option key={et.id} value={et.id}>
                  {et.name}
                </option>
              ))}
            </select>
            {errors.eventTypeId && (
              <p className="text-error-600 text-[13px] font-medium">{errors.eventTypeId.message}</p>
            )}
          </div>

          <Input
            {...register('title')}
            label="Title"
            placeholder="Brief summary of the event"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Detailed description..."
              rows={4}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={4000}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Unit (optional)</label>
            <select {...register('unitId')} className={selectClass}>
              <option value="">{unitsLoading ? 'Loading units...' : 'No unit'}</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.number}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Priority</label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high', 'urgent'] as const).map((p) => {
                const colors = {
                  low: 'bg-neutral-100 text-neutral-600',
                  normal: 'bg-primary-50 text-primary-700',
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
              {isSubmitting ? 'Logging...' : 'Log Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
