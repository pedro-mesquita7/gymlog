# Pitfalls Research: Local-First PWA with DuckDB-WASM

**Domain:** Local-first PWA with DuckDB-WASM + IndexedDB + Parquet
**Researched:** 2026-01-27
**Confidence:** HIGH (verified with official DuckDB docs, MDN, WebFetch sources)

---

## Browser Storage Pitfalls

### QuotaExceededError on Unknown Threshold
**Problem:** App crashes silently when IndexedDB quota exceeded. Developers often don't estimate storage before storing.
**Prevention:**
- Call `navigator.storage.estimate()` before writing large datasets
- Wrap all IndexedDB writes in try-catch for `QuotaExceededError`
- Monitor storage usage: `estimate.usage / estimate.quota`
- Implement cleanup logic before storing new data

**Browser Quotas to Know:**
- Chrome/Edge: 60% of disk space per origin
- Firefox: 10% of disk (best-effort) or 50% (persistent with `navigator.storage.persist()`)
- Safari (iOS 17+): ~60% of disk, 7-day inactivity eviction

### Storage Eviction on Device Pressure
**Problem:** All origin data deleted at once (LRU) when device runs low on disk. Users lose everything without warning.
**Prevention:**
- Request persistent storage: `navigator.storage.persist()` to skip LRU eviction
- Handle eviction gracefully: detect if IndexedDB is empty on page load
- Implement telemetry to catch data loss events
- Provide user warning: "Your data may be deleted if device storage is full"
- Don't assume data survives between sessions in best-effort mode

### Shared Quota Across All Storage Types
**Problem:** Cache API, IndexedDB, Web Storage all share same quota. Caching assets eats data storage allowance.
**Prevention:**
- Estimate total storage needed: DuckDB data + service worker + cache + other storage
- Keep service worker cache minimal (only essential assets)
- Monitor partition of quota: `estimate.quota` shows TOTAL, not per-storage-type
- Use versioning for caches to delete stale versions early

---

## DuckDB-WASM Pitfalls

### Out-of-Memory Crashes on Large Joins
**Problem:** DuckDB-WASM cannot spill to disk. Complex joins or aggregations on medium datasets (500MB+) cause OOM crashes. No graceful "out of memory" errors—browser tab freezes.
**Prevention:**
- Test query memory usage: profile with DevTools before shipping
- Chunk data: process in smaller batches rather than all at once
- Avoid multi-table joins on full datasets—filter first, then join
- Set realistic expectations: WASM is for 10-100MB, not TB-scale

### 4GB WebAssembly Memory Ceiling
**Problem:** Even on 64GB RAM, DuckDB-WASM limited to 4GB per tab. Browser memory limits enforced strictly.
**Prevention:**
- Cap dataset size at 1-2GB to leave room for query processing
- Don't load entire Parquet files into DuckDB at once—use streaming queries
- Pre-filter data in Parquet before loading into DuckDB
- Accept that you cannot query true TB-scale data in browser (use MotherDuck for larger datasets)

### Memory Leaks After Query Execution
**Problem:** Memory not released after queries complete. Running queries sequentially leads to out-of-memory errors.
**Prevention:**
- Call `db.close()` or similar cleanup after each query (check DuckDB-WASM docs for version-specific API)
- Monitor memory with DevTools: Task Manager should show memory decreasing after queries
- Don't accumulate query results: consume and discard results immediately
- Report leaks to DuckDB team if cleanup doesn't help (known issue in v1.1.2)

### Single-Threaded Execution by Default
**Problem:** Queries run on single thread, blocking UI. Long-running queries freeze the app.
**Prevention:**
- Move DuckDB queries to Web Worker to unblock main thread
- Provide loading UI/progress indicator for multi-second queries
- Break queries into smaller operations
- Note: Multithreading in WASM is experimental; don't rely on it yet

### Missing Feature Parity with Desktop DuckDB
**Problem:** Parquet compression, lazy loading, and HTTPFS not available in WASM build. Features you expect may not exist.
**Prevention:**
- Test all query patterns against DuckDB-WASM, not just desktop DuckDB
- Assume Parquet files are uncompressed or use Snappy/Brotli only
- Don't rely on remote file loading (HTTPFS unavailable)—fetch Parquet to browser first
- Check DuckDB-WASM release notes before upgrading

### INSTALL Extension is No-Op
**Problem:** `INSTALL extension` silently succeeds but does nothing. Extensions don't persist across sessions.
**Prevention:**
- Don't use INSTALL in WASM code—it's a no-op
- Load extensions that are bundled with WASM (JSON, etc.) but assume none will install
- Pre-load necessary extension code before creating queries

---

## PWA/Offline Pitfalls

### Service Worker Cache Staleness
**Problem:** Cached assets served faster than network. Users see stale data and don't realize it's old. Updates invisible without explicit cache busting.
**Prevention:**
- Set explicit cache versioning: `cache-v1`, `cache-v2`, etc. Delete old caches on service worker update
- Implement network-first strategy for API data, cache-first for static assets
- Show "last synced" timestamp to users—make staleness visible
- Clear cache on data version mismatches detected in code

### No Automatic Data Sync on Online Status
**Problem:** App goes offline, user edits data, returns online—nothing happens. Changes don't sync unless you explicitly implement sync logic.
**Prevention:**
- Listen to `online` event: implement sync trigger, not just detection
- Store pending mutations in IndexedDB before attempting network sync
- Use Background Sync API (`registration.sync.register()`) for reliable offline-first sync
- Implement conflict resolution: what wins if both client and server changed data?

### GitHub Pages HTTPS Requirement
**Problem:** Service workers require HTTPS. GitHub Pages has HTTPS, but mixed-content errors if app tries to load Parquet over HTTP.
**Prevention:**
- Ensure all assets and data URLs are HTTPS
- Embed Parquet files in repo or serve from HTTPS CDN
- Don't load external resources over HTTP in offline mode
- Test service worker registration: should succeed with no console errors

### Silent Service Worker Update Failures
**Problem:** Service worker updates fail silently. Old version runs forever. Users never get bug fixes.
**Prevention:**
- Implement `controller` change detection: listen to `controllerchange` event
- Log service worker lifecycle: `activate`, `install`, `message` events
- Test updates explicitly: disable browser cache during dev, reload after changes
- Provide manual update prompt: "New version available. Refresh?"

### IndexedDB + Service Worker Initialization Race
**Problem:** Service worker tries to cache assets while app loads IndexedDB. Race conditions cause stale cache or missing data.
**Prevention:**
- Don't depend on service worker to cache app data (IndexedDB is for data, Cache API for assets)
- Separate concerns: service worker caches HTML/CSS/JS, IndexedDB stores user data
- Initialize service worker registration AFTER app loads (don't block on it)
- Avoid cross-window data sharing via service worker for this app

---

## Data Loss Prevention

### Unhandled Storage Quota Exceeded
**Scenario:** User imports large Parquet file, quota exceeded mid-write. Half-written record in IndexedDB. Data corrupted.
**Mitigation:**
- Wrap all IndexedDB transactions in try-catch
- On `QuotaExceededError`: delete oldest records, compress data, or show user "storage full" warning
- Use transactions: entire write succeeds or fails, never partial
- Implement quota check BEFORE import: `estimate.usage + fileSize <= estimate.quota`

### Browser Cache Cleared by User
**Scenario:** User clears browser cache. Service worker, IndexedDB, and cached assets all deleted. App is blank.
**Mitigation:**
- This is expected. Design gracefully: show "no data" state, not error
- Provide export/import: let users save data to JSON file regularly
- Suggest `navigator.storage.persist()` on first load to reduce eviction risk
- Test explicitly: clear cache in DevTools and verify app is usable (empty state)

### Concurrent Edit Conflicts Between Tabs
**Scenario:** User opens app in two tabs. Edits in Tab A, queries run in Tab B. IndexedDB sees conflicting writes.
**Mitigation:**
- Implement single-writer pattern: use IndexedDB `keyPath` uniqueness, fail writes on conflict
- Store version/timestamp on records: detect conflicts before writing
- Use `versionchange` event to close database in other tabs if schema changes
- Warn user: "This data is open in another tab" or lock writes to first-open tab

### Parquet File Corruption on Partial Download
**Scenario:** Download Parquet file interrupted. Partial file cached. Queries fail silently or crash DuckDB.
**Mitigation:**
- Validate file hash after download (include SHA256 in Parquet metadata)
- Store Parquet in separate IndexedDB store, mark as "valid" only after hash check
- On load, check validity: if invalid, re-download
- Don't assume Parquet file is valid—always verify before query

### IndexedDB Transaction Timeout During Large Query
**Scenario:** Running multi-second DuckDB query. User switches tabs. IndexedDB transaction times out. Mutation lost.
**Mitigation:**
- Keep DuckDB queries short (< 5 seconds). Longer queries in Web Worker.
- Don't hold open transactions during long operations
- Save intermediate results to IndexedDB after each chunk
- Don't rely on single transaction spanning user interaction

### No Backup if Device Storage Fails
**Scenario:** Device storage corrupted or quota reset. No way to recover data.
**Mitigation:**
- Implement periodic export to JSON (once per session or user-triggered)
- Store backup in cloud (if app has backend, though this project is offline-first)
- Accept data loss risk and design UI accordingly: "Your data is only on this device"
- Provide user-facing backup/restore: allow export/import via file picker

---

## Parquet-Specific Gotchas

### Uncompressed Parquet Bloats IndexedDB
**Problem:** DuckDB-WASM doesn't support all compression codecs. Using large uncompressed Parquet files wastes storage quota.
**Prevention:**
- Pre-compress Parquet with Snappy or Brotli before shipping
- Calculate storage: if Parquet is 500MB, quota consumed is 500MB
- Use columnar selection in Parquet: load only columns you need, not entire file
- Consider splitting large files into year/month chunks

### Decompression Memory Overhead
**Problem:** Decompressing Parquet to Arrow requires 2x memory temporarily (compressed + uncompressed). 1GB Parquet needs 2GB available.
**Prevention:**
- Allocate 2x file size when calculating quota needs
- Use `Table.intoFFI()` API (in parquet-wasm) to reduce memory overhead
- Stream Parquet decompression if library supports it
- Test memory usage in DevTools during Parquet loading

---

## Critical Checklist Before Launch

- [ ] Storage quota estimation done: `navigator.storage.estimate()` called
- [ ] Service worker cache version strategy implemented
- [ ] IndexedDB QuotaExceededError caught and handled
- [ ] DuckDB-WASM memory cleanup verified (no leaks after queries)
- [ ] Parquet file integrity validation implemented
- [ ] Offline mode tested: app usable with no network
- [ ] Data export/import backup mechanism provided
- [ ] User communication: last sync time, storage warnings visible
- [ ] GitHub Pages HTTPS verified for all resources
- [ ] Service worker update detection and user notification working

---

## Sources

- [DuckDB WASM Documentation](https://duckdb.org/docs/stable/clients/wasm/overview)
- [Browser Storage Limits and Eviction Criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [GitHub Pages Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Offline Web Apps on GitHub Pages](https://mykmelez.github.io/offline-web-apps-on-github-pages/)
- [PWA Offline Data - web.dev](https://web.dev/learn/pwa/offline-data/)
- [DuckDB-WASM Performance Optimization Guide - Orchestra](https://www.getorchestra.io/guides/optimize-duckdb-performance-with-web-assembly-advanced-tweaks-for-data-engineering)
- [Memory Leak in DuckDB-WASM - GitHub Issue #1904](https://github.com/duckdb/duckdb-wasm/issues/1904)
- [Parquet-WASM - npm](https://www.npmjs.com/package/parquet-wasm)
- [DuckDB in the Browser, Fast Parquet at the Edge - Medium](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e)
