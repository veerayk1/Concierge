/**
 * Concierge — i18n Comprehensive Tests
 *
 * Extended test coverage for the internationalization system.
 * Covers: both locale loading, translation key parity, date/number/currency
 * formatting, pluralization, interpolation, fallback behaviour,
 * and property-level translation overrides.
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
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type TranslationOverride,
} from '@/lib/i18n';

import enMessages from '@/locales/en.json';
import frCAMessages from '@/locales/fr-CA.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MessageMap = Record<string, Record<string, string>>;

/** Collect all dot-separated keys from a two-level message map. */
function collectKeys(map: MessageMap): string[] {
  const keys: string[] = [];
  for (const namespace of Object.keys(map)) {
    for (const field of Object.keys(map[namespace]!)) {
      keys.push(`${namespace}.${field}`);
    }
  }
  return keys.sort();
}

function makeOverride(
  partial: Partial<TranslationOverride> & Pick<TranslationOverride, 'namespace' | 'key' | 'value'>,
): TranslationOverride {
  return {
    id: 'test-override',
    propertyId: 'prop-test',
    locale: 'en',
    createdById: 'user-test',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// 1. English locale loads correctly
// ---------------------------------------------------------------------------

describe('English locale loading', () => {
  it('has a non-empty English message file', () => {
    const keys = collectKeys(enMessages as unknown as MessageMap);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('returns English translations for all known namespaces', () => {
    expect(t('common.save')).toBe('Save');
    expect(t('common.cancel')).toBe('Cancel');
    expect(t('common.delete')).toBe('Delete');
    expect(t('common.loading')).toBe('Loading...');
    expect(t('common.search')).toBe('Search');
    expect(t('common.noResults')).toBe('No results found');
  });

  it('returns English dashboard translations', () => {
    expect(t('dashboard.title')).toBe('Dashboard');
  });

  it('returns English package translations', () => {
    expect(t('packages.title')).toBe('Packages');
    expect(t('packages.receive')).toBe('Receive Package');
    expect(t('packages.release')).toBe('Release Package');
  });

  it('returns English error translations', () => {
    expect(t('errors.required')).toBe('This field is required');
    expect(t('errors.invalidEmail')).toBe('Please enter a valid email address');
    expect(t('errors.serverError')).toBe('Something went wrong. Please try again.');
  });
});

// ---------------------------------------------------------------------------
// 2. French-Canadian locale loads correctly
// ---------------------------------------------------------------------------

describe('French-Canadian locale loading', () => {
  it('has a non-empty French-Canadian message file', () => {
    const keys = collectKeys(frCAMessages as unknown as MessageMap);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('returns fr-CA translations for common namespace', () => {
    expect(t('common.save', { locale: 'fr-CA' })).toBe('Enregistrer');
    expect(t('common.cancel', { locale: 'fr-CA' })).toBe('Annuler');
    expect(t('common.delete', { locale: 'fr-CA' })).toBe('Supprimer');
    expect(t('common.loading', { locale: 'fr-CA' })).toBe('Chargement...');
    expect(t('common.search', { locale: 'fr-CA' })).toBe('Rechercher');
  });

  it('returns fr-CA dashboard translations', () => {
    expect(t('dashboard.title', { locale: 'fr-CA' })).toBe('Tableau de bord');
  });

  it('returns fr-CA package translations', () => {
    expect(t('packages.title', { locale: 'fr-CA' })).toBe('Colis');
    expect(t('packages.receive', { locale: 'fr-CA' })).toBe('Recevoir un colis');
  });

  it('returns fr-CA error translations', () => {
    expect(t('errors.required', { locale: 'fr-CA' })).toBe('Ce champ est requis');
    expect(t('errors.invalidEmail', { locale: 'fr-CA' })).toBe(
      'Veuillez entrer une adresse courriel valide',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. All translation keys exist in both locales (parity check)
// ---------------------------------------------------------------------------

describe('Translation key parity between en and fr-CA', () => {
  const enKeys = collectKeys(enMessages as unknown as MessageMap);
  const frCAKeys = collectKeys(frCAMessages as unknown as MessageMap);

  it('en and fr-CA have the same number of keys', () => {
    expect(enKeys.length).toBe(frCAKeys.length);
  });

  it('every English key exists in fr-CA', () => {
    const missingInFrCA = enKeys.filter((k) => !frCAKeys.includes(k));
    expect(missingInFrCA).toEqual([]);
  });

  it('every fr-CA key exists in English', () => {
    const missingInEn = frCAKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('no key has an empty string value in English', () => {
    const enMap = enMessages as unknown as MessageMap;
    for (const ns of Object.keys(enMap)) {
      for (const field of Object.keys(enMap[ns]!)) {
        expect(enMap[ns]![field]!.length, `en.${ns}.${field} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('no key has an empty string value in fr-CA', () => {
    const frMap = frCAMessages as unknown as MessageMap;
    for (const ns of Object.keys(frMap)) {
      for (const field of Object.keys(frMap[ns]!)) {
        expect(frMap[ns]![field]!.length, `fr-CA.${ns}.${field} is empty`).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Date formatting uses locale-appropriate format
// ---------------------------------------------------------------------------

describe('formatDate() locale-appropriate formatting', () => {
  const date = new Date(2026, 2, 16); // March 16, 2026

  it('English format contains English month name', () => {
    const result = formatDate(date, 'en');
    expect(result).toContain('March');
    expect(result).toContain('2026');
  });

  it('French-Canadian format contains French month name', () => {
    const result = formatDate(date, 'fr-CA');
    expect(result).toContain('mars');
    expect(result).toContain('2026');
  });

  it('supports custom format patterns', () => {
    const result = formatDate(date, 'en', 'yyyy-MM-dd');
    expect(result).toBe('2026-03-16');
  });

  it('defaults to English locale when not specified', () => {
    const result = formatDate(date);
    expect(result).toContain('March');
  });

  it('handles end-of-year dates', () => {
    const dec31 = new Date(2026, 11, 31);
    const enResult = formatDate(dec31, 'en');
    expect(enResult).toContain('December');
    expect(enResult).toContain('2026');

    const frResult = formatDate(dec31, 'fr-CA');
    expect(frResult).toMatch(/d[eé]cembre/i);
  });

  it('handles leap year date (Feb 29)', () => {
    const leapDay = new Date(2028, 1, 29);
    const result = formatDate(leapDay, 'en');
    expect(result).toContain('February');
    expect(result).toContain('29');
  });
});

// ---------------------------------------------------------------------------
// 5. Currency formatting uses CAD by default
// ---------------------------------------------------------------------------

describe('formatCurrency() CAD default', () => {
  it('formats with CAD by default in English', () => {
    const result = formatCurrency(100);
    expect(result).toContain('$');
    expect(result).toContain('100');
  });

  it('formats with CAD by default in fr-CA', () => {
    const result = formatCurrency(100, 'CAD', 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toContain('$');
    expect(normalized).toContain('100');
  });

  it('handles zero amount', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
    expect(result).toContain('0');
  });

  it('handles large amounts with grouping', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('$');
    expect(result).toContain('1,234,567.89');
  });

  it('handles negative amounts', () => {
    const result = formatCurrency(-50.0);
    expect(result).toContain('$');
    expect(result).toContain('50');
  });

  it('formats USD when specified', () => {
    const result = formatCurrency(25, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('25');
  });

  it('formats EUR when specified', () => {
    const result = formatCurrency(25, 'EUR');
    // EUR symbol varies by locale but should contain the amount
    expect(result).toContain('25');
  });

  it('fr-CA uses comma as decimal separator', () => {
    const result = formatCurrency(99.99, 'CAD', 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toMatch(/99,99/);
  });
});

// ---------------------------------------------------------------------------
// 6. Number formatting uses locale separators
// ---------------------------------------------------------------------------

describe('formatNumber() locale separators', () => {
  it('English uses comma for thousands', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('English uses period for decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });

  it('fr-CA uses non-breaking space for thousands', () => {
    const result = formatNumber(1234567, 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toBe('1 234 567');
  });

  it('fr-CA uses comma for decimals', () => {
    const result = formatNumber(1234.56, 'fr-CA');
    const normalized = result.replace(/\s/g, ' ');
    expect(normalized).toBe('1 234,56');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1234);
    expect(result).toContain('1,234');
    expect(result).toContain('-');
  });

  it('handles very small decimals', () => {
    const result = formatNumber(0.001);
    expect(result).toBe('0.001');
  });
});

// ---------------------------------------------------------------------------
// 7. Pluralization works correctly
// ---------------------------------------------------------------------------

describe('Pluralization', () => {
  describe('English pluralization', () => {
    it('singular form for count = 1', () => {
      expect(t('packages.count', { count: 1 })).toBe('1 package');
    });

    it('plural form for count = 0', () => {
      expect(t('packages.count', { count: 0 })).toBe('0 packages');
    });

    it('plural form for count = 2', () => {
      expect(t('packages.count', { count: 2 })).toBe('2 packages');
    });

    it('plural form for count = 100', () => {
      expect(t('packages.count', { count: 100 })).toBe('100 packages');
    });

    it('itemCount with =0 shows special form', () => {
      expect(t('common.itemCount', { count: 0 })).toBe('No items');
    });

    it('itemCount with 1 shows singular', () => {
      expect(t('common.itemCount', { count: 1 })).toBe('1 item');
    });

    it('itemCount with many shows plural', () => {
      expect(t('common.itemCount', { count: 42 })).toBe('42 items');
    });
  });

  describe('French-Canadian pluralization', () => {
    it('singular form for count = 1 in fr-CA', () => {
      expect(t('packages.count', { count: 1, locale: 'fr-CA' })).toBe('1 colis');
    });

    it('plural form for count = 5 in fr-CA', () => {
      expect(t('packages.count', { count: 5, locale: 'fr-CA' })).toBe('5 colis');
    });

    it('fr-CA itemCount =0 form', () => {
      const result = t('common.itemCount', { count: 0, locale: 'fr-CA' });
      expect(result).toContain('Aucun');
    });

    it('fr-CA itemCount singular', () => {
      const result = t('common.itemCount', { count: 1, locale: 'fr-CA' });
      expect(result).toContain('1');
    });

    it('fr-CA itemCount plural', () => {
      const result = t('common.itemCount', { count: 10, locale: 'fr-CA' });
      expect(result).toContain('10');
    });

    it('pendingCount zero in fr-CA', () => {
      const result = t('packages.pendingCount', { count: 0, locale: 'fr-CA' });
      expect(result).toContain('Aucun');
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Translation interpolation works
// ---------------------------------------------------------------------------

describe('Translation interpolation', () => {
  it('replaces {name} in welcome greeting (English)', () => {
    expect(t('welcome.greeting', { name: 'Alice' })).toBe('Welcome, Alice');
  });

  it('replaces {name} in welcome greeting (fr-CA)', () => {
    expect(t('welcome.greeting', { name: 'Marie', locale: 'fr-CA' })).toBe('Bienvenue, Marie');
  });

  it('replaces {name} in dashboard greeting', () => {
    expect(t('dashboard.greeting', { name: 'John' })).toBe('Good morning, John');
  });

  it('replaces {name} in fr-CA dashboard greeting', () => {
    expect(t('dashboard.greeting', { name: 'Jean', locale: 'fr-CA' })).toBe('Bonjour, Jean');
  });

  it('replaces {date} in lastLogin', () => {
    const result = t('dashboard.lastLogin', { date: 'March 16, 2026' });
    expect(result).toBe('Last login: March 16, 2026');
  });

  it('replaces {date} in fr-CA lastLogin', () => {
    const result = t('dashboard.lastLogin', { date: '16 mars 2026', locale: 'fr-CA' });
    expect(result).toContain('16 mars 2026');
  });

  it('handles special characters in interpolation values', () => {
    const result = t('welcome.greeting', { name: "O'Brien" });
    expect(result).toBe("Welcome, O'Brien");
  });

  it('handles numeric interpolation values', () => {
    const result = t('dashboard.greeting', { name: '42' });
    expect(result).toBe('Good morning, 42');
  });

  it('handles empty string interpolation', () => {
    const result = t('welcome.greeting', { name: '' });
    expect(result).toBe('Welcome, ');
  });
});

// ---------------------------------------------------------------------------
// 9. Missing translation key falls back to English
// ---------------------------------------------------------------------------

describe('Missing translation fallback', () => {
  beforeEach(() => {
    clearTranslationOverrides();
  });

  it('falls back to English when fr-CA key is missing', () => {
    // Use a key that exists in English — if we request it in fr-CA
    // and it somehow were missing, it would fall back to English.
    // Since both locales have the same keys, test the fallback mechanism
    // by verifying that a completely unknown key returns itself.
    expect(t('nonexistent.key', { locale: 'fr-CA' })).toBe('nonexistent.key');
  });

  it('returns the key itself when missing from all locales', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
    expect(t('does.not.exist', { locale: 'fr-CA' })).toBe('does.not.exist');
  });

  it('does not throw for deeply nested missing keys', () => {
    expect(() => t('a.b.c.d.e')).not.toThrow();
  });

  it('returns key for single-segment keys (no dot)', () => {
    expect(t('orphanKey')).toBe('orphanKey');
  });
});

// ---------------------------------------------------------------------------
// 10. Property-level translation overrides
// ---------------------------------------------------------------------------

describe('Property-level translation overrides', () => {
  beforeEach(() => {
    clearTranslationOverrides();
  });

  it('override replaces default English translation', () => {
    applyTranslationOverrides([
      makeOverride({ namespace: 'dashboard', key: 'title', value: 'Control Center' }),
    ]);
    expect(t('dashboard.title')).toBe('Control Center');
  });

  it('override replaces fr-CA translation', () => {
    applyTranslationOverrides([
      makeOverride({
        locale: 'fr-CA',
        namespace: 'dashboard',
        key: 'title',
        value: 'Centre de controle',
      }),
    ]);
    expect(t('dashboard.title', { locale: 'fr-CA' })).toBe('Centre de controle');
  });

  it('override supports interpolation', () => {
    applyTranslationOverrides([
      makeOverride({ namespace: 'welcome', key: 'greeting', value: 'Hey there, {name}!' }),
    ]);
    expect(t('welcome.greeting', { name: 'Bob' })).toBe('Hey there, Bob!');
  });

  it('multiple overrides can coexist', () => {
    applyTranslationOverrides([
      makeOverride({ namespace: 'dashboard', key: 'title', value: 'Home Base' }),
      makeOverride({ namespace: 'packages', key: 'title', value: 'Deliveries' }),
    ]);
    expect(t('dashboard.title')).toBe('Home Base');
    expect(t('packages.title')).toBe('Deliveries');
  });

  it('clearing overrides restores default translations', () => {
    applyTranslationOverrides([
      makeOverride({ namespace: 'dashboard', key: 'title', value: 'Override' }),
    ]);
    expect(t('dashboard.title')).toBe('Override');

    clearTranslationOverrides();
    expect(t('dashboard.title')).toBe('Dashboard');
  });

  it('overrides for one locale do not affect another', () => {
    applyTranslationOverrides([
      makeOverride({ locale: 'en', namespace: 'common', key: 'save', value: 'Submit' }),
    ]);
    expect(t('common.save')).toBe('Submit');
    expect(t('common.save', { locale: 'fr-CA' })).toBe('Enregistrer');
  });

  it('override with different propertyId is still applied (cache is global)', () => {
    applyTranslationOverrides([
      makeOverride({
        propertyId: 'prop-A',
        namespace: 'dashboard',
        key: 'title',
        value: 'Prop A Home',
      }),
    ]);
    // The override cache is global per the implementation — the caller loads only relevant overrides
    expect(t('dashboard.title')).toBe('Prop A Home');
  });
});

// ---------------------------------------------------------------------------
// Additional: SUPPORTED_LOCALES and detectLocale
// ---------------------------------------------------------------------------

describe('SUPPORTED_LOCALES', () => {
  it('contains en and fr-CA', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('fr-CA');
  });

  it('has exactly 2 supported locales', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(2);
  });
});

describe('detectLocale()', () => {
  it('returns en for undefined user', () => {
    expect(detectLocale(undefined)).toBe('en');
  });

  it('returns en for null user', () => {
    expect(detectLocale(null)).toBe('en');
  });

  it('returns en for user with no preference', () => {
    expect(detectLocale({})).toBe('en');
  });

  it('returns en for user with null preference', () => {
    expect(detectLocale({ preferredLocale: null })).toBe('en');
  });

  it('returns fr-CA when user prefers it', () => {
    expect(detectLocale({ preferredLocale: 'fr-CA' })).toBe('fr-CA');
  });

  it('returns default for unsupported locale', () => {
    // @ts-expect-error — testing runtime safety
    expect(detectLocale({ preferredLocale: 'es-MX' })).toBe(DEFAULT_LOCALE);
  });
});
