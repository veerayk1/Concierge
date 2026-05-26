'use client';

/**
 * AgingShelfCard
 *
 * Front-desk surface: how many packages have been sitting on the
 * shelf longer than a week and risk being forgotten. The oldest ones
 * surface inline so the desk can either remind the resident with
 * one tap into the package detail page, or pull them aside for the
 * supervisor's attention.
 *
 * Pulses (.conc-spotlight) when anything is >14 days old.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Inbox, Snowflake } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface Pkg {
  id: string;
  referenceNumber: string;
  status: string;
  description: string | null;
  isPerishable: boolean;
  createdAt: string;
  unit: { id: string; number: string } | null;
  courier: { id: string; name: string } | null;
}

const NOT_WAITING = new Set(['released', 'returned', 'cancelled']);

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function AgingShelfCard() {
  const router = useRouter();
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: Pkg[] }>(
    apiUrl('/api/v1/packages', { propertyId, pageSize: '100' }),
  );

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Pkg[] }).data
      : (response as unknown as Pkg[]) || [];

  // 7+ day unreleased packages — the actually-stale shelf.
  const aging = (all || [])
    .filter((p) => !NOT_WAITING.has(p.status) && daysAgo(p.createdAt) >= 7)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (aging.length === 0) return null;

  const veryStale = aging.some((p) => daysAgo(p.createdAt) >= 14);

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '150ms' }}
      aria-label="Packages aging on the shelf"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          veryStale
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-amber-200 from-amber-50 via-white to-orange-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            veryStale
              ? 'bg-gradient-to-br from-rose-300/30 via-amber-300/20 to-orange-300/20'
              : 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              veryStale ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-amber-200/60'
            }`}
          >
            <Inbox
              className={veryStale ? 'h-5 w-5 text-rose-600' : 'h-5 w-5 text-amber-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  veryStale ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {veryStale ? 'Aging out' : 'On the shelf'}
              </span>
              <span
                className={`text-[11.5px] ${veryStale ? 'text-rose-700/80' : 'text-amber-700/80'}`}
              >
                · {aging.length} package{aging.length === 1 ? '' : 's'} 7+ days old
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {aging.slice(0, 4).map((p) => {
                const days = daysAgo(p.createdAt);
                const tooOld = days >= 14;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/packages/${p.id}` as never)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-amber-100/60 transition hover:bg-white hover:ring-amber-200"
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${
                          p.isPerishable
                            ? 'bg-rose-50 ring-rose-200'
                            : tooOld
                              ? 'bg-rose-50 ring-rose-200'
                              : 'bg-amber-50 ring-amber-200'
                        }`}
                      >
                        {p.isPerishable ? (
                          <Snowflake className="h-3.5 w-3.5 text-rose-600" strokeWidth={1.8} />
                        ) : (
                          <Inbox
                            className={`h-3.5 w-3.5 ${tooOld ? 'text-rose-600' : 'text-amber-700'}`}
                            strokeWidth={1.8}
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            Unit {p.unit?.number ?? '—'} ·{' '}
                            <span className="font-normal text-neutral-700">
                              {p.courier?.name ?? 'Package'}
                            </span>
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                              tooOld
                                ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                : 'bg-amber-50 text-amber-700 ring-amber-200'
                            }`}
                          >
                            {days}d
                          </span>
                          {p.isPerishable && (
                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-rose-700 uppercase ring-1 ring-rose-200">
                              Perishable
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                          <Clock className="h-2.5 w-2.5" />#{p.referenceNumber}
                          {p.description && (
                            <span className="truncate text-neutral-500"> · {p.description}</span>
                          )}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {aging.length > 4 && (
              <button
                type="button"
                onClick={() => router.push('/packages' as never)}
                className={`mt-1 inline-flex items-center gap-1 text-[12px] font-semibold ${
                  veryStale
                    ? 'text-rose-700 hover:text-rose-800'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                See all {aging.length}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
