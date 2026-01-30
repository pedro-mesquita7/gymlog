# Technology Stack: v1.2 UX & Portfolio Polish

**Project:** GymLog v1.2
**Researched:** 2026-01-30
**Scope:** Stack additions for testing, CI/CD, design system, error boundaries, observability, and demo data

## Executive Summary

This research focuses ONLY on new stack requirements for v1.2 features. The existing validated stack (React 19, DuckDB-WASM 1.32.0, dbt-duckdb, Zustand, Tailwind CSS 4, Recharts, etc.) is NOT covered here.

**Key Recommendations:**
- **Testing:** Vitest 4.0+ with React Testing Library 16.3+ and Playwright for DuckDB-WASM integration tests
- **CI/CD:** GitHub Actions with native Vite deployment workflow and dbt test automation
- **Design System:** Tailwind CSS 4 @theme directive (no additional tooling needed)
- **Error Boundaries:** react-error-boundary 6.1.0 for React 19 compatibility
- **Observability:** web-vitals 5.1.0 for browser performance metrics (lightweight, no backend)
- **Demo Data:** parquet-wasm 0.7.1 for generating Parquet seed files in TypeScript

---

## 1. Testing Framework

### Recommended Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **vitest** | ^4.0.17 | Unit & integration test runner | Vite-native, 5-10x faster than Jest, stable Browser Mode for DuckDB-WASM testing |
| **@vitest/ui** | ^4.0.17 | Interactive test UI with coverage visualization | Built-in UI shows test results and HTML coverage reports in browser |
| **@vitest/coverage-v8** | ^4.0.17 | Code coverage using V8 | AST-based remapping (since v3.2.0) provides Istanbul-quality accuracy with V8 speed |
| **@testing-library/react** | ^16.3.1 | React component testing | React 19 compatible (v16+), user-centric testing approach |
| **@testing-library/jest-dom** | ^6.6.3 | Custom DOM matchers | Provides `.toBeInTheDocument()`, `.toHaveTextContent()`, etc. |
| **@testing-library/user-event** | ^14.6.1 | User interaction simulation | More realistic user events than fireEvent |
| **happy-dom** | ^15.11.7 | DOM environment for unit tests | 2-3x faster than jsdom, sufficient for most React unit tests |
| **playwright** | ^1.51.0 | E2E tests for OPFS integration | Real browser testing required for DuckDB-WASM OPFS persistence |
| **msw** | ^2.8.3 | API request mocking | Network-level mocking, works across Vitest, Playwright, Storybook |

### Rationale

**Why Vitest 4.0+?**
- Native Vite integration (no configuration needed, uses existing vite.config.ts)
- Vitest 4.0 graduated Browser Mode from experimental to stable (December 2025)
- 5-10x faster than Jest on large codebases, feedback measured in microseconds
- Jest-compatible API for easy migration patterns
- **Source:** [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4), [Vitest vs Jest 30: Why 2026 is the Year of Browser-Native Testing](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb)

**Why Happy-DOM over jsdom?**
- Happy-DOM is 2-3x faster than jsdom, optimized for performance
- Sufficient for 90% of React unit tests that don't need full browser fidelity
- Lighter memory footprint
- **Trade-off:** Missing some obscure browser APIs, but unit tests shouldn't need those
- **Source:** [Test Environment | Guide | Vitest](https://vitest.dev/guide/environment), [jsdom vs happy-dom Discussion](https://github.com/vitest-dev/vitest/discussions/1607)

**Why Playwright for integration tests?**
- DuckDB-WASM OPFS persistence requires REAL browser environment
- happy-dom and jsdom cannot simulate OPFS (Origin Private File System)
- DuckDB-WASM's own test suite uses OPFS integration tests
- Headless browser automation allows CI/CD testing of OPFS workflows
- **Source:** [duckdb-wasm OPFS tests](https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts), [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)

**Why MSW?**
- Network-level request interception (no code changes needed)
- Reusable mocks across Vitest unit tests, Playwright E2E tests, Storybook stories
- Better than mocking fetch/axios directly (more realistic)
- **Use case:** Mock external API calls in tests (if we add any backend integrations later)
- **Source:** [Mock Service Worker](https://mswjs.io/), [Mocking Requests | Vitest](https://vitest.dev/guide/mocking/requests)

### Testing Strategy

**Unit Tests (Vitest + happy-dom + RTL):**
- React components (forms, lists, buttons)
- Zustand stores
- Utility functions
- dbt macro logic (if testable in JS)

**Integration Tests (Playwright):**
- DuckDB-WASM OPFS persistence (write → reload → read)
- Full user workflows (create gym → log workout → view history)
- PWA offline functionality
- Performance benchmarks (query execution time)

**Coverage Targets:**
- Components: 80%+ (focus on critical UI paths)
- Stores: 90%+ (business logic should be well-tested)
- Utils: 95%+ (pure functions are easy to test)

### Installation

```bash
# Testing framework
npm install -D vitest @vitest/ui @vitest/coverage-v8

# React testing
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom

# E2E testing
npm install -D playwright @playwright/test

# API mocking (optional, for future)
npm install -D msw
```

### Configuration Notes

**vitest.config.ts additions:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom', // Fast DOM for unit tests
    globals: true, // Enable describe, it, expect globally
    setupFiles: './src/test/setup.ts', // Load @testing-library/jest-dom
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    },
  },
})
```

**Playwright for OPFS tests (separate config):**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 2. CI/CD Pipeline

### Recommended Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **GitHub Actions** | N/A (platform) | CI/CD orchestration | Native to GitHub Pages, free for public repos, well-documented Vite integration |
| **actions/checkout** | v4 | Clone repository | Standard |
| **actions/setup-node** | v4 | Install Node.js | Standard |
| **actions/upload-pages-artifact** | v3 | Upload build artifacts | Required for GitHub Pages deployment |
| **actions/deploy-pages** | v4 | Deploy to GitHub Pages | Official GitHub Pages action |
| **sqlfluff** | ^4.0.0 | SQL linting for dbt models | Catches syntax errors, enforces style, dbt 1.10 support |

### Rationale

**Why GitHub Actions?**
- Native integration with GitHub Pages (Settings → Pages → Source: GitHub Actions)
- No third-party CI service needed (simplicity)
- Free for public repos, included in private repo plans
- Official Vite deployment workflow template available
- **Source:** [Deploying a Static Site | Vite](https://vite.dev/guide/static-deploy), [Deploying a Static Vite App on GitHub Pages with GitHub Actions](https://medium.com/@uci.lasmana/deploying-a-static-vite-app-on-github-pages-with-github-actions-03a67bb9ac4e)

**Why SQLFluff?**
- Industry standard for SQL linting (Python-based)
- Native dbt support (understands Jinja templating)
- SQLFluff 4.0.0 (released 2026-01-15) supports dbt 1.10
- Catches SQL syntax errors BEFORE they reach DuckDB-WASM
- Enforces consistent SQL style across dbt models
- **Source:** [SQLFluff Releases](https://github.com/sqlfluff/sqlfluff/releases), [Run linting checks with SQLFluff | dbt Developer Hub](https://docs.getdbt.com/guides/orchestration/set-up-ci/lint-on-push)

### Workflow Structure

**Workflow 1: Test & Lint (on PR)**
```yaml
name: Test & Lint
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run test:e2e # Playwright tests

  lint-sql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install sqlfluff==4.0.0
      - run: sqlfluff lint dbt/models --dialect duckdb
```

**Workflow 2: Deploy to GitHub Pages (on push to main)**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### vite.config.ts Change Required

**Critical:** Set `base` for GitHub Pages subdomain deployment:

```typescript
// If deploying to https://username.github.io/gymlog/
export default defineConfig({
  base: '/gymlog/', // CHANGE THIS to match your repo name
  // ... rest of config
})
```

**Source:** [Deploying a Static Site | Vite](https://vite.dev/guide/static-deploy)

### dbt Testing in CI/CD

**Option A: Compile Only (Recommended for Browser-Only App)**
```bash
cd dbt && dbt compile --target browser
```
- Validates SQL syntax and Jinja templating
- No database connection needed
- Fast (< 5 seconds)

**Option B: Run dbt Tests (If Adding Schema Tests Later)**
```bash
cd dbt && dbt test --target browser
```
- Requires DuckDB-WASM setup in Node.js (complex)
- NOT RECOMMENDED for now (adds CI complexity)

**Recommendation:** Use SQLFluff for SQL validation + `dbt compile` to catch Jinja errors. Defer actual dbt tests to local development until we need schema tests.

**Source:** [GitHub Actions dbt tests workflow 2026](https://www.datafold.com/blog/building-your-first-ci-pipeline-for-your-dbt-project), [Deploying dbt on GitHub Actions](https://medium.com/@amahmood561/deploying-dbt-on-github-actions-a-complete-guide-to-automated-data-transformations-3a86cf44b44a)

---

## 3. Design System Tooling

### Recommended Stack

**NO ADDITIONAL TOOLING NEEDED.**

Tailwind CSS 4 (already in project at v4.1.18) provides native design token support via `@theme` directive. This is sufficient for improving component consistency.

### Rationale

**Why NOT add a component library?**
- Project already uses custom Tailwind components (~12,865 LOC)
- Adding shadcn/ui or similar would require rewriting existing components
- v1.2 goal is "polish existing UX," not "rebuild with new component library"
- **Recommendation:** Improve consistency using Tailwind 4 features, not by introducing new dependencies

**Why Tailwind CSS 4 @theme is sufficient?**
- Tailwind 4 (released late 2025) introduced CSS-first configuration
- `@theme` directive replaces tailwind.config.js with CSS variables
- Design tokens defined once, accessible as utilities AND CSS variables
- Browser exposes tokens as `var(--color-primary)` for non-Tailwind usage
- **Source:** [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4), [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

### Implementation Strategy

**Step 1: Create design token CSS file**
```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Colors - semantic naming */
  --color-primary: oklch(0.55 0.22 262); /* Purple for actions */
  --color-primary-hover: oklch(0.50 0.22 262);
  --color-success: oklch(0.65 0.20 145); /* Green for PRs */
  --color-danger: oklch(0.60 0.25 25); /* Red for delete */
  --color-surface: oklch(0.98 0 0); /* Card backgrounds */
  --color-border: oklch(0.90 0 0);

  /* Spacing - consistent gaps */
  --spacing-card: 1rem;
  --spacing-section: 2rem;

  /* Typography */
  --font-display: "Inter", sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-modal: 0 10px 25px -5px rgb(0 0 0 / 0.2);

  /* Breakpoints (if custom needed) */
  --breakpoint-tablet: 640px;
  --breakpoint-desktop: 1024px;
}
```

**Step 2: Use tokens in components**
```tsx
// Old way (inconsistent)
<button className="bg-purple-600 hover:bg-purple-700 px-4 py-2">
  Save
</button>

// New way (token-based)
<button className="bg-primary hover:bg-primary-hover px-[--spacing-card] py-2">
  Save
</button>
```

**Step 3: Document tokens in Storybook (optional for v1.2)**
- If time permits, add Storybook to visualize design tokens
- NOT REQUIRED for v1.2 (defer to v1.3 if needed)

### What NOT to Add

| Tool | Why NOT Needed |
|------|----------------|
| **Style Dictionary** | Tailwind 4 @theme already provides token management |
| **shadcn/ui** | Would require rewriting existing components (out of scope) |
| **CVA (Class Variance Authority)** | Overkill for current component complexity |
| **Figma Tokens Plugin** | No Figma design system to sync with |
| **twin.macro** | Adds build complexity, Tailwind 4 is sufficient |

**Source:** [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns), [How to Build a Design Token System for Tailwind](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)

---

## 4. Error Boundary Patterns

### Recommended Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **react-error-boundary** | ^6.1.0 | Error boundary component | React 19 compatible, hook support, automatic error logging integration |

### Rationale

**Why react-error-boundary over custom implementation?**
- React 19 improved error handling (removed duplicate logs, added onCaughtError/onUncaughtError)
- react-error-boundary 6.1.0 (published 2026-01-27) supports React 19
- Provides declarative error boundaries with fallback UI
- Includes `useErrorHandler` hook for async error handling
- Reset functionality for error recovery
- **Source:** [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary), [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed)

**React 19 Error Boundary Improvements:**
- `onCaughtError`: Called when error caught by Error Boundary
- `onUncaughtError`: Called when error NOT caught by Error Boundary
- No more duplicate error logs (previously threw error twice)
- Better integration with Actions (automatic error propagation)
- **Source:** [React v19](https://react.dev/blog/2024/12/05/react-19)

### Implementation Strategy

**Strategic Placement:**
1. **Top-level boundary** - Around `<App />` (fallback: "Something went wrong" page)
2. **Data regions** - Around components loading DuckDB-WASM data
3. **Form boundaries** - Around complex forms (prevent form errors from crashing app)

**Example: Top-Level Error Boundary**
```tsx
// src/App.tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-card">
        <h1 className="text-2xl font-bold text-danger mb-4">Something went wrong</h1>
        <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto mb-4">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Log to console (or future error tracking service)
        console.error('Error caught by boundary:', error, info)
      }}
    >
      <MainApp />
    </ErrorBoundary>
  )
}
```

**Example: Data Region Boundary**
```tsx
// src/components/WorkoutHistory.tsx
import { ErrorBoundary } from 'react-error-boundary'

function WorkoutHistory() {
  return (
    <ErrorBoundary
      fallback={<div>Failed to load workout history. Please refresh.</div>}
    >
      <WorkoutHistoryContent />
    </ErrorBoundary>
  )
}
```

**Example: Async Error Handling (Event Handlers)**
```tsx
import { useErrorHandler } from 'react-error-boundary'

function WorkoutForm() {
  const handleError = useErrorHandler()

  const onSubmit = async (data) => {
    try {
      await saveWorkout(data)
    } catch (error) {
      handleError(error) // Propagates to nearest error boundary
    }
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

### Limitations (React Error Boundaries in General)

Error boundaries **DO NOT** catch:
- Event handler errors (use try/catch or useErrorHandler)
- Async errors (setTimeout, promises - use useErrorHandler)
- Server-side rendering errors
- Errors in error boundary itself

**Source:** [Error Boundaries – React](https://legacy.reactjs.org/docs/error-boundaries.html), [Guide to Error & Exception Handling in React | Sentry](https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/)

### Installation

```bash
npm install react-error-boundary
```

---

## 5. Observability (Browser-Only App)

### Recommended Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **web-vitals** | ^5.1.0 | Core Web Vitals monitoring | Official Google library, 2KB, measures LCP/INP/CLS, Safari 2026 support |

### Rationale

**Why web-vitals?**
- Official Google library for measuring Core Web Vitals
- Tiny footprint (~2KB gzipped)
- Measures real user performance (not synthetic)
- Safari adding LCP and INP support in 2026 (full browser coverage)
- Works in production without backend infrastructure
- **Source:** [web-vitals npm](https://www.npmjs.com/package/web-vitals), [Web Vitals | Articles | web.dev](https://web.dev/articles/vitals)

**Core Web Vitals Measured:**
- **LCP (Largest Contentful Paint):** Loading performance (<2.5s good)
- **INP (Interaction to Next Paint):** Interactivity (<200ms good)
- **CLS (Cumulative Layout Shift):** Visual stability (<0.1 good)

**Why NOT use full observability platform (Sentry, Datadog, etc.)?**
- Browser-only app, no backend to send metrics to
- No budget for paid observability services
- web-vitals logs to console (sufficient for portfolio demo)
- Can integrate with free services later (Google Analytics, Plausible)

### Implementation Strategy

**Basic Setup (Console Logging):**
```typescript
// src/utils/observability.ts
import { onCLS, onINP, onLCP } from 'web-vitals'

export function initPerformanceMonitoring() {
  // Log Core Web Vitals to console
  onCLS(console.log)
  onINP(console.log)
  onLCP(console.log)
}

// src/main.tsx
import { initPerformanceMonitoring } from './utils/observability'

initPerformanceMonitoring()
```

**Advanced: Custom DuckDB Query Metrics**
```typescript
// src/utils/queryMetrics.ts
interface QueryMetric {
  query: string
  duration: number
  timestamp: number
}

const queryMetrics: QueryMetric[] = []

export function logQuery(query: string, duration: number) {
  const metric = {
    query: query.slice(0, 100), // Truncate long queries
    duration,
    timestamp: Date.now(),
  }
  queryMetrics.push(metric)

  // Log slow queries (>100ms)
  if (duration > 100) {
    console.warn('Slow query detected:', metric)
  }
}

// Usage in DuckDB wrapper
const start = performance.now()
const result = await db.query(sql)
const duration = performance.now() - start
logQuery(sql, duration)
```

**Advanced: OPFS Storage Metrics**
```typescript
// src/utils/storageMetrics.ts
export async function logStorageUsage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    console.log('Storage usage:', {
      used: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
      quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
      percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%',
    })
  }
}

// Call on app mount or settings page
useEffect(() => {
  logStorageUsage()
}, [])
```

### What NOT to Add

| Tool | Why NOT Needed |
|------|----------------|
| **Sentry** | Requires backend, overkill for portfolio project |
| **Datadog RUM** | Paid service, requires backend |
| **LogRocket** | Paid service, session replay not needed |
| **Google Analytics** | Privacy concerns, not needed for v1.2 (defer to v1.3) |
| **PostHog** | Self-hosted or paid, backend required |

**Source:** [Observability for Browsers](https://dzone.com/articles/observability-for-browsers), [Monitor Core Web Vitals with the web-vitals.js Library](https://www.debugbear.com/blog/core-web-vitals-js)

### Installation

```bash
npm install web-vitals
```

---

## 6. Demo/Seed Data Approach

### Recommended Stack

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **parquet-wasm** | ^0.7.1 | Generate Parquet files in TypeScript | WebAssembly Parquet writer, works in Node.js, generates files DuckDB-WASM can read |

### Rationale

**Why parquet-wasm?**
- WebAssembly bindings to Rust Parquet library (fast, reliable)
- Works in Node.js (can generate seed files in build script)
- Produces Parquet files compatible with DuckDB-WASM
- Brotli-compressed WASM bundle is 1.2 MB (acceptable for dev dependency)
- **Source:** [parquet-wasm docs](https://kylebarron.dev/parquet-wasm/), [Apache Arrow Parquet generation JavaScript TypeScript 2026](https://arrow.apache.org/docs/js/)

**Why NOT use other approaches?**
- **CSV seed files:** Less efficient, no schema enforcement
- **SQL INSERT scripts:** Slower than Parquet, doesn't test Parquet ingestion
- **apache-arrow JavaScript:** No native Parquet write support (read-only)
- **parquetjs:** Pure JavaScript but slower, less maintained

### Seed Data Strategy

**Approach 1: Pre-Generated Parquet Files (Recommended)**
```
public/seed/
  ├── gyms.parquet          # 2-3 sample gyms
  ├── exercises.parquet     # 20-30 common exercises
  ├── workouts.parquet      # 10-15 historical workouts
  └── sets.parquet          # 50-100 logged sets
```

**Generation Script (Node.js):**
```typescript
// scripts/generateSeedData.ts
import * as arrow from 'apache-arrow'
import { writeParquet } from 'parquet-wasm/node'
import { readFileSync, writeFileSync } from 'fs'

// Generate gyms
const gymsTable = arrow.tableFromJSON([
  { gym_id: '01J...', name: 'Home Gym', created_at: '2024-01-01' },
  { gym_id: '01J...', name: 'Commercial Gym', created_at: '2024-01-01' },
])

const gymsParquet = writeParquet(gymsTable)
writeFileSync('public/seed/gyms.parquet', gymsParquet)

// Generate exercises (common compound lifts)
const exercisesTable = arrow.tableFromJSON([
  { exercise_id: '01J...', name: 'Barbell Squat', muscle_group: 'Legs', created_at: '2024-01-01' },
  { exercise_id: '01J...', name: 'Bench Press', muscle_group: 'Chest', created_at: '2024-01-01' },
  // ... more exercises
])

const exercisesParquet = writeParquet(exercisesTable)
writeFileSync('public/seed/exercises.parquet', exercisesParquet)
```

**Loading in App:**
```typescript
// src/utils/seedData.ts
import { db } from './duckdb'

export async function loadSeedData() {
  // Check if user already has data
  const result = await db.query("SELECT COUNT(*) FROM gyms")
  if (result.rows[0]['count'] > 0) {
    console.log('Data already exists, skipping seed')
    return
  }

  // Load seed files
  await db.query("COPY gyms FROM '/seed/gyms.parquet' (FORMAT PARQUET)")
  await db.query("COPY exercises FROM '/seed/exercises.parquet' (FORMAT PARQUET)")
  await db.query("COPY workouts FROM '/seed/workouts.parquet' (FORMAT PARQUET)")
  await db.query("COPY sets FROM '/seed/sets.parquet' (FORMAT PARQUET)")

  console.log('Seed data loaded successfully')
}
```

**Approach 2: Faker.js for Random Data (Optional)**
```typescript
import { faker } from '@faker-js/faker'

// Generate realistic workout data
const workouts = Array.from({ length: 15 }, () => ({
  workout_id: uuidv7(),
  gym_id: faker.helpers.arrayElement(gymIds),
  name: faker.helpers.arrayElement(['Push Day', 'Pull Day', 'Leg Day']),
  date: faker.date.past({ years: 1 }).toISOString(),
}))
```

### Installation

```bash
# Core dependency
npm install -D parquet-wasm

# Optional: Faker for realistic data
npm install -D @faker-js/faker

# Required: Apache Arrow (peer dependency)
npm install apache-arrow
```

### Seed Data Recommendations

**What to Include:**
- 2-3 sample gyms (Home Gym, Commercial Gym)
- 20-30 exercises (focus on compound lifts: squat, bench, deadlift, OHP, rows)
- 10-15 historical workouts (spanning 3-6 months)
- 50-100 logged sets (realistic progression, some PRs)

**What NOT to Include:**
- Personal user data (privacy concern)
- Too much data (keep initial load fast)
- Real gym names (trademark issues)

**Source:** [DuckDB in the Browser, Fast Parquet at the Edge](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e), [DuckDB-Wasm Examples](https://github.com/duckdb-wasm-examples)

---

## Stack Summary Table

| Category | Package | Version | When to Use |
|----------|---------|---------|-------------|
| **Testing** | vitest | ^4.0.17 | All tests (unit, integration) |
| | @vitest/ui | ^4.0.17 | Viewing test results and coverage |
| | @vitest/coverage-v8 | ^4.0.17 | Code coverage reporting |
| | @testing-library/react | ^16.3.1 | React component tests |
| | @testing-library/jest-dom | ^6.6.3 | DOM assertions |
| | @testing-library/user-event | ^14.6.1 | User interaction simulation |
| | happy-dom | ^15.11.7 | Fast DOM environment for unit tests |
| | playwright | ^1.51.0 | E2E tests requiring real browser (OPFS) |
| | msw | ^2.8.3 | Mock API requests (optional) |
| **CI/CD** | GitHub Actions | N/A | All CI/CD workflows |
| | sqlfluff | ^4.0.0 | SQL linting for dbt models |
| **Design System** | (none) | N/A | Use Tailwind 4 @theme directive |
| **Error Boundaries** | react-error-boundary | ^6.1.0 | All error boundary components |
| **Observability** | web-vitals | ^5.1.0 | Core Web Vitals monitoring |
| **Demo Data** | parquet-wasm | ^0.7.1 | Generate seed Parquet files |
| | @faker-js/faker | ^9.4.0 | Generate realistic fake data (optional) |

---

## Installation Commands

```bash
# Testing
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
npm install -D playwright @playwright/test
npm install -D msw

# Error boundaries
npm install react-error-boundary

# Observability
npm install web-vitals

# Demo data
npm install -D parquet-wasm @faker-js/faker
npm install apache-arrow
```

**Note:** SQLFluff installed in CI/CD via Python pip (not npm).

---

## What NOT to Add

| Package | Why Rejected |
|---------|--------------|
| Jest | Slower than Vitest, requires separate config from Vite |
| jsdom | Slower than happy-dom, not needed for unit tests |
| Cypress | Heavier than Playwright, less modern API |
| shadcn/ui | Would require rewriting existing components |
| Storybook | Out of scope for v1.2 (defer to v1.3) |
| Style Dictionary | Tailwind 4 @theme is sufficient |
| Sentry | Requires backend, overkill for portfolio |
| Google Analytics | Privacy concerns, defer to v1.3 |
| parquetjs | Slower than parquet-wasm, less maintained |

---

## Integration Points with Existing Stack

### Vitest + Vite
- Shares `vite.config.ts` (single config file)
- Uses existing `@vitejs/plugin-react` for JSX transformation
- No additional build configuration needed

### Playwright + Vite Dev Server
- playwright.config.ts references `npm run dev` (port 5173)
- Tests run against live dev server (OPFS requires real COOP/COEP headers)

### GitHub Actions + Vite Build
- `npm run build` generates `dist/` folder
- `actions/upload-pages-artifact` uploads `dist/`
- No custom build script needed

### Tailwind 4 @theme + Existing Components
- Migrate incrementally (old classes still work)
- Add `@theme` to `src/styles/theme.css`
- Import in `src/main.tsx` or `index.html`

### parquet-wasm + DuckDB-WASM
- Generates Parquet files in `public/seed/`
- DuckDB-WASM loads via `COPY FROM 'seed/*.parquet'`
- No runtime dependency (parquet-wasm is devDependency)

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Testing Stack | HIGH | Vitest 4.0 stable release, RTL 16.3.1 React 19 compatible, Playwright is proven for OPFS tests |
| CI/CD | HIGH | Official Vite documentation, GitHub Actions native to GitHub Pages, SQLFluff 4.0.0 recent release |
| Design System | MEDIUM | Tailwind 4 @theme is new (late 2025), but well-documented and sufficient for needs |
| Error Boundaries | HIGH | react-error-boundary 6.1.0 published 2026-01-27, React 19 compatibility verified |
| Observability | HIGH | web-vitals 5.1.0 is official Google library, Safari 2026 support confirmed |
| Demo Data | MEDIUM | parquet-wasm 0.7.1 is proven, but seed data generation script needs testing |

---

## Open Questions for Implementation

1. **Test Coverage Thresholds:** Should we enforce 80% coverage in CI/CD, or just report?
2. **Playwright OPFS Tests:** How many E2E tests needed? (Recommend: 3-5 critical paths)
3. **SQLFluff Rules:** Use default dbt rules, or customize for DuckDB dialect?
4. **Seed Data Volume:** How much historical data to include? (Recommend: 3 months)
5. **Error Boundary Granularity:** How many error boundaries? (Recommend: 3-5 strategic placements)

---

## Sources

### Testing
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4)
- [Vitest vs Jest 30: Why 2026 is the Year of Browser-Native Testing](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb)
- [Test Environment | Guide | Vitest](https://vitest.dev/guide/environment)
- [jsdom vs happy-dom Discussion](https://github.com/vitest-dev/vitest/discussions/1607)
- [duckdb-wasm OPFS tests](https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts)
- [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)
- [How to Unit Test React Components with Vitest and React Testing Library](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)
- [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react)
- [Mock Service Worker](https://mswjs.io/)
- [Mocking Requests | Vitest](https://vitest.dev/guide/mocking/requests)
- [Coverage | Guide | Vitest](https://vitest.dev/guide/coverage)

### CI/CD
- [Deploying a Static Site | Vite](https://vite.dev/guide/static-deploy)
- [Deploying a Static Vite App on GitHub Pages with GitHub Actions](https://medium.com/@uci.lasmana/deploying-a-static-vite-app-on-github-pages-with-github-actions-03a67bb9ac4e)
- [SQLFluff Releases](https://github.com/sqlfluff/sqlfluff/releases)
- [Run linting checks with SQLFluff | dbt Developer Hub](https://docs.getdbt.com/guides/orchestration/set-up-ci/lint-on-push)
- [GitHub Actions dbt tests workflow](https://www.datafold.com/blog/building-your-first-ci-pipeline-for-your-dbt-project)
- [Deploying dbt on GitHub Actions](https://medium.com/@amahmood561/deploying-dbt-on-github-actions-a-complete-guide-to-automated-data-transformations-3a86cf44b44a)

### Design System
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [How to Build a Design Token System for Tailwind](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)

### Error Boundaries
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary)
- [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed)
- [React v19](https://react.dev/blog/2024/12/05/react-19)
- [Error Boundaries – React](https://legacy.reactjs.org/docs/error-boundaries.html)
- [Guide to Error & Exception Handling in React | Sentry](https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/)

### Observability
- [web-vitals npm](https://www.npmjs.com/package/web-vitals)
- [Web Vitals | Articles | web.dev](https://web.dev/articles/vitals)
- [Observability for Browsers](https://dzone.com/articles/observability-for-browsers)
- [Monitor Core Web Vitals with the web-vitals.js Library](https://www.debugbear.com/blog/core-web-vitals-js)
- [GitHub - GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals)

### Demo Data
- [parquet-wasm docs](https://kylebarron.dev/parquet-wasm/)
- [Apache Arrow JavaScript](https://arrow.apache.org/docs/js/)
- [DuckDB in the Browser, Fast Parquet at the Edge](https://medium.com/@2nick2patel2/duckdb-in-the-browser-fast-parquet-at-the-edge-76a94863625e)
- [DuckDB-Wasm Examples](https://github.com/duckdb-wasm-examples)
- [A DuckDB-Wasm Web Mapping Experiment with Parquet](https://sparkgeo.com/blog/a-duckdb-wasm-web-mapping-experiment-with-parquet/)
