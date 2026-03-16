import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-body-sm text-text-primary font-medium">
            {label}
            {props.required ? <span className="text-status-error ml-0.5">*</span> : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'bg-surface-primary text-body-md text-text-primary min-h-[80px] w-full rounded-lg border px-3 py-2',
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
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-body-xs text-status-error" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-body-xs text-text-tertiary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
