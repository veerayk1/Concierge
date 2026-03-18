'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Root                                                                       */
/* -------------------------------------------------------------------------- */

export const Tabs = TabsPrimitive.Root;

/* -------------------------------------------------------------------------- */
/*  List                                                                       */
/* -------------------------------------------------------------------------- */

export type TabsVariant = 'underline' | 'pill';

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Visual variant for the tab bar */
  variant?: TabsVariant;
}

const listVariants: Record<TabsVariant, string> = {
  underline: 'border-b border-neutral-200 gap-0',
  pill: 'bg-neutral-100 rounded-lg p-1 gap-1',
};

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant = 'underline', ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn('inline-flex items-center', listVariants[variant], className)}
      data-variant={variant}
      {...props}
    />
  ),
);
TabsList.displayName = 'TabsList';

/* -------------------------------------------------------------------------- */
/*  Trigger                                                                    */
/* -------------------------------------------------------------------------- */

export interface TabsTriggerProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** Visual variant — should match the parent TabsList variant */
  variant?: TabsVariant;
}

const triggerBase =
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const triggerVariants: Record<TabsVariant, string> = {
  underline: [
    'px-4 py-2.5 text-[14px] text-neutral-500',
    'border-b-2 border-transparent -mb-px',
    'hover:text-neutral-700',
    'data-[state=active]:border-primary-500 data-[state=active]:text-primary-700',
  ].join(' '),
  pill: [
    'px-3 py-1.5 text-[13px] rounded-md text-neutral-500',
    'hover:text-neutral-700',
    'data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm',
  ].join(' '),
};

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, variant = 'underline', ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(triggerBase, triggerVariants[variant], className)}
      {...props}
    />
  ),
);
TabsTrigger.displayName = 'TabsTrigger';

/* -------------------------------------------------------------------------- */
/*  Content                                                                    */
/* -------------------------------------------------------------------------- */

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-primary-500 mt-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
