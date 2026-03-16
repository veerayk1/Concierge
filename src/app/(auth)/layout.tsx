/**
 * Concierge — Auth Layout
 *
 * Centered card layout for authentication pages.
 * No sidebar, no header. White background with the Concierge logo
 * centered above the content card.
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-bold text-neutral-900">Concierge</span>
          <span className="text-sm text-neutral-500">Building Management Portal</span>
        </div>

        {/* Card */}
        <div className="w-full rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
