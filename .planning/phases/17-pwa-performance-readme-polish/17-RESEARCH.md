# Phase 17: PWA, Performance, README & Final Polish - Research

**Researched:** 2026-02-01
**Domain:** PWA service workers, performance budgets, portfolio presentation, UX polish
**Confidence:** HIGH (core patterns verified via official docs and codebase inspection)

## Summary

This phase has four distinct workstreams: (1) PWA service worker + manifest for offline/installability, (2) performance budgets in CI, (3) README overhaul for portfolio presentation, and (4) a tab-by-tab UX consistency audit. The critical technical challenge is merging the existing `coi-serviceworker` (required for DuckDB-WASM's SharedArrayBuffer/OPFS support on GitHub Pages) with a new Workbox-based precaching service worker. Since browsers only allow one active service worker per scope, these cannot coexist as separate files -- they must be combined into a single custom service worker using vite-plugin-pwa's `injectManifest` strategy.

The app currently loads DuckDB-WASM bundles from jsDelivr CDN at runtime (`getJsDelivrBundles()`). For true offline support, these external WASM/JS bundles must either be self-hosted (copied into `dist/`) or cached via runtime caching in the service worker. The existing CSP policy (`script-src 'self' 'wasm-unsafe-eval'`) blocks inline scripts, which constrains the service worker registration approach -- use `injectRegister: 'script-defer'` or manual registration via virtual module to avoid needing `'unsafe-inline'`.

**Primary recommendation:** Use `vite-plugin-pwa` v0.21+ with `injectManifest` strategy, writing a custom service worker that combines Workbox precaching with the COI header injection logic currently handled by `coi-serviceworker.js`. For bundle size checks, use a simple shell script in CI (the dedicated Vite plugin requires Vite 6+, and the project uses Vite 5.4).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^0.21.x | PWA manifest + SW generation | De facto standard for Vite PWAs; wraps Workbox; 5k+ GitHub stars |
| workbox-precaching | 7.x (bundled) | Asset precaching in SW | Google's official SW toolkit; comes with vite-plugin-pwa |
| workbox-routing | 7.x (bundled) | SW route matching | Needed for runtime caching of CDN resources |
| workbox-strategies | 7.x (bundled) | Caching strategies (CacheFirst, etc.) | Network-first for CDN WASM, cache-first for app assets |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vite-pwa/assets-generator | ^0.2.x | Generate PWA icons from SVG source | CLI tool to produce all icon sizes from single source |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa | Hand-rolled SW | Massive complexity increase; Workbox handles cache versioning, cleanup, update flow |
| vite-plugin-bundlesize | Shell script in CI | vite-plugin-bundlesize requires Vite 6+; project uses Vite 5.4; shell script is simpler |
| @vite-pwa/assets-generator | Manual icon creation | Generator ensures correct sizes; but manual works for a small set |

**Installation:**
```bash
npm install -D vite-plugin-pwa
```

Workbox modules (workbox-precaching, workbox-routing, workbox-strategies, workbox-core) are bundled with vite-plugin-pwa and available as imports in the custom service worker -- no separate install needed.

## Architecture Patterns

### Recommended Project Structure
```
public/
  pwa-192x192.png         # PWA icon (from generated assets)
  pwa-512x512.png         # PWA icon
  maskable-icon-512x512.png  # Maskable variant
  apple-touch-icon-180x180.png  # iOS icon
  favicon.ico             # Browser tab icon
  favicon.svg             # SVG favicon
  robots.txt              # SEO crawling
  # coi-serviceworker.js  # REMOVED (merged into custom SW)
src/
  sw.ts                   # Custom service worker (injectManifest source)
```

### Pattern 1: Combined COI + Workbox Service Worker (injectManifest)
**What:** Single custom service worker that both injects COOP/COEP headers (replacing coi-serviceworker.js) and handles Workbox precaching for offline support.
**When to use:** Always -- this is the only viable approach given the single-SW-per-scope browser limitation.
**Example:**
```typescript
// src/sw.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// --- Auto-update behavior ---
self.skipWaiting();
clientsClaim();

// --- Workbox precaching (app assets) ---
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// --- Runtime caching for DuckDB CDN resources ---
registerRoute(
  ({ url }) => url.hostname === 'cdn.jsdelivr.net' &&
    (url.pathname.includes('duckdb') || url.pathname.endsWith('.wasm')),
  new CacheFirst({
    cacheName: 'duckdb-wasm-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// --- COI header injection (replaces coi-serviceworker.js) ---
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  // Only inject headers for navigation requests and same-origin resources
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
```
**Source:** Pattern derived from coi-serviceworker.js logic + Workbox official docs

### Pattern 2: vite-plugin-pwa Configuration
**What:** Vite config for injectManifest with manifest definition.
**Example:**
```typescript
// vite.config.ts addition
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  injectRegister: 'script-defer', // Avoids CSP 'unsafe-inline' issue
  manifest: {
    name: 'GymLog - Workout Tracker',
    short_name: 'GymLog',
    description: 'Event-sourced workout tracker with DuckDB-WASM analytics',
    theme_color: '#1a1a2e', // Approximate OKLCH 18% lightness in hex
    background_color: '#1a1a2e',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
  },
  devOptions: {
    enabled: false, // Only enable for testing; SW interferes with HMR
  },
})
```

### Pattern 3: Bundle Size Check Script
**What:** Simple shell script added to CI that checks JS bundle sizes after build.
**Example:**
```bash
#!/bin/bash
# scripts/check-bundle-size.sh
MAX_MAIN_KB=600    # Main bundle
MAX_ANALYTICS_KB=550  # Analytics lazy chunk
MAX_DUCKDB_KB=200  # DuckDB wrapper chunk
MAX_TOTAL_KB=1400  # Total JS budget

FAIL=0
for pattern_limit in "index-:$MAX_MAIN_KB" "AnalyticsPage-:$MAX_ANALYTICS_KB" "duckdb-:$MAX_DUCKDB_KB"; do
  pattern="${pattern_limit%%:*}"
  limit="${pattern_limit##*:}"
  file=$(find dist/assets -name "${pattern}*.js" | head -1)
  if [ -n "$file" ]; then
    size_kb=$(( $(stat -c%s "$file") / 1024 ))
    if [ "$size_kb" -gt "$limit" ]; then
      echo "FAIL: $file is ${size_kb}KB (limit: ${limit}KB)"
      FAIL=1
    else
      echo "OK: $file is ${size_kb}KB (limit: ${limit}KB)"
    fi
  fi
done

TOTAL=$(find dist/assets -name '*.js' -exec stat -c%s {} + | awk '{s+=$1} END {printf "%d", s/1024}')
echo "Total JS: ${TOTAL}KB (budget: ${MAX_TOTAL_KB}KB)"
[ "$TOTAL" -gt "$MAX_TOTAL_KB" ] && FAIL=1

exit $FAIL
```

### Pattern 4: CSP Update for PWA
**What:** The existing CSP meta tag needs updating to allow the manifest and service worker registration script.
**Current CSP:**
```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self';
```
**Required changes:**
- `connect-src` must include `https://cdn.jsdelivr.net` (DuckDB CDN fetches through SW)
- `manifest-src 'self'` should be added for the web manifest
- `worker-src` already includes `'self' blob:` which covers the service worker

### Anti-Patterns to Avoid
- **Running two separate service workers:** Browser only allows one per scope. The coi-serviceworker.js and a PWA service worker CANNOT coexist separately.
- **Using `generateSW` strategy:** Cannot add custom COI header injection with the auto-generated approach. Must use `injectManifest`.
- **Precaching DuckDB CDN resources:** These are loaded at runtime from jsDelivr. Use runtime caching (CacheFirst) instead of precaching, since Workbox precache only works with build output files.
- **Inline SW registration with strict CSP:** The app's CSP disallows `'unsafe-inline'` for scripts. Using `injectRegister: 'inline'` would break registration. Use `'script-defer'` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker lifecycle | Manual SW with cache API | Workbox via vite-plugin-pwa | Cache versioning, cleanup, update detection are complex |
| PWA manifest generation | Manual JSON file | vite-plugin-pwa manifest config | Plugin handles base path, generates link/meta tags |
| Icon generation | Manual resize in image editor | @vite-pwa/assets-generator or manual SVG+PNG set | Need 5+ sizes; generator ensures correctness |
| Bundle size tracking | Custom webpack analyzer | Shell script checking file sizes | Simple, no dependencies, works with Vite 5 |
| Lighthouse CI | Manual lighthouse runs | treosh/lighthouse-ci-action | Handles server startup, multiple runs, artifact upload |

**Key insight:** The service worker is the most complex piece. Workbox handles cache invalidation, versioned asset URLs, and update propagation -- all of which are notoriously difficult to get right manually.

## Common Pitfalls

### Pitfall 1: COI Service Worker Conflict
**What goes wrong:** Adding vite-plugin-pwa alongside the existing coi-serviceworker.js creates two competing service workers. The PWA service worker takes over, COI headers are no longer injected, and DuckDB-WASM falls back to in-memory mode (losing OPFS persistence).
**Why it happens:** Browsers register exactly one service worker per scope. The last one registered wins.
**How to avoid:** Merge COI header injection into the custom Workbox service worker using `injectManifest`. Remove `coi-serviceworker.js` from public/ and the script tag in index.html.
**Warning signs:** App works but shows "demo mode" (non-persistent). `window.crossOriginIsolated` returns false.

### Pitfall 2: DuckDB CDN Resources Not Cached for Offline
**What goes wrong:** App assets are precached, but DuckDB-WASM binaries (loaded from cdn.jsdelivr.net at runtime) are not cached. App fails offline because it can't load the WASM module.
**Why it happens:** Workbox precache only covers files in the build output directory. CDN resources need runtime caching.
**How to avoid:** Add a `registerRoute` with `CacheFirst` strategy for `cdn.jsdelivr.net` URLs containing `duckdb` or `.wasm`. After first visit, these are cached and served from cache offline.
**Warning signs:** App works offline for UI but DuckDB init fails.

### Pitfall 3: CSP Blocking SW Registration
**What goes wrong:** Service worker registration script is injected inline, but CSP blocks it because `script-src` only allows `'self'`.
**Why it happens:** Default vite-plugin-pwa `injectRegister` mode may inject inline script.
**How to avoid:** Use `injectRegister: 'script-defer'` which creates an external JS file loaded via `<script defer src="...">`, compliant with `script-src 'self'`.
**Warning signs:** Console error about CSP violation for inline script.

### Pitfall 4: VITE_BASE Path Not Applied to SW
**What goes wrong:** Service worker scope doesn't match the deployed path on GitHub Pages (e.g., `/gymlog/`).
**Why it happens:** GitHub Pages deploys to a subdirectory. SW scope must match.
**How to avoid:** vite-plugin-pwa automatically uses Vite's `base` config. The existing `VITE_BASE` env var in CI already handles this. Verify manifest `start_url` and `scope` are relative or use the base path.
**Warning signs:** SW registered but doesn't intercept requests. Install prompt doesn't appear.

### Pitfall 5: Stale Cache After Deploy
**What goes wrong:** Users get an old version of the app because the service worker serves cached assets.
**Why it happens:** Without proper cache busting, the SW continues serving old precached files.
**How to avoid:** Workbox precaching uses content hashes in the manifest. `skipWaiting()` + `clientsClaim()` ensures new SW activates immediately. Users get the new version on next page load.
**Warning signs:** Deploy succeeds but users see old UI.

### Pitfall 6: README Placeholder URLs
**What goes wrong:** README ships with `username.github.io/gymlog` placeholder URLs and badge links.
**Why it happens:** The existing README was scaffolded with placeholder values that were never updated.
**How to avoid:** Replace all placeholder URLs with actual deployment URLs. Test all links work.
**Warning signs:** 404 on demo link, broken badge images.

### Pitfall 7: Lighthouse Score Regression from Large WASM
**What goes wrong:** Lighthouse Performance score is low due to DuckDB-WASM download size (~9MB from CDN).
**Why it happens:** DuckDB bundles are large; Lighthouse counts all network requests.
**How to avoid:** DuckDB is loaded after initial render (async init in `useDuckDB`). Document this as a known cost. Focus Lighthouse audit on first meaningful paint and interactivity, not total transfer size. The app shell loads fast; DuckDB init happens in background.
**Warning signs:** Low Performance score despite fast UI render.

## Code Examples

### Current Codebase State (Verified)

**DuckDB initialization loads from CDN:**
```typescript
// src/db/duckdb-init.ts (lines 57-68)
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
const worker_url = URL.createObjectURL(
  new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
);
const worker = new Worker(worker_url);
const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule);
```

**Current CSP in index.html:**
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; connect-src 'self'; font-src 'self';">
```

**Current build output sizes (from dist/):**
- `index-*.js`: 580KB (main bundle: React, Zustand, framer-motion, form libs)
- `AnalyticsPage-*.js`: 524KB (lazy: Recharts + analytics components)
- `duckdb-*.js`: 188KB (DuckDB-WASM wrapper)
- `index-*.css`: 60KB
- Total JS: ~1.29MB uncompressed
- Total dist: ~1.9MB (including fonts)

**Tabs in app:** Workouts, Templates, Analytics, Settings
- Each wrapped in `<FeatureErrorBoundary>`
- Analytics is lazy-loaded via `React.lazy()`
- DB loading state handled in App.tsx (line 257-263)
- DB error state handled in App.tsx (line 266-280)

**Existing loading/error patterns observed:**
- `App.tsx`: Global DB loading + error states
- `ExerciseHistory.tsx`: loading/error/empty pattern
- `AnalyticsPage.tsx`: per-section loading states
- `TemplateList.tsx`: `isLoading` from hook
- Various inline `text-text-muted` loading strings

**Existing README:** Already has architecture diagrams, tech stack, data model lineage. Needs: live demo URL fix, screenshots/GIF, "run locally" cleanup, build version corrections (says Vite 6.x, actually 5.4).

### tsconfig Consideration for SW
The custom service worker needs `WebWorker` in the lib array. Current `tsconfig.app.json` has `"lib": ["ES2022", "DOM", "DOM.Iterable"]`. The SW file (`src/sw.ts`) needs its own tsconfig or the `WebWorker` lib added. vite-plugin-pwa handles compilation separately, so a `tsconfig.sw.json` referencing `WebWorker` is the clean approach, or the `declare let self: ServiceWorkerGlobalScope` pattern works with the existing config.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| coi-serviceworker (standalone) | Merged COI + Workbox SW | When adding PWA | Single SW handles both concerns |
| Manual manifest.json | vite-plugin-pwa manifest config | Standard since vite-plugin-pwa v0.12 | Auto-generates manifest with base path |
| generateSW strategy | injectManifest for custom SW | When custom logic needed | Required for COI header injection |
| Webpack bundle analyzer | Simple file-size script or vite-plugin-bundlesize | Vite ecosystem | vite-plugin-bundlesize needs Vite 6+; script works everywhere |

**Deprecated/outdated:**
- `coi-serviceworker.js` as standalone file: Must be merged into custom SW once PWA SW is added
- README placeholder URLs (`username.github.io`): Need actual deployment URL

## Open Questions

1. **DuckDB CDN vs Self-Hosted WASM**
   - What we know: Currently loads from jsDelivr CDN (~9MB). Runtime caching with CacheFirst strategy will cache after first visit.
   - What's unclear: Whether self-hosting the WASM in `public/` would be better for offline reliability (avoids first-visit-online requirement for CDN cache). Self-hosting increases deploy size significantly.
   - Recommendation: Keep CDN approach with runtime caching. The app already requires an initial online visit to load. Document that first visit must be online.

2. **Theme Color Hex Conversion**
   - What we know: App uses OKLCH `oklch(18% 0.01 270)` for page background. PWA manifest requires hex color.
   - What's unclear: Exact hex equivalent of the OKLCH value.
   - Recommendation: Compute closest hex approximation. `oklch(18% 0.01 270)` is approximately `#1a1a2e` (very dark blue-gray). Verify visually.

3. **Lighthouse Score Achievability**
   - What we know: Target is 90+ across all 4 categories. The large DuckDB WASM download may impact Performance.
   - What's unclear: Whether 90+ Performance is achievable with ~9MB CDN download.
   - Recommendation: Run baseline Lighthouse audit first. DuckDB loads async so it may not impact LCP. Document actual scores and set realistic targets. Focus on what can be optimized (fonts, CSS, JS splitting).

4. **GIF/Screenshot Generation**
   - What we know: README needs hero GIF and screenshots.
   - What's unclear: Best tool for recording GIF in a CLI/automated context.
   - Recommendation: Use browser dev tools or manual screenshots during polish pass. GIF can be recorded with any screen recorder. This is a manual step, not automated.

## Sources

### Primary (HIGH confidence)
- vite-plugin-pwa official docs - Getting Started, injectManifest, PWA Minimal Requirements, Register Service Worker
  - https://vite-pwa-org.netlify.app/guide/
  - https://vite-pwa-org.netlify.app/guide/inject-manifest
  - https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements
  - https://vite-pwa-org.netlify.app/guide/register-service-worker
- Codebase inspection - vite.config.ts, package.json, index.html, src/db/duckdb-init.ts, public/coi-serviceworker.js, .github/workflows/ci.yml, README.md, src/App.tsx, tsconfig.app.json
- vite-plugin-bundlesize README - https://github.com/drwpow/vite-plugin-bundlesize (requires Vite 6+, not compatible)

### Secondary (MEDIUM confidence)
- GitHub Pages COI limitations - https://github.com/orgs/community/discussions/13309 (still no custom headers as of 2026)
- coi-serviceworker library - https://github.com/gzuidhof/coi-serviceworker
- Workbox COEP/COOP recipe - https://github.com/GoogleChrome/workbox/issues/2963
- treosh/lighthouse-ci-action - https://github.com/treosh/lighthouse-ci-action
- DuckDB-WASM architecture - https://duckdb.org/2021/10/29/duckdb-wasm

### Tertiary (LOW confidence)
- Blog post on COI via service workers - https://blog.tomayac.com/2025/03/08/setting-coop-coep-headers-on-static-hosting-like-github-pages/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - vite-plugin-pwa is the established standard; verified via official docs
- Architecture: HIGH - COI+Workbox merge pattern verified via codebase inspection and Workbox issue tracker
- Pitfalls: HIGH - Each pitfall identified from direct codebase analysis (CSP, CDN loading, single-SW constraint)
- Bundle size: MEDIUM - Simple script approach is straightforward but specific budget numbers need baseline measurement
- README: HIGH - Existing README inspected; gaps clearly identified
- Polish: MEDIUM - Requires runtime audit; patterns observed but specific issues unknown until implementation

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable libraries, slow-moving domain)
