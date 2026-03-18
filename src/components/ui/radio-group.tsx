'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  error?: string;
}

export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  ({ className, error, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn('grid gap-3', className)}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && (
        <p className="text-error-600 text-[13px]" role="alert">
          {error}
        </p>
      )}
    </div>
  ),
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  label?: string;
  description?: string;
}

export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, description, id, ...props }, ref) => {
  const itemId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex items-start gap-3">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={cn(
          'aspect-square h-5 w-5 shrink-0 rounded-full border-2 border-neutral-300',
          'transition-colors duration-150',
          'hover:border-neutral-400',
          'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:border-primary-500',
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="fill-primary-500 text-primary-500 h-2.5 w-2.5" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={itemId}
              className="cursor-pointer text-[15px] leading-5 font-medium text-neutral-900"
            >
              {label}
            </label>
          )}
          {description && <p className="text-[13px] leading-4 text-neutral-500">{description}</p>}
        </div>
      )}
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
