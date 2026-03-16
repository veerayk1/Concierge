/**
 * Concierge — General Utility Functions
 *
 * Pure utility functions used across the application.
 * All functions are tree-shakeable and have no side effects.
 *
 * @module lib/utils
 */

import { type ClassValue, clsx } from 'clsx';
import { format as dateFnsFormat, formatDistanceToNow, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';

// ---------------------------------------------------------------------------
// Class Name Merging
// ---------------------------------------------------------------------------

/**
 * Merges class names using clsx + tailwind-merge.
 * Handles conditional classes and resolves Tailwind conflicts.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random request ID (UUID v4).
 * Uses the Web Crypto API (available in Node 19+ and all modern browsers).
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// PII Masking (Security Rulebook G.2)
// ---------------------------------------------------------------------------

/**
 * Masks an email address for log output.
 * `john.doe@example.com` becomes `j***@example.com`.
 *
 * Per Security Rulebook G.2.2.
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);

  if (localPart.length <= 1) {
    return `${localPart}***${domain}`;
  }

  return `${localPart[0]}***${domain}`;
}

/**
 * Masks an IP address for general application logs.
 * `192.168.1.42` becomes `192.168.***`.
 * `2001:0db8:85a3::8a2e:0370:7334` becomes `2001:0db8:***`.
 *
 * Per Security Rulebook G.2.3.
 */
export function maskIp(ip: string): string {
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}.***`;
    }
    return '***';
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:***`;
    }
    return '***';
  }

  return '***';
}

// ---------------------------------------------------------------------------
// Date Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a date using date-fns.
 *
 * @param date - Date object or ISO 8601 string.
 * @param formatStr - date-fns format string. Defaults to 'MMM d, yyyy h:mm a'.
 *
 * @example
 * formatDate(new Date()) // "Mar 16, 2026 2:30 PM"
 * formatDate('2026-03-16T14:30:00Z', 'yyyy-MM-dd') // "2026-03-16"
 */
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return dateFnsFormat(parsed, formatStr);
}

/**
 * Returns a human-readable relative time string.
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 60000)) // "1 minute ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
}

// ---------------------------------------------------------------------------
// Async Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a promise that resolves after the specified delay.
 * Useful for debouncing, retry backoff, and testing.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// Environment Detection
// ---------------------------------------------------------------------------

/** Returns true if running on the server (Node.js), false in the browser. */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/** Returns true if running in the browser. */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// ---------------------------------------------------------------------------
// String Utilities
// ---------------------------------------------------------------------------

/**
 * Truncates a string to the specified length with an ellipsis.
 *
 * @example
 * truncate('Hello, World!', 8) // "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, Math.max(0, maxLength - 3))}...`;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @example
 * capitalize('hello') // "Hello"
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a snake_case or kebab-case string to a display label.
 *
 * @example
 * toDisplayLabel('front_desk') // "Front Desk"
 * toDisplayLabel('in-progress') // "In Progress"
 */
export function toDisplayLabel(str: string): string {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

// ---------------------------------------------------------------------------
// Number Formatting
// ---------------------------------------------------------------------------

/**
 * Formats a number with locale-appropriate separators.
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number, locale: string = 'en-CA'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formats a number as currency (CAD by default).
 *
 * @example
 * formatCurrency(1234.5) // "$1,234.50"
 */
export function formatCurrency(
  value: number,
  currency: string = 'CAD',
  locale: string = 'en-CA',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Object Utilities
// ---------------------------------------------------------------------------

/**
 * Removes undefined and null values from an object.
 * Useful for building query parameters and API payloads.
 */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Type-safe Object.keys that returns typed keys.
 */
export function typedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}
