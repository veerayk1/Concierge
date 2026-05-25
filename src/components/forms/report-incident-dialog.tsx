'use client';

/**
 * Report Incident Dialog
 *
 * Built for a guard or concierge under stress. The page that opens
 * this dialog is usually a moving situation — someone is upset,
 * something is broken, a vehicle needs towing. The whole UX is built
 * around minimising friction at exactly the moment they have the
 * least patience to fight a form:
 *
 *  1. Top-6 quick-category chips so they don't open a select dropdown
 *     while a resident is yelling.
 *  2. AI-style auto-priority: typing "fire", "police", "intrusion"
 *     auto-flips priority to urgent; "noise", "package" stays medium.
 *  3. The submit button gets a colour that matches priority — green
 *     for routine, amber for important, red for urgent — so the guard
 *     sees what they're about to file at a glance.
 *  4. Photos via camera input (mobile opens the camera direct).
 *  5. ⌘+Enter submits.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Camera,
  Car,
  Flame,
  Sparkles,
  Users,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
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

// Top 6 quick categories — the ones a guard files multiple times per
// shift. The full category list is still available in the "More" select
// below. Each chip carries an icon, palette, and (smart-detected)
// suggested priority.
const QUICK_CATEGORIES: {
  label: string;
  icon: typeof AlertTriangle;
  tone: string;
  suggestedPriority: IncidentInput['priority'];
}[] = [
  {
    label: 'Noise Complaint',
    icon: Volume2,
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    suggestedPriority: 'low',
  },
  {
    label: 'Suspicious Activity',
    icon: AlertTriangle,
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    suggestedPriority: 'high',
  },
  {
    label: 'Vehicle Issue',
    icon: Car,
    tone: 'bg-violet-50 text-violet-700 ring-violet-200',
    suggestedPriority: 'medium',
  },
  {
    label: 'Water/Flood',
    icon: Wrench,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    suggestedPriority: 'high',
  },
  {
    label: 'Fire/Safety',
    icon: Flame,
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    suggestedPriority: 'urgent',
  },
  {
    label: 'Trespassing',
    icon: Users,
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    suggestedPriority: 'urgent',
  },
];

const FULL_CATEGORIES = [
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

// Words that escalate the priority automatically. "fire" and "police"
// always go urgent; "smoke", "alarm" go high. The guard can still
// override.
const URGENT_KEYWORDS =
  /\b(fire|smoke|police|911|injury|injured|bleeding|unconscious|assault|trespass|intrusion|broken in|weapon|gun|knife)\b/i;
const HIGH_KEYWORDS = /\b(alarm|leak|flood|threat|stalker|vandal|theft|stolen|broken)\b/i;

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
  const [autoPriority, setAutoPriority] = useState<'urgent' | 'high' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  // Fetch event types to find the incident-report type UUID
  useEffect(() => {
    if (!open) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
      headers['x-demo-role'] = localStorage.getItem('demo_role')!;
    }
    if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('auth_token')}`;
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

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');
  const requiresFollowUp = watch('requiresFollowUp');
  const policeNotified = watch('policeNotified');
  const title = watch('title');
  const description = watch('description');

  // Smart priority — escalate to urgent if any urgent keyword appears
  // in title or description; to high for high keywords. Guard can
  // override and the smart suggestion stops fighting them.
  useEffect(() => {
    const blob = `${title || ''} ${description || ''}`;
    let suggested: 'urgent' | 'high' | null = null;
    if (URGENT_KEYWORDS.test(blob)) suggested = 'urgent';
    else if (HIGH_KEYWORDS.test(blob)) suggested = 'high';
    if (!suggested) {
      setAutoPriority(null);
      return;
    }
    if (selectedPriority !== suggested && autoPriority === null) {
      setValue('priority', suggested);
      setAutoPriority(suggested);
    } else if (selectedPriority === suggested) {
      setAutoPriority(suggested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  useEffect(() => {
    if (!open) {
      setAutoPriority(null);
      setAttachedFiles([]);
    }
  }, [open]);

  function selectQuickCategory(cat: (typeof QUICK_CATEGORIES)[number]) {
    setValue('category', cat.label);
    // Only bump priority up, never down — guard might have already
    // escalated based on what they saw.
    const order = ['low', 'medium', 'high', 'urgent'] as const;
    if (order.indexOf(cat.suggestedPriority) > order.indexOf(selectedPriority)) {
      setValue('priority', cat.suggestedPriority);
    }
  }

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
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          eventTypeId: incidentTypeId || 'incident-report',
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
        const result = await response.json().catch(() => ({}));
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
    e.target.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Submit button colour matches the final priority so the guard sees
  // what they're filing at a glance.
  const submitClass =
    selectedPriority === 'urgent'
      ? 'bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-[0_2px_8px_rgba(220,38,38,0.4)]'
      : selectedPriority === 'high'
        ? 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
        : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          Report incident
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Tap a category to start. The form will smart-suggest a priority based on what you type.
        </DialogDescription>

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleSubmit(onSubmit)();
            }
          }}
          className="mt-5 flex flex-col gap-5"
          noValidate
        >
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* QUICK CATEGORIES — six big chips, each with icon + tone */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              What kind of incident?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => selectQuickCategory(cat)}
                    className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-medium ring-1 transition-all duration-150 hover:-translate-y-px hover:shadow-sm ${
                      active ? cat.tone + ' shadow-sm ring-2' : cat.tone + ' opacity-90'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <details className="mt-1 text-[12.5px] text-neutral-500">
              <summary className="cursor-pointer hover:text-neutral-700">Something else…</summary>
              <select
                {...register('category')}
                className="focus:border-primary-500 focus:ring-primary-100 mt-2 h-[40px] w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 focus:ring-4 focus:outline-none"
              >
                <option value="">Pick a category…</option>
                {FULL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </details>
            {errors.category && (
              <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
            )}
          </div>

          <Input
            {...register('title')}
            label="Headline"
            placeholder="e.g. Suspicious vehicle in P2 — silver SUV, no plate"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <span>What happened?</span>
              <span className="text-[10.5px] tracking-normal text-neutral-400 normal-case">
                ⌘+Enter to send
              </span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Time, location, what you saw, who was involved, what you did…"
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
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

          {/* PRIORITY — four pill buttons. Auto-flipped if the title or
              description mentions urgent keywords; a small chip explains
              what just happened so the guard isn't confused. */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                const palette: Record<typeof p, string> = {
                  low: 'bg-neutral-50 text-neutral-700 ring-neutral-200',
                  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
                  high: 'bg-amber-50 text-amber-700 ring-amber-200',
                  urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
                };
                const active = selectedPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setValue('priority', p);
                      setAutoPriority(null);
                    }}
                    className={`rounded-xl py-2 text-[12.5px] font-semibold capitalize ring-1 transition-all duration-150 ${
                      active ? palette[p] + ' shadow-sm ring-2' : palette[p] + ' opacity-70'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {autoPriority && (
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium ring-1 ${
                  autoPriority === 'urgent'
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}
              >
                <Zap className="h-3 w-3" />
                Auto-flagged {autoPriority} — we noticed a serious keyword in what you wrote.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('location')}
              label="Where"
              placeholder="P2 Parking, Lobby, Floor 8…"
              error={errors.location?.message}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Related unit</label>
              <select
                {...register('unitId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">{unitsLoading ? 'Loading units…' : 'No specific unit'}</option>
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
              label="Needs supervisor follow-up"
              description="Flag this for review and a follow-up action."
              id="follow-up"
            />
            <Checkbox
              checked={policeNotified}
              onCheckedChange={(c) => setValue('policeNotified', c === true)}
              label="Police / emergency services were called"
              description="Check if 911 or non-emergency police have been contacted."
              id="police"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/heic,image/webp"
            capture="environment"
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
            Attach photos {attachedFiles.length > 0 ? `(${attachedFiles.length})` : ''}
          </Button>

          {attachedFiles.length > 0 && (
            <ul className="flex flex-col gap-1.5">
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
              className={submitClass}
            >
              {isSubmitting ? 'Filing…' : 'File incident'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
