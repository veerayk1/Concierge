'use client';

/**
 * Shift Log Entry Dialog
 *
 * Built for someone who's busy at the desk. The goal is to get a
 * shift note in under 10 seconds, not 60. Strategies:
 *
 *  1. Auto-detect the current shift so the resident doesn't pick.
 *  2. Quick-template chips — common scenarios pre-fill the textarea
 *     ("Routine patrol", "Pass-on", "Tow truck dispatched", etc.) so
 *     the concierge clicks once and tweaks 4 words instead of writing
 *     a full paragraph.
 *  3. AI-flavoured smart-priority auto-suggestion — words like
 *     "URGENT" / "alarm" / "police" auto-mark the entry important.
 *  4. Visual character counter so they know when they're hitting the
 *     limit before the submit click.
 *  5. Keyboard shortcut: Ctrl/⌘+Enter submits.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Clock,
  Megaphone,
  Sparkles,
  Sun,
  Sunrise,
  Moon,
  TruckIcon,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const shiftEntrySchema = z.object({
  content: z.string().min(1, 'Entry content is required').max(4000),
  shift: z.enum(['morning', 'afternoon', 'night']),
  isImportant: z.boolean().default(false),
});

type ShiftEntryInput = z.infer<typeof shiftEntrySchema>;

interface CreateShiftEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

// Quick templates the concierge can tap to prefill. Each one is the
// kind of entry that comes up multiple times per shift — adding them
// as one-click reduces "thinking about how to phrase it" friction.
const QUICK_TEMPLATES: {
  label: string;
  text: string;
  icon: typeof Megaphone;
  tone: string;
  important?: boolean;
}[] = [
  {
    label: 'Routine patrol',
    text: 'Completed routine patrol of all floors and common areas. No issues observed.',
    icon: Clock,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  {
    label: 'Pass-on note',
    text: 'Pass-on for the next shift: ',
    icon: Megaphone,
    tone: 'bg-primary-50 text-primary-700 ring-primary-200',
    important: true,
  },
  {
    label: 'Tow truck called',
    text: 'Tow truck dispatched for vehicle (plate: ____) parked in spot ____. Resident notified.',
    icon: TruckIcon,
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  {
    label: 'Resident assisted',
    text: 'Helped resident at unit ____ with ____. Resolved on site.',
    icon: Users,
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  {
    label: 'Maintenance follow-up',
    text: 'Spoke with maintenance about ____ in unit ____. Expected resolution: ____.',
    icon: Wrench,
    tone: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  {
    label: 'Incident',
    text: 'Incident reported: ____. Time: ____. Action taken: ____. Follow-up needed: ____.',
    icon: AlertTriangle,
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    important: true,
  },
];

// Words that auto-flag an entry as important. Saves a click for the
// shifts where things actually go sideways.
const URGENT_KEYWORDS =
  /\b(urgent|emergency|alarm|police|fire|injury|leak|flood|intrusion|broken in|trespass)\b/i;

export function CreateShiftEntryDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateShiftEntryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [autoImportant, setAutoImportant] = useState(false);

  // Auto-detect current shift
  const hour = new Date().getHours();
  const defaultShift = hour < 14 ? 'morning' : hour < 22 ? 'afternoon' : 'night';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(shiftEntrySchema) as any,
    defaultValues: {
      content: '',
      shift: defaultShift as 'morning' | 'afternoon' | 'night',
      isImportant: false,
    },
  });

  const selectedShift = watch('shift');
  const isImportant = watch('isImportant');
  const content = watch('content');
  const [polishing, setPolishing] = useState(false);

  async function polishContent() {
    if (!content?.trim() || polishing) return;
    setPolishing(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const tok = localStorage.getItem('auth_token');
        if (tok) headers['Authorization'] = `Bearer ${tok}`;
        const dr = localStorage.getItem('demo_role');
        if (dr) headers['x-demo-role'] = dr;
      }
      const r = await fetch('/api/v1/ai/polish', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: content }),
      });
      const j = await r.json();
      if (j?.data?.polished) setValue('content', j.data.polished);
    } catch {
      /* silent */
    } finally {
      setPolishing(false);
    }
  }

  // Smart priority — if the content reads URGENT, auto-flip the
  // important toggle so the concierge doesn't have to remember. The
  // resident can still uncheck it if it's a false-positive.
  useEffect(() => {
    if (!content) {
      setAutoImportant(false);
      return;
    }
    const looksUrgent = URGENT_KEYWORDS.test(content);
    if (looksUrgent && !isImportant) {
      setValue('isImportant', true);
      setAutoImportant(true);
    } else if (!looksUrgent && autoImportant) {
      setValue('isImportant', false);
      setAutoImportant(false);
    }
    // We deliberately only react to `content` so the user can still
    // toggle important manually without us fighting them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Reset autoImportant flag when the dialog closes so it doesn't
  // leak into the next entry.
  useEffect(() => {
    if (!open) setAutoImportant(false);
  }, [open]);

  function applyTemplate(template: (typeof QUICK_TEMPLATES)[number]) {
    setValue('content', template.text);
    if (template.important) setValue('isImportant', true);
    // Move the cursor to the first underscore placeholder so the
    // concierge can start typing the actual detail immediately.
    setTimeout(() => {
      const ta = document.querySelector<HTMLTextAreaElement>('[data-shift-entry-content]');
      if (!ta) return;
      ta.focus();
      const idx = ta.value.indexOf('____');
      if (idx >= 0) {
        ta.setSelectionRange(idx, idx + 4);
      } else {
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, 0);
  }

  async function onSubmit(data: ShiftEntryInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/shift-log', {
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
          content: `[${data.shift.toUpperCase()} SHIFT] ${data.content}`,
          category: 'general',
          priority: data.isImportant ? 'important' : 'normal',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to add entry');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const SHIFTS = [
    {
      value: 'morning',
      label: 'Morning',
      time: '6 – 2',
      icon: Sunrise,
      activeBg: 'bg-amber-100 text-amber-800 ring-amber-300',
      idleBg: 'bg-neutral-50 text-neutral-500 ring-neutral-200',
    },
    {
      value: 'afternoon',
      label: 'Afternoon',
      time: '2 – 10',
      icon: Sun,
      activeBg: 'bg-sky-100 text-sky-800 ring-sky-300',
      idleBg: 'bg-neutral-50 text-neutral-500 ring-neutral-200',
    },
    {
      value: 'night',
      label: 'Night',
      time: '10 – 6',
      icon: Moon,
      activeBg: 'bg-violet-100 text-violet-800 ring-violet-300',
      idleBg: 'bg-neutral-50 text-neutral-500 ring-neutral-200',
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Clock className="text-primary-500 h-5 w-5" />
          Add shift entry
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Tap a template, or write your own. The next shift will see this first.
        </DialogDescription>

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            // Cmd/Ctrl + Enter submits — saves a click for repeat
            // entries during a busy shift.
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

          {/* QUICK TEMPLATES — six chips. Each one drops a starter
              sentence into the textarea and selects the first ____
              placeholder so the concierge can type immediately. */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Start from a template
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-medium ring-1 transition-all duration-150 hover:-translate-y-px hover:shadow-sm ${t.tone}`}
                >
                  <t.icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SHIFT — auto-selected for the current hour. Three big
              icon tiles instead of a select. */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              Shift
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SHIFTS.map((s) => {
                const Icon = s.icon;
                const active = selectedShift === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setValue('shift', s.value as ShiftEntryInput['shift'])}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 ring-1 transition-all duration-150 ${
                      active ? s.activeBg : s.idleBg + ' hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    <div className="text-left">
                      <p className="text-[13px] font-semibold">{s.label}</p>
                      <p className="text-[10.5px] opacity-70">{s.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT — textarea with live char counter, a Polish
              with AI button, and a soft focus ring. */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-3 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <span>What happened?</span>
              <span className="flex items-center gap-2 text-[10.5px] tracking-normal text-neutral-400 normal-case">
                <button
                  type="button"
                  onClick={polishContent}
                  disabled={polishing || !content?.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 disabled:opacity-50"
                  title="Fix typos and capitalize sentences"
                >
                  <span>✨</span>
                  {polishing ? 'Polishing…' : 'Polish'}
                </button>
                <span>{(content || '').length} / 4000 · ⌘+Enter to send</span>
              </span>
            </label>
            <textarea
              {...register('content')}
              data-shift-entry-content
              placeholder="The next person at the desk will see this first.&#10;&#10;e.g. Elevator B out of service, technician expected by 2pm. Route residents to Elevator A."
              rows={5}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.content
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
              maxLength={4000}
            />
            {errors.content && (
              <p className="text-error-600 text-[13px] font-medium">{errors.content.message}</p>
            )}
          </div>

          {/* IMPORTANT — auto-toggled when the entry contains urgent
              keywords. Visible badge tells the user that happened so
              it doesn't feel like the form is fighting them. */}
          <div className="flex flex-col gap-2">
            <Checkbox
              checked={isImportant}
              onCheckedChange={(c) => {
                setValue('isImportant', c === true);
                setAutoImportant(false);
              }}
              label="Mark as important — pin to top of the next shift's view"
              id="important"
            />
            {autoImportant && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11.5px] font-medium text-amber-700 ring-1 ring-amber-200">
                <Zap className="h-3 w-3" />
                Auto-flagged important — your entry mentions an urgent keyword.
              </div>
            )}
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
              {isSubmitting ? 'Adding…' : 'Add entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
