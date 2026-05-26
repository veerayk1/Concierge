'use client';

/**
 * ExpectedVisitorsCard
 *
 * "Resident 1204 has a plumber coming at 9am." The concierge sees a
 * pre-authorized visitor at the top of their dashboard, with one tap
 * to check them in when they walk through the door. Skips the whole
 * sign-in dialog because the resident already filled out the name,
 * unit, and visitor type when they scheduled.
 *
 * Hides itself when there's nothing expected — the front desk doesn't
 * need a "no expected visitors" card on a quiet Tuesday.
 */

import { useState } from 'react';
import { CalendarClock, Check, Clock, Users } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface ExpectedVisitor {
  id: string;
  visitorName: string;
  visitorType: string;
  arrivalAt: string; // expected, stored in arrivalAt
  unit: { id: string; number: string } | null;
  comments: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  visitor: 'Guest',
  contractor: 'Contractor',
  delivery_person: 'Delivery',
  real_estate_agent: 'Realtor',
  emergency_service: 'Emergency',
  other: 'Other',
};

function whenLabel(iso: string): string {
  const t = new Date(iso);
  const today = new Date();
  const sameDay = t.toDateString() === today.toDateString();
  const time = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return time;
  return `${t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`;
}

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

export function ExpectedVisitorsCard() {
  const propertyId = getPropertyId();
  const { data: response, refetch } = useApi<{ data: ExpectedVisitor[] }>(
    apiUrl('/api/v1/visitors', { propertyId, status: 'expected' }),
  );
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const rows =
    response && 'data' in (response as object)
      ? (response as { data: ExpectedVisitor[] }).data
      : (response as unknown as ExpectedVisitor[]) || [];

  // Today + tomorrow window. Pre-prepping a contractor badge for the
  // 8am arrival the next morning is the desk's evening ritual, so
  // tomorrow needs to be visible too — anything beyond gets the
  // /visitors list page.
  const now = Date.now();
  const within48h = rows.filter((r) => {
    const ts = new Date(r.arrivalAt).getTime();
    return ts > now - 60 * 60 * 1000 && ts - now < 48 * 60 * 60 * 1000;
  });
  if (within48h.length === 0) return null;

  // Partition into "today" (local-day match) and "tomorrow" so the
  // section reads as two short lists, not one long one. Today first,
  // each section sorted earliest-arrival-first.
  const todayKey = new Date().toDateString();
  const tomorrowKey = new Date(now + 24 * 60 * 60 * 1000).toDateString();
  const todayList = within48h
    .filter((v) => new Date(v.arrivalAt).toDateString() === todayKey)
    .sort((a, b) => new Date(a.arrivalAt).getTime() - new Date(b.arrivalAt).getTime());
  const tomorrowList = within48h
    .filter((v) => new Date(v.arrivalAt).toDateString() === tomorrowKey)
    .sort((a, b) => new Date(a.arrivalAt).getTime() - new Date(b.arrivalAt).getTime());

  async function checkIn(id: string) {
    setCheckingIn(id);
    try {
      await fetch(`/api/v1/visitors/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'check_in' }),
      });
      refetch?.();
    } finally {
      setCheckingIn(null);
    }
  }

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '120ms' }}
      aria-label="Expected visitors"
    >
      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-5 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-sky-300/30 via-blue-300/20 to-indigo-300/20 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-sky-200/60 backdrop-blur-sm">
            <CalendarClock className="h-5 w-5 text-sky-600" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-sky-700 uppercase">
                Expected
              </span>
              <span className="text-[11.5px] text-sky-700/80">
                · {todayList.length} today
                {tomorrowList.length > 0 ? ` · ${tomorrowList.length} tomorrow` : ''}
              </span>
            </div>
            {todayList.length > 0 && (
              <>
                {tomorrowList.length > 0 && (
                  <p className="mt-2.5 text-[10px] font-semibold tracking-[0.08em] text-sky-700 uppercase">
                    Today
                  </p>
                )}
                <ul
                  className={`flex flex-col gap-2 ${tomorrowList.length > 0 ? 'mt-1.5' : 'mt-2.5'}`}
                >
                  {todayList.slice(0, 6).map((v) => {
                    const busy = checkingIn === v.id;
                    return (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-3 py-2 ring-1 ring-sky-100/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-neutral-900">
                            {v.visitorName}
                          </p>
                          <p className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                            <Users className="h-3 w-3" />
                            {TYPE_LABEL[v.visitorType] ?? 'Guest'}
                            {v.unit && <span> · Unit {v.unit.number}</span>}
                            <span className="ml-1 inline-flex items-center gap-0.5 text-sky-700">
                              <Clock className="h-2.5 w-2.5" />
                              {whenLabel(v.arrivalAt)}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => checkIn(v.id)}
                          disabled={busy}
                          className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {busy ? 'Checking in…' : 'Arrived'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {tomorrowList.length > 0 && (
              <>
                <p className="mt-3 text-[10px] font-semibold tracking-[0.08em] text-sky-700/70 uppercase">
                  Tomorrow · prep badges
                </p>
                {/* Tomorrow's list reads as a roster — no check-in
                    button since they're not here yet. Eight max to
                    keep the card glanceable. */}
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {tomorrowList.slice(0, 8).map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-3 rounded-xl bg-white/40 px-3 py-1.5 ring-1 ring-sky-100/40"
                    >
                      <span className="min-w-[3.25rem] text-[12px] font-semibold text-sky-700">
                        {whenLabel(v.arrivalAt)}
                      </span>
                      <span className="truncate text-[13px] text-neutral-800">{v.visitorName}</span>
                      <span className="ml-auto text-[11.5px] text-neutral-500">
                        {TYPE_LABEL[v.visitorType] ?? 'Guest'}
                        {v.unit && ` · Unit ${v.unit.number}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
