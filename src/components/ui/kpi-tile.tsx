import { forwardRef, type ReactNode } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  href?: string;
  /** Optional accent applied to icon background + delta chip border */
  accent?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Up/down trend vs prior period. Positive number = green, negative = red. */
  delta?: { value: number; suffix?: string; label?: string };
  /** Optional one-line context shown under value, e.g. "in 14 buildings" */
  caption?: string;
  className?: string;
}

const ACCENT_BG: Record<NonNullable<KpiTileProps['accent']>, string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export const KpiTile = forwardRef<HTMLElement, KpiTileProps>(function KpiTile(
  { label, value, icon: Icon, href, accent = 'neutral', delta, caption, className },
  ref,
) {
  const accentClass = ACCENT_BG[accent];
  const deltaPositive = delta ? delta.value >= 0 : false;
  const isLink = Boolean(href);

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accentClass)}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <span className="text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
            {label}
          </span>
        </div>
        {isLink ? (
          <ArrowUpRight
            className="h-4 w-4 text-neutral-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-600"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[26px] leading-none font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
              deltaPositive ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700',
            )}
            aria-label={delta.label ?? `${delta.value}${delta.suffix ?? ''}`}
          >
            {deltaPositive ? '+' : ''}
            {delta.value}
            {delta.suffix ?? '%'}
          </span>
        ) : null}
      </div>
      {caption ? <p className="mt-1 text-[12px] text-neutral-500">{caption}</p> : null}
    </>
  );

  const wrapperClass = cn(
    'group flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all duration-150',
    isLink &&
      'hover:border-neutral-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary-500',
    className,
  );

  if (isLink) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={wrapperClass}
        data-component="kpi-tile"
      >
        {inner}
      </a>
    );
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={wrapperClass} data-component="kpi-tile">
      {inner}
    </div>
  );
});

export default KpiTile;
