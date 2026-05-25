import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Tone of the icon halo — defaults to neutral. */
  tone?: 'neutral' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
}

const TONE_BUBBLE: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  neutral: 'from-neutral-100 to-neutral-50 text-neutral-500 ring-neutral-200/60',
  amber: 'from-amber-100 to-orange-50 text-amber-600 ring-amber-200/60',
  emerald: 'from-emerald-100 to-teal-50 text-emerald-600 ring-emerald-200/60',
  sky: 'from-sky-100 to-indigo-50 text-sky-600 ring-sky-200/60',
  violet: 'from-violet-100 to-pink-50 text-violet-600 ring-violet-200/60',
  rose: 'from-rose-100 to-amber-50 text-rose-600 ring-rose-200/60',
};

const TONE_GLOW: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  neutral: 'bg-neutral-100/0',
  amber: 'bg-amber-200/40',
  emerald: 'bg-emerald-200/40',
  sky: 'bg-sky-200/40',
  violet: 'bg-violet-200/40',
  rose: 'bg-rose-200/40',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = 'neutral',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50/60 to-white py-16 text-center',
        className,
      )}
    >
      {/* Soft tone-coloured glow behind the icon — a single radial that
          gives the section a focal point without being loud. Hidden for
          tone=neutral to keep staff/admin pages plain. */}
      {tone !== 'neutral' ? (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-6 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl',
            TONE_GLOW[tone],
          )}
        />
      ) : null}
      {icon ? (
        <div
          className={cn(
            'relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1',
            TONE_BUBBLE[tone],
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3 className="relative text-[16px] font-semibold text-neutral-900">{title}</h3>
      {description ? (
        <p className="relative mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
