'use client';

/**
 * MyBookingsCard
 *
 * Resident view of their own upcoming amenity bookings with approval
 * status — answers "did the manager approve my BBQ booking?" without
 * a navigation. Pulses (.conc-spotlight) when anything still has
 * approvalStatus='pending' so the resident knows they're in the
 * queue and don't try to re-book the same slot.
 *
 * Closes the manager-side loop with UX-131 (DecisionQueueCard) —
 * the moment the manager taps "Approve" inline, this card flips on
 * the next dashboard refresh.
 */

import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Clock, PartyPopper, XCircle } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface Booking {
  id: string;
  referenceNumber: string;
  status: string;
  approvalStatus: string;
  startDate: string;
  startTime: string;
  endTime: string;
  amenity?: { id: string; name: string } | null;
  unit?: { id: string; number: string } | null;
}

function whenLabel(startDate: string, startTime: string): string {
  // Schema stores startDate as Date and startTime as Time(); both
  // arrive as ISO strings. We combine the date part of startDate with
  // the time part of startTime to render "Sat Mar 8 · 6:30 PM".
  const d = new Date(startDate);
  const t = new Date(startTime);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const timeStr = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, today)) return `Today · ${timeStr}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${timeStr}`;
  const sameYear = d.getFullYear() === today.getFullYear();
  const dateStr = sameYear
    ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr} · ${timeStr}`;
}

const STATUS_TONE: Record<string, { bg: string; ring: string; text: string; label: string }> = {
  pending: {
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
    label: 'Pending approval',
  },
  approved: {
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    text: 'text-emerald-700',
    label: 'Approved',
  },
  declined: {
    bg: 'bg-rose-50',
    ring: 'ring-rose-200',
    text: 'text-rose-700',
    label: 'Declined',
  },
};

export function MyBookingsCard() {
  const router = useRouter();
  const { data: response } = useApi<{ data: Booking[] }>(apiUrl('/api/v1/resident/bookings', {}));

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Booking[] }).data
      : (response as unknown as Booking[]) || [];

  // Only show upcoming (today or later) and not-cancelled bookings.
  const now = new Date();
  const upcoming = (all || []).filter((b) => {
    if (b.status === 'cancelled') return false;
    const d = new Date(b.startDate);
    return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  if (upcoming.length === 0) return null;

  // Sort by date ascending — soonest first.
  upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const anyPending = upcoming.some((b) => b.approvalStatus === 'pending');

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '240ms' }}
      aria-label="Your amenity bookings"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          anyPending
            ? 'conc-spotlight border-amber-200 from-amber-50 via-white to-yellow-50'
            : 'border-sky-200 from-sky-50 via-white to-cyan-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            anyPending
              ? 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
              : 'bg-gradient-to-br from-sky-300/30 via-blue-300/20 to-cyan-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              anyPending ? 'ring-1 ring-amber-200/60' : 'ring-1 ring-sky-200/60'
            }`}
          >
            <PartyPopper
              className={anyPending ? 'h-5 w-5 text-amber-600' : 'h-5 w-5 text-sky-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  anyPending ? 'text-amber-700' : 'text-sky-700'
                }`}
              >
                {anyPending ? 'Awaiting approval' : 'Your bookings'}
              </span>
              <span
                className={`text-[11.5px] ${anyPending ? 'text-amber-700/80' : 'text-sky-700/80'}`}
              >
                · {upcoming.length} upcoming
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {upcoming.slice(0, 3).map((b) => {
                const tone = STATUS_TONE[b.approvalStatus] ?? STATUS_TONE.pending!;
                const StatusIcon =
                  b.approvalStatus === 'approved'
                    ? CheckCircle2
                    : b.approvalStatus === 'declined'
                      ? XCircle
                      : Clock;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => router.push('/amenity-booking' as never)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-neutral-100/80 transition hover:bg-white"
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${tone.bg} ${tone.ring}`}
                      >
                        <StatusIcon className={`h-3.5 w-3.5 ${tone.text}`} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            {b.amenity?.name ?? 'Amenity'}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${tone.bg} ${tone.ring} ${tone.text}`}
                          >
                            {tone.label}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                          <Calendar className="h-2.5 w-2.5" />
                          {whenLabel(b.startDate, b.startTime)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {upcoming.length > 3 && (
              <button
                type="button"
                onClick={() => router.push('/amenity-booking' as never)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:text-sky-800"
              >
                See all {upcoming.length} bookings
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
