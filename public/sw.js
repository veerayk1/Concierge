// Concierge — Minimal service worker
//
// Purpose: make the app "installable" (PWA criterion) and provide a
// graceful offline fallback for navigation requests. Deliberately
// minimal — we do NOT pre-cache application chunks because they
// change on every deploy, and a stale chunk that survives a deploy
// is worse than a brief offline message.
//
// Strategy:
//   - install: cache the offline shell.
//   - fetch:   network-first for everything. On network failure for
//              a navigation request, return the offline shell. On
//              any other failure, let it bubble.
//   - activate: clean up old shell caches.

const CACHE_VERSION = 'concierge-shell-v1';
const OFFLINE_URL = '/offline.html';
const SHELL_ASSETS = [OFFLINE_URL, '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GETs we care about. Never touch API calls — they
  // need real auth and real responses, not cached stale data.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/data/')) return;

  // Navigation requests: network-first, fall back to offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res ?? new Response('', { status: 503 })),
      ),
    );
    return;
  }

  // Static assets we cached at install: cache-first.
  if (SHELL_ASSETS.some((path) => url.pathname === path)) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
});
