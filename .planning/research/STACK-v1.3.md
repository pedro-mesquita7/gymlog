# Stack Research: v1.3 Production Polish & Deploy Readiness

**Date:** 2026-01-31
**Focus:** New stack additions for v1.3 features

## New Dependencies

### @toon-format/toon v2.1.0

**Purpose:** Token-Oriented Object Notation — LLM-optimized data export
**Install:** `npm install @toon-format/toon`
**Bundle:** ~13MB unpacked (tree-shakeable, only encode needed at runtime)

**API Surface:**
```typescript
import { encode } from '@toon-format/toon'

// Core functions
encode(input: JsonValue, options?: EncodeOptions): string
decode(input: string, options?: DecodeOptions): JsonValue
encodeLines(input: JsonValue, options?: EncodeOptions): Iterable<string>
```

**EncodeOptions:**
```typescript
{
  indent?: number       // default: 2
  delimiter?: ',' | '\t' | '|'  // default: ','
  keyFolding?: 'off' | 'safe'  // default: 'off'
  flattenDepth?: number // default: Infinity
  replacer?: EncodeReplacer
}
```

**Format example (workout data):**
```
workout:
  date: 2026-01-31
  exercises[3]{name,sets,reps,weight}:
    Squat,5,5,100
    "Bench Press",4,8,70
    Deadlift,3,5,120
```

**Why use it:**
- 30-60% fewer tokens vs JSON
- 73.9% LLM accuracy vs JSON's 69.7%
- Perfect for tabular workout data (uniform arrays of sets)
- Official TypeScript SDK with types

**Integration:** Import encode only (tree-shake decode). Create export service that queries DuckDB, formats via encode(), copies to clipboard or downloads .toon file.

### No Other New Runtime Dependencies

Everything else in v1.3 uses existing stack:
- **Analytics redesign** → existing Recharts + hooks
- **Time ranges** → existing Zustand + SQL queries
- **Volume recommendations** → hardcoded research data + existing volume analytics
- **Color scheme** → existing Tailwind CSS 4 OKLCH tokens
- **E2E tests** → existing Playwright
- **PWA audit** → existing vite-plugin-pwa config
- **Performance** → Lighthouse CI (dev dependency only)

### Dev Dependencies (Optional)

| Tool | Purpose | Notes |
|------|---------|-------|
| `lighthouse-ci` | CI performance budgets | GitHub Actions integration |
| `@axe-core/playwright` | Automated accessibility testing | Playwright plugin for WCAG audit |

## What NOT to Add

- **No charting library change** — Recharts handles time range filtering fine
- **No state management change** — Zustand sufficient for time range state
- **No CSS framework change** — Tailwind 4 OKLCH handles color audit
- **No test framework change** — Vitest + Playwright covers E2E expansion
- **No service worker library** — vite-plugin-pwa already handles this

## Volume Science Data (Hardcoded, Not a Library)

Schoenfeld et al. (2017) + Renaissance Periodization volume landmarks:

| Muscle Group | MEV | MAV Low | MAV High | MRV |
|-------------|-----|---------|----------|-----|
| Chest | 6 | 12 | 20 | 22 |
| Back | 10 | 14 | 22 | 25 |
| Quads | 8 | 12 | 18 | 20 |
| Hamstrings | 6 | 10 | 16 | 20 |
| Biceps | 8 | 14 | 20 | 26 |
| Triceps | 6 | 10 | 14 | 18 |
| Shoulders (front) | 0 | 6 | 8 | 12 |
| Shoulders (side/rear) | 8 | 16 | 22 | 26 |
| Calves | 8 | 12 | 16 | 20 |
| Abs | 0 | 16 | 20 | 25 |
| Glutes | 0 | 4 | 12 | 16 |

Zones: Under MEV (red) → MEV-MAV low (yellow) → MAV range (green) → MAV high-MRV (orange) → Over MRV (red)

Sources: Schoenfeld, Ogborn & Krieger 2017; Israetel/RP volume landmarks.
