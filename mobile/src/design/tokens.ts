/**
 * Design tokens — single source of truth for the mobile app.
 *
 * These mirror the web design system (docs/DESIGN-SYSTEM.md) so the
 * two products stay visually coherent. Any value here that differs
 * from the web is intentional — usually because native platforms have
 * different defaults (touch targets, font scaling, safe-area
 * conventions) than the web.
 */

export const colors = {
  // Brand
  ink: '#0F172A', // primary CTAs, headings, dark surface
  inkSoft: '#1E293B', // pressed state of dark surfaces

  // Neutral scale (matches web Tailwind neutral-*)
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#E5E5E5',
  neutral300: '#D4D4D4',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717',

  // Semantic — status only, never decorative (matches CLAUDE.md rule)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Module accents (subtle washes only — for the hero gradient
  // behind page titles, matching the web PageShell hero prop)
  amber: 'rgba(254, 215, 170, 0.45)',
  emerald: 'rgba(167, 243, 208, 0.45)',
  sky: 'rgba(186, 230, 253, 0.50)',
  violet: 'rgba(221, 214, 254, 0.50)',
  rose: 'rgba(254, 205, 211, 0.50)',

  // Surface
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Spacing — 4px grid system, identical to the web.
 * Use spacing tokens, never raw pixel values, so iOS / Android render
 * the same density.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

/**
 * Type scale — slightly larger than the web to match iOS / Android
 * conventions. The web 14/15 body becomes 15/16 on native because
 * native default font is smaller than browser default.
 */
export const typography = {
  // Page titles
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyEmphasis: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Supporting
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Button
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 22,
  },
} as const;

/**
 * Radius — generous on cards and buttons, matching the web's
 * `rounded-2xl` (16px) and `rounded-3xl` (24px) pattern.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Shadows — iOS uses shadowOffset/shadowOpacity/shadowRadius; Android
 * uses elevation. The wrapper components compose both so cards look
 * the same on both platforms.
 */
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

/**
 * Touch target minimum — Apple HIG: 44pt. Material 3: 48dp. Use 44
 * as a floor and 48 for primary actions.
 */
export const touchTarget = {
  min: 44,
  comfortable: 48,
} as const;

export type Spacing = keyof typeof spacing;
export type Color = keyof typeof colors;
export type Typography = keyof typeof typography;
