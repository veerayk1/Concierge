'use client';

/**
 * GovernanceSnapshotCard
 *
 * Property admin / board member surface: the four numbers that
 * actually answer "how is the building doing today?" — occupancy,
 * vendor compliance health, outstanding amenity fees, recent move
 * activity. Replaces the "open 4 raw tables on a Monday" routine.
 *
 * Pulses (.conc-spotlight) when vendor risk is non-zero, because a
 * vendor with expired insurance walking on site is the single thing
 * that bankrupts a small board.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, DollarSign, ShieldAlert, Users } from 'lucide-react';

import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface GovernanceData {
  occupancy: { totalUnits: number; occupiedUnits: number; vacantUnits: number; percent: number };
  vendors: {
    total: number;
    atRisk: number;
    byStatus: Record<string, number>;
    atRiskList: {
      id: string;
      companyName: string;
      complianceStatus: string;
      category: string | null;
    }[];
    expiringDocs: {
      id: string;
      documentType: string;
      expiresAt: string | null;
      daysUntilExpiry: number | null;
      vendorId: string;
      vendorName: string;
    }[];
  };
  outstandingFees: { total: number; count: number };
  recentMoves: {
    id: string;
    kind: 'in' | 'out';
    unitNumber: string | null;
    name: string;
    on: string;
    residentType: string;
  }[];
}

const COMPLIANCE_TONE: Record<string, string> = {
  expired: 'bg-rose-50 text-rose-700 ring-rose-200',
  expiring: 'bg-amber-50 text-amber-700 ring-amber-200',
  not_compliant: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function statusLabel(s: string): string {
  if (s === 'not_compliant') return 'Not compliant';
  if (s === 'expiring') return 'Expiring';
  if (s === 'expired') return 'Expired';
  return s;
}

function docLabel(s: string): string {
  if (s === 'insurance') return 'Insurance';
  if (s === 'license') return 'License';
  if (s === 'wsib') return 'WSIB';
  if (s === 'certification') return 'Cert.';
  return s;
}

function dollar(n: number): string {
  if (n === 0) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export function GovernanceSnapshotCard() {
  const router = useRouter();
  const propertyId = getPropertyId();
  const { data: response } = useApi<{ data: GovernanceData }>(
    apiUrl('/api/v1/admin/governance', { propertyId }),
  );

  const data: GovernanceData | null =
    response && 'data' in (response as object)
      ? (response as { data: GovernanceData }).data
      : (response as unknown as GovernanceData | null);
  if (!data) return null;

  // Hide if the property has zero of everything — fresh property,
  // nothing to summarise.
  const empty =
    data.occupancy.totalUnits === 0 &&
    data.vendors.total === 0 &&
    data.outstandingFees.total === 0 &&
    data.recentMoves.length === 0;
  if (empty) return null;

  const vendorAtRisk = data.vendors.atRisk;
  const pulse = vendorAtRisk > 0;

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '90ms' }}
      aria-label="Building governance snapshot"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${
          pulse
            ? 'conc-spotlight border-rose-200 from-rose-50 via-white to-amber-50'
            : 'border-violet-200 from-violet-50 via-white to-sky-50'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full blur-2xl ${
            pulse
              ? 'bg-gradient-to-br from-rose-300/30 via-amber-300/20 to-orange-300/20'
              : 'bg-gradient-to-br from-violet-300/30 via-indigo-300/20 to-sky-300/20'
          }`}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10.5px] font-semibold tracking-[0.1em] uppercase ${
                pulse ? 'text-rose-700' : 'text-violet-700'
              }`}
            >
              {pulse ? 'Compliance heads-up' : 'Building snapshot'}
            </span>
            <span className={`text-[11.5px] ${pulse ? 'text-rose-700/80' : 'text-violet-700/80'}`}>
              · the four numbers worth glancing at
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Occupancy */}
            <button
              type="button"
              onClick={() => router.push('/units' as never)}
              className="flex flex-col gap-1 rounded-xl bg-white/70 px-3 py-2.5 text-left ring-1 ring-violet-100/80 transition hover:bg-white hover:ring-violet-200"
            >
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-violet-700 uppercase">
                <Building2 className="h-3 w-3" />
                Occupancy
              </span>
              <span className="text-[20px] font-bold text-neutral-900">
                {data.occupancy.percent}%
              </span>
              <span className="text-[11.5px] text-neutral-500">
                {data.occupancy.occupiedUnits} of {data.occupancy.totalUnits} occupied
                {data.occupancy.vacantUnits > 0 && (
                  <span className="text-neutral-400"> · {data.occupancy.vacantUnits} vacant</span>
                )}
              </span>
            </button>

            {/* Vendor compliance */}
            <button
              type="button"
              onClick={() => router.push('/vendors' as never)}
              className={`flex flex-col gap-1 rounded-xl bg-white/70 px-3 py-2.5 text-left ring-1 transition hover:bg-white ${
                vendorAtRisk > 0
                  ? 'ring-rose-200 hover:ring-rose-300'
                  : 'ring-emerald-200 hover:ring-emerald-300'
              }`}
            >
              <span
                className={`flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase ${
                  vendorAtRisk > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                <ShieldAlert className="h-3 w-3" />
                Vendor risk
              </span>
              <span className="text-[20px] font-bold text-neutral-900">{vendorAtRisk}</span>
              <span className="text-[11.5px] text-neutral-500">
                {vendorAtRisk === 0
                  ? `All ${data.vendors.total} compliant`
                  : `of ${data.vendors.total} need attention`}
              </span>
            </button>

            {/* Outstanding fees */}
            <button
              type="button"
              onClick={() => router.push('/amenity-booking' as never)}
              className="flex flex-col gap-1 rounded-xl bg-white/70 px-3 py-2.5 text-left ring-1 ring-amber-100/80 transition hover:bg-white hover:ring-amber-200"
            >
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-amber-700 uppercase">
                <DollarSign className="h-3 w-3" />
                Outstanding
              </span>
              <span className="text-[20px] font-bold text-neutral-900">
                {dollar(data.outstandingFees.total)}
              </span>
              <span className="text-[11.5px] text-neutral-500">
                {data.outstandingFees.count} unpaid booking
                {data.outstandingFees.count === 1 ? '' : 's'}
              </span>
            </button>

            {/* Recent move activity */}
            <button
              type="button"
              onClick={() => router.push('/residents' as never)}
              className="flex flex-col gap-1 rounded-xl bg-white/70 px-3 py-2.5 text-left ring-1 ring-sky-100/80 transition hover:bg-white hover:ring-sky-200"
            >
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-sky-700 uppercase">
                <Users className="h-3 w-3" />
                Moves (30d)
              </span>
              <span className="text-[20px] font-bold text-neutral-900">
                {data.recentMoves.length}
              </span>
              <span className="text-[11.5px] text-neutral-500">
                {data.recentMoves.filter((m) => m.kind === 'in').length} in ·{' '}
                {data.recentMoves.filter((m) => m.kind === 'out').length} out
              </span>
            </button>
          </div>

          {(data.vendors.atRiskList.length > 0 || data.vendors.expiringDocs.length > 0) && (
            <div className="mt-3 rounded-xl bg-white/60 px-3 py-2 ring-1 ring-rose-100/80">
              {data.vendors.atRiskList.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-700">
                  <span className="text-[10.5px] font-semibold tracking-[0.06em] text-rose-700 uppercase">
                    Chase
                  </span>
                  {data.vendors.atRiskList.slice(0, 4).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => router.push(`/vendors/${v.id}` as never)}
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-rose-50"
                    >
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                          COMPLIANCE_TONE[v.complianceStatus] ??
                          'bg-rose-50 text-rose-700 ring-rose-200'
                        }`}
                      >
                        {statusLabel(v.complianceStatus)}
                      </span>
                      <span className="font-medium text-neutral-900">{v.companyName}</span>
                      {v.category && <span className="text-neutral-500">· {v.category}</span>}
                    </button>
                  ))}
                  {data.vendors.atRiskList.length > 4 && (
                    <button
                      type="button"
                      onClick={() => router.push('/vendors' as never)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-700 hover:text-rose-800"
                    >
                      + {data.vendors.atRiskList.length - 4} more
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              {data.vendors.expiringDocs.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-700">
                  <span className="text-[10.5px] font-semibold tracking-[0.06em] text-amber-700 uppercase">
                    Heads up
                  </span>
                  {data.vendors.expiringDocs.slice(0, 4).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => router.push(`/vendors/${d.vendorId}` as never)}
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-amber-50"
                    >
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-amber-700 uppercase ring-1 ring-amber-200">
                        {docLabel(d.documentType)}{' '}
                        {d.daysUntilExpiry !== null && `· ${d.daysUntilExpiry}d`}
                      </span>
                      <span className="font-medium text-neutral-900">{d.vendorName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.recentMoves.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-600">
              <span className="text-[10.5px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                Recent
              </span>
              {data.recentMoves.slice(0, 3).map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1">
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                      m.kind === 'in'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-neutral-50 text-neutral-600 ring-neutral-200'
                    }`}
                  >
                    {m.kind === 'in' ? 'Moved in' : 'Moved out'}
                  </span>
                  <span className="text-neutral-800">{m.name}</span>
                  {m.unitNumber && <span className="text-neutral-500">· Unit {m.unitNumber}</span>}
                  <span className="text-neutral-400">· {relativeDays(m.on)}</span>
                </span>
              ))}
              {data.recentMoves.length > 3 && (
                <button
                  type="button"
                  onClick={() => router.push('/residents' as never)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:text-sky-800"
                >
                  + {data.recentMoves.length - 3} more
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
