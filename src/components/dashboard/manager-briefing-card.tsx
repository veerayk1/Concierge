'use client';

/**
 * ManagerBriefingCard
 *
 * Property admin / board / manager mirror of UX-144 and UX-145 — one
 * paragraph that ties together the day's governance signals: vendor
 * compliance gaps, stalled decisions in the queue, urgent unassigned
 * maintenance, recent move-ins to acknowledge.
 *
 * Pulses when there are at-risk vendors or stalled decisions — both
 * are situations where the manager's inattention compounds risk.
 */

import { Sparkles } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface Briefing {
  paragraphs: string[];
  highlights: {
    atRiskVendors: number;
    stalledAlterations: number;
    stalledBookings: number;
    urgentUnassignedMaintenance: number;
    recentMoveIns: number;
  };
}

export function ManagerBriefingCard() {
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: Briefing }>(
    apiUrl('/api/v1/manager/briefing', { propertyId }),
  );

  const data: Briefing | null =
    response && 'data' in (response as object)
      ? (response as { data: Briefing }).data
      : (response as unknown as Briefing | null);
  if (!data) return null;

  const { paragraphs, highlights } = data;
  if (paragraphs.length <= 2 && paragraphs[1]?.startsWith('The building is running cleanly'))
    return null;

  const urgent =
    highlights.atRiskVendors > 0 ||
    highlights.stalledAlterations + highlights.stalledBookings > 0 ||
    highlights.urgentUnassignedMaintenance > 0;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '40ms' }}
      aria-label="Manager briefing"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          urgent
            ? 'conc-spotlight border-amber-200 from-amber-50 via-white to-orange-50'
            : 'border-violet-200 from-violet-50 via-white to-indigo-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            urgent
              ? 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
              : 'bg-gradient-to-br from-violet-300/30 via-indigo-300/20 to-sky-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              urgent ? 'ring-1 ring-amber-200/60' : 'ring-1 ring-violet-200/60'
            }`}
          >
            <Sparkles
              className={urgent ? 'h-5 w-5 text-amber-600' : 'h-5 w-5 text-violet-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                urgent ? 'text-amber-700' : 'text-violet-700'
              }`}
            >
              Your morning
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
