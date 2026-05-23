import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, type, name, ...props }, ref) => {
    const slug = label?.toLowerCase().replace(/\s+/g, '-');
    const inputId = id || slug;
    // Default the name attribute to the label slug so password managers,
    // autofill, screen readers (aria-labelledby) and form libraries that
    // key off `name` have something stable to bind to. Callers can still
    // override by passing an explicit `name` prop.
    const inputName = name || slug;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
          >
            {label}
            {props.required ? (
              <span className="text-error-500 ml-0.5" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          name={inputName}
          type={type}
          className={cn(
            'h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900',
            'placeholder:text-neutral-400',
            'transition-all duration-200 ease-out',
            'focus:ring-4 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
            error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
              : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-error-600 text-[13px] font-medium"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-[13px] text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
