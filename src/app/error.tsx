'use client';

/**
 * Concierge — Error Boundary
 *
 * Catches errors thrown during rendering of route segments.
 * Never exposes stack traces or internal details to the user.
 */

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">Something went wrong</h1>
      <p className="max-w-md text-neutral-500">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      {error.digest && <p className="text-xs text-neutral-400">Error reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="bg-primary-500 hover:bg-primary-600 mt-4 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
