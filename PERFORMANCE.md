# Performance

Performance budgets, optimization strategies, and runtime characteristics for GymLog.

## Bundle Size Budget

Sizes measured after `npm run build`. Budget limits are enforced in CI via `scripts/check-bundle-size.sh`.

| Chunk | Contents | Actual | Budget | Gzip |
|-------|----------|--------|--------|------|
| `index-*.js` | React, Zustand, Framer Motion, UI components | 577 KB | 660 KB | 173 KB |
| `AnalyticsPage-*.js` | Recharts, analytics charts, progression logic | 522 KB | 600 KB | 172 KB |
| `duckdb-*.js` | DuckDB-WASM JavaScript wrapper | 188 KB | 215 KB | 44 KB |
| **Total JS** | All JavaScript combined | **1,287 KB** | **1,480 KB** | **389 KB** |

> Sizes are uncompressed unless noted. Gzip column shows compressed transfer size. GitHub Pages serves gzip-compressed assets, so users download the gzip column sizes.

Budget limits are set ~15% above current actual sizes to allow organic growth without false positives. If a budget is exceeded, investigate whether the growth is justified before raising the limit.

### CI Enforcement

The `build-deploy` job in `.github/workflows/ci.yml` runs `bash scripts/check-bundle-size.sh dist` after every build. The script checks each chunk individually and reports pass/fail with exact sizes.

## Code Splitting Strategy

GymLog uses three main JavaScript chunks:

1. **Main bundle** (`index-*.js`) -- The entry point containing React, Zustand state management, Framer Motion (LazyMotion, DOM features only), all page components except Analytics, and the service worker registration.

2. **Analytics chunk** (`AnalyticsPage-*.js`) -- Lazy-loaded via `React.lazy()`. Contains Recharts, all chart components (VolumeBarChart, MuscleHeatMap, ProgressionDashboard), and analytics-specific hooks. Only downloaded when the user navigates to the Analytics page.

3. **DuckDB chunk** (`duckdb-*.js`) -- Separated via `manualChunks` in Vite config. Contains the DuckDB-WASM JavaScript wrapper. The actual WASM binary (~9 MB) is fetched from the jsDelivr CDN at runtime and cached by the service worker.

The service worker (Workbox injectManifest) precaches all three chunks plus CSS, fonts, and HTML so the app works fully offline after first load.

## Lighthouse Targets

| Category | Target | Notes |
|----------|--------|-------|
| Performance | 85+ | First load downloads ~9 MB DuckDB-WASM from CDN, impacting FCP. Cached loads should score 95+. |
| Accessibility | 90+ | OKLCH color system designed for WCAG AA contrast ratios. |
| Best Practices | 90+ | CSP meta tag, HTTPS-only service worker, no deprecated APIs. |
| SEO | 90+ | Meta tags, manifest, proper heading hierarchy. |

### Why not 100 Performance?

DuckDB-WASM requires downloading a ~9 MB binary on first visit. This is fetched from jsDelivr CDN and cached by the service worker for subsequent loads. The trade-off is justified: DuckDB provides a full SQL engine in the browser, enabling analytics queries that would otherwise require a backend server.

## Runtime Performance

### DuckDB-WASM Initialization

- **Cold start** (first visit): 2-5 seconds depending on network speed (downloads WASM binary from CDN)
- **Warm start** (cached): 500-1500 ms depending on device (WASM binary loaded from service worker cache)
- **OPFS persistence**: After initialization, DuckDB uses Origin Private File System for storage. Page refreshes reuse the existing database without re-importing data.

### Chart Rendering

- Recharts lazy-loaded in the Analytics chunk; not downloaded until needed
- Typical render time: <200 ms for datasets under 1,000 data points
- VolumeBarChart uses per-bar `Cell` coloring for zone visualization
- MuscleHeatMap uses direct SVG fill with OKLCH colors

### SQL Query Execution

- DuckDB's vectorized columnar engine executes typical analytics queries in <100 ms
- Window functions for PR detection and progression analysis
- Queries compiled by dbt and bundled as static SQL strings

## Optimization Notes

### Bundle Size

- **LazyMotion** (Framer Motion): Only loads `domAnimation` features, excluding the full motion bundle (~50% savings)
- **Font subsetting**: `@fontsource/geist-sans` loads only Latin character set (4 weights, ~140 KB total woff2)
- **Tree shaking**: Vite/Rollup eliminates unused exports from Recharts and other libraries
- **Manual chunks**: DuckDB wrapper isolated to prevent it from inflating the main bundle

### Runtime

- **OPFS persistence**: Database survives page refresh without re-initialization or data re-import
- **Service worker caching**: Workbox precaches all app assets; CDN resources (DuckDB WASM binary) cached on first fetch via runtime caching
- **Abort controllers**: Analytics hooks use `AbortController` refs to cancel stale queries when time range changes
- **Lazy routes**: Analytics page loaded on-demand, keeping initial page load fast for the primary workout logging flow
