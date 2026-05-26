'use client';

/**
 * MyExpectingCard (resident-side mirror of ExpectedVisitorsCard)
 *
 * Closes the loop on the resident's "Expecting someone?" tile — once
 * they schedule a guest, they need to see that the schedule is locked
 * in. Without this card, a resident who scheduled their plumber for
 * tomorrow has no way to know it actually happened, no way to spot a
 * typo in the time, and no way to remember they have a guest coming.
 *
 * Hides when there's nothing scheduled in the next 7 days.
 */

import { CalendarClock, Clock, Users } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface MyVisitor {
  id: string;
  visitorName: string;
  visitorType: string;
  arrivalAt: string;
  departureAt: string | null;
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
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const time = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isSameDay(t, today)) return `Today at ${time}`;
  if (isSameDay(t, tomorrow)) return `Tomorrow at ${time}`;
  return `${t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

export function MyExpectingCard() {
  const { data: response } = useApi<{ data: MyVisitor[] }>(
    apiUrl('/api/v1/my/visitors', { status: 'expected' }),
  );

  const rows =
    response && 'data' in (response as object)
      ? (response as { data: MyVisitor[] }).data
      : (response as unknown as MyVisitor[]) || [];

  // Only show visitors arriving in the next 7 days — anything farther
  // out lives on a dedicated /residents/visitors page when we build it.
  const upcoming = rows.filter((r) => {
    const t = new Date(r.arrivalAt).getTime();
    return t - Date.now() < 7 * 24 * 60 * 60 * 1000;
  });
  if (upcoming.length === 0) return null;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '180ms' }}
      aria-label="Your expected visitors"
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
                You're expecting
              </span>
              <span className="text-[11.5px] text-sky-700/80">
                · {upcoming.length} pre-authorized
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {upcoming.slice(0, 5).map((v) => (
                <li
                  key={v.id}
                  className="flex items-start gap-2 rounded-lg px-1 py-1 text-[13.5px] leading-relaxed text-neutral-800"
                >
                  <Users className="mt-0.5 h-3 w-3 flex-shrink-0 text-sky-500" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-neutral-900">{v.visitorName}</span>
                    <span className="text-neutral-500">
                      {' · '}
                      {TYPE_LABEL[v.visitorType] ?? 'Guest'}
                    </span>
                    <span className="ml-1 inline-flex items-center gap-1 text-[12px] text-sky-700">
                      <Clock className="h-2.5 w-2.5" />
                      {whenLabel(v.arrivalAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {upcoming.length > 5 && (
              <p className="mt-1 text-[12px] text-neutral-500">
                + {upcoming.length - 5} more later this week
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
