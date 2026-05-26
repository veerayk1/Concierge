'use client';

/**
 * TodaysScheduleCard
 *
 * Manager / front desk view of every confirmed amenity booking
 * happening today, in chronological order. Lets staff stay ahead of
 * "the elevator's on hold from 9–11 for unit 802's move-in",
 * "the party room is locked off all afternoon for unit 304", "BBQ
 * area is booked back-to-back from 5pm".
 *
 * Pulls from the existing GET /api/v1/bookings with a today-window
 * filter on the client. Pending-approval rows are excluded — those
 * live on UX-131 DecisionQueueCard; this card is "what's actually
 * happening today" not "what might be."
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface Booking {
  id: string;
  status: string;
  approvalStatus: string;
  startDate: string;
  startTime: string;
  endTime: string;
  amenity?: { id: string; name: string } | null;
  unit?: { id: string; number: string } | null;
}

function timeOnly(iso: string): string {
  // startTime arrives from Postgres TIME() as 'YYYY-MM-DDTHH:MM:SS.000Z'.
  // Parse the HH:MM substring as wall-clock — don't let `new Date()`
  // shift it through the viewer's local timezone (a booking saved
  // at 10am should display as 10am for everyone).
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return iso;
  let h = parseInt(m[1]!, 10);
  const mm = m[2]!;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function isToday(iso: string): boolean {
  // startDate arrives as 'YYYY-MM-DDT00:00:00.000Z' from Postgres DATE.
  // We want the property's wall-clock day (treat the slug as a
  // calendar day, ignoring TZ). Compare the YYYY-MM-DD slug against
  // the viewer's local YYYY-MM-DD.
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayLocal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  return iso.slice(0, 10) === todayLocal;
}

const COUNT_AS_HAPPENING = new Set(['approved', 'confirmed', 'completed']);

export function TodaysScheduleCard() {
  const propertyId = getPropertyId();
  const router = useRouter();
  const { data: response } = useApi<{ data: Booking[] }>(
    apiUrl('/api/v1/bookings', { propertyId, pageSize: '100' }),
  );

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Booking[] }).data
      : (response as unknown as Booking[]) || [];

  const today = (all || []).filter(
    (b) =>
      isToday(b.startDate) &&
      COUNT_AS_HAPPENING.has(b.status) &&
      b.approvalStatus !== 'declined' &&
      b.approvalStatus !== 'pending',
  );
  if (today.length === 0) return null;

  // Earliest first.
  today.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Highlight any booking that's currently in progress.
  const now = Date.now();
  const isInProgress = (b: Booking) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return start <= now && now <= end;
  };

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '160ms' }}
      aria-label="Today's amenity schedule"
    >
      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-5 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-sky-300/30 via-blue-300/20 to-cyan-300/20 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-sky-200/60 backdrop-blur-sm">
            <CalendarDays className="h-5 w-5 text-sky-600" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-sky-700 uppercase">
                Today on the property
              </span>
              <span className="text-[11.5px] text-sky-700/80">
                · {today.length} confirmed booking{today.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {today.slice(0, 6).map((b) => {
                const active = isInProgress(b);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => router.push('/amenity-booking' as never)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition ${
                        active
                          ? 'bg-emerald-50 ring-1 ring-emerald-200 hover:bg-emerald-100'
                          : 'hover:bg-white/70 hover:ring-1 hover:ring-sky-200'
                      }`}
                    >
                      <span
                        className={`flex h-9 flex-shrink-0 flex-col items-center justify-center rounded-lg px-2 py-0.5 text-center ring-1 ${
                          active
                            ? 'bg-emerald-100 text-emerald-800 ring-emerald-300'
                            : 'bg-sky-50 text-sky-800 ring-sky-200'
                        }`}
                      >
                        <span className="text-[11.5px] leading-none font-bold">
                          {timeOnly(b.startTime).replace(/\s*(AM|PM)/i, '')}
                        </span>
                        <span className="text-[8.5px] font-semibold tracking-[0.06em] uppercase">
                          {timeOnly(b.startTime).match(/AM|PM/i)?.[0]?.toLowerCase()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            {b.amenity?.name ?? 'Amenity'}
                          </span>
                          {active && (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-emerald-800 uppercase ring-1 ring-emerald-300">
                              Live now
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                          <Clock className="h-2.5 w-2.5" />
                          {timeOnly(b.startTime)} – {timeOnly(b.endTime)}
                          {b.unit && (
                            <span className="text-neutral-500">· Unit {b.unit.number}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {today.length > 6 && (
              <button
                type="button"
                onClick={() => router.push('/amenity-booking' as never)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:text-sky-800"
              >
                See all {today.length} today
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
