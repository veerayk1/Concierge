import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-surface-secondary text-text-secondary',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-body-xs inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
