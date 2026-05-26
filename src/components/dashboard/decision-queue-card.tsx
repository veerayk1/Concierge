'use client';

/**
 * DecisionQueueCard
 *
 * Property manager's morning surface: every alteration / booking /
 * urgent maintenance request that's waiting on a decision, in one
 * list. Replaces the manager's previous "open three tabs to find what
 * needs me" routine with one card and a button per row.
 *
 * Rows that are safe to approve in one tap (amenity bookings) show
 * an inline "Approve" — everything else routes to its detail page
 * with an "Open it" link, because alterations and maintenance have
 * real review steps that can't be collapsed.
 *
 * Self-hides when the queue is empty; pulses (.conc-spotlight) when
 * any item has been waiting > 24 hours, so a queue that's accruing
 * stale work is impossible to scroll past.
 */

import { useState } from 'react';
import { ArrowRight, Check, ClipboardList, Clock, Hammer, PartyPopper, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface DecisionItem {
  id: string;
  type: 'alteration' | 'booking' | 'maintenance';
  title: string;
  subtitle: string | null;
  unitNumber: string | null;
  who: string | null;
  waitingSince: string;
  hoursWaiting: number;
  href: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approveAction: {
    method: 'PATCH';
    url: string;
    approveBody: Record<string, unknown>;
  } | null;
}

const TYPE_TONE: Record<
  DecisionItem['type'],
  { icon: typeof ClipboardList; bg: string; ring: string; text: string }
> = {
  alteration: {
    icon: Hammer,
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    text: 'text-violet-700',
  },
  booking: {
    icon: PartyPopper,
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    text: 'text-sky-700',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
  },
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
  high: 'bg-amber-50 text-amber-700 ring-amber-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  low: 'bg-neutral-50 text-neutral-700 ring-neutral-200',
};

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const tok = localStorage.getItem('auth_token');
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    const demoRole = localStorage.getItem('demo_role');
    if (demoRole) h['x-demo-role'] = demoRole;
  }
  return h;
}

function waitingLabel(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function DecisionQueueCard() {
  const router = useRouter();
  const propertyId = getPropertyId();
  const { data: response, refetch } = useApi<{ data: DecisionItem[] }>(
    apiUrl('/api/v1/manager/decisions', { propertyId }),
  );
  const [acting, setActing] = useState<string | null>(null);

  const rawRows =
    response && 'data' in (response as object)
      ? (response as { data: DecisionItem[] }).data
      : (response as unknown as DecisionItem[]) || [];

  // Same test-seed filter used across the portal — CHAIN-*, UI-CHAIN,
  // E2E, SEC, EXH, TEST title prefixes are demo fixtures, not real
  // resident requests, and they shouldn't be cluttering a manager's
  // morning decision queue.
  const TEST_TITLE_PATTERN =
    /^(CHAIN[- ]?[A-Z]|UI[- ]?CHAIN[- ]?[A-Z]|E2E[- ]|SEC[- ]\d|EXH[- ]?[A-Z]?|TEST[- ]|UI-?H[- ]?\d)/i;
  const rows = (rawRows || []).filter((r) => !TEST_TITLE_PATTERN.test(r.title?.trim() ?? ''));

  if (!rows || rows.length === 0) return null;

  // Sort: urgent priority first, then by how long they've been waiting
  // (oldest at the top). The manager's first scan should land on the
  // thing that's both important AND oldest, not whatever the API
  // happened to return first.
  const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  rows.sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 4;
    const pb = PRIORITY_RANK[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    return b.hoursWaiting - a.hoursWaiting;
  });

  const stale = rows.some((r) => r.hoursWaiting >= 24);

  async function approve(item: DecisionItem) {
    if (!item.approveAction) return;
    setActing(item.id);
    try {
      await fetch(item.approveAction.url, {
        method: item.approveAction.method,
        headers: authHeaders(),
        body: JSON.stringify(item.approveAction.approveBody),
      });
      refetch?.();
    } finally {
      setActing(null);
    }
  }

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '60ms' }}
      aria-label="Decisions waiting on you"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          stale
            ? 'conc-spotlight border-amber-300 from-amber-50 via-white to-orange-50'
            : 'border-violet-200 from-violet-50 via-white to-sky-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            stale
              ? 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-rose-300/20'
              : 'bg-gradient-to-br from-violet-300/30 via-indigo-300/20 to-sky-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              stale ? 'ring-1 ring-amber-200/60' : 'ring-1 ring-violet-200/60'
            }`}
          >
            <ClipboardList
              className={stale ? 'h-5 w-5 text-amber-600' : 'h-5 w-5 text-violet-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  stale ? 'text-amber-700' : 'text-violet-700'
                }`}
              >
                {stale ? 'Backed up' : 'On your desk'}
              </span>
              <span
                className={`text-[11.5px] ${stale ? 'text-amber-700/80' : 'text-violet-700/80'}`}
              >
                · {rows.length} decision{rows.length === 1 ? '' : 's'} waiting
              </span>
            </div>

            <ul className="mt-2.5 flex flex-col gap-1.5">
              {rows.slice(0, 6).map((item) => {
                const tone = TYPE_TONE[item.type];
                const Icon = tone.icon;
                const busy = acting === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-neutral-100/80 backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(item.href as never)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${tone.bg} ${tone.ring}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${tone.text}`} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            {item.title}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase ring-1 ${PRIORITY_TONE[item.priority]}`}
                          >
                            {item.priority}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                          {item.unitNumber && <span>Unit {item.unitNumber}</span>}
                          {item.subtitle && (
                            <span className="truncate text-neutral-500">· {item.subtitle}</span>
                          )}
                          <span className="ml-auto inline-flex items-center gap-1 text-neutral-500">
                            <Clock className="h-2.5 w-2.5" />
                            {waitingLabel(item.hoursWaiting)} ago
                          </span>
                        </span>
                      </span>
                    </button>
                    {item.approveAction ? (
                      <button
                        type="button"
                        onClick={() => approve(item)}
                        disabled={busy}
                        className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {busy ? 'Approving…' : 'Approve'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(item.href as never)}
                        className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-neutral-700 ring-1 ring-neutral-200 transition hover:bg-white hover:ring-neutral-300"
                      >
                        Open it
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {rows.length > 6 && (
              <p className="mt-2 text-[12px] text-neutral-500">
                + {rows.length - 6} more in the queue.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
