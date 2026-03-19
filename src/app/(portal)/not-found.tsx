'use client';

/**
 * Concierge — Portal 404 Not Found
 *
 * Shown when a route within the (portal) group does not match.
 * Renders inside the app shell layout so sidebar/header remain visible.
 */

import Link from 'next/link';
import { FileQuestion, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PortalNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card padding="lg" className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <FileQuestion className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">404</h1>

        <h2 className="mt-1 text-lg font-semibold text-neutral-700">Page not found</h2>

        <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
          This page does not exist or you may not have access to it. Check the URL or navigate back
          to the dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-medium text-white shadow-sm transition-all duration-200 ease-out active:scale-[0.98]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <Button variant="secondary" size="md" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
