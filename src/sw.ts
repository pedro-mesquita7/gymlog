import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Auto-update: new SW activates immediately, takes control of all clients
self.skipWaiting();
clientsClaim();

// Workbox precaching -- caches all Vite-built assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching for DuckDB-WASM CDN resources (jsDelivr)
registerRoute(
  ({ url }) => url.hostname === 'cdn.jsdelivr.net' &&
    (url.pathname.includes('duckdb') || url.pathname.endsWith('.wasm')),
  new CacheFirst({
    cacheName: 'duckdb-wasm-cdn',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// COI header injection -- replaces public/coi-serviceworker.js
// Required for SharedArrayBuffer (DuckDB-WASM OPFS persistence)
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  // Workaround for Chrome DevTools bug
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const response = await fetch(request);
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })()
    );
  }
});
