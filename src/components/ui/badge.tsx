import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-neutral-100 text-neutral-600 border-neutral-200/60',
  success: 'bg-success-50 text-success-700 border-success-200/60',
  warning: 'bg-warning-50 text-warning-700 border-warning-200/60',
  error: 'bg-error-50 text-error-700 border-error-200/60',
  info: 'bg-info-50 text-info-700 border-info-200/60',
  primary: 'bg-primary-50 text-primary-700 border-primary-200/60',
} as const;

const badgeSizes = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-[12px] px-2.5 py-0.5',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  dot?: boolean;
  dotColor?: string;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase',
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColor || 'bg-current')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
