'use client';

/**
 * Submit Shift Report Dialog
 *
 * End-of-shift wizard. The guard / concierge clicks "End shift &
 * submit report" on /shift-log; we hit POST
 * /api/v1/shift-log/handoff/compose to auto-roll-up every entry
 * they logged this shift, count packages/visitors/incidents handled,
 * and produce an AI-polished draft. The user reviews/edits the draft
 * and submits via POST /api/v1/shift-log/handoff.
 *
 * Steps:
 *   1. Auto-summary — read-only counts + editable narrative.
 *   2. Pass-on — flagged urgent items the next shift must see.
 *      User can uncheck items they handled before they left.
 *   3. Anything else — optional free-text additions; AI polish
 *      runs on submit.
 *   4. Sign off — confirmation + submit.
 */

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Package as PackageIcon,
  Sparkles,
  Users,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ComposeEntry {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  createdAt: string;
  unit: { id: string; number: string } | null;
  isUrgent: boolean;
}

interface ComposeResponse {
  shiftType: 'morning' | 'afternoon' | 'night';
  shiftDate: string;
  counts: {
    entries: number;
    urgent: number;
    routine: number;
    packagesLogged: number;
    visitorsSignedIn: number;
    incidentsReported: number;
  };
  aiSummary: string;
  notes: string;
  flaggedItems: {
    id: string;
    description: string;
    priority: string;
    unit_number: string | null;
    event_id: string;
  }[];
  entries: ComposeEntry[];
}

interface SubmitShiftReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

const SHIFT_TONE: Record<string, string> = {
  morning: 'bg-amber-50 ring-amber-200 text-amber-800',
  afternoon: 'bg-sky-50 ring-sky-200 text-sky-800',
  night: 'bg-violet-50 ring-violet-200 text-violet-800',
};

export function SubmitShiftReportDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: SubmitShiftReportDialogProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ComposeResponse | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [editedNotes, setEditedNotes] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [addendum, setAddendum] = useState('');
  const [polishingSummary, setPolishingSummary] = useState(false);
  const [polishingNotes, setPolishingNotes] = useState(false);

  // One-tap server-side polish — typo fixes and sentence-cased
  // capitalisation over the edited summary or notes. The user can
  // edit freely, then click Polish if they want the rough draft
  // cleaned up before they sign off.
  async function polishText(
    text: string,
    onSet: (next: string) => void,
    setBusy: (b: boolean) => void,
  ) {
    if (!text.trim()) return;
    setBusy(true);
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
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (j?.data?.polished) onSet(j.data.polished);
    } catch {
      /* silent — leave text as-is */
    } finally {
      setBusy(false);
    }
  }

  // Compose the draft when the dialog opens.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setError(null);
      setDraft(null);
      setExcludedIds(new Set());
      setEditedNotes('');
      setEditedSummary('');
      setAddendum('');
      return;
    }
    setLoading(true);
    fetch('/api/v1/shift-log/handoff/compose', {
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
      body: JSON.stringify({ propertyId }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setError(j.message || 'Could not compose the shift report.');
        } else {
          const data = j.data as ComposeResponse;
          setDraft(data);
          setEditedSummary(data.aiSummary || '');
          setEditedNotes(data.notes || '');
        }
      })
      .catch(() => setError('Network error. Try again.'))
      .finally(() => setLoading(false));
  }, [open, propertyId]);

  function toggleExclude(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    try {
      // Apply user edits + filtered pass-on items.
      const flaggedItems = draft.flaggedItems.filter((f) => !excludedIds.has(f.id));
      const combinedNotes = [editedNotes, addendum.trim() && `\n\nADDITIONAL:\n${addendum.trim()}`]
        .filter(Boolean)
        .join('');
      const payload = {
        propertyId,
        shiftDate: draft.shiftDate,
        shiftType: draft.shiftType,
        notes: combinedNotes,
        flaggedItems,
        aiSummary: editedSummary,
      };
      const r = await fetch('/api/v1/shift-log/handoff', {
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
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Submit failed (${r.status})`);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ['Auto-summary', 'Pass-on', 'Final touches', 'Sign off'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Sparkles className="h-5 w-5 text-amber-500" />
          End shift & submit report
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          We rolled up everything you logged this shift. Review, tweak, sign off.
        </DialogDescription>

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-2 text-[11.5px] tracking-[0.06em] text-neutral-400 uppercase">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  i === step
                    ? 'bg-primary-500 text-white'
                    : i < step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span
                className={`${
                  i === step ? 'text-neutral-700' : i < step ? 'text-emerald-600' : ''
                }`}
              >
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="border-error-200 bg-error-50 text-error-700 mt-4 rounded-xl border px-4 py-3 text-[14px]">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            <p className="text-[13.5px] text-neutral-500">Reading every entry from your shift…</p>
          </div>
        )}

        {!loading && draft && (
          <>
            {/* ----- STEP 1 — Auto summary ----- */}
            {step === 0 && (
              <div className="mt-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatPill
                    label="Entries"
                    value={draft.counts.entries}
                    tone="bg-emerald-50 text-emerald-700 ring-emerald-200"
                  />
                  <StatPill
                    label="Packages"
                    value={draft.counts.packagesLogged}
                    tone="bg-amber-50 text-amber-700 ring-amber-200"
                    icon={PackageIcon}
                  />
                  <StatPill
                    label="Visitors"
                    value={draft.counts.visitorsSignedIn}
                    tone="bg-sky-50 text-sky-700 ring-sky-200"
                    icon={Users}
                  />
                  <StatPill
                    label="Incidents"
                    value={draft.counts.incidentsReported}
                    tone={
                      draft.counts.incidentsReported > 0
                        ? 'bg-rose-50 text-rose-700 ring-rose-200'
                        : 'bg-neutral-50 text-neutral-600 ring-neutral-200'
                    }
                    icon={AlertTriangle}
                  />
                </div>

                <div
                  className={`rounded-xl px-3 py-2 ring-1 ${SHIFT_TONE[draft.shiftType]} w-fit text-[11px] font-semibold tracking-[0.08em] uppercase`}
                >
                  {draft.shiftType} shift · {draft.shiftDate}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Auto-summary
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        polishText(editedSummary, setEditedSummary, setPolishingSummary)
                      }
                      disabled={polishingSummary || !editedSummary.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 disabled:opacity-50"
                      title="Fix typos and capitalize sentences"
                    >
                      <Sparkles className="h-3 w-3" />
                      {polishingSummary ? 'Polishing…' : 'Polish with AI'}
                    </button>
                  </div>
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={3}
                    className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-neutral-900 transition-all focus:ring-4 focus:outline-none"
                  />
                  <p className="text-[11.5px] text-neutral-400">
                    Generated from your entries. Edit anything that doesn't read right, then hit
                    Polish to clean up typos.
                  </p>
                </div>
              </div>
            )}

            {/* ----- STEP 2 — Pass-on (urgent items the next shift must see) ----- */}
            {step === 1 && (
              <div className="mt-5 flex flex-col gap-4">
                <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                  <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                  Pass-on to next shift
                </label>
                {draft.flaggedItems.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                    <p className="text-[13.5px] text-emerald-800">
                      Nothing urgent to pass on. The next shift inherits a clean slate.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {draft.flaggedItems.map((f) => {
                      const excluded = excludedIds.has(f.id);
                      return (
                        <li
                          key={f.id}
                          className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all ${
                            excluded
                              ? 'border-neutral-200 bg-neutral-50 opacity-60'
                              : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExclude(f.id)}
                            className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                              excluded
                                ? 'border-neutral-300 bg-white'
                                : 'border-amber-500 bg-amber-500 text-white'
                            }`}
                          >
                            {!excluded && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[14px] leading-relaxed ${
                                excluded ? 'text-neutral-500 line-through' : 'text-neutral-900'
                              }`}
                            >
                              {f.description}
                            </p>
                            {f.unit_number && (
                              <p className="mt-0.5 text-[11.5px] text-neutral-500">
                                Unit {f.unit_number}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExclude(f.id)}
                            className="text-[11.5px] font-medium text-neutral-500 hover:text-neutral-700"
                          >
                            {excluded ? 'Add back' : 'I handled it'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="text-[11.5px] text-neutral-400">
                  Uncheck anything you wrapped up before clocking out — only what's left rolls to
                  the next shift.
                </p>
              </div>
            )}

            {/* ----- STEP 3 — Final touches (notes + addendum) ----- */}
            {step === 2 && (
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                      The full handoff notes
                    </label>
                    <button
                      type="button"
                      onClick={() => polishText(editedNotes, setEditedNotes, setPolishingNotes)}
                      disabled={polishingNotes || !editedNotes.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 disabled:opacity-50"
                      title="Fix typos and capitalize sentences"
                    >
                      <Sparkles className="h-3 w-3" />
                      {polishingNotes ? 'Polishing…' : 'Polish with AI'}
                    </button>
                  </div>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={8}
                    className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-mono text-[12.5px] leading-relaxed text-neutral-900 transition-all focus:ring-4 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                    Anything we didn't log? Drop it here.
                  </label>
                  <textarea
                    value={addendum}
                    onChange={(e) => setAddendum(e.target.value)}
                    rows={3}
                    placeholder="e.g. Friendly heads-up — unit 1204's plumber arrives at 8am tomorrow."
                    className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] leading-relaxed text-neutral-900 transition-all placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ----- STEP 4 — Sign-off ----- */}
            {step === 3 && (
              <div className="mt-5 flex flex-col gap-4">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-5 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" strokeWidth={1.8} />
                  <p className="mt-3 text-[15px] font-semibold text-neutral-900">
                    Ready to hand off.
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-600">
                    The next shift will see your pass-on the moment they sign in. Your supervisor
                    and property manager get a copy too.
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-3 text-[12.5px] text-neutral-600 ring-1 ring-neutral-200">
                  <p className="font-semibold text-neutral-700">Final summary</p>
                  <p className="mt-1 leading-relaxed">{editedSummary}</p>
                </div>
              </div>
            )}

            {/* ----- Navigation ----- */}
            <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
              <Button
                type="button"
                variant="secondary"
                disabled={step === 0 || submitting}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {step < stepLabels.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] hover:from-emerald-600 hover:to-teal-700"
                >
                  {submitting ? 'Submitting…' : 'Submit & end shift'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon?: typeof Sparkles;
}) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl px-3 py-2 ring-1 ${tone}`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" strokeWidth={1.8} />}
        <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase opacity-80">
          {label}
        </span>
      </div>
      <span
        className="text-[22px] font-semibold tracking-[-0.02em]"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </span>
    </div>
  );
}
