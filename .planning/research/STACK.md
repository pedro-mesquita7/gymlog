# Stack Research: Fitness Tracking PWA

## DuckDB-WASM + React Integration

DuckDB-WASM (v1.4.4) requires the **AsyncDuckDB API** running in a separate Web Worker thread to avoid blocking the main React thread. Use **@duckdb/react-duckdb** (official package, v1.33.1+) or community hooks like **duckdb-wasm-kit** for React integration. Key pattern: `useDuckDb` hook initializes a singleton DuckDB instance on first call; `useDuckDbQuery` hook handles typical query lifecycle (loading, error states).

**Critical gotcha:** DuckDB-WASM is single-threaded by default with experimental multithreading support. Memory is browser-limited (4GB max in Chrome). For UI responsiveness at 60 FPS, push all SQL operations (scans, joins, aggregations) into the Web Worker thread—never run queries on the main thread. The browser's WASM memory cannot spill to disk, so large dataset operations may fail if they exceed available RAM.

## PWA Setup with Vite

Use **vite-plugin-pwa** (v0.17.4+) with minimal config: `registerType: 'autoUpdate'` enables automatic service worker updates. Key offline configuration: set `clientsClaim: true` and `skipWaiting: true` in workbox options for immediate service worker activation. The plugin auto-precaches all static assets (HTML, CSS, JS) via workbox, enabling instant offline loading after first visit. For offline data access, you'll need to configure `runtimeCaching` for API responses or dynamically cache Parquet files via IndexedDB or OPFS.

**Setup tip:** Enable `devOptions: { enabled: true }` during development to test PWA features locally. The plugin generates manifest and service worker automatically—no manual file creation needed.

## Parquet in Browser

DuckDB-WASM reads Parquet natively via HTTP range requests (column pruning + predicate pushdown). For best performance with local-first design, cache Parquet in the **Origin Private File System (OPFS)** using the OPFS-SAH API, which offers near-native query speed. Query the cached file directly—DuckDB handles OPFS reads efficiently. Use `parquet_metadata()` to inspect file structure without downloading the entire file, reducing bandwidth.

**Performance note:** OPFS caching is persistent across sessions and maintains transactional guarantees. Firefox OPFS-SAH performance matches in-memory DuckDB; Chrome is ~2x faster. For strength training data (~5K-50K rows typical), OPFS caching will easily fit in available space and enable sub-second queries offline.

## Key Libraries

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@duckdb/duckdb-wasm` | 1.4.4+ | Core WASM analytics engine | DuckDB compiled to WASM, handles Parquet natively |
| `@duckdb/react-duckdb` | 1.33.1+ | React hooks & context | Official React integration with lifecycle management |
| `vite-plugin-pwa` | 0.17.4+ | Service worker & offline | Zero-config PWA generation with workbox under the hood |
| `react` | 18+ | UI framework | Already decided |
| `typescript` | 5+ | Type safety | Already decided |
| `vite` | 5+ | Build tool | Already decided (required for vite-plugin-pwa v0.17+) |
| `tailwind` | 3+ | Styling | Already decided |
| `parquetjs` or none | — | Parquet in JS | NOT needed—DuckDB-WASM handles Parquet parsing natively |

## Alternatives Not Recommended

| Option | Why Not | Use Instead |
|--------|---------|------------|
| IndexedDB for Parquet | Smaller storage limit, slower than OPFS-SAH | OPFS (Origin Private File System) |
| SQL.js | Single-threaded, no Parquet support | DuckDB-WASM (multi-worker compatible, Parquet native) |
| Manual web workers | Boilerplate heavy, threading issues | duckdb-wasm-kit hooks (handles worker lifecycle) |
| Apache Arrow JS + custom transforms | Slower for analytics, no SQL engine | DuckDB-WASM (SQL is faster for filtering/aggregation) |

## Installation

```bash
# Core analytics
npm install @duckdb/duckdb-wasm @duckdb/react-duckdb

# PWA
npm install -D vite-plugin-pwa

# Already installed
# npm install react typescript vite tailwindcss
```

## Vite Config Snippet

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
      },
      includeAssets: ['favicon.ico', 'robots.txt'],
      devOptions: { enabled: true },
    }),
  ],
})
```

## Sources

- [DuckDB-WASM GitHub Repository](https://github.com/duckdb/duckdb-wasm)
- [duckdb-wasm-kit: React Hooks for DuckDB](https://github.com/holdenmatt/duckdb-wasm-kit)
- [OPFS Caching with React + DuckDB-WASM](https://medium.com/@hadiyolworld007/opfs-caching-ftw-react-duckdb-wasm-blazing-parquet-0442ff695db5)
- [Vite PWA Official Guide](https://vite-pwa-org.netlify.app/guide/)
- [React + DuckDB-WASM at 60 FPS](https://medium.com/@hadiyolworld007/react-duckdb-wasm-at-60-fps-a00cafad3271)
- [DuckDB-Wasm Web Worker Considerations](https://github.com/duckdb/duckdb-wasm/discussions/1445)
- [DuckDB in the Browser: Parquet Performance](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e)
