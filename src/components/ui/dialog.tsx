'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Blurred overlay with a slight gradient so the dialog feels like it's
      // floating above the page rather than punched out of it. Backdrop-blur
      // gives the "what's behind" a frosted-glass treatment.
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Full-bleed white card with a subtle gradient wash at the very top
        // so the modal has a clear "header zone" without an explicit divider.
        // Layered shadow gives real depth; the dialog reads as floating
        // hardware rather than a flat overlay.
        'fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.25),0_8px_24px_-6px_rgba(15,23,42,0.12)]',
        // Premium entrance: scale-in + slide-up + soft fade, on a slightly
        // longer curve than Radix's defaults so it lands instead of snapping.
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2',
        'data-[state=open]:duration-300',
        className,
      )}
      {...props}
    >
      {/* Soft gradient header wash — a low-alpha radial that bleeds down
          from the top of the dialog. Adds the same warmth the page heroes
          have without recolouring the form fields below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(186,230,253,0.45)_0%,rgba(221,214,254,0.18)_45%,transparent_80%)]"
      />
      <div className="relative">{children}</div>
      <DialogPrimitive.Close className="focus:ring-primary-200 absolute top-4 right-4 rounded-lg p-1.5 text-neutral-500 backdrop-blur-sm transition-all hover:bg-neutral-100 hover:text-neutral-700 focus:ring-2 focus:outline-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-[18px] font-semibold text-neutral-900', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('mt-2 text-[14px] text-neutral-500', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
