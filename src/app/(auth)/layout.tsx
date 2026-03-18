/**
 * Concierge — Auth Layout
 *
 * Centered card layout for authentication pages.
 * No sidebar, no header. White background with the Concierge logo
 * centered above the content card. Max-width 480px, vertically centered.
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="flex w-full max-w-[480px] flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-500 flex h-10 w-10 items-center justify-center rounded-xl">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-[26px] font-bold tracking-tight text-neutral-900">Concierge</span>
          </div>
          <span className="text-[14px] text-neutral-500">Building Management Portal</span>
        </div>

        {/* Card */}
        <div className="w-full rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
