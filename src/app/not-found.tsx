'use client';

/**
 * Concierge — 404 Not Found (Root)
 *
 * Shown when a route does not match any page at the root level.
 * Uses client directive only for the "Go Back" button (history.back).
 */

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <FileQuestion className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-neutral-900">404</h1>

        <h2 className="mt-2 text-lg font-semibold text-neutral-700">Page not found</h2>

        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          The page you are looking for does not exist or has been moved. Check the URL or navigate
          back to a known page.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 inline-flex h-[44px] items-center justify-center rounded-xl px-5 text-[15px] font-medium text-white shadow-sm transition-all duration-200 ease-out active:scale-[0.98]"
          >
            Go Home
          </Link>
          <Button variant="secondary" size="lg" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
