import { forwardRef, type ReactNode } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  href?: string;
  /** Accent tints the value, the delta chip border, and the optional left rail. */
  accent?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Up/down trend vs prior period. Positive number = green, negative = red. */
  delta?: { value: number; suffix?: string; label?: string };
  /** Optional one-line context shown under value, e.g. "in 14 buildings" */
  caption?: string;
  className?: string;
}

// Per-accent colour mapping for the small rail and the value text. Replaces
// the old icon-in-coloured-circle pattern (SaaS template tell) with a
// 2px left-edge accent + monoline icon, which reads as a polished
// data-dense KPI tile instead of a marketing card.
const ACCENT_RAIL: Record<NonNullable<KpiTileProps['accent']>, string> = {
  primary: 'bg-primary-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  neutral: 'bg-neutral-300',
};

const ACCENT_ICON: Record<NonNullable<KpiTileProps['accent']>, string> = {
  primary: 'text-primary-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  info: 'text-info-600',
  neutral: 'text-neutral-500',
};

export const KpiTile = forwardRef<HTMLElement, KpiTileProps>(function KpiTile(
  { label, value, icon: Icon, href, accent = 'neutral', delta, caption, className },
  ref,
) {
  const deltaPositive = delta ? delta.value >= 0 : false;
  const isLink = Boolean(href);

  const inner = (
    <>
      {/* Top row: label + optional monoline icon + drill-in arrow */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <Icon
              className={cn('h-3.5 w-3.5 flex-shrink-0', ACCENT_ICON[accent])}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate text-[11px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
            {label}
          </span>
        </div>
        {isLink ? (
          <ArrowUpRight
            className="h-3.5 w-3.5 flex-shrink-0 text-neutral-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-600"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {/* Value + optional delta chip */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-neutral-900"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-tight',
              deltaPositive ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700',
            )}
            aria-label={delta.label ?? `${delta.value}${delta.suffix ?? ''}`}
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {deltaPositive ? '↑' : '↓'}
            {Math.abs(delta.value)}
            {delta.suffix ?? '%'}
          </span>
        ) : null}
      </div>

      {caption ? (
        <p className="mt-1.5 text-[11.5px] leading-snug text-neutral-500">{caption}</p>
      ) : null}
    </>
  );

  const wrapperClass = cn(
    'group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white px-4 py-3.5 transition-all duration-150',
    isLink &&
      'hover:-translate-y-px hover:border-neutral-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] focus-visible:outline-2 focus-visible:outline-primary-500',
    className,
  );

  const railEl = (
    <span
      aria-hidden="true"
      className={cn('absolute top-0 bottom-0 left-0 w-[2px]', ACCENT_RAIL[accent])}
    />
  );

  if (isLink) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={wrapperClass}
        data-component="kpi-tile"
      >
        {railEl}
        {inner}
      </a>
    );
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={wrapperClass} data-component="kpi-tile">
      {railEl}
      {inner}
    </div>
  );
});

export default KpiTile;
