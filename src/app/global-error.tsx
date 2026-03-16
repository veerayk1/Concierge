'use client';

/**
 * Concierge — Global Error Boundary
 *
 * Catches errors that occur in the root layout itself.
 * Renders its own <html> and <body> since the root layout may have failed.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center font-sans">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="max-w-md text-gray-500">
          A critical error occurred. Please try again or contact support.
        </p>
        {error.digest && <p className="text-xs text-gray-400">Error reference: {error.digest}</p>}
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
