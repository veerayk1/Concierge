import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  primary:
    'bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98]',
  secondary:
    'bg-white text-neutral-700 border border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 active:scale-[0.98]',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-150',
  danger:
    'bg-error-600 text-white shadow-sm hover:bg-error-700 active:bg-error-800 active:scale-[0.98]',
  link: 'text-primary-500 hover:text-primary-600 underline-offset-4 hover:underline p-0 h-auto',
} as const;

const buttonSizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[14px] gap-2 rounded-xl',
  lg: 'h-[44px] px-5 text-[15px] gap-2.5 rounded-xl',
  xl: 'h-12 px-6 text-[16px] gap-3 rounded-xl',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:ring-primary-100 focus-visible:ring-4 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-40',
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
