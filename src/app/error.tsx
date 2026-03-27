'use client';

/**
 * Concierge — Global Error Boundary
 *
 * Catches unhandled errors at the root level. Shows a clean, branded
 * error page with retry and navigation options. Never exposes raw
 * error details or stack traces to end users.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { reportDebugEvent, inferModuleFromRoute } from '@/lib/hooks/use-debug-session';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for debugging
    console.error('[Concierge] Unhandled error:', error);

    // Report to debugging intelligence layer — fire-and-forget
    const pathname = typeof window !== 'undefined' ? window.location.pathname : undefined;
    reportDebugEvent({
      type: 'FRONTEND_ERROR',
      source: 'client',
      severity: 'CRITICAL',
      title: error.message || 'Unhandled root-level error',
      errorMessage: error.message,
      stackTrace: error.stack ?? null,
      errorCode: error.digest ?? null,
      route: pathname ?? null,
      module: pathname ? inferModuleFromRoute(pathname) : null,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card padding="lg" className="w-full max-w-md text-center">
        <div className="bg-error-50 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <AlertTriangle className="text-error-600 h-8 w-8" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Something went wrong
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
          An unexpected error occurred. Please try again or return to the home page. If the problem
          persists, contact your property administrator.
        </p>

        {error.digest && <p className="mt-4 text-xs text-neutral-400">Reference: {error.digest}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={reset}>
            Try Again
          </Button>
          <Link
            href="/"
            className="inline-flex h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-[15px] font-medium text-neutral-700 shadow-sm transition-all duration-200 ease-out hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] active:bg-neutral-100"
          >
            Go Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
