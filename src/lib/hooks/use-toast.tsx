'use client';

/**
 * useToast — global toast notification system.
 *
 * The `<Toast />` primitives in src/components/ui/toast.tsx have
 * existed for a while but nothing was wired to them, so every page
 * resorted to native `alert()` or inline error divs — 17 of them at
 * audit time. Those alerts look like a 1998 page, block the whole
 * window, and have no design-system styling.
 *
 * This hook + provider gives every screen a single function:
 *
 *     const { toast } = useToast();
 *     toast.success('Saved.');
 *     toast.error('Could not start checkout.');
 *
 * Mounted at the providers layout so any client component on any
 * page can fire one.
 *
 * Design choices:
 *   - 5-second default duration, dismissible by hover or close button.
 *   - Stack from the bottom-right (Radix viewport default).
 *   - Variants map to the existing `toastVariants` in toast.tsx so we
 *     don't redefine semantic colors in two places.
 *   - The function signatures stay parallel to `alert()` so the
 *     mass-replace from `alert('msg')` → `toast.error('msg')` is a
 *     one-token swap per call.
 */

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

type Variant = 'default' | 'success' | 'warning' | 'error';

interface ToastEntry {
  id: number;
  message: string;
  description?: string;
  variant: Variant;
  durationMs: number;
}

interface ToastApi {
  default: (message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  /** Lower-level dispatch for custom durations / variants. */
  show: (entry: Omit<ToastEntry, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  const show = useCallback((entry: Omit<ToastEntry, 'id'>) => {
    setEntries((prev) => [...prev, { ...entry, id: Date.now() + Math.random() }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      default: (message, description) =>
        show({ message, description, variant: 'default', durationMs: 5000 }),
      success: (message, description) =>
        show({ message, description, variant: 'success', durationMs: 4000 }),
      warning: (message, description) =>
        show({ message, description, variant: 'warning', durationMs: 6000 }),
      error: (message, description) =>
        show({ message, description, variant: 'error', durationMs: 8000 }),
      show,
    }),
    [show],
  );

  const dismiss = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={api}>
      <RadixToastProvider swipeDirection="right" duration={5000}>
        {children}
        {entries.map((entry) => (
          <Toast
            key={entry.id}
            variant={entry.variant}
            duration={entry.durationMs}
            onOpenChange={(open) => {
              if (!open) dismiss(entry.id);
            }}
          >
            <div className="flex flex-1 flex-col gap-1 pr-4">
              <ToastTitle>{entry.message}</ToastTitle>
              {entry.description && <ToastDescription>{entry.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Defensive fallback: callers that fire toasts before the
    // provider mounts (e.g. very early in app boot) get a no-op
    // logger instead of an exception. Better than crashing.
    return {
      default: (m) => console.log('[toast:default]', m),
      success: (m) => console.log('[toast:success]', m),
      warning: (m) => console.warn('[toast:warning]', m),
      error: (m) => console.error('[toast:error]', m),
      show: (entry) => console.log('[toast:show]', entry),
    };
  }
  return ctx;
}
