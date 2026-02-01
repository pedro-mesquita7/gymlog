---
phase: 17-pwa-performance-readme-polish
plan: 01
subsystem: pwa
tags: [service-worker, pwa, offline, workbox, manifest, coi]
depends_on: []
provides:
  - Combined COI + Workbox service worker (src/sw.ts)
  - PWA manifest with icons for installability
  - Offline-capable asset caching via Workbox precaching
  - DuckDB CDN runtime caching for offline WASM loading
affects:
  - 17-03 (performance budget -- SW adds to total JS)
  - All future deploys (SW handles COI headers instead of coi-serviceworker.js)
tech_stack:
  added: [vite-plugin-pwa]
  removed: [coi-serviceworker]
  patterns: [injectManifest, combined-service-worker, runtime-caching]
key_files:
  created:
    - src/sw.ts
    - public/manifest.webmanifest
    - public/pwa-192x192.png
    - public/pwa-512x512.png
    - public/maskable-icon-512x512.png
    - public/apple-touch-icon-180x180.png
    - public/favicon.ico
  modified:
    - vite.config.ts
    - index.html
    - package.json
    - tsconfig.app.json
    - .github/workflows/ci.yml
  deleted:
    - public/coi-serviceworker.js
decisions:
  - id: 17-01-a
    description: "injectManifest strategy with script-defer registration to avoid CSP inline script issues"
  - id: 17-01-b
    description: "Static manifest.webmanifest in public/ (manifest:false in plugin) for explicit control over scope/start_url"
  - id: 17-01-c
    description: "sw.ts excluded from tsconfig.app.json; vite-plugin-pwa compiles it separately with WebWorker types"
metrics:
  duration: 6m
  completed: 2026-02-01
---

# Phase 17 Plan 01: PWA Service Worker & Manifest Summary

**One-liner:** Combined Workbox + COI service worker with injectManifest strategy, replacing coi-serviceworker.js for offline-capable installable PWA.

## What Was Done

### Task 1: vite-plugin-pwa + Combined Service Worker
- Installed `vite-plugin-pwa` (v1.2.0) as dev dependency
- Created `src/sw.ts` combining three concerns in one service worker:
  1. **Workbox precaching** -- all Vite-built assets cached via `precacheAndRoute(self.__WB_MANIFEST)` (38 entries)
  2. **DuckDB CDN runtime caching** -- CacheFirst strategy for `cdn.jsdelivr.net` duckdb/wasm URLs with 30-day expiration
  3. **COI header injection** -- COOP/COEP headers on navigation requests (replaces coi-serviceworker.js)
- Configured vite.config.ts with VitePWA plugin using `injectManifest` strategy, `script-defer` registration
- Excluded `src/sw.ts` from `tsconfig.app.json` to avoid DOM vs WebWorker lib conflicts

### Task 2: PWA Manifest, Icons, index.html Updates
- Created `public/manifest.webmanifest` with app name, theme color (#1a1a2e), standalone display, portrait orientation
- Generated PWA icons programmatically (dumbbell on dark background): 192x192, 512x512, maskable 512x512, apple-touch 180x180, favicon.ico
- Updated `index.html`:
  - Added manifest link, apple-touch-icon link, theme-color meta, apple-mobile-web-app-capable meta
  - Updated CSP: added `https://cdn.jsdelivr.net` to connect-src, added `manifest-src 'self'`
  - Updated title to "GymLog - Workout Tracker"
  - Removed `<script src="coi-serviceworker.js">` tag
- Deleted `public/coi-serviceworker.js`
- Removed `coi-serviceworker` npm package
- Removed "Copy COI serviceworker" step from CI workflow

## Decisions Made

1. **injectManifest + script-defer** -- Required because (a) custom COI logic cannot use generateSW, (b) CSP blocks inline scripts so script-defer creates an external registerSW.js file
2. **Static manifest file** -- Using `manifest: false` in plugin config with a hand-written `public/manifest.webmanifest` gives explicit control over `scope: "./"` and `start_url: "./"` which work correctly with any Vite base path
3. **SW excluded from tsconfig.app.json** -- The service worker needs WebWorker types but the app needs DOM types; vite-plugin-pwa handles SW compilation in its own build pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript compilation failure for sw.ts**
- **Found during:** Task 1 verification
- **Issue:** `tsconfig.app.json` includes `src/` which picks up `sw.ts`, but SW uses `ServiceWorkerGlobalScope` APIs not available with DOM lib
- **Fix:** Added `"exclude": ["src/sw.ts"]` to `tsconfig.app.json`; vite-plugin-pwa compiles sw.ts separately
- **Commit:** f897367

**2. [Rule 2 - Missing Critical] Removed unused coi-serviceworker npm package**
- **Found during:** Task 2
- **Issue:** `coi-serviceworker` package still in devDependencies after deleting the file
- **Fix:** `npm uninstall coi-serviceworker`
- **Commit:** f897367

## Verification Results

- `npm run build` succeeds -- 38 precache entries, sw.js generated (26.6KB)
- `dist/sw.js` exists in build output
- `dist/manifest.webmanifest` exists in build output
- `dist/pwa-192x192.png`, `dist/pwa-512x512.png`, `dist/maskable-icon-512x512.png` all present
- No references to `coi-serviceworker` in dist/
- `npx tsc --noEmit` passes clean

## Commits

| Hash | Message |
|------|---------|
| 979adef | feat(17-01): install vite-plugin-pwa and create combined service worker |
| f897367 | feat(17-01): add PWA manifest, icons, update index.html, remove coi-serviceworker |
