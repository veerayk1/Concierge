/**
 * Concierge — Media Query Hooks
 *
 * SSR-safe media query hooks with breakpoint helpers.
 * Breakpoints sourced from design tokens.
 *
 * @module hooks/use-media-query
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { BREAKPOINTS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Core Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * SSR-safe: returns `false` on the server and during hydration, then
 * syncs with the actual viewport on the first client-side effect.
 *
 * @param query - CSS media query string (e.g. `(min-width: 768px)`)
 * @returns `true` if the media query matches, `false` otherwise
 *
 * @example
 * const isWide = useMediaQuery('(min-width: 1280px)');
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Sync immediately on mount
    setMatches(getMatches());

    const mediaQueryList = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query, getMatches]);

  return matches;
}

// ---------------------------------------------------------------------------
// Breakpoint Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the viewport is narrower than the `sm` breakpoint (640px).
 * Useful for mobile-specific layouts and behaviors.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);
}

/**
 * Returns `true` when the viewport is between `sm` (640px) and `lg` (1024px).
 * Covers typical tablet portrait and landscape modes.
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/**
 * Returns `true` when the viewport is at least `lg` (1024px).
 * Covers laptops and all larger screens.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Returns `true` when the viewport is at least `monitor` (1920px).
 * Per the design system, 99% of users are on desktop monitors.
 * This breakpoint targets full HD and above.
 */
export function useIsMonitor(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.monitor}px)`);
}
