'use client';

/**
 * KeysOverdueCard
 *
 * Security guard surface: keys / FOBs issued to contractors,
 * cleaners, repair people that haven't been returned. Anything past
 * its expectedReturn (or 24h+ without an expectedReturn) shows up
 * here so the guard can chase the borrower before the key ends up
 * in the wrong pocket overnight.
 *
 * Pulses (.conc-spotlight) when anything is hard-overdue (past its
 * expectedReturn) — lost keys are the most expensive recurring
 * security cost in a small building.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, KeyRound, ShieldAlert } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface Checkout {
  id: string;
  checkedOutTo: string;
  company: string | null;
  reason: string;
  checkoutTime: string;
  expectedReturn: string | null;
  returnTime: string | null;
  key: { id: string; keyName: string; category: string; status: string } | null;
}

function hoursSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (3600 * 1000));
}

function whenLabel(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function KeysOverdueCard() {
  const router = useRouter();
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: Checkout[] }>(
    apiUrl('/api/v1/keys/checkouts', { propertyId, active: 'true' }),
  );

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Checkout[] }).data
      : (response as unknown as Checkout[]) || [];

  // "Overdue" = past expectedReturn, OR checked out >24h ago with no
  // expectedReturn set. Both are signals the borrower is unlikely to
  // walk it back to the desk unprompted.
  const now = Date.now();
  const overdue = (all || []).filter((c) => {
    if (c.returnTime) return false;
    if (c.expectedReturn) return new Date(c.expectedReturn).getTime() < now;
    return hoursSince(c.checkoutTime) >= 24;
  });
  if (overdue.length === 0) return null;

  // Sort oldest checkout first — longest-out gets attention first.
  overdue.sort((a, b) => new Date(a.checkoutTime).getTime() - new Date(b.checkoutTime).getTime());

  const hardOverdue = overdue.some(
    (c) => c.expectedReturn && new Date(c.expectedReturn).getTime() < now,
  );

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '90ms' }}
      aria-label="Keys not yet returned"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          hardOverdue
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-amber-200 from-amber-50 via-white to-orange-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            hardOverdue
              ? 'bg-gradient-to-br from-rose-300/30 via-amber-300/20 to-orange-300/20'
              : 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              hardOverdue ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-amber-200/60'
            }`}
          >
            {hardOverdue ? (
              <ShieldAlert className="h-5 w-5 text-rose-600" strokeWidth={1.8} />
            ) : (
              <KeyRound className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  hardOverdue ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {hardOverdue ? 'Chase these' : 'Still out'}
              </span>
              <span
                className={`text-[11.5px] ${hardOverdue ? 'text-rose-700/80' : 'text-amber-700/80'}`}
              >
                · {overdue.length} key{overdue.length === 1 ? '' : 's'} not returned
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {overdue.slice(0, 4).map((c) => {
                const hours = hoursSince(c.checkoutTime);
                const past = c.expectedReturn && new Date(c.expectedReturn).getTime() < now;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/keys` as never)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-amber-100/60 transition hover:bg-white hover:ring-amber-200"
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${
                          past ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50 ring-amber-200'
                        }`}
                      >
                        <KeyRound
                          className={`h-3.5 w-3.5 ${past ? 'text-rose-600' : 'text-amber-700'}`}
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            {c.key?.keyName ?? 'Key'} · {c.checkedOutTo}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                              past
                                ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                : 'bg-amber-50 text-amber-700 ring-amber-200'
                            }`}
                          >
                            {whenLabel(hours)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                          <Clock className="h-2.5 w-2.5" />
                          {c.company && <span>{c.company} · </span>}
                          <span className="truncate text-neutral-500">{c.reason}</span>
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {overdue.length > 4 && (
              <button
                type="button"
                onClick={() => router.push('/keys' as never)}
                className={`mt-1 inline-flex items-center gap-1 text-[12px] font-semibold ${
                  hardOverdue
                    ? 'text-rose-700 hover:text-rose-800'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                See all {overdue.length}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
