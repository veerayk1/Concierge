import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-body-sm text-text-primary font-medium">
            {label}
            {props.required ? <span className="text-status-error ml-0.5">*</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-surface-primary text-body-md text-text-primary h-10 w-full rounded-lg border px-3',
            'placeholder:text-text-tertiary',
            'focus:ring-interactive-focus focus:ring-2 focus:ring-offset-1 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-status-error focus:ring-status-error'
              : 'border-border-primary hover:border-border-secondary',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-body-xs text-status-error" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-body-xs text-text-tertiary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
