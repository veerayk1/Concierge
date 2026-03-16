# Concierge — Internationalization (i18n) Strategy

> **Version**: 1.0 | **Date**: 2026-03-16 | **Status**: APPROVED
>
> This document defines how the Concierge platform supports multiple languages, currencies,
> date formats, and text directions. Every developer must follow these patterns when adding
> user-facing text to any component, page, or email template.

---

## Table of Contents

1. [Rollout Phases](#1-rollout-phases)
2. [Library Choice](#2-library-choice)
3. [Message File Structure](#3-message-file-structure)
4. [Locale Detection & Resolution](#4-locale-detection--resolution)
5. [URL Strategy](#5-url-strategy)
6. [Component Patterns](#6-component-patterns)
7. [Pluralization & ICU Message Format](#7-pluralization--icu-message-format)
8. [Currency Formatting](#8-currency-formatting)
9. [Date & Time Formatting](#9-date--time-formatting)
10. [Number Formatting](#10-number-formatting)
11. [Content Translation Workflow](#11-content-translation-workflow)
12. [RTL Support](#12-rtl-support)
13. [Design Token Impact](#13-design-token-impact)
14. [Testing](#14-testing)
15. [Developer Checklist](#15-developer-checklist)

---

## 1. Rollout Phases

| Phase       | Languages                                                          | Timeline  | Notes                                                                        |
| ----------- | ------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------- |
| **Phase 1** | English (`en`), French-Canadian (`fr-CA`)                          | v1 launch | Canada is the primary market. French-Canadian is legally required in Quebec. |
| **Phase 2** | Spanish (`es`), Simplified Chinese (`zh-CN`), Portuguese (`pt-BR`) | v2        | Top condo markets in North America.                                          |
| **Phase 3** | Arabic (`ar`), Hebrew (`he`)                                       | v3        | RTL language support. Requires layout mirroring.                             |

### Phase 1 Requirements

- Every user-facing string must be extracted to a message file. No hardcoded English text in components.
- French-Canadian (`fr-CA`) is distinct from France French (`fr-FR`). Use Quebec-specific terminology
  (e.g., "courriel" not "email", "stationnement" not "parking").
- All form validation messages, error messages, toast notifications, and email templates must be translated.
- Admin-created content (announcements, event type names, amenity descriptions) remains in the language
  the admin writes it in. The platform does not auto-translate user-generated content.

---

## 2. Library Choice

| Property                   | Value                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Library**                | `next-intl` 4.x                                                                                                                                            |
| **Why**                    | Native Next.js App Router support, works in both Server Components and Client Components, built-in ICU message format, lightweight (< 5 KB client bundle). |
| **Alternative Considered** | `react-intl` — rejected because it requires `IntlProvider` wrapper and does not work in React Server Components without workarounds.                       |
| **Alternative Considered** | `i18next` + `next-i18next` — rejected because the App Router integration is unofficial and adds unnecessary complexity.                                    |

### Installation

```bash
pnpm add next-intl
```

---

## 3. Message File Structure

All message files live in `/messages/{locale}.json`. Each file uses a flat namespace structure
with dot-separated keys organized by module.

### Directory Layout

```
/messages/
├── en.json          # English (default)
├── fr-CA.json       # French-Canadian
├── es.json          # Spanish (Phase 2)
├── zh-CN.json       # Simplified Chinese (Phase 2)
├── pt-BR.json       # Portuguese (Phase 2)
└── ar.json          # Arabic (Phase 3)
```

### Namespace Structure

Each JSON file is organized into top-level namespaces that map to platform modules:

| Namespace       | Contents                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `common`        | Shared strings: "Save", "Cancel", "Delete", "Loading", "Back", "Next", "Search", pagination labels |
| `auth`          | Login, logout, password reset, 2FA, session expired                                                |
| `dashboard`     | Dashboard widget titles, quick action labels, greeting messages                                    |
| `packages`      | Package intake, release, notification, courier names, storage locations                            |
| `maintenance`   | Request creation, assignment, status labels, priority labels, categories                           |
| `amenities`     | Booking flow, calendar labels, approval status, payment messages                                   |
| `security`      | Incident types, visitor log, FOB management, parking violations, shift log                         |
| `admin`         | Settings labels, user management, property configuration, event type management                    |
| `billing`       | Subscription tiers, invoice labels, payment status, feature gating messages                        |
| `errors`        | Validation errors, server errors, network errors, permission denied messages                       |
| `notifications` | Email subjects, SMS templates, push notification titles and bodies                                 |

### Example: `en.json` (partial)

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "search": "Search",
    "noResults": "No results found",
    "itemCount": "{count, plural, =0 {No items} one {1 item} other {# items}}"
  },
  "packages": {
    "title": "Packages",
    "receive": "Receive Package",
    "release": "Release Package",
    "notifyResident": "Notify Resident",
    "storageLocation": "Storage Location",
    "pendingCount": "{count, plural, =0 {No pending packages} one {1 pending package} other {# pending packages}}"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email address",
    "serverError": "Something went wrong. Please try again."
  }
}
```

### Key Naming Convention

- Use camelCase for key names: `pendingCount`, `notifyResident`
- Prefix with the action or context: `createMaintenanceRequest`, `deleteConfirmTitle`
- Never use the English string as the key. Keys are stable identifiers that never change even if
  the English wording is updated.

---

## 4. Locale Detection & Resolution

The platform determines the user's locale using this priority chain (highest to lowest):

| Priority | Source                     | How It Works                                                                                                    |
| -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1        | **User profile setting**   | Stored in the `users` table as `preferredLocale`. Set during onboarding or in My Account → Language.            |
| 2        | **Cookie**                 | `NEXT_LOCALE` cookie set on first visit or language switch. Persists across sessions for unauthenticated users. |
| 3        | **Accept-Language header** | Parsed from the browser's language preference. Matched against supported locales.                               |
| 4        | **Property default**       | Each property has a `defaultLocale` in its settings. Falls back to this if no user preference.                  |
| 5        | **Platform default**       | `en` (English). Always the final fallback.                                                                      |

### Resolution Logic (in middleware.ts)

1. If user is authenticated, read `preferredLocale` from the JWT token payload (added as `locale` claim).
2. If not authenticated, check `NEXT_LOCALE` cookie.
3. If no cookie, parse `Accept-Language` header. Match against `['en', 'fr-CA']` (Phase 1).
4. If no match, use `en`.
5. Set the resolved locale on the request context for downstream use.

---

## 5. URL Strategy

Concierge uses **prefix-based routing** with middleware rewrites.

### URL Format

```
https://app.concierge.com/en/dashboard
https://app.concierge.com/fr/dashboard
https://app.concierge.com/en/packages
https://app.concierge.com/fr/packages
```

### Implementation

- The `[locale]` segment is a dynamic route parameter in the App Router: `app/[locale]/layout.tsx`
- Middleware (`middleware.ts`) detects the locale and rewrites the URL if the prefix is missing.
- If a user visits `/dashboard`, middleware redirects to `/en/dashboard` (or `/fr/dashboard` based on detection).
- The locale prefix is **always visible** in the URL. This enables bookmarking and sharing locale-specific links.
- API routes (`/api/*`) do NOT have locale prefixes. They accept a `locale` query parameter or header for
  response messages (e.g., validation error messages).

### next-intl Configuration

```typescript
// src/i18n/config.ts
export const locales = ['en', 'fr-CA'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

---

## 6. Component Patterns

### Server Components (default)

```typescript
import { getTranslations } from 'next-intl/server';

export default async function PackageList() {
  const t = await getTranslations('packages');

  return (
    <h1>{t('title')}</h1>
    // renders "Packages" in English, "Colis" in French-Canadian
  );
}
```

### Client Components

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function PackageActions() {
  const t = useTranslations('packages');

  return (
    <button>{t('receive')}</button>
    // renders "Receive Package" in English
  );
}
```

### Rule: Never import from both

A single component must use either `getTranslations` (server) or `useTranslations` (client). Never both.
If a Server Component contains a Client Component child, pass translated strings as props or let the
child component call `useTranslations` independently.

---

## 7. Pluralization & ICU Message Format

All messages that involve counts, interpolation, or conditional text use
[ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/).

### Pluralization

```json
{
  "packages": {
    "pendingCount": "{count, plural, =0 {No pending packages} one {1 pending package} other {# pending packages}}"
  }
}
```

Usage: `t('pendingCount', { count: 5 })` → "5 pending packages"

### French-Canadian Pluralization

French uses different plural rules than English. The `one` category applies to both 0 and 1 in French:

```json
{
  "packages": {
    "pendingCount": "{count, plural, =0 {Aucun colis en attente} one {1 colis en attente} other {# colis en attente}}"
  }
}
```

### Interpolation

```json
{
  "dashboard": {
    "greeting": "Good morning, {name}",
    "lastLogin": "Last login: {date}"
  }
}
```

Usage: `t('greeting', { name: 'Sarah' })` → "Good morning, Sarah"

### Select (gender, role, etc.)

```json
{
  "notifications": {
    "assignedTo": "{role, select, manager {Property Manager} security {Security Guard} frontDesk {Front Desk} other {Staff Member}} assigned"
  }
}
```

---

## 8. Currency Formatting

| Property             | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| **Default currency** | CAD (Canadian Dollar)                                                      |
| **US customers**     | USD (United States Dollar)                                                 |
| **Future EU**        | EUR (Euro)                                                                 |
| **Storage format**   | Integer cents in the database (e.g., `2500` = $25.00). Never store floats. |

### Formatting Function

```typescript
// src/lib/format-currency.ts
export function formatCurrency(
  amountInCents: number,
  locale: string,
  currency: string = 'CAD',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}

// formatCurrency(2500, 'en', 'CAD') → "$25.00"
// formatCurrency(2500, 'fr-CA', 'CAD') → "25,00 $"
```

The currency is determined by the property's `billingCurrency` setting, not by the user's locale.
A French-speaking user at a Canadian property sees "25,00 $" (French formatting of CAD).

---

## 9. Date & Time Formatting

| Property            | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| **Library**         | `date-fns` 3.x with locale imports                                |
| **Storage**         | All dates stored in UTC in the database.                          |
| **Display**         | Converted to the property's timezone for display.                 |
| **Timezone source** | Property settings (`property.timezone`, e.g., `America/Toronto`). |

### Formatting Function

```typescript
import { format } from 'date-fns';
import { enCA, frCA } from 'date-fns/locale';

const localeMap = { en: enCA, 'fr-CA': frCA };

export function formatDate(date: Date, pattern: string, locale: string): string {
  return format(date, pattern, { locale: localeMap[locale] });
}

// formatDate(new Date(), 'PPP', 'en')    → "March 16, 2026"
// formatDate(new Date(), 'PPP', 'fr-CA') → "16 mars 2026"
```

### Standard Patterns

| Context     | Pattern               | English Example       | French Example      |
| ----------- | --------------------- | --------------------- | ------------------- |
| Full date   | `PPP`                 | March 16, 2026        | 16 mars 2026        |
| Short date  | `PP`                  | Mar 16, 2026          | 16 mars 2026        |
| Date + time | `PPp`                 | Mar 16, 2026, 2:30 PM | 16 mars 2026, 14:30 |
| Time only   | `p`                   | 2:30 PM               | 14:30               |
| Relative    | `formatDistanceToNow` | 5 minutes ago         | il y a 5 minutes    |

---

## 10. Number Formatting

Use `Intl.NumberFormat` for all number display (not just currency).

```typescript
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

// formatNumber(1234567, 'en')    → "1,234,567"
// formatNumber(1234567, 'fr-CA') → "1 234 567"
```

French-Canadian uses spaces as thousands separators and commas as decimal separators.
English uses commas as thousands separators and periods as decimal separators.
Never hardcode separators. Always use `Intl.NumberFormat`.

---

## 11. Content Translation Workflow

This is the process for adding and translating new strings:

### Step 1: Developer Adds English Strings

The developer adds new keys to `messages/en.json` with English values. The key must follow
the naming convention described in Section 3.

### Step 2: Export Untranslated Keys

A CLI script compares all locale files and outputs a JSON file containing only the keys that
exist in `en.json` but are missing from other locale files:

```bash
pnpm run i18n:export-missing
# Output: /messages/missing/fr-CA.json
```

### Step 3: Professional Translation

The missing keys JSON file is sent to the translation service (vendor TBD). The translator
returns a completed JSON file with the same key structure.

### Step 4: Import Translated JSON

```bash
pnpm run i18n:import --locale fr-CA --file ./translated/fr-CA.json
```

This merges the translated keys into the existing `messages/fr-CA.json` file.

### Step 5: CI Validation

The CI pipeline runs `pnpm run i18n:check` on every pull request. This check fails if:

- Any key in `en.json` is missing from any other locale file
- Any key in a locale file does not exist in `en.json` (orphaned key)
- Any ICU message format string has syntax errors
- Any interpolation variable in a translation does not match the English version

---

## 12. RTL Support

Phase 3 adds Arabic and Hebrew, which are right-to-left (RTL) languages.

### CSS Strategy: Logical Properties

All CSS must use logical properties instead of physical properties:

| Physical Property (DO NOT USE) | Logical Property (USE THIS) |
| ------------------------------ | --------------------------- |
| `margin-left`                  | `margin-inline-start`       |
| `margin-right`                 | `margin-inline-end`         |
| `padding-left`                 | `padding-inline-start`      |
| `padding-right`                | `padding-inline-end`        |
| `text-align: left`             | `text-align: start`         |
| `text-align: right`            | `text-align: end`           |
| `float: left`                  | `float: inline-start`       |
| `border-left`                  | `border-inline-start`       |

### HTML Direction

The `dir` attribute is set on the `<html>` element based on the active locale:

```typescript
// app/[locale]/layout.tsx
const direction = ['ar', 'he'].includes(locale) ? 'rtl' : 'ltr';
return <html lang={locale} dir={direction}>...</html>;
```

### Tailwind CSS

Tailwind 3.4+ supports logical properties via the `rtl:` variant. Use `rtl:` prefix for any
direction-specific utility that cannot be expressed as a logical property.

### Icons and Images

- Directional icons (arrows, chevrons) must be mirrored in RTL mode using CSS `transform: scaleX(-1)`.
- Progress bars and sliders must reverse direction in RTL.
- Logos, brand images, and non-directional icons remain unchanged.

---

## 13. Design Token Impact

The Concierge design token system (defined in `docs/DESIGN-SYSTEM.md`) is direction-agnostic.
All spacing, color, and typography tokens work identically in LTR and RTL modes.

No token changes are required for any locale. This is by design: tokens define values (8px, #1a1a1a),
not directions (left, right).

---

## 14. Testing

### Pseudo-Locale Testing

A special pseudo-locale (`pseudo`) transforms all English strings into accented versions that
are still readable but visually distinct. This catches hardcoded strings that were not extracted.

Example: "Packages" → "P\u00e4\u0107k\u00e4\u01e7\u00e9s" (Päċkäǧés)

Enable in development:

```bash
NEXT_PUBLIC_LOCALE=pseudo pnpm dev
```

### Visual Regression Tests

Playwright captures screenshots of every page in both `en` and `fr-CA` locales. French text is
typically 20-30% longer than English, so these tests catch layout overflow issues.

### CI Checks

| Check              | Tool                | Runs On          |
| ------------------ | ------------------- | ---------------- |
| Missing keys       | `i18n:check` script | Every PR         |
| ICU syntax         | `i18n:check` script | Every PR         |
| Visual regression  | Playwright          | Merge to main    |
| Pseudo-locale scan | Custom script       | Weekly scheduled |

---

## 15. Developer Checklist

Before submitting a PR that adds user-facing text:

- [ ] All strings extracted to `messages/en.json` with correct namespace
- [ ] Keys follow camelCase naming convention
- [ ] Pluralization uses ICU `{count, plural, ...}` format
- [ ] No hardcoded English strings in components, pages, or API responses
- [ ] Currency uses `formatCurrency()` helper, not manual formatting
- [ ] Dates use `formatDate()` helper with `date-fns` locale
- [ ] Numbers use `formatNumber()` helper, not `toLocaleString()` directly
- [ ] CSS uses logical properties (no `margin-left`, `padding-right`, etc.)
- [ ] `pnpm run i18n:check` passes locally
- [ ] French-Canadian translations requested or added

---

_Last updated: 2026-03-16_
