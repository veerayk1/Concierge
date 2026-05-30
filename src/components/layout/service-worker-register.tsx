'use client';

/**
 * Concierge — Service Worker Registration
 *
 * Mounted once at the root layout. Registers `/sw.js` so the app
 * passes the PWA installability criteria (Chrome shows the "Install"
 * prompt; iOS Safari "Add to Home Screen" gets the app icon + name).
 *
 * Why a separate client component: the root layout is a Server
 * Component. `navigator.serviceWorker.register` is a window-only API
 * and has to run on the client. Putting the call in `useEffect` makes
 * it run AFTER hydration, which is what we want — the page is usable
 * before the service worker even installs.
 *
 * Dev caveat: in development Next.js serves files with cache headers
 * the service worker doesn't respect well, and HMR fights the cache.
 * We register in production only.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Defer to idle so it never competes with first paint.
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        // Failure is non-fatal. The app still works; it just won't be
        // installable until the next page load.
        console.warn('[sw] registration failed', err);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        register,
      );
    } else {
      setTimeout(register, 1500);
    }
  }, []);

  return null;
}
