'use client';

/**
 * StaffOnDutyStrip
 *
 * Tiny status strip on the resident dashboard: "Front desk: Emily on
 * duty · Security: on duty". Powered by live SecurityShift data —
 * any active shift at the resident's property flips the indicator
 * to a glowing green dot.
 *
 * Stays visible even when nothing is on duty (rendered as a quiet
 * "off-duty" notice in neutral) so a resident at 4 AM knows not to
 * expect a callback. Designed to be a single-line component, not a
 * card — it lives between the spotlight banner and the rest of the
 * dashboard cards as ambient context.
 */

import { Headset, ShieldCheck } from 'lucide-react';

import { useApi } from '@/lib/hooks/use-api';

interface Availability {
  frontDesk: { onDuty: boolean; count: number; name: string | null };
  security: { onDuty: boolean; count: number; name: string | null };
}

export function StaffOnDutyStrip() {
  const { data: response } = useApi<{ data: Availability }>('/api/v1/my/staff-on-duty');

  const data: Availability | null =
    response && 'data' in (response as object)
      ? (response as { data: Availability }).data
      : (response as unknown as Availability | null);
  if (!data) return null;

  const { frontDesk, security } = data;
  // Hide entirely if both are off — the resident dashboard doesn't
  // need an "everyone is gone" banner sitting there at 4am. If at
  // least one is on duty, render the whole strip so the resident
  // sees the full picture.
  if (!frontDesk.onDuty && !security.onDuty) return null;

  return (
    <section
      className="conc-rise relative flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-neutral-200/80 bg-white/60 px-4 py-2 backdrop-blur-sm"
      style={{ animationDelay: '90ms' }}
      aria-label="Building staff on duty"
    >
      <Indicator
        icon={Headset}
        label="Front desk"
        onDuty={frontDesk.onDuty}
        name={frontDesk.name}
      />
      <Indicator
        icon={ShieldCheck}
        label="Security"
        onDuty={security.onDuty}
        name={security.name}
      />
    </section>
  );
}

function Indicator({
  icon: Icon,
  label,
  onDuty,
  name,
}: {
  icon: typeof Headset;
  label: string;
  onDuty: boolean;
  name: string | null;
}) {
  return (
    <span className="flex items-center gap-2 text-[12.5px]">
      <Icon
        className={`h-3.5 w-3.5 ${onDuty ? 'text-emerald-600' : 'text-neutral-400'}`}
        strokeWidth={1.8}
      />
      <span className="font-medium text-neutral-700">{label}:</span>
      <span className="relative inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`relative inline-block h-2 w-2 rounded-full ${
            onDuty ? 'bg-emerald-500' : 'bg-neutral-300'
          }`}
        >
          {onDuty && (
            <span className="absolute inset-0 -m-0.5 animate-ping rounded-full bg-emerald-400/60" />
          )}
        </span>
        {onDuty ? (
          <span className="font-semibold text-emerald-700">
            {name ? `${name} on duty` : 'On duty'}
          </span>
        ) : (
          <span className="text-neutral-500">Off duty</span>
        )}
      </span>
    </span>
  );
}
