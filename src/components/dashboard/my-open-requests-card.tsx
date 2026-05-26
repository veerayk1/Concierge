'use client';

/**
 * MyOpenRequestsCard
 *
 * Resident's daily question: "what's happening with the leak I
 * reported?" Today the only way to find out is open /my-requests and
 * scan the table. This card surfaces the 1–3 most recent open service
 * requests inline on the dashboard with status + last update, and a
 * direct jump into each detail page.
 *
 * Self-hides when nothing is open — no point telling a happy resident
 * that they have zero open requests.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Loader2, PauseCircle, Wrench } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface Req {
  id: string;
  referenceNumber: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'on_hold' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  unitNumber: string | null;
}

const STATUS_TONE: Record<
  string,
  { icon: typeof Wrench; bg: string; ring: string; text: string; label: string }
> = {
  open: {
    icon: Wrench,
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    text: 'text-amber-700',
    label: 'Open',
  },
  in_progress: {
    icon: Loader2,
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    text: 'text-sky-700',
    label: 'In progress',
  },
  on_hold: {
    icon: PauseCircle,
    bg: 'bg-neutral-50',
    ring: 'ring-neutral-200',
    text: 'text-neutral-700',
    label: 'On hold',
  },
  closed: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    text: 'text-emerald-700',
    label: 'Closed',
  },
};

function whenLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MyOpenRequestsCard() {
  const router = useRouter();
  const { data: response } = useApi<{ data: Req[] }>(apiUrl('/api/v1/resident/maintenance', {}));

  const all =
    response && 'data' in (response as object)
      ? (response as { data: Req[] }).data
      : (response as unknown as Req[]) || [];

  // Filter to anything not yet done. Real-world seed data uses both
  // 'closed' and 'resolved' as terminal states, so exclude both.
  const TERMINAL = new Set(['closed', 'resolved', 'cancelled', 'completed']);
  const open = (all || []).filter((r) => !TERMINAL.has(r.status));
  if (open.length === 0) return null;

  // Sort: in_progress first (most active), then on_hold, then open;
  // within each status, most-recently-updated first.
  const statusRank: Record<string, number> = { in_progress: 0, on_hold: 1, open: 2 };
  open.sort((a, b) => {
    const r = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
    if (r !== 0) return r;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '210ms' }}
      aria-label="Your open service requests"
    >
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300/30 via-teal-300/20 to-sky-300/20 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-emerald-200/60 backdrop-blur-sm">
            <Wrench className="h-5 w-5 text-emerald-600" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-emerald-700 uppercase">
                On your list
              </span>
              <span className="text-[11.5px] text-emerald-700/80">
                · {open.length} open request{open.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {open.slice(0, 3).map((r) => {
                const tone = STATUS_TONE[r.status] ?? STATUS_TONE.open!;
                const Icon = tone.icon;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/my-requests/${r.id}` as never)}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2 text-left ring-1 ring-emerald-100/60 transition hover:bg-white hover:ring-emerald-200"
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${tone.bg} ${tone.ring}`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${tone.text} ${r.status === 'in_progress' ? 'animate-spin' : ''}`}
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold text-neutral-900">
                            {r.title}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${tone.bg} ${tone.ring} ${tone.text}`}
                          >
                            {tone.label}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-500">
                          <Clock className="h-2.5 w-2.5" />
                          Updated {whenLabel(r.updatedAt)}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {open.length > 3 && (
              <button
                type="button"
                onClick={() => router.push('/my-requests' as never)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                See all {open.length}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
