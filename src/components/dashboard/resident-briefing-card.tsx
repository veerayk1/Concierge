'use client';

/**
 * ResidentBriefingCard
 *
 * One short paragraph that ties together everything happening in
 * the resident's life on the property today. Sits at the very top
 * of the resident dashboard as a calm welcome — "Good morning,
 * Alice. You're expecting Mike at 9am. 2 packages waiting at the
 * desk, one is perishable. Party Room is booked 6–9pm by Unit 304."
 *
 * Hides if the briefing is just the greeting and "Quiet day" — the
 * boring case where nothing demands attention. Pulses
 * (.conc-spotlight) when there's a perishable package or urgent
 * service request still open.
 */

import { Sparkles } from 'lucide-react';

import { useApi } from '@/lib/hooks/use-api';

interface Briefing {
  paragraphs: string[];
  highlights: {
    expectedVisitorsToday: number;
    packagesWaiting: number;
    perishablePackages: number;
    openRequests: number;
    inProgressRequests: number;
  };
}

export function ResidentBriefingCard() {
  const { data: response } = useApi<{ data: Briefing }>('/api/v1/my/briefing');

  const data: Briefing | null =
    response && 'data' in (response as object)
      ? (response as { data: Briefing }).data
      : (response as unknown as Briefing | null);
  if (!data) return null;

  const { paragraphs, highlights } = data;
  // The endpoint always returns at least the greeting. If everything
  // else is empty/quiet, hide the card — a quiet day doesn't need a
  // banner shouting "you have a quiet day".
  if (paragraphs.length <= 2 && paragraphs[1]?.startsWith('Quiet')) return null;

  const urgent = highlights.perishablePackages > 0;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '40ms' }}
      aria-label="Today's briefing"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          urgent
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-violet-200 from-violet-50 via-white to-sky-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            urgent
              ? 'bg-gradient-to-br from-rose-300/30 via-orange-300/20 to-amber-300/20'
              : 'bg-gradient-to-br from-violet-300/30 via-indigo-300/20 to-sky-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              urgent ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-violet-200/60'
            }`}
          >
            <Sparkles
              className={urgent ? 'h-5 w-5 text-rose-600' : 'h-5 w-5 text-violet-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                urgent ? 'text-rose-700' : 'text-violet-700'
              }`}
            >
              Your day
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-neutral-800">
              {paragraphs.map((line, i) => (
                <span key={i} className={i === 0 ? 'font-semibold text-neutral-900' : ''}>
                  {i > 0 && ' '}
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
