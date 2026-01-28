# Phase 4: Data Durability - Research

**Researched:** 2026-01-28
**Domain:** Browser-based data export/import and backup reminders
**Confidence:** HIGH

## Summary

Phase 4 requires implementing export/import capabilities for DuckDB-WASM data stored in OPFS, plus backup reminders. The research covered three key domains: (1) DuckDB-WASM Parquet export/import APIs, (2) browser file download/upload patterns, and (3) state management for tracking backup actions.

DuckDB provides native COPY TO/FROM SQL commands for Parquet operations. The standard pattern is: execute COPY TO to write a Parquet file to DuckDB's virtual filesystem, use copyFileToBuffer() to extract the file as Uint8Array, then trigger browser download via Blob + URL.createObjectURL(). For import: use File API for user file selection, registerFileHandle() to register the file with DuckDB, then execute SQL to load data into tables.

Backup reminders require tracking workout completion count since last export. The existing Zustand store pattern with persist middleware can be extended with a counter that increments on workout completion and resets on export. A dismissable banner component will show when the counter exceeds a threshold.

**Primary recommendation:** Use DuckDB's COPY TO Parquet with zstd compression for exports, registerFileHandle with BROWSER_FILEREADER protocol for imports, and extend the existing Zustand pattern for backup reminder state.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @duckdb/duckdb-wasm | 1.32.0 (current in project) | SQL database with Parquet support | Already in use, native Parquet read/write, OPFS persistence |
| Zustand | 5.0.10 (current in project) | State management with persistence | Already in use, proven persist middleware for localStorage |
| Browser File API | Native | File selection for imports | Standard web API, no dependencies needed |
| Browser Blob API | Native | Creating downloadable files | Standard for client-side file generation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.3.6 (current in project) | Import validation schema | Already in use, validate imported Parquet schema matches expected structure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| COPY TO Parquet | Export as JSON/CSV | Parquet is project's core technology, better compression, type-safe |
| URL.createObjectURL | File System Access API | Object URLs work in all browsers, simpler for downloads |
| Zustand persist | Custom localStorage | Persist middleware is production-tested, handles hydration |

**Installation:**
No new packages required - all capabilities available in current stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── backup/
│       ├── useBackupExport.ts     # Export hook with DuckDB operations
│       ├── useBackupImport.ts     # Import hook with file handling
│       └── BackupReminder.tsx     # Dismissable banner component
├── stores/
│   └── useBackupStore.ts          # Backup state (counter, last export)
└── utils/
    └── parquet.ts                 # Shared Parquet helpers (compression config)
```

### Pattern 1: Export All Events to Parquet
**What:** Query events table, write to Parquet with COPY TO, extract buffer, trigger download
**When to use:** User clicks "Export Data" button
**Example:**
```typescript
// Source: DuckDB official docs + DuckDB-WASM API docs
async function exportToParquet(db: AsyncDuckDB): Promise<void> {
  const conn = await db.connect();

  // Write all events to Parquet with zstd compression
  await conn.query(`
    COPY (SELECT * FROM events ORDER BY _created_at)
    TO 'backup.parquet'
    (FORMAT parquet, COMPRESSION zstd, COMPRESSION_LEVEL 3)
  `);

  // Extract file buffer from DuckDB virtual filesystem
  const buffer = await db.copyFileToBuffer('backup.parquet');

  // Create downloadable blob
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymlog-backup-${new Date().toISOString().split('T')[0]}.parquet`;
  a.click();

  // Critical: Clean up to prevent memory leaks
  URL.revokeObjectURL(url);
  await db.dropFile('backup.parquet');
  await conn.close();
}
```

### Pattern 2: Import Parquet Backup
**What:** User selects file, register with DuckDB, insert into events table
**When to use:** User clicks "Import Data" and selects Parquet file
**Example:**
```typescript
// Source: DuckDB-WASM Data Ingestion docs
async function importFromParquet(db: AsyncDuckDB, file: File): Promise<void> {
  const conn = await db.connect();

  // Register file with DuckDB filesystem using BROWSER_FILEREADER protocol
  await db.registerFileHandle(
    'import.parquet',
    file,
    DuckDBDataProtocol.BROWSER_FILEREADER,
    true  // directIO
  );

  // Validate schema matches (prevents importing wrong files)
  const schemaCheck = await conn.query(`
    SELECT column_name, column_type
    FROM (DESCRIBE SELECT * FROM 'import.parquet')
  `);
  // Validate columns: _event_id, _created_at, event_type, payload

  // Insert events, handling duplicates
  await conn.query(`
    INSERT INTO events
    SELECT * FROM 'import.parquet'
    WHERE _event_id NOT IN (SELECT _event_id FROM events)
  `);

  // Clean up
  await db.dropFile('import.parquet');
  await conn.close();
}
```

### Pattern 3: Backup Reminder with Zustand
**What:** Track workouts since last export, show banner when threshold exceeded
**When to use:** After every workout completion, on app load
**Example:**
```typescript
// Source: Zustand persist middleware docs
interface BackupState {
  workoutsSinceBackup: number;
  lastBackupDate: string | null;
  reminderDismissed: boolean;

  incrementWorkoutCount: () => void;
  resetBackupCount: () => void;
  dismissReminder: () => void;
}

export const useBackupStore = create<BackupState>()(
  persist(
    (set) => ({
      workoutsSinceBackup: 0,
      lastBackupDate: null,
      reminderDismissed: false,

      incrementWorkoutCount: () => set((state) => ({
        workoutsSinceBackup: state.workoutsSinceBackup + 1,
        reminderDismissed: false  // Reset dismiss on new workout
      })),

      resetBackupCount: () => set({
        workoutsSinceBackup: 0,
        lastBackupDate: new Date().toISOString(),
        reminderDismissed: false
      }),

      dismissReminder: () => set({ reminderDismissed: true })
    }),
    {
      name: 'gymlog-backup',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// In component:
const BACKUP_THRESHOLD = 10;  // Show reminder every 10 workouts
const shouldShowReminder =
  workoutsSinceBackup >= BACKUP_THRESHOLD && !reminderDismissed;
```

### Pattern 4: Dismissable Banner Component
**What:** Alert banner with dismiss button that respects reminder state
**When to use:** Top of app when shouldShowReminder is true
**Example:**
```typescript
// Source: Material UI Alert + Shopify Polaris patterns
function BackupReminder() {
  const { workoutsSinceBackup, dismissReminder } = useBackupStore();
  const { exportBackup } = useBackupExport();

  const handleExport = async () => {
    await exportBackup();
    // resetBackupCount() called by exportBackup hook
  };

  return (
    <div role="alert" className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-400 mr-3" /* icon */ />
          <p className="text-sm text-yellow-700">
            You've completed {workoutsSinceBackup} workouts since your last backup.
            <button onClick={handleExport} className="underline ml-1">
              Back up your data now
            </button>
          </p>
        </div>
        <button onClick={dismissReminder} aria-label="Dismiss reminder">
          <svg className="w-5 h-5 text-yellow-400" /* close icon */ />
        </button>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Forgetting URL.revokeObjectURL():** Memory leaks accumulate with each export, can crash browser after many exports
- **Not validating import schema:** Importing arbitrary Parquet files can corrupt database or cause type errors
- **Using sessionStorage for backup counter:** Counter resets when tab closes, defeating the purpose
- **Blocking UI during export:** Large databases (1000+ events) can take seconds, use async with loading state
- **Not handling OPFS unavailable:** Export should work even if app is in in-memory mode, just warn about lack of auto-save

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parquet file generation | Custom binary serialization | DuckDB COPY TO | Parquet spec is complex (compression, encoding, metadata), DuckDB handles all edge cases |
| File download triggering | Custom download manager | URL.createObjectURL + <a> click | Cross-browser tested, handles mobile, no dependencies |
| Backup counter persistence | Custom localStorage wrapper | Zustand persist middleware | Handles hydration, race conditions, storage failures, TypeScript types |
| Schema validation | String matching column names | DuckDB DESCRIBE + Zod | Type-safe, handles nested structures, clear error messages |
| File size limits | Manual chunk splitting | Trust browser Blob API limits | Modern browsers handle 500MB+ Blobs, fails gracefully if exceeded |

**Key insight:** DuckDB already has production-grade Parquet export/import. Don't reimplement serialization - just orchestrate the existing APIs.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Object URLs
**What goes wrong:** Each createObjectURL creates a reference that persists until revoked. Multiple exports without cleanup accumulate memory.
**Why it happens:** Developers forget revokeObjectURL is manual memory management, not garbage collected.
**How to avoid:** Always call URL.revokeObjectURL(url) immediately after download trigger. Add it in finally block or use cleanup pattern.
**Warning signs:** Browser tab memory grows with each export, eventually crashes. DevTools Memory profiler shows growing Blob references.

### Pitfall 2: Import Overwrites Existing Data
**What goes wrong:** User imports old backup, newer events get overwritten or deleted.
**Why it happens:** Using INSERT OR REPLACE instead of INSERT with duplicate checking.
**How to avoid:** Use INSERT with WHERE _event_id NOT IN (SELECT _event_id FROM events) to skip duplicates. Consider showing preview of what will be imported.
**Warning signs:** User reports losing recent workouts after import. Event counts decrease after import.

### Pitfall 3: Export While Workout Active
**What goes wrong:** Export captures partial workout state, then workout completes. Import restores incomplete state.
**Why it happens:** No check for active workout session before export.
**How to avoid:** Check useWorkoutStore session state, warn user "Complete or cancel current workout before exporting". Alternative: include session state in export metadata.
**Warning signs:** User reports "lost sets" after import. Session state inconsistent with events table.

### Pitfall 4: Large File Browser Limitations
**What goes wrong:** Export/import hangs or fails silently on databases with 10,000+ events.
**Why it happens:** Browser main thread blocks during large file operations. Some browsers have Blob size limits.
**How to avoid:** Show loading state during operations. Test with realistic data volumes (1000, 5000, 10000 events). Consider warning at high event counts. For very large datasets (50,000+ events), chunk exports by date range.
**Warning signs:** UI freezes during export. No download happens. "Out of memory" errors in console.

### Pitfall 5: Import Doesn't Validate File Type
**What goes wrong:** User selects .csv or .json file, gets cryptic DuckDB error "not a Parquet file".
**Why it happens:** File input accepts all files, no pre-validation of magic bytes.
**How to avoid:** Check file extension is .parquet before registerFileHandle. Consider checking magic bytes (PAR1 header). Show user-friendly error: "Please select a Parquet backup file".
**Warning signs:** User confused by error messages. Support requests about "broken import".

### Pitfall 6: Backup Counter Never Resets
**What goes wrong:** User exports data but counter keeps incrementing, reminder shows again immediately.
**Why it happens:** Export function doesn't call resetBackupCount() or call happens but store isn't persisted.
**How to avoid:** Ensure resetBackupCount() called after successful export. Verify Zustand persist middleware is properly configured. Test counter reset behavior.
**Warning signs:** Reminder permanently visible. Counter value grows indefinitely.

## Code Examples

Verified patterns from official sources:

### DuckDB COPY TO Parquet Syntax
```sql
-- Source: https://duckdb.org/docs/stable/guides/file_formats/parquet_export
COPY (SELECT * FROM events ORDER BY _created_at)
TO 'backup.parquet'
(FORMAT parquet, COMPRESSION zstd, COMPRESSION_LEVEL 3);

-- With custom row group size for better compression
COPY (SELECT * FROM events)
TO 'backup.parquet'
(FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 100000);
```

### DuckDB Read Parquet
```sql
-- Source: https://duckdb.org/docs/stable/guides/file_formats/parquet_import
-- Implicit format detection
SELECT * FROM 'import.parquet';

-- Explicit function
SELECT * FROM read_parquet('import.parquet');

-- Load into table with duplicate checking
INSERT INTO events
SELECT * FROM 'import.parquet'
WHERE _event_id NOT IN (SELECT _event_id FROM events);
```

### Register File with DuckDB-WASM
```typescript
// Source: https://duckdb.org/docs/stable/clients/wasm/data_ingestion
import { DuckDBDataProtocol } from '@duckdb/duckdb-wasm';

// For user-selected files via File API
const file: File = /* from input type="file" */;
await db.registerFileHandle(
  'local.parquet',
  file,
  DuckDBDataProtocol.BROWSER_FILEREADER,
  true  // directIO flag
);
```

### Extract File Buffer for Download
```typescript
// Source: https://shell.duckdb.org/docs/classes/index.AsyncDuckDB.html
// After COPY TO command writes file
const buffer: Uint8Array = await db.copyFileToBuffer('backup.parquet');

// Create downloadable blob
const blob = new Blob([buffer], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);

// Trigger download
const link = document.createElement('a');
link.href = url;
link.download = 'backup.parquet';
link.click();

// Critical: Prevent memory leak
URL.revokeObjectURL(url);
```

### Browser File Selection
```typescript
// Source: Standard HTML5 File API
// In component:
<input
  type="file"
  accept=".parquet"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  }}
/>

// Programmatic file picker (modern browsers):
async function pickFile(): Promise<File | null> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.parquet';

  return new Promise((resolve) => {
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Export as JSON | Export as Parquet | Standard since DuckDB 0.3 (2021) | 10x smaller files, preserves types, faster import |
| Manual file download via server | Client-side Blob download | HTML5 File API (2014+) | No server needed, works offline, privacy-preserving |
| localStorage for all state | OPFS for large data | OPFS stable 2023 | Persistent database without localStorage 10MB limits |
| File reader chunking | registerFileHandle direct | DuckDB-WASM 1.0+ (2023) | Simpler API, DuckDB manages memory |

**Deprecated/outdated:**
- **CSV export for analytics data:** Parquet is now standard for structured analytics data (better compression, type safety)
- **download attribute without revokeObjectURL:** Memory leaks are unacceptable in modern SPAs, cleanup is mandatory
- **Synchronous file operations:** All modern APIs are async to avoid blocking main thread

## Open Questions

Things that couldn't be fully resolved:

1. **Maximum viable export size**
   - What we know: Blob API handles 500MB+ in Chrome, varies by browser and device
   - What's unclear: Exact limits for OPFS -> Blob -> Download pipeline in production
   - Recommendation: Test with 10,000 event database (estimate 5-10MB compressed Parquet). Add warning if events table exceeds 50,000 rows. Consider paginated export for future.

2. **Import merge strategies**
   - What we know: INSERT with NOT IN prevents duplicates by _event_id
   - What's unclear: How to handle scenario where user exports on Device A, works on Device B, then imports A's backup to B (divergent histories)
   - Recommendation: Start with simple duplicate skip. Document as limitation: "Import adds missing events, doesn't merge divergent histories". Consider conflict detection in future phase.

3. **Backup reminder threshold tuning**
   - What we know: Need a threshold (N workouts) to trigger reminder
   - What's unclear: What N value balances data safety vs. annoyance? Does it vary by user activity level?
   - Recommendation: Start with 10 workouts as default. Make it configurable in future. Track analytics on dismiss vs. export rates to optimize.

4. **Browser compatibility for large Parquet files**
   - What we know: OPFS works in Chrome, Firefox 111+, Safari 2023+
   - What's unclear: Performance characteristics on mobile browsers with limited memory
   - Recommendation: Test on mobile Chrome/Safari with realistic dataset. Consider adding warning for mobile users with large databases. Progressive Web App considerations for file access.

## Sources

### Primary (HIGH confidence)
- DuckDB Parquet Export: https://duckdb.org/docs/stable/guides/file_formats/parquet_export
- DuckDB Parquet Import: https://duckdb.org/docs/stable/guides/file_formats/parquet_import
- DuckDB-WASM Data Ingestion: https://duckdb.org/docs/stable/clients/wasm/data_ingestion
- DuckDB-WASM AsyncDuckDB API: https://shell.duckdb.org/docs/classes/index.AsyncDuckDB.html
- DuckDB COPY Statement: https://duckdb.org/docs/stable/sql/statements/copy

### Secondary (MEDIUM confidence)
- DuckDB-WASM GitHub: https://github.com/duckdb/duckdb-wasm (version, examples)
- Zustand Persist Middleware: https://zustand.docs.pmnd.rs/middlewares/persist
- OPFS Browser Compatibility: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- File System Access API: https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
- Material UI Alert Component: https://mui.com/material-ui/react-alert/

### Tertiary (LOW confidence)
- WebSearch: "DuckDB WASM export parquet file browser 2026" - Community articles on DuckDB-WASM patterns
- WebSearch: "browser download file blob JavaScript 2026" - Best practices for client-side downloads
- WebSearch: "event sourcing backup export all events pattern 2026" - Event sourcing backup strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - DuckDB-WASM API documented, Zustand patterns verified, browser APIs stable
- Architecture: HIGH - Export/import pattern verified from official docs, Zustand pattern from existing codebase
- Pitfalls: MEDIUM - Memory leaks and import overwrites documented, but large file limits require testing

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable APIs, unlikely to change)

---

## Additional Technical Notes

### DuckDB-WASM Versions
- Project uses @duckdb/duckdb-wasm 1.32.0
- DuckDB-WASM based on DuckDB v1.4.4 (as of research date)
- Parquet support stable since early versions

### Parquet Compression Recommendations
- **zstd level 3:** Good balance of compression ratio and speed (DuckDB default)
- **zstd level 1:** Fastest compression, minimal CPU usage, ~10% larger files
- **zstd level 9+:** Maximum compression, slower, diminishing returns for most datasets
- For event sourcing data (text-heavy JSON payloads), expect 5-10x compression vs uncompressed

### Event Sourcing Export Considerations
- Export includes ALL events (immutable append-only log)
- Order by _created_at ensures chronological replay
- Virtual columns (year, month) are recomputed on import, don't need export
- JSON payload column compresses well with Parquet (dictionary encoding)

### Browser File API Compatibility
- File API: Universal support (Chrome, Firefox, Safari, Edge)
- Blob API: Universal support
- URL.createObjectURL: Universal support (requires manual cleanup)
- File System Access API: Chrome/Edge only (not needed for this phase)
- OPFS: Chrome, Firefox 111+, Safari 2023+ (already handled by existing duckdb-init.ts fallback)

### React Hook Patterns
- Export hook: useBackupExport() - wraps async DuckDB operations, manages loading state
- Import hook: useBackupImport() - wraps file selection + validation, manages error state
- Both hooks interact with useBackupStore to update counter/timestamp
- Follow existing pattern from useWorkoutStore (Zustand + persist middleware)
