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
          <label htmlFor={textareaId} className="text-[13px] font-medium text-neutral-900">
            {label}
            {props.required ? (
              <span className="text-error-600 ml-0.5" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-[14px] text-neutral-900',
            'placeholder:text-neutral-400',
            'focus:ring-primary-200 focus:ring-2 focus:ring-offset-1 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-error-600 focus:ring-error-600'
              : 'border-neutral-200 hover:border-neutral-300',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-error-600 text-[12px]" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-[12px] text-neutral-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
