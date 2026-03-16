/**
 * Concierge — 404 Not Found
 *
 * Shown when a route does not match any page.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold text-neutral-900">404</h1>
      <h2 className="text-xl font-semibold text-neutral-700">Page not found</h2>
      <p className="max-w-md text-neutral-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary-500 hover:bg-primary-600 mt-4 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
