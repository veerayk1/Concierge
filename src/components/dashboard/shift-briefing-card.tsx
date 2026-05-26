'use client';

/**
 * ShiftBriefingCard
 *
 * Front desk / security mirror of UX-144 ResidentBriefingCard — one
 * paragraph that ties together everything the staff member needs to
 * know at the start of their shift. Pulls from
 * /api/v1/staff/shift-briefing.
 *
 * Pulses (.conc-spotlight) when any active incidents or overdue
 * keys exist — those are the two signals that warrant immediate
 * attention before settling in.
 */

import { Sparkles } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface Briefing {
  paragraphs: string[];
  highlights: {
    activeIncidents: number;
    overdueKeys: number;
    agingPackages: number;
    perishablePackages: number;
    expectedVisitors: number;
    todaysBookings: number;
  };
}

export function ShiftBriefingCard() {
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: Briefing }>(
    apiUrl('/api/v1/staff/shift-briefing', { propertyId }),
  );

  const data: Briefing | null =
    response && 'data' in (response as object)
      ? (response as { data: Briefing }).data
      : (response as unknown as Briefing | null);
  if (!data) return null;

  const { paragraphs, highlights } = data;
  // Skip the card if the only content is the greeting + the quiet
  // fallback — same logic as the resident briefing.
  if (paragraphs.length <= 2 && paragraphs[1]?.startsWith('Floor is quiet')) return null;

  const urgent = highlights.activeIncidents > 0 || highlights.overdueKeys > 0;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '40ms' }}
      aria-label="Your shift briefing"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          urgent
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-sky-200 from-sky-50 via-white to-indigo-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            urgent
              ? 'bg-gradient-to-br from-rose-300/30 via-orange-300/20 to-amber-300/20'
              : 'bg-gradient-to-br from-sky-300/30 via-blue-300/20 to-indigo-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              urgent ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-sky-200/60'
            }`}
          >
            <Sparkles
              className={urgent ? 'h-5 w-5 text-rose-600' : 'h-5 w-5 text-sky-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                urgent ? 'text-rose-700' : 'text-sky-700'
              }`}
            >
              Your shift
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
