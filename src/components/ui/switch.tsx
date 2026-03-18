'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

const switchSizes = {
  sm: {
    root: 'h-5 w-9',
    thumb: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
  },
  md: {
    root: 'h-6 w-11',
    thumb: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  },
} as const;

export interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
  size?: keyof typeof switchSizes;
}

export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, description, size = 'md', id, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const sizeConfig = switchSizes[size];

    return (
      <div className="flex items-center gap-3">
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          className={cn(
            'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-neutral-300',
            sizeConfig.root,
            className,
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
              sizeConfig.thumb,
            )}
          />
        </SwitchPrimitive.Root>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={switchId}
                className="cursor-pointer text-[15px] font-medium text-neutral-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {label}
              </label>
            )}
            {description && <p className="text-[13px] text-neutral-500">{description}</p>}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
