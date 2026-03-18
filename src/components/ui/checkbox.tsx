'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          className={cn(
            'peer h-[18px] w-[18px] shrink-0 rounded-[5px] border transition-all duration-200',
            'focus-visible:ring-primary-100 focus-visible:ring-4 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 data-[state=checked]:text-white',
            'data-[state=indeterminate]:border-primary-500 data-[state=indeterminate]:bg-primary-500 data-[state=indeterminate]:text-white',
            error
              ? 'border-error-400'
              : 'data-[state=checked]:hover:bg-primary-600 border-neutral-300 hover:border-neutral-400',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center">
            {props.checked === 'indeterminate' ? (
              <Minus className="h-3 w-3" strokeWidth={3} />
            ) : (
              <Check className="h-3 w-3" strokeWidth={3} />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {(label || description || error) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={checkboxId}
                className="cursor-pointer text-[14px] leading-5 font-medium text-neutral-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-40"
              >
                {label}
              </label>
            )}
            {description && <p className="text-[13px] leading-5 text-neutral-500">{description}</p>}
            {error && (
              <p
                id={`${checkboxId}-error`}
                className="text-error-600 text-[13px] font-medium"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
