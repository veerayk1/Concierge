'use client';

/**
 * Concierge — Client Providers
 *
 * Wraps the application in all required client-side context providers.
 */

import type { ReactNode } from 'react';
import { DebugSessionProvider } from '@/lib/hooks/use-debug-session';
import { FloatingDebugButton } from '@/components/debug/floating-debug-button';
import { ToastProvider } from '@/lib/hooks/use-toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DebugSessionProvider>
      <ToastProvider>
        {children}
        <FloatingDebugButton />
      </ToastProvider>
    </DebugSessionProvider>
  );
}
