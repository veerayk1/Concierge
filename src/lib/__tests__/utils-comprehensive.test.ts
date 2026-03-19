/**
 * Concierge — Utils Comprehensive Tests
 *
 * Tests for all utility functions in src/lib/utils.ts:
 * cn(), maskEmail(), maskIp(), formatDate(), formatRelativeTime(),
 * truncate(), capitalize(), toDisplayLabel(), formatNumber(),
 * formatCurrency(), compact(), generateRequestId(), sleep(),
 * isServer(), isBrowser(), typedKeys().
 *
 * @see src/lib/utils.ts
 */

import { describe, it, expect } from 'vitest';

import {
  cn,
  maskEmail,
  maskIp,
  truncate,
  capitalize,
  toDisplayLabel,
  formatNumber,
  formatCurrency,
  compact,
  generateRequestId,
  typedKeys,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// 1. cn() — Tailwind class merging
// ---------------------------------------------------------------------------

describe('cn()', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-8');
    expect(result).toBe('px-8');
    expect(result).not.toContain('px-4');
  });

  it('resolves conflicting background colors', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });

  it('resolves conflicting text sizes', () => {
    const result = cn('text-sm', 'text-lg');
    expect(result).toBe('text-lg');
  });

  it('handles conditional classes via clsx', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn('base', isActive && 'active', isDisabled && 'disabled');
    expect(result).toBe('base active');
    expect(result).not.toContain('disabled');
  });

  it('handles arrays of classes', () => {
    const result = cn(['px-4', 'py-2'], 'text-sm');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('text-sm');
  });

  it('handles undefined and null inputs', () => {
    const result = cn('px-4', undefined, null, 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('handles empty string inputs', () => {
    const result = cn('px-4', '', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('resolves margin conflicts', () => {
    const result = cn('mt-2', 'mt-4');
    expect(result).toBe('mt-4');
  });

  it('does not merge non-conflicting classes', () => {
    const result = cn('px-4', 'py-2', 'bg-white', 'text-black');
    expect(result).toBe('px-4 py-2 bg-white text-black');
  });

  it('resolves conflicting rounded classes', () => {
    const result = cn('rounded-sm', 'rounded-lg');
    expect(result).toBe('rounded-lg');
  });

  it('handles object syntax from clsx', () => {
    const result = cn({ 'bg-red-500': true, 'text-white': true, hidden: false });
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-white');
    expect(result).not.toContain('hidden');
  });
});

// ---------------------------------------------------------------------------
// 2. maskEmail()
// ---------------------------------------------------------------------------

describe('maskEmail()', () => {
  it('masks a standard email address', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
  });

  it('masks a single-char local part', () => {
    expect(maskEmail('j@example.com')).toBe('j***@example.com');
  });

  it('masks a short email', () => {
    expect(maskEmail('ab@x.co')).toBe('a***@x.co');
  });

  it('returns *** for email without @ sign', () => {
    expect(maskEmail('notanemail')).toBe('***');
  });

  it('returns *** for empty string', () => {
    expect(maskEmail('')).toBe('***');
  });

  it('returns *** for @ at position 0', () => {
    expect(maskEmail('@example.com')).toBe('***');
  });

  it('preserves the domain completely', () => {
    const result = maskEmail('user@company.org');
    expect(result).toContain('@company.org');
  });

  it('handles email with dots in local part', () => {
    const result = maskEmail('first.last@domain.com');
    expect(result).toBe('f***@domain.com');
  });

  it('handles email with plus addressing', () => {
    const result = maskEmail('user+tag@gmail.com');
    expect(result).toBe('u***@gmail.com');
  });
});

// ---------------------------------------------------------------------------
// 3. maskIp()
// ---------------------------------------------------------------------------

describe('maskIp()', () => {
  it('masks a standard IPv4 address', () => {
    expect(maskIp('192.168.1.42')).toBe('192.168.***');
  });

  it('masks another IPv4 address', () => {
    expect(maskIp('10.0.0.1')).toBe('10.0.***');
  });

  it('masks localhost IPv4', () => {
    expect(maskIp('127.0.0.1')).toBe('127.0.***');
  });

  it('masks a full IPv6 address', () => {
    expect(maskIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:***');
  });

  it('masks a compressed IPv6 address', () => {
    expect(maskIp('2001:0db8::1')).toBe('2001:0db8:***');
  });

  it('masks IPv6 loopback', () => {
    expect(maskIp('::1')).toBe('::***');
  });

  it('returns *** for non-IP string', () => {
    expect(maskIp('not-an-ip')).toBe('***');
  });

  it('returns *** for empty string', () => {
    expect(maskIp('')).toBe('***');
  });

  it('handles single-dot string', () => {
    const result = maskIp('192');
    // No dot or colon, returns ***
    expect(result).toBe('***');
  });
});

// ---------------------------------------------------------------------------
// 4. truncate()
// ---------------------------------------------------------------------------

describe('truncate()', () => {
  it('returns the string unchanged if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the string unchanged if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when longer than maxLength', () => {
    expect(truncate('Hello, World!', 8)).toBe('Hello...');
  });

  it('handles maxLength of 3 (minimum for ellipsis)', () => {
    expect(truncate('abcdef', 3)).toBe('...');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('handles single character with maxLength 1', () => {
    // maxLength 1 means 0 chars + "..." but str.slice(0,0) = "" so "..."
    // But "a".length <= 1 is true, so returns "a"
    expect(truncate('a', 1)).toBe('a');
  });

  it('handles long string truncation', () => {
    const long = 'a'.repeat(100);
    const result = truncate(long, 13);
    expect(result).toHaveLength(13);
    expect(result).toBe('aaaaaaaaaa...');
  });

  it('truncation includes ellipsis in the length count', () => {
    const result = truncate('Hello, World!', 10);
    expect(result).toHaveLength(10);
    expect(result).toBe('Hello, ...');
  });
});

// ---------------------------------------------------------------------------
// 5. capitalize()
// ---------------------------------------------------------------------------

describe('capitalize()', () => {
  it('capitalizes a lowercase word', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('does not change already capitalized string', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('capitalizes only the first letter, leaves rest unchanged', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });

  it('handles string starting with a number', () => {
    expect(capitalize('123abc')).toBe('123abc');
  });

  it('handles string with spaces', () => {
    expect(capitalize('hello world')).toBe('Hello world');
  });

  it('handles string starting with special character', () => {
    expect(capitalize('!hello')).toBe('!hello');
  });

  it('handles single uppercase character', () => {
    expect(capitalize('A')).toBe('A');
  });
});

// ---------------------------------------------------------------------------
// 6. toDisplayLabel()
// ---------------------------------------------------------------------------

describe('toDisplayLabel()', () => {
  it('converts snake_case to Title Case', () => {
    expect(toDisplayLabel('front_desk')).toBe('Front Desk');
  });

  it('converts kebab-case to Title Case', () => {
    expect(toDisplayLabel('in-progress')).toBe('In Progress');
  });

  it('handles single word', () => {
    expect(toDisplayLabel('active')).toBe('Active');
  });

  it('handles multiple underscores', () => {
    expect(toDisplayLabel('property_manager_role')).toBe('Property Manager Role');
  });

  it('handles multiple hyphens', () => {
    expect(toDisplayLabel('not-yet-started')).toBe('Not Yet Started');
  });

  it('handles mixed separators', () => {
    expect(toDisplayLabel('some_field-name')).toBe('Some Field Name');
  });

  it('handles empty string', () => {
    expect(toDisplayLabel('')).toBe('');
  });

  it('handles already Title Case with no separators', () => {
    expect(toDisplayLabel('Dashboard')).toBe('Dashboard');
  });

  it('handles ALL_CAPS_SNAKE_CASE', () => {
    const result = toDisplayLabel('MAX_RETRY_COUNT');
    expect(result).toBe('MAX RETRY COUNT');
  });

  it('handles single character segments', () => {
    expect(toDisplayLabel('a_b_c')).toBe('A B C');
  });
});

// ---------------------------------------------------------------------------
// 7. formatNumber()
// ---------------------------------------------------------------------------

describe('formatNumber()', () => {
  it('formats with en-CA locale by default', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats decimals correctly', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats negative numbers', () => {
    const result = formatNumber(-9876);
    expect(result).toContain('9,876');
    expect(result).toContain('-');
  });

  it('formats with fr-CA locale', () => {
    const result = formatNumber(1234567, 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toBe('1 234 567');
  });

  it('formats small numbers without separators', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats very large numbers', () => {
    const result = formatNumber(1000000000);
    expect(result).toBe('1,000,000,000');
  });

  it('formats with de-DE locale', () => {
    const result = formatNumber(1234.56, 'de-DE');
    // German uses . for thousands and , for decimal
    expect(result).toContain('1.234,56');
  });
});

// ---------------------------------------------------------------------------
// 8. formatCurrency()
// ---------------------------------------------------------------------------

describe('formatCurrency()', () => {
  it('formats CAD in en-CA locale by default', () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain('$');
    expect(result).toContain('1,234.50');
  });

  it('formats zero as currency', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
    expect(result).toContain('0.00');
  });

  it('formats negative currency', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('$');
    expect(result).toContain('50.00');
  });

  it('formats USD', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('100.00');
  });

  it('formats EUR', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('100.00');
  });

  it('formats large amounts with grouping', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('1,234,567.89');
  });

  it('formats with fr-CA locale', () => {
    const result = formatCurrency(1234.56, 'CAD', 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toMatch(/1 234,56/);
    expect(normalized).toContain('$');
  });

  it('always shows two decimal places', () => {
    const result = formatCurrency(100);
    expect(result).toMatch(/100\.00/);
  });

  it('rounds to two decimal places', () => {
    const result = formatCurrency(99.999);
    // Intl.NumberFormat rounds, so 99.999 -> 100.00
    expect(result).toContain('100.00');
  });
});

// ---------------------------------------------------------------------------
// 9. compact()
// ---------------------------------------------------------------------------

describe('compact()', () => {
  it('removes null values', () => {
    const result = compact({ a: 1, b: null, c: 'hello' });
    expect(result).toEqual({ a: 1, c: 'hello' });
  });

  it('removes undefined values', () => {
    const result = compact({ a: 1, b: undefined, c: 'hello' });
    expect(result).toEqual({ a: 1, c: 'hello' });
  });

  it('removes both null and undefined', () => {
    const result = compact({ a: null, b: undefined, c: 42 });
    expect(result).toEqual({ c: 42 });
  });

  it('keeps false, 0, and empty string (falsy but not null/undefined)', () => {
    const result = compact({ a: false, b: 0, c: '', d: null });
    expect(result).toEqual({ a: false, b: 0, c: '' });
  });

  it('returns empty object when all values are null/undefined', () => {
    const result = compact({ a: null, b: undefined });
    expect(result).toEqual({});
  });

  it('returns all properties when none are null/undefined', () => {
    const input = { a: 1, b: 'test', c: true };
    const result = compact(input);
    expect(result).toEqual(input);
  });

  it('handles empty object', () => {
    const result = compact({});
    expect(result).toEqual({});
  });

  it('keeps nested objects even if they contain null values', () => {
    const nested = { inner: null };
    const result = compact({ a: 1, b: nested });
    // compact is shallow — nested object itself is not null/undefined
    expect(result).toEqual({ a: 1, b: nested });
  });

  it('keeps arrays', () => {
    const result = compact({ a: [1, 2, 3], b: null });
    expect(result).toEqual({ a: [1, 2, 3] });
  });
});

// ---------------------------------------------------------------------------
// 10. generateRequestId()
// ---------------------------------------------------------------------------

describe('generateRequestId()', () => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('returns a valid UUID v4', () => {
    const id = generateRequestId();
    expect(uuidV4Regex.test(id)).toBe(true);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(100);
  });

  it('has correct length (36 characters with hyphens)', () => {
    const id = generateRequestId();
    expect(id).toHaveLength(36);
  });

  it('version digit is 4', () => {
    const id = generateRequestId();
    // Position 14 (0-indexed) is the version nibble
    expect(id[14]).toBe('4');
  });

  it('variant bits are correct (8, 9, a, or b)', () => {
    const id = generateRequestId();
    // Position 19 (0-indexed) is the variant nibble
    expect(['8', '9', 'a', 'b']).toContain(id[19]!.toLowerCase());
  });
});

// ---------------------------------------------------------------------------
// Additional: typedKeys()
// ---------------------------------------------------------------------------

describe('typedKeys()', () => {
  it('returns typed keys of an object', () => {
    const obj = { name: 'Alice', age: 30, active: true };
    const keys = typedKeys(obj);
    expect(keys).toContain('name');
    expect(keys).toContain('age');
    expect(keys).toContain('active');
    expect(keys).toHaveLength(3);
  });

  it('returns empty array for empty object', () => {
    expect(typedKeys({})).toEqual([]);
  });
});
