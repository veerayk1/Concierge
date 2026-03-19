/**
 * Concierge — Internationalization (i18n) Module
 *
 * Provides locale-aware translation, date/number/currency formatting.
 * Supports English (en) and French-Canadian (fr-CA) per Phase 1.
 *
 * @see docs/tech/INTERNATIONALIZATION.md
 */

import IntlMessageFormat from 'intl-messageformat';
import { format, type Locale as DateFnsLocale } from 'date-fns';
import { enCA, frCA } from 'date-fns/locale';

import enMessages from '@/locales/en.json';
import frCAMessages from '@/locales/fr-CA.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const SUPPORTED_LOCALES = ['en', 'fr-CA'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface TranslationOverride {
  id: string;
  propertyId: string;
  locale: string;
  namespace: string;
  key: string;
  value: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslateOptions {
  locale?: SupportedLocale;
  /** Interpolation values and plural counts */
  [key: string]: unknown;
}

export interface UserPreference {
  preferredLocale?: SupportedLocale | null;
}

// ---------------------------------------------------------------------------
// Message registry
// ---------------------------------------------------------------------------

type MessageMap = Record<string, Record<string, string>>;

const messages: Record<SupportedLocale, MessageMap> = {
  en: enMessages as unknown as MessageMap,
  'fr-CA': frCAMessages as unknown as MessageMap,
};

// Runtime overrides keyed by `${propertyId}:${locale}:${namespace}.${key}`
const overrideCache = new Map<string, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated key (e.g. "dashboard.title") from a nested message map.
 */
function resolveKey(map: MessageMap, key: string): string | undefined {
  const parts = key.split('.');
  if (parts.length === 2) {
    const namespace = parts[0]!;
    const field = parts[1]!;
    return map[namespace]?.[field];
  }
  // Support deeper nesting by walking the tree (future-proof)
  // For now only 2-level nesting is used
  return undefined;
}

// ---------------------------------------------------------------------------
// Core translate function
// ---------------------------------------------------------------------------

/**
 * Translate a key with optional interpolation, pluralization, and locale override.
 *
 * @example
 *   t('dashboard.title')                             // "Dashboard"
 *   t('dashboard.title', { locale: 'fr-CA' })        // "Tableau de bord"
 *   t('welcome.greeting', { name: 'John' })           // "Welcome, John"
 *   t('packages.count', { count: 5 })                 // "5 packages"
 *   t('packages.count', { count: 5, locale: 'fr-CA'}) // "5 colis"
 */
export function t(key: string, options?: TranslateOptions): string {
  const { locale: localeOpt, ...values } = options ?? {};
  const locale: SupportedLocale = localeOpt ?? DEFAULT_LOCALE;

  // 1. Check override cache first
  // (overrides are loaded externally via applyTranslationOverrides)
  // We check for overrides matching any propertyId — the caller is responsible
  // for loading only the relevant property's overrides.
  for (const [cacheKey, cacheValue] of overrideCache) {
    const suffix = `:${locale}:${key}`;
    if (cacheKey.endsWith(suffix)) {
      const msg = new IntlMessageFormat(cacheValue, locale);
      return msg.format(values) as string;
    }
  }

  // 2. Look up from static message files
  const localeMessages = messages[locale] ?? messages[DEFAULT_LOCALE];
  const template = resolveKey(localeMessages, key);

  if (template === undefined) {
    // Fallback: try default locale
    if (locale !== DEFAULT_LOCALE) {
      const fallbackTemplate = resolveKey(messages[DEFAULT_LOCALE], key);
      if (fallbackTemplate !== undefined) {
        const msg = new IntlMessageFormat(fallbackTemplate, DEFAULT_LOCALE);
        return msg.format(values) as string;
      }
    }
    // Key not found anywhere — return the key itself (safe fallback)
    return key;
  }

  const msg = new IntlMessageFormat(template, locale);
  return msg.format(values) as string;
}

// ---------------------------------------------------------------------------
// Translation overrides (per-property customisation)
// ---------------------------------------------------------------------------

/**
 * Load translation overrides into the runtime cache.
 * Call this at app startup or when switching property context.
 */
export function applyTranslationOverrides(overrides: TranslationOverride[]): void {
  for (const o of overrides) {
    const cacheKey = `${o.propertyId}:${o.locale}:${o.namespace}.${o.key}`;
    overrideCache.set(cacheKey, o.value);
  }
}

/**
 * Clear all cached translation overrides.
 */
export function clearTranslationOverrides(): void {
  overrideCache.clear();
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const dateFnsLocaleMap: Record<SupportedLocale, DateFnsLocale> = {
  en: enCA,
  'fr-CA': frCA,
};

/**
 * Format a date using date-fns with locale awareness.
 *
 * @param date    - The date to format
 * @param locale  - Target locale (defaults to 'en')
 * @param pattern - date-fns format pattern (defaults to 'PPP')
 */
export function formatDate(
  date: Date,
  locale: SupportedLocale = DEFAULT_LOCALE,
  pattern: string = 'PPP',
): string {
  const dateFnsLocale = dateFnsLocaleMap[locale] ?? dateFnsLocaleMap[DEFAULT_LOCALE];
  return format(date, pattern, { locale: dateFnsLocale });
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number with locale-aware grouping and decimal separators.
 */
export function formatNumber(value: number, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

/**
 * Format an amount as currency.
 *
 * @param amount   - Numeric amount (NOT cents — the caller converts)
 * @param currency - ISO 4217 currency code (e.g. 'CAD', 'USD')
 * @param locale   - Target locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'CAD',
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

/**
 * Detect the preferred locale from a user preference object.
 * Falls back to the platform default if no preference is set.
 */
export function detectLocale(user?: UserPreference | null): SupportedLocale {
  if (user?.preferredLocale && SUPPORTED_LOCALES.includes(user.preferredLocale)) {
    return user.preferredLocale;
  }
  return DEFAULT_LOCALE;
}
