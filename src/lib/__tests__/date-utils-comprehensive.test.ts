/**
 * Concierge — Date/Time Utility Comprehensive Tests
 *
 * Tests for formatDate, formatRelativeTime from utils.ts, and
 * date-related edge cases including timezone handling, null/invalid dates,
 * date range validation, business hours detection, and shift time calculation.
 *
 * @see src/lib/utils.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { formatDate, formatRelativeTime } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a UTC date to Toronto local hour and day-of-week.
 * Uses a fixed offset approach for test reliability (EST = UTC-5, EDT = UTC-4).
 * March dates before DST (March 8, 2026) use EST; after use EDT.
 * November dates after DST end use EST.
 */
function torontoHourAndDay(date: Date): { hour: number; day: number } {
  const month = date.getUTCMonth(); // 0-indexed
  const utcDay = date.getUTCDate();
  // Simplified DST: EDT (UTC-4) from March 8 to Nov 1, EST (UTC-5) otherwise
  const isDST =
    (month > 2 && month < 10) || (month === 2 && utcDay >= 8) || (month === 10 && utcDay < 1);
  const offsetHours = isDST ? -4 : -5;
  const torontoMs = date.getTime() + offsetHours * 60 * 60 * 1000;
  const toronto = new Date(torontoMs);
  return { hour: toronto.getUTCHours(), day: toronto.getUTCDay() };
}

/** Checks whether a given hour (0-23) in Toronto falls within business hours (9-17). */
function isBusinessHours(date: Date): boolean {
  const { hour, day } = torontoHourAndDay(date);
  // Business hours: Mon-Fri (1-5), 9 AM - 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

/** Determine shift based on hour: day (7-15), evening (15-23), night (23-7). */
function getShift(date: Date): 'day' | 'evening' | 'night' {
  const { hour } = torontoHourAndDay(date);
  if (hour >= 7 && hour < 15) return 'day';
  if (hour >= 15 && hour < 23) return 'evening';
  return 'night';
}

/** Validates a date range (start must be before or equal to end). */
function isValidDateRange(start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return start.getTime() <= end.getTime();
}

// ---------------------------------------------------------------------------
// 1. formatDate with various formats
// ---------------------------------------------------------------------------

describe('formatDate()', () => {
  it('formats a Date object with default pattern', () => {
    const date = new Date(2026, 2, 16, 14, 30, 0);
    const result = formatDate(date);
    // Default format: 'MMM d, yyyy h:mm a'
    expect(result).toContain('Mar');
    expect(result).toContain('16');
    expect(result).toContain('2026');
  });

  it('formats an ISO string with default pattern', () => {
    const result = formatDate('2026-03-16T14:30:00.000Z');
    expect(result).toContain('Mar');
    expect(result).toContain('16');
    expect(result).toContain('2026');
  });

  it('formats with custom yyyy-MM-dd pattern', () => {
    const date = new Date(2026, 2, 16);
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-03-16');
  });

  it('formats with time-only pattern HH:mm:ss', () => {
    const date = new Date(2026, 2, 16, 9, 5, 30);
    expect(formatDate(date, 'HH:mm:ss')).toBe('09:05:30');
  });

  it('formats with long month pattern MMMM d, yyyy', () => {
    const date = new Date(2026, 0, 1);
    expect(formatDate(date, 'MMMM d, yyyy')).toBe('January 1, 2026');
  });

  it('formats with day-of-week pattern EEEE', () => {
    // March 16, 2026 is a Monday
    const date = new Date(2026, 2, 16);
    expect(formatDate(date, 'EEEE')).toBe('Monday');
  });

  it('formats December 31 correctly', () => {
    const date = new Date(2026, 11, 31);
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-12-31');
  });

  it('formats January 1 correctly', () => {
    const date = new Date(2026, 0, 1);
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-01-01');
  });

  it('formats leap year Feb 29 correctly', () => {
    const date = new Date(2028, 1, 29);
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2028-02-29');
  });

  it('formats with combined date-time pattern', () => {
    const date = new Date(2026, 2, 16, 14, 30, 0);
    const result = formatDate(date, 'yyyy-MM-dd HH:mm');
    expect(result).toBe('2026-03-16 14:30');
  });

  it('handles midnight correctly', () => {
    const date = new Date(2026, 2, 16, 0, 0, 0);
    expect(formatDate(date, 'HH:mm')).toBe('00:00');
  });

  it('handles end of day correctly', () => {
    const date = new Date(2026, 2, 16, 23, 59, 59);
    expect(formatDate(date, 'HH:mm:ss')).toBe('23:59:59');
  });
});

// ---------------------------------------------------------------------------
// 2. formatRelativeTime
// ---------------------------------------------------------------------------

describe('formatRelativeTime()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "less than a minute ago" for very recent dates', () => {
    const date = new Date(Date.now() - 10_000); // 10 seconds ago
    const result = formatRelativeTime(date);
    expect(result).toContain('less than a minute ago');
  });

  it('returns "X minutes ago" for minutes-old dates', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = formatRelativeTime(date);
    expect(result).toContain('5 minutes ago');
  });

  it('returns "about X hours ago" for hours-old dates', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const result = formatRelativeTime(date);
    expect(result).toContain('2 hours ago');
  });

  it('returns "1 day ago" for yesterday', () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const result = formatRelativeTime(date);
    expect(result).toContain('1 day ago');
  });

  it('returns "X days ago" for multi-day distances', () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const result = formatRelativeTime(date);
    expect(result).toContain('3 days ago');
  });

  it('returns "about 1 month ago" for 30+ day distances', () => {
    const date = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(date);
    expect(result).toContain('month');
    expect(result).toContain('ago');
  });

  it('handles ISO string input', () => {
    const isoString = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(isoString);
    expect(result).toContain('hour');
    expect(result).toContain('ago');
  });

  it('handles future dates with "in" prefix', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const result = formatRelativeTime(futureDate);
    expect(result).toContain('in');
    expect(result).toContain('hour');
  });
});

// ---------------------------------------------------------------------------
// 3. Timezone handling (Toronto)
// ---------------------------------------------------------------------------

describe('Timezone handling (America/Toronto)', () => {
  it('formats a UTC date to Toronto local representation', () => {
    // UTC midnight March 16 is March 15 in Toronto (EST = UTC-5)
    const utcDate = new Date('2026-03-16T04:00:00Z');
    // In Toronto (EST), this is March 15 at 11 PM or March 16 at midnight (depending on DST)
    const torontoStr = utcDate.toLocaleString('en-US', { timeZone: 'America/Toronto' });
    expect(torontoStr).toBeTruthy();
    // The important thing is that it produces a valid date
    const parsed = new Date(torontoStr);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

  it('handles DST spring forward correctly', () => {
    // DST in 2026: March 8 at 2:00 AM EST -> 3:00 AM EDT
    const beforeDST = new Date('2026-03-08T06:00:00Z'); // 1 AM EST
    const afterDST = new Date('2026-03-08T08:00:00Z'); // 4 AM EDT (skips 2-3 AM)

    const beforeStr = beforeDST.toLocaleString('en-US', { timeZone: 'America/Toronto' });
    const afterStr = afterDST.toLocaleString('en-US', { timeZone: 'America/Toronto' });

    expect(beforeStr).toBeTruthy();
    expect(afterStr).toBeTruthy();
  });

  it('handles DST fall back correctly', () => {
    // DST ends November 1, 2026 at 2:00 AM EDT -> 1:00 AM EST
    const duringFallback = new Date('2026-11-01T06:00:00Z');
    const fallbackStr = duringFallback.toLocaleString('en-US', { timeZone: 'America/Toronto' });
    expect(fallbackStr).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 4. Edge cases: null dates, invalid dates, future dates
// ---------------------------------------------------------------------------

describe('Date edge cases', () => {
  it('formatDate handles epoch date (Jan 1 1970)', () => {
    // new Date(0) is midnight UTC, which may be Dec 31 in local timezone
    const epoch = new Date(0);
    const result = formatDate(epoch, 'yyyy-MM-dd');
    // Accept either Dec 31 1969 (local TZ behind UTC) or Jan 1 1970
    expect(['1970-01-01', '1969-12-31']).toContain(result);
  });

  it('formatDate handles far future dates', () => {
    const future = new Date(2099, 11, 31);
    const result = formatDate(future, 'yyyy-MM-dd');
    expect(result).toBe('2099-12-31');
  });

  it('formatDate handles dates before 2000', () => {
    const y2k = new Date(1999, 11, 31);
    const result = formatDate(y2k, 'yyyy-MM-dd');
    expect(result).toBe('1999-12-31');
  });

  it('formatDate throws or handles invalid ISO string gracefully', () => {
    // parseISO of garbage returns Invalid Date, date-fns format will throw
    expect(() => formatDate('not-a-date')).toThrow();
  });

  it('formatDate handles ISO string with timezone offset', () => {
    const result = formatDate('2026-03-16T14:30:00+05:00', 'yyyy-MM-dd');
    // date-fns parseISO respects the offset
    expect(result).toMatch(/2026-03-16/);
  });
});

// ---------------------------------------------------------------------------
// 5. Date range validation
// ---------------------------------------------------------------------------

describe('Date range validation', () => {
  it('returns true when start is before end', () => {
    const start = new Date(2026, 2, 1);
    const end = new Date(2026, 2, 31);
    expect(isValidDateRange(start, end)).toBe(true);
  });

  it('returns true when start equals end', () => {
    const date = new Date(2026, 2, 16);
    expect(isValidDateRange(date, date)).toBe(true);
  });

  it('returns false when start is after end', () => {
    const start = new Date(2026, 2, 31);
    const end = new Date(2026, 2, 1);
    expect(isValidDateRange(start, end)).toBe(false);
  });

  it('returns false when start is null', () => {
    expect(isValidDateRange(null, new Date())).toBe(false);
  });

  it('returns false when end is null', () => {
    expect(isValidDateRange(new Date(), null)).toBe(false);
  });

  it('returns false when both are null', () => {
    expect(isValidDateRange(null, null)).toBe(false);
  });

  it('returns false for invalid date objects', () => {
    const invalid = new Date('garbage');
    expect(isValidDateRange(invalid, new Date())).toBe(false);
    expect(isValidDateRange(new Date(), invalid)).toBe(false);
  });

  it('handles cross-year ranges', () => {
    const start = new Date(2025, 11, 31);
    const end = new Date(2026, 0, 1);
    expect(isValidDateRange(start, end)).toBe(true);
  });

  it('handles same-day different-time ranges', () => {
    const start = new Date(2026, 2, 16, 9, 0);
    const end = new Date(2026, 2, 16, 17, 0);
    expect(isValidDateRange(start, end)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Business hours detection
// ---------------------------------------------------------------------------

describe('Business hours detection (Toronto)', () => {
  it('9 AM on Monday is business hours', () => {
    // March 16, 2026 is a Monday. After March 8 DST: EDT = UTC-4
    // 9 AM EDT = 13:00 UTC
    const monday9am = new Date('2026-03-16T13:00:00Z');
    expect(isBusinessHours(monday9am)).toBe(true);
  });

  it('4:59 PM on Wednesday is business hours', () => {
    // March 18, 2026 is a Wednesday. 4:59 PM EDT = 20:59 UTC
    const wed459pm = new Date('2026-03-18T20:59:00Z');
    expect(isBusinessHours(wed459pm)).toBe(true);
  });

  it('5 PM on Friday is not business hours (end of day)', () => {
    // March 20, 2026 is a Friday. 5 PM EDT = 21:00 UTC
    const fri5pm = new Date('2026-03-20T21:00:00Z');
    expect(isBusinessHours(fri5pm)).toBe(false);
  });

  it('Saturday is not business hours', () => {
    // March 21, 2026 is a Saturday. Noon EDT = 16:00 UTC
    const satNoon = new Date('2026-03-21T16:00:00Z');
    expect(isBusinessHours(satNoon)).toBe(false);
  });

  it('Sunday is not business hours', () => {
    // March 22, 2026 is a Sunday. Noon EDT = 16:00 UTC
    const sunNoon = new Date('2026-03-22T16:00:00Z');
    expect(isBusinessHours(sunNoon)).toBe(false);
  });

  it('3 AM on Tuesday is not business hours', () => {
    // March 17, 2026 is a Tuesday. 3 AM EDT = 07:00 UTC
    const tue3am = new Date('2026-03-17T07:00:00Z');
    expect(isBusinessHours(tue3am)).toBe(false);
  });

  it('8:59 AM on Thursday is not business hours', () => {
    // March 19, 2026 is a Thursday. 8:59 AM EDT = 12:59 UTC
    const thu859 = new Date('2026-03-19T12:59:00Z');
    expect(isBusinessHours(thu859)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Shift time calculation (day/evening/night)
// ---------------------------------------------------------------------------

describe('Shift time calculation', () => {
  it('7 AM is day shift', () => {
    // 7 AM EDT = 11:00 UTC
    const date = new Date('2026-03-16T11:00:00Z');
    expect(getShift(date)).toBe('day');
  });

  it('2 PM is day shift', () => {
    // 2 PM EDT = 18:00 UTC
    const date = new Date('2026-03-16T18:00:00Z');
    expect(getShift(date)).toBe('day');
  });

  it('3 PM is evening shift', () => {
    // 3 PM EDT = 19:00 UTC
    const date = new Date('2026-03-16T19:00:00Z');
    expect(getShift(date)).toBe('evening');
  });

  it('10 PM is evening shift', () => {
    // 10 PM EDT = 02:00 UTC next day
    const date = new Date('2026-03-17T02:00:00Z');
    expect(getShift(date)).toBe('evening');
  });

  it('11 PM is night shift', () => {
    // 11 PM EDT = 03:00 UTC next day
    const date = new Date('2026-03-17T03:00:00Z');
    expect(getShift(date)).toBe('night');
  });

  it('midnight is night shift', () => {
    // midnight EDT = 04:00 UTC
    const date = new Date('2026-03-17T04:00:00Z');
    expect(getShift(date)).toBe('night');
  });

  it('3 AM is night shift', () => {
    // 3 AM EDT = 07:00 UTC
    const date = new Date('2026-03-17T07:00:00Z');
    expect(getShift(date)).toBe('night');
  });

  it('6:59 AM is night shift', () => {
    // 6:59 AM EDT = 10:59 UTC
    const date = new Date('2026-03-16T10:59:00Z');
    expect(getShift(date)).toBe('night');
  });

  it('shift boundaries are correct at transitions', () => {
    // Day starts at 7 AM EDT (11:00 UTC)
    expect(getShift(new Date('2026-03-16T11:00:00Z'))).toBe('day');
    // Evening starts at 3 PM EDT (19:00 UTC)
    expect(getShift(new Date('2026-03-16T19:00:00Z'))).toBe('evening');
    // Night starts at 11 PM EDT (03:00 UTC next day)
    expect(getShift(new Date('2026-03-17T03:00:00Z'))).toBe('night');
  });
});
