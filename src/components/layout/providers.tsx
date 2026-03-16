'use client';

/**
 * Concierge — Client Providers
 *
 * Wraps the application in all required client-side context providers.
 * Currently a pass-through; providers will be added as features are built
 * (e.g. auth context, toast provider, query client).
 */

import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
