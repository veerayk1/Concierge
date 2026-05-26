'use client';

/**
 * ActiveIncidentsCard
 *
 * Manager / supervisor / admin view: "what happened on the floor in
 * the last 24 hours that you need to know about." Pulled from
 * /api/v1/incidents/active — urgent+high anything, plus everything
 * still open. Pulses (.conc-spotlight) when there's anything urgent.
 *
 * Hides itself when the list is empty — no point shouting "all clear"
 * on a quiet morning. A separate AllClear state lives on the dashboard
 * itself if we ever decide we want that.
 */

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface IncidentRow {
  id: string;
  title: string | null;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  createdAt: string;
  unit: { id: string; number: string } | null;
  category: string;
}

const PRIORITY_TONE: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
  high: 'bg-amber-50 text-amber-700 ring-amber-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  low: 'bg-neutral-50 text-neutral-700 ring-neutral-200',
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

export function ActiveIncidentsCard() {
  const router = useRouter();
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: IncidentRow[] }>(
    apiUrl('/api/v1/incidents/active', { propertyId }),
  );

  const rawRows =
    response && 'data' in (response as object)
      ? (response as { data: IncidentRow[] }).data
      : (response as unknown as IncidentRow[]) || [];

  // Same test-seed filter as the residents directory and incidents
  // page — keep CHAIN/E2E/UI-CHAIN fixtures out of the manager's
  // "Needs your attention" rail so it reads like a real building.
  const TEST_TITLE_PATTERN =
    /^(CHAIN[- ]?[A-Z]|UI[- ]?CHAIN[- ]?[A-Z]|E2E[- ]|SEC[- ]\d|EXH[- ]?[A-Z]?|TEST[- ]|UI-?H[- ]?\d)/i;
  const rows = (rawRows || []).filter((r) => !TEST_TITLE_PATTERN.test(r.title?.trim() ?? ''));

  if (!rows || rows.length === 0) return null;

  const hasUrgent = rows.some((r) => r.priority === 'urgent');

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '90ms' }}
      aria-label="Active incidents from the last 24 hours"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          hasUrgent
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-amber-200 from-amber-50 via-white to-orange-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            hasUrgent
              ? 'bg-gradient-to-br from-rose-300/30 via-red-300/20 to-amber-300/20'
              : 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              hasUrgent ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-amber-200/60'
            }`}
          >
            <AlertTriangle
              className={hasUrgent ? 'h-5 w-5 text-rose-600' : 'h-5 w-5 text-amber-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  hasUrgent ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {hasUrgent ? 'Needs your attention' : 'On the floor'}
              </span>
              <span
                className={`text-[11.5px] ${hasUrgent ? 'text-rose-700/80' : 'text-amber-700/80'}`}
              >
                · {rows.length} incident{rows.length === 1 ? '' : 's'} in the last 24 hours
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {rows.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/events/${r.id}` as never)}
                    className="group flex w-full items-start gap-2 rounded-lg px-1 py-0.5 text-left text-[13.5px] leading-relaxed text-neutral-800 hover:bg-white/50"
                  >
                    <span
                      className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase ring-1 ${PRIORITY_TONE[r.priority] ?? PRIORITY_TONE.medium}`}
                    >
                      {r.priority}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-neutral-900">{r.title}</span>
                      {r.unit && <span className="text-neutral-500"> · Unit {r.unit.number}</span>}
                      <span className="ml-1.5 inline-flex items-center gap-1 text-[11.5px] text-neutral-500">
                        <Clock className="h-2.5 w-2.5" />
                        {relativeTime(r.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {rows.length > 5 && (
              <button
                type="button"
                onClick={() => router.push('/security/incidents' as never)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-rose-700 hover:text-rose-800"
              >
                View all {rows.length}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
