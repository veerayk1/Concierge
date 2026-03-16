/**
 * Concierge — Root Loading Skeleton
 *
 * Displayed by Next.js while a route segment is loading.
 * Shows a centered spinner with accessible labelling.
 */

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="border-t-primary-500 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}
