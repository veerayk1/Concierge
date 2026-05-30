/**
 * Canonical formatters for dates, times, and currency.
 *
 * Why one file: an audit of src/app found 12+ different toLocaleDateString
 * call signatures across the portal — some en-US, some bare, some
 * { month: 'short' }, some { weekday: 'short' }. Same component on
 * two different pages showed "May 30, 2026" and "5/30/2026" depending
 * on which file authored the formatter. That's the kind of drift a
 * buyer notices on a demo without being able to name it.
 *
 * Locale default is en-CA because the platform's primary market is
 * Canadian property management (PIPEDA, Toronto-area condos). Override
 * via the locale parameter when rendering content explicitly
 * targeting another region.
 */

const DEFAULT_LOCALE = 'en-CA';
const DEFAULT_CURRENCY = 'CAD';

type DateInput = string | number | Date;

function toDate(input: DateInput): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * "May 30, 2026"
 * Use everywhere a date is shown as a standalone label.
 */
export function formatDate(input: DateInput, locale = DEFAULT_LOCALE): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * "May 30"
 * Use in lists where the year is obvious from context.
 */
export function formatDateShort(input: DateInput, locale = DEFAULT_LOCALE): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * "Sat, May 30 · 7:00 PM"
 * Use where both day and time matter — bookings, visitor arrivals,
 * incident timestamps.
 */
export function formatDateTime(input: DateInput, locale = DEFAULT_LOCALE): string {
  const d = toDate(input);
  if (!d) return '—';
  const datePart = d.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
}

/**
 * "7:00 PM"
 * Use where the row is already grouped by date.
 */
export function formatTime(input: DateInput, locale = DEFAULT_LOCALE): string {
  const d = toDate(input);
  if (!d) return '—';
  return d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * "3 minutes ago", "2 hours ago", "yesterday", "May 30"
 * Use for activity feeds where freshness matters more than precision.
 */
export function formatRelative(input: DateInput, now = Date.now()): string {
  const d = toDate(input);
  if (!d) return '—';
  const diffMs = now - d.getTime();
  if (diffMs < 0) return formatDateShort(d);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day} days ago`;
  return formatDateShort(d);
}

/**
 * "$1,234.56"
 * `amount` is in CENTS (the storage convention across the platform).
 */
export function formatCurrency(
  amountInCents: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

/**
 * "1,234"
 * Generic number formatting with thousands separators.
 */
export function formatNumber(n: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * "12.5%"
 * Pass the raw percentage (0–100), not the 0–1 fraction.
 */
export function formatPercent(
  percent: number,
  locale = DEFAULT_LOCALE,
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(percent / 100);
}
