/**
 * Date formatting helpers that fall back gracefully instead of rendering
 * the literal string "Invalid Date" or "NaN" to the user.
 *
 * Rule of thumb: anywhere we display a date that comes from the API,
 * prefer these helpers over raw `new Date(iso).toLocaleDateString(...)`.
 *
 * @module lib/format-date
 */

const DEFAULT_FALLBACK = '—';

/**
 * Returns true if `value` can be parsed into a real date.
 */
function isParseableDate(value: string | number | Date | null | undefined): boolean {
  if (value === null || value === undefined || value === '') return false;
  const d = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Format a date for display. Returns the fallback when the source is
 * null / undefined / unparseable.
 *
 * @example formatDate(event.date)
 *   => "May 23, 2026"  (when valid)
 *   => "—"             (when null / undefined / "Invalid Date")
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!isParseableDate(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date + time for display. Returns the fallback when the
 * source is null / undefined / unparseable.
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!isParseableDate(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return d.toLocaleString('en-US', options);
}

/**
 * Format a time-only value. Returns the fallback when the source is
 * null / undefined / unparseable.
 */
export function formatTime(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  },
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!isParseableDate(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string | number);
  return d.toLocaleTimeString('en-US', options);
}

/**
 * Format a "X minutes / hours / days ago" string from an ISO timestamp.
 * Returns the fallback when the source is unparseable.
 */
export function formatRelative(
  value: string | number | Date | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!isParseableDate(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string | number);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return formatDate(d);
}
