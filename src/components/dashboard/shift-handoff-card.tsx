'use client';

/**
 * ShiftHandoffCard
 *
 * Renders the most-recent submitted ShiftHandoff for the property on
 * top of the Front Desk and Security dashboards. The on-shift person
 * sees their pass-on the moment they sign in. Pulses gently (reuses
 * .conc-spotlight) when there are flagged items the previous shift
 * left for follow-up.
 *
 * Hides itself when there's no handoff, when the previous handoff is
 * older than 18 hours (stale), or when the API errors out — we never
 * want to be the loudest thing on screen for no reason.
 */

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface HandoffData {
  id: string;
  shiftDate: string;
  shiftType: 'morning' | 'afternoon' | 'night';
  notes: string | null;
  aiSummary: string | null;
  flaggedItems: {
    id?: string;
    description: string;
    priority?: string;
    unit_number?: string | null;
  }[];
  eventCount: number;
  createdAt: string;
  outgoingUser: { firstName: string; lastName: string } | null;
}

const SHIFT_LABEL: Record<HandoffData['shiftType'], string> = {
  morning: 'morning shift',
  afternoon: 'afternoon shift',
  night: 'overnight shift',
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function ShiftHandoffCard() {
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: HandoffData | null }>(
    apiUrl('/api/v1/shift-log/handoff/latest', { propertyId }),
  );

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  // Persist dismissal so the same handoff doesn't keep re-appearing
  // across reloads after the on-shift person has read it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setDismissed(window.localStorage.getItem('concierge:handoffDismissed'));
    } catch {
      /* ignore */
    }
  }, []);

  const raw =
    response && 'data' in (response as object)
      ? (response as { data: HandoffData | null }).data
      : (response as unknown as HandoffData | null);
  if (!raw) return null;
  // Stale guard — anything older than 18 hours is yesterday's news.
  const ageMs = Date.now() - new Date(raw.createdAt).getTime();
  if (ageMs > 18 * 60 * 60 * 1000) return null;
  if (dismissed === raw.id) return null;

  const flagged = Array.isArray(raw.flaggedItems) ? raw.flaggedItems : [];
  const hasUrgent = flagged.length > 0;
  const outName = raw.outgoingUser?.firstName || 'the previous shift';

  function dismissCard() {
    try {
      window.localStorage.setItem('concierge:handoffDismissed', raw!.id);
    } catch {
      /* ignore */
    }
    setDismissed(raw!.id);
  }

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '60ms' }}
      aria-label="Pass-on from previous shift"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          hasUrgent
            ? 'conc-spotlight border-amber-200 from-amber-50 via-white to-rose-50'
            : 'border-emerald-200 from-emerald-50 via-white to-teal-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            hasUrgent
              ? 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-rose-300/20'
              : 'bg-gradient-to-br from-emerald-300/30 via-teal-300/20 to-sky-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              hasUrgent ? 'ring-1 ring-amber-200/60' : 'ring-1 ring-emerald-200/60'
            }`}
          >
            {hasUrgent ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
            ) : (
              <Sparkles className="h-5 w-5 text-emerald-600" strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  hasUrgent ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {hasUrgent ? 'Heads up' : 'Pass-on'}
              </span>
              <span
                className={`text-[11.5px] ${hasUrgent ? 'text-amber-700/80' : 'text-emerald-700/80'}`}
              >
                · from {outName}'s {SHIFT_LABEL[raw.shiftType]} · {relativeTime(raw.createdAt)}
              </span>
            </div>
            {raw.aiSummary && (
              <p className="mt-1 text-[14px] leading-relaxed text-neutral-800">{raw.aiSummary}</p>
            )}
            {flagged.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {flagged.slice(0, expanded ? flagged.length : 3).map((f, i) => (
                  <li
                    key={f.id ?? i}
                    className="flex items-start gap-2 text-[13.5px] leading-relaxed text-neutral-700"
                  >
                    <span className="mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                    <span>
                      {f.description}
                      {f.unit_number && (
                        <span className="text-neutral-500"> — Unit {f.unit_number}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {flagged.length > 3 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-amber-700 hover:text-amber-800"
              >
                {expanded ? 'Show less' : `Show ${flagged.length - 3} more`}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismissCard}
            className={`flex flex-shrink-0 items-center gap-1 self-center text-[12.5px] font-semibold ${
              hasUrgent
                ? 'text-amber-700 hover:text-amber-800'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            Got it
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
