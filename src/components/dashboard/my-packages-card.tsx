'use client';

/**
 * MyPackagesCard
 *
 * Resident gets a "your package has arrived" notification but has to
 * dig into /my-packages to find out which courier, when it landed,
 * or what reference number to give the desk. This card surfaces those
 * details inline so the resident can swing by the desk on their way
 * out without opening another page.
 *
 * Pulses (.conc-spotlight) when anything is marked perishable —
 * groceries / pharmacy items left at the desk too long is the single
 * worst package failure mode.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Package, Snowflake } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface Pkg {
  id: string;
  referenceNumber: string;
  status: string;
  description: string | null;
  trackingNumber: string | null;
  isPerishable: boolean;
  createdAt: string;
  courier: { id: string; name: string; slug?: string | null } | null;
}

function whenLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function MyPackagesCard() {
  const router = useRouter();
  const { data: response } = useApi<{ data: Pkg[] }>(
    apiUrl('/api/v1/resident/packages', { status: 'awaiting_pickup' }),
  );

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Pkg[] }).data
      : (response as unknown as Pkg[]) || [];

  // Some seed data uses "received" / "pending" rather than the
  // canonical "awaiting_pickup". Treat anything not-yet-released as
  // awaiting so the card stays honest.
  const RELEASED = new Set(['released', 'returned', 'cancelled']);
  const waiting = (all || []).filter((p) => !RELEASED.has(p.status));
  if (waiting.length === 0) return null;

  const anyPerishable = waiting.some((p) => p.isPerishable);

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '270ms' }}
      aria-label="Your packages waiting at the desk"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          anyPerishable
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-amber-200 from-amber-50 via-white to-orange-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            anyPerishable
              ? 'bg-gradient-to-br from-rose-300/30 via-orange-300/20 to-amber-300/20'
              : 'bg-gradient-to-br from-amber-300/30 via-orange-300/20 to-yellow-300/20'
          }`}
        />
        <div className="relative flex items-start gap-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-sm ${
              anyPerishable ? 'ring-1 ring-rose-200/60' : 'ring-1 ring-amber-200/60'
            }`}
          >
            <Package
              className={anyPerishable ? 'h-5 w-5 text-rose-600' : 'h-5 w-5 text-amber-600'}
              strokeWidth={1.8}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                  anyPerishable ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {anyPerishable ? 'Pick up soon' : 'At the desk'}
              </span>
              <span
                className={`text-[11.5px] ${anyPerishable ? 'text-rose-700/80' : 'text-amber-700/80'}`}
              >
                · {waiting.length} package{waiting.length === 1 ? '' : 's'} waiting
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {waiting.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/my-packages` as never)}
                    className="flex w-full items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-amber-100/60 transition hover:bg-white hover:ring-amber-200"
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${
                        p.isPerishable ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50 ring-amber-200'
                      }`}
                    >
                      {p.isPerishable ? (
                        <Snowflake className="h-3.5 w-3.5 text-rose-600" strokeWidth={1.8} />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-amber-700" strokeWidth={1.8} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                          {p.courier?.name ?? 'Package'}
                          {p.referenceNumber && (
                            <span className="ml-1.5 font-mono text-[11px] font-medium text-neutral-500">
                              #{p.referenceNumber}
                            </span>
                          )}
                        </span>
                        {p.isPerishable && (
                          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-rose-700 uppercase ring-1 ring-rose-200">
                            Perishable
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
                        <Clock className="h-2.5 w-2.5" />
                        Arrived {whenLabel(p.createdAt)}
                        {p.description && (
                          <span className="truncate text-neutral-500"> · {p.description}</span>
                        )}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                  </button>
                </li>
              ))}
            </ul>
            {waiting.length > 3 && (
              <button
                type="button"
                onClick={() => router.push('/my-packages' as never)}
                className={`mt-1 inline-flex items-center gap-1 text-[12px] font-semibold ${
                  anyPerishable
                    ? 'text-rose-700 hover:text-rose-800'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                See all {waiting.length}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
