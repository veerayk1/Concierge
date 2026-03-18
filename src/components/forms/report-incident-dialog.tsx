'use client';

/**
 * Report Incident Dialog — per PRD 03 Section 3.1.7
 * Multi-step incident form with category, priority, description, photos
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Camera, MapPin } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  category: z.string().min(1, 'Select a category'),
  location: z.string().max(200).optional(),
  unitId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  requiresFollowUp: z.boolean().default(false),
  policeNotified: z.boolean().default(false),
});

type IncidentInput = z.infer<typeof incidentSchema>;

const INCIDENT_CATEGORIES = [
  'Noise Complaint',
  'Suspicious Activity',
  'Theft',
  'Vandalism',
  'Trespassing',
  'Fire/Safety',
  'Water/Flood',
  'Equipment Failure',
  'Vehicle Issue',
  'Assault/Threat',
  'Medical Emergency',
  'Other',
];

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function ReportIncidentDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: ReportIncidentDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncidentInput>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      location: '',
      unitId: '',
      priority: 'medium',
      requiresFollowUp: false,
      policeNotified: false,
    },
  });

  const selectedPriority = watch('priority');
  const requiresFollowUp = watch('requiresFollowUp');
  const policeNotified = watch('policeNotified');

  async function onSubmit(data: IncidentInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          eventTypeId: 'type-incident',
          unitId: data.unitId || undefined,
          title: data.title,
          description: data.description,
          priority: data.priority,
          customFields: {
            category: data.category,
            location: data.location,
            requiresFollowUp: data.requiresFollowUp,
            policeNotified: data.policeNotified,
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to report incident');
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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <AlertTriangle className="text-error-500 h-5 w-5" />
          Report Incident
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Log a security incident with full details for investigation.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('title')}
            label="Incident Title"
            placeholder="e.g. Noise complaint, Suspicious vehicle in P2"
            required
            error={errors.title?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.category
                    ? 'border-error-300'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">Select category...</option>
                {INCIDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Priority</label>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as const).map((p) => {
                  const colors = {
                    low: 'bg-neutral-100 text-neutral-600',
                    medium: 'bg-warning-50 text-warning-700',
                    high: 'bg-error-50 text-error-700',
                    critical: 'bg-error-200 text-error-900',
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue('priority', p)}
                      className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition-all ${
                        selectedPriority === p
                          ? 'ring-primary-500 ring-2 ' + colors[p]
                          : colors[p] + ' opacity-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Provide a detailed description of the incident..."
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('location')}
              label="Location"
              placeholder="e.g. P2 Parking, Lobby, Floor 8 hallway"
              error={errors.location?.message}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Related Unit</label>
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
          </div>

          <div className="flex flex-col gap-3">
            <Checkbox
              checked={requiresFollowUp}
              onCheckedChange={(c) => setValue('requiresFollowUp', c === true)}
              label="Requires Follow-up"
              description="Flag this incident for supervisor review and follow-up action"
              id="follow-up"
            />
            <Checkbox
              checked={policeNotified}
              onCheckedChange={(c) => setValue('policeNotified', c === true)}
              label="Police/Emergency Services Notified"
              description="Check if 911 or non-emergency police have been contacted"
              id="police"
            />
          </div>

          <Button type="button" variant="secondary" fullWidth>
            <Camera className="h-4 w-4" />
            Attach Photos
          </Button>

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
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-error-600 hover:bg-error-700"
            >
              {isSubmitting ? 'Reporting...' : 'Report Incident'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
