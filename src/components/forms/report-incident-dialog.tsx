'use client';

/**
 * Report Incident Dialog — per PRD 03 Section 3.1.7
 * Multi-step incident form with category, priority, description, photos
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Camera, MapPin, X } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  category: z.string().min(1, 'Select a category'),
  location: z.string().max(200).optional(),
  unitId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
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
  const [incidentTypeId, setIncidentTypeId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  // Fetch event types to find the incident-report type UUID
  useEffect(() => {
    if (!open) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
      headers['x-demo-role'] = localStorage.getItem('demo_role')!;
    }
    fetch(`/api/v1/event-types?propertyId=${propertyId}`, { headers })
      .then((res) => res.json())
      .then((result) => {
        const types = result.data ?? result;
        if (Array.isArray(types)) {
          const incident = types.find(
            (t: { slug?: string; name?: string }) =>
              t.slug === 'incident_report' ||
              t.slug === 'incident-report' ||
              t.name?.toLowerCase().includes('incident'),
          );
          if (incident) setIncidentTypeId(incident.id);
        }
      })
      .catch(() => {});
  }, [open, propertyId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncidentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incidentSchema) as any,
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
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          eventTypeId: incidentTypeId || undefined,
          unitId: data.unitId || undefined,
          title: data.title,
          description: data.description,
          priority: data.priority,
          customFields: {
            category: data.category,
            location: data.location,
            requiresFollowUp: data.requiresFollowUp,
            policeNotified: data.policeNotified,
            pendingPhotos: attachedFiles.map((f) => f.name),
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to report incident');
        return;
      }

      reset();
      setAttachedFiles([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
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
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                  const colors = {
                    low: 'bg-neutral-100 text-neutral-600',
                    medium: 'bg-warning-50 text-warning-700',
                    high: 'bg-error-50 text-error-700',
                    urgent: 'bg-error-200 text-error-900',
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
                <option value="">{unitsLoading ? 'Loading...' : 'No specific unit'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/heic,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            Attach Photos
          </Button>

          {attachedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-medium text-neutral-600">
                {attachedFiles.length} photo{attachedFiles.length !== 1 ? 's' : ''} selected
              </p>
              <ul className="flex flex-col gap-1">
                {attachedFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-[13px] text-neutral-700"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-neutral-400">
                Photos will be uploaded after submission
              </p>
            </div>
          )}

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
