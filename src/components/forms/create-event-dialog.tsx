'use client';

/**
 * Create Event Dialog — per PRD 03 Security Console
 * Quick-create for unified event model
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key, Package, Shield, ShieldAlert, Sparkles, StickyNote, Users } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createEventSchema, type CreateEventInput } from '@/schemas/event';

// ---------------------------------------------------------------------------
// Event Type Options (per PRD 03 — 7 entry types for v1)
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  {
    id: 'type-visitor',
    name: 'Visitor',
    icon: Users,
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
  {
    id: 'type-package',
    name: 'Package',
    icon: Package,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    id: 'type-incident',
    name: 'Incident',
    icon: ShieldAlert,
    color: 'text-error-600',
    bg: 'bg-error-50',
  },
  { id: 'type-key', name: 'Key/FOB', icon: Key, color: 'text-purple-600', bg: 'bg-purple-50' },
  {
    id: 'type-pass-on',
    name: 'Pass-On',
    icon: StickyNote,
    color: 'text-warning-600',
    bg: 'bg-warning-50',
  },
  {
    id: 'type-cleaning',
    name: 'Cleaning',
    icon: Sparkles,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    id: 'type-note',
    name: 'Note',
    icon: StickyNote,
    color: 'text-neutral-600',
    bg: 'bg-neutral-100',
  },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-neutral-100 text-neutral-600' },
  { value: 'normal', label: 'Normal', color: 'bg-neutral-100 text-neutral-600' },
  { value: 'medium', label: 'Medium', color: 'bg-warning-50 text-warning-700' },
  { value: 'high', label: 'High', color: 'bg-error-50 text-error-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-error-100 text-error-800' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      propertyId,
      eventTypeId: '',
      unitId: '',
      title: '',
      description: '',
      priority: 'normal',
    },
  });

  const selectedTypeId = watch('eventTypeId');
  const selectedPriority = watch('priority');

  async function onSubmit(data: CreateEventInput) {
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
        body: JSON.stringify(data),
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
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Shield className="text-primary-500 h-5 w-5" />
          Log Event
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new entry in the security console event log.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Event Type Selector — Icon Grid per PRD 03 */}
          <div>
            <p className="mb-2 text-[14px] font-medium text-neutral-700">
              Event Type<span className="text-error-500 ml-0.5">*</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setValue('eventTypeId', type.id, { shouldValidate: true })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-150 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-transparent bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${type.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${type.color}`} />
                    </div>
                    <span className="text-[12px] font-medium text-neutral-700">{type.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.eventTypeId && (
              <p className="text-error-600 mt-1.5 text-[13px] font-medium">
                {errors.eventTypeId.message}
              </p>
            )}
          </div>

          <Input
            {...register('title')}
            label="Title"
            placeholder="e.g. Visitor for unit 1501, Noise complaint Floor 8"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Details</label>
            <textarea
              {...register('description')}
              placeholder="Describe the event..."
              rows={3}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Unit */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Unit</label>
              <select
                {...register('unitId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">No specific unit</option>
                <option value="unit-1">101</option>
                <option value="unit-2">305</option>
                <option value="unit-3">422</option>
                <option value="unit-4">710</option>
                <option value="unit-5">802</option>
                <option value="unit-6">1105</option>
                <option value="unit-7">1203</option>
                <option value="unit-8">1501</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Priority</label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setValue('priority', p.value as CreateEventInput['priority'], {
                        shouldValidate: true,
                      })
                    }
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-all ${
                      selectedPriority === p.value
                        ? 'ring-primary-500 ring-2 ' + p.color
                        : p.color + ' opacity-60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              {isSubmitting ? 'Creating...' : 'Log Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
