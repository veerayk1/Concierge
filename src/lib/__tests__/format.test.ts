/**
 * Tests for the canonical date / currency formatters in src/lib/format.ts.
 * These are pure functions, so the tests pin exact output (en-CA locale).
 */

import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
} from '../format';

const D = new Date('2026-05-30T19:30:00Z');

describe('formatDate', () => {
  it('formats a full date', () => {
    // en-CA "MMM D, YYYY"
    expect(formatDate('2026-05-30T12:00:00Z')).toMatch(/May 30, 2026/);
  });
  it('returns an em-dash for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
  it('accepts a Date object', () => {
    expect(formatDate(D)).toMatch(/2026/);
  });
});

describe('formatDateShort', () => {
  it('omits the year', () => {
    const out = formatDateShort('2026-05-30T12:00:00Z');
    expect(out).toMatch(/May 30/);
    expect(out).not.toMatch(/2026/);
  });
});

describe('formatTime', () => {
  it('renders an h:mm time', () => {
    expect(formatTime(D)).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-05-30T12:00:00Z').getTime();
  it('says "just now" for <1 min', () => {
    expect(formatRelative(new Date(now - 30 * 1000), now)).toBe('just now');
  });
  it('uses minutes for <1 hr', () => {
    expect(formatRelative(new Date(now - 10 * 60 * 1000), now)).toBe('10 min ago');
  });
  it('uses hours for <1 day', () => {
    expect(formatRelative(new Date(now - 5 * 60 * 60 * 1000), now)).toBe('5 hr ago');
  });
  it('says "yesterday" for 1 day', () => {
    expect(formatRelative(new Date(now - 26 * 60 * 60 * 1000), now)).toBe('yesterday');
  });
  it('falls back to a short date for old dates', () => {
    expect(formatRelative(new Date(now - 30 * 24 * 60 * 60 * 1000), now)).toMatch(
      /[A-Z][a-z]{2} \d/,
    );
  });
  it('returns em-dash for invalid', () => {
    expect(formatRelative('garbage')).toBe('—');
  });
});

describe('formatCurrency', () => {
  it('treats the input as cents', () => {
    expect(formatCurrency(123456)).toMatch(/1,234\.56/);
  });
  it('renders zero', () => {
    expect(formatCurrency(0)).toMatch(/0\.00/);
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatPercent', () => {
  it('takes a 0-100 value', () => {
    expect(formatPercent(12.5)).toMatch(/12\.5\s*%/);
  });
});
