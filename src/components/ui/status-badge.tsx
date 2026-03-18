import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Status Badge                                                               */
/*  Displays a coloured pill with a leading dot indicator.                     */
/*  Used throughout dashboards to communicate record / entity status.          */
/* -------------------------------------------------------------------------- */

const statusVariants = {
  success: {
    badge: 'bg-success-50 text-success-700 border-success-200',
    dot: 'bg-success-500',
  },
  warning: {
    badge: 'bg-warning-50 text-warning-700 border-warning-200',
    dot: 'bg-warning-500',
  },
  error: {
    badge: 'bg-error-50 text-error-700 border-error-200',
    dot: 'bg-error-500',
  },
  info: {
    badge: 'bg-info-50 text-info-700 border-info-200',
    dot: 'bg-info-500',
  },
  neutral: {
    badge: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dot: 'bg-neutral-400',
  },
} as const;

const badgeSizes = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-0.5 text-[12px] gap-1.5',
  lg: 'px-3 py-1 text-[13px] gap-1.5',
} as const;

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2 w-2',
} as const;

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual status — controls colour scheme */
  status?: keyof typeof statusVariants;
  /** Size variant */
  size?: keyof typeof badgeSizes;
  /** Whether to show the leading dot indicator */
  dot?: boolean;
}

export function StatusBadge({
  className,
  status = 'neutral',
  size = 'md',
  dot = true,
  children,
  ...props
}: StatusBadgeProps) {
  const variant = statusVariants[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border leading-none font-medium',
        variant.badge,
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('shrink-0 rounded-full', variant.dot, dotSizes[size])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
