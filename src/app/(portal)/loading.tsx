/**
 * Concierge — Portal Loading State
 *
 * Displayed while portal route segments are loading.
 * Renders inside the app shell so sidebar/header remain visible.
 * Shows a centered spinner with the Concierge wordmark.
 */

export default function PortalLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div
            className="border-t-primary-500 h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200"
            role="status"
            aria-label="Loading"
          />
        </div>
        <p className="text-sm font-medium tracking-wide text-neutral-400">CONCIERGE</p>
      </div>
    </div>
  );
}
