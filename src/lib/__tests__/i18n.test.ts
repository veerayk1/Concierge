/**
 * Concierge — i18n Module Tests
 *
 * TDD tests for the internationalization system.
 * Covers: translation lookup, interpolation, pluralization,
 * date/number/currency formatting, overrides, and language detection.
 *
 * @see docs/tech/INTERNATIONALIZATION.md
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  t,
  formatDate,
  formatNumber,
  formatCurrency,
  detectLocale,
  applyTranslationOverrides,
  clearTranslationOverrides,
  DEFAULT_LOCALE,
  type TranslationOverride,
} from '@/lib/i18n';

// ---------------------------------------------------------------------------
// 1. Default locale translation
// ---------------------------------------------------------------------------

describe('t() — default locale (en)', () => {
  it('returns the English string for a known key', () => {
    expect(t('dashboard.title')).toBe('Dashboard');
  });
});

// ---------------------------------------------------------------------------
// 2. French-Canadian translation
// ---------------------------------------------------------------------------

describe('t() — fr-CA locale', () => {
  it('returns the French string when locale is fr-CA', () => {
    expect(t('dashboard.title', { locale: 'fr-CA' })).toBe('Tableau de bord');
  });
});

// ---------------------------------------------------------------------------
// 3. Missing key returns the key itself
// ---------------------------------------------------------------------------

describe('t() — missing key', () => {
  it('returns the key string when the key does not exist', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('does not throw for missing keys', () => {
    expect(() => t('totally.missing.deep.key')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 4. Interpolation
// ---------------------------------------------------------------------------

describe('t() — interpolation', () => {
  it('replaces {name} placeholder with the provided value', () => {
    expect(t('welcome.greeting', { name: 'John' })).toBe('Welcome, John');
  });

  it('works with fr-CA interpolation', () => {
    expect(t('welcome.greeting', { name: 'Jean', locale: 'fr-CA' })).toBe('Bienvenue, Jean');
  });
});

// ---------------------------------------------------------------------------
// 5-6. Plural rules (English)
// ---------------------------------------------------------------------------

describe('t() — English plural rules', () => {
  it('uses singular form for count = 1', () => {
    expect(t('packages.count', { count: 1 })).toBe('1 package');
  });

  it('uses plural form for count > 1', () => {
    expect(t('packages.count', { count: 5 })).toBe('5 packages');
  });
});

// ---------------------------------------------------------------------------
// 7. French plural
// ---------------------------------------------------------------------------

describe('t() — French plural rules', () => {
  it('uses French plural form for count = 5', () => {
    expect(t('packages.count', { count: 5, locale: 'fr-CA' })).toBe('5 colis');
  });

  it('uses French singular form for count = 1', () => {
    expect(t('packages.count', { count: 1, locale: 'fr-CA' })).toBe('1 colis');
  });
});

// ---------------------------------------------------------------------------
// 8. Date formatting
// ---------------------------------------------------------------------------

describe('formatDate()', () => {
  // Use a fixed date to avoid timezone flakiness
  const date = new Date(2026, 2, 16); // March 16, 2026

  it('formats a date in English by default', () => {
    const result = formatDate(date);
    // date-fns PPP with enCA locale: "March 16th, 2026"
    expect(result).toContain('March');
    expect(result).toContain('2026');
  });

  it('formats a date in French-Canadian', () => {
    const result = formatDate(date, 'fr-CA');
    // date-fns PPP with frCA locale: "16 mars 2026"
    expect(result).toContain('mars');
    expect(result).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// 9. Number formatting
// ---------------------------------------------------------------------------

describe('formatNumber()', () => {
  it('formats a number with French-Canadian separators', () => {
    const result = formatNumber(1234.56, 'fr-CA');
    // fr-CA uses non-breaking space as thousands separator and comma as decimal
    // Normalize spaces for comparison
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toBe('1 234,56');
  });

  it('formats a number with English separators by default', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});

// ---------------------------------------------------------------------------
// 10. Currency formatting
// ---------------------------------------------------------------------------

describe('formatCurrency()', () => {
  it('formats CAD in fr-CA locale', () => {
    const result = formatCurrency(99.99, 'CAD', 'fr-CA');
    // Normalize non-breaking spaces for assertion
    const normalized = result.replace(/\s/g, ' ');
    // fr-CA CAD formatting uses comma as decimal separator and $ symbol
    expect(normalized).toMatch(/99,99/);
    expect(normalized).toContain('$');
  });

  it('formats CAD in English locale', () => {
    const result = formatCurrency(99.99, 'CAD', 'en');
    expect(result).toContain('$');
    expect(result).toContain('99.99');
  });
});

// ---------------------------------------------------------------------------
// 11. Translation overrides per property
// ---------------------------------------------------------------------------

describe('Translation overrides', () => {
  beforeEach(() => {
    clearTranslationOverrides();
  });

  it('uses an override value instead of the default translation', () => {
    const override: TranslationOverride = {
      id: 'override-1',
      propertyId: 'prop-123',
      locale: 'en',
      namespace: 'dashboard',
      key: 'title',
      value: 'Home',
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    applyTranslationOverrides([override]);
    expect(t('dashboard.title')).toBe('Home');
  });

  it('uses overrides for fr-CA locale', () => {
    const override: TranslationOverride = {
      id: 'override-2',
      propertyId: 'prop-123',
      locale: 'fr-CA',
      namespace: 'dashboard',
      key: 'title',
      value: 'Accueil',
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    applyTranslationOverrides([override]);
    expect(t('dashboard.title', { locale: 'fr-CA' })).toBe('Accueil');
  });

  it('falls back to default when overrides are cleared', () => {
    const override: TranslationOverride = {
      id: 'override-3',
      propertyId: 'prop-123',
      locale: 'en',
      namespace: 'dashboard',
      key: 'title',
      value: 'Home',
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    applyTranslationOverrides([override]);
    expect(t('dashboard.title')).toBe('Home');

    clearTranslationOverrides();
    expect(t('dashboard.title')).toBe('Dashboard');
  });
});

// ---------------------------------------------------------------------------
// 12. Language detection from user preference
// ---------------------------------------------------------------------------

describe('detectLocale()', () => {
  it('returns the user preferred locale when set', () => {
    expect(detectLocale({ preferredLocale: 'fr-CA' })).toBe('fr-CA');
  });

  it('returns default locale when user has no preference', () => {
    expect(detectLocale({ preferredLocale: null })).toBe(DEFAULT_LOCALE);
  });

  it('returns default locale when user is null', () => {
    expect(detectLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it('returns default locale when user is undefined', () => {
    expect(detectLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it('returns default locale for an unsupported locale value', () => {
    // @ts-expect-error — testing runtime safety with invalid value
    expect(detectLocale({ preferredLocale: 'de-DE' })).toBe(DEFAULT_LOCALE);
  });
});
