# Phase 8: Testing & Design Foundation - Research

**Researched:** 2026-01-31
**Domain:** Testing infrastructure, error boundaries, design system, component primitives
**Confidence:** HIGH

## Summary

Phase 8 establishes production-grade testing, error recovery, and visual design primitives for upcoming features. This is a foundation phase with no user-facing feature changes.

The standard approach for testing React 19 + DuckDB-WASM PWAs in 2026 is **Vitest 4+ with React Testing Library for unit tests** (mocking DuckDB), **Playwright for E2E tests** (real browser with OPFS), **react-error-boundary 6.1+ for granular error boundaries**, **Geist fonts via @fontsource or non.geist**, and **Tailwind CSS 4's @theme directive for design tokens**.

Key insight: Don't test implementation details. Test user behavior. Mock DuckDB in unit tests, use real DB only in E2E tests.

**Primary recommendation:** Start with testing infrastructure and error boundaries (foundation), then extract component primitives from existing code based on audit, systematize design tokens incrementally during component migration.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **vitest** | ^4.0.17 | Unit & integration test runner | Vite-native (reuses existing config), 10-20x faster than Jest, stable Browser Mode, Jest-compatible API |
| **@testing-library/react** | ^16.3.1 | React component testing utilities | React 19 compatible (v16+), user-centric queries, industry standard for behavior testing |
| **playwright** | ^1.51.0 | E2E browser testing | Real browser required for OPFS testing, headless automation for CI/CD, official Microsoft support |
| **react-error-boundary** | ^6.1.0 | Error boundary wrapper component | React 19 compatible, hook-based API (useErrorHandler), fallback customization, official best practice |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@vitest/ui** | ^4.0.17 | Interactive test UI | View test results and HTML coverage reports in browser |
| **@vitest/coverage-v8** | ^4.0.17 | Code coverage reporting | AST-based remapping (v3.2+) = Istanbul accuracy + V8 speed |
| **@testing-library/jest-dom** | ^6.6.3 | DOM matchers | `.toBeInTheDocument()`, `.toHaveTextContent()` assertions |
| **@testing-library/user-event** | ^14.6.1 | User interaction simulation | More realistic than fireEvent (keyboard, mouse, clipboard) |
| **happy-dom** | ^15.11.7 | DOM environment for unit tests | 2-3x faster than jsdom, sufficient for 90% of React tests |
| **@fontsource/geist-sans** | ^8.1.0 | Geist Sans font | Self-hosted fonts, no Next.js dependency |
| **@fontsource/geist-mono** | ^8.1.0 | Geist Mono font | Monospace variant for metrics/data |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest slower, needs separate config from Vite, outdated for 2026 |
| happy-dom | jsdom | jsdom slower (3x), heavier memory, but better edge-case coverage |
| Playwright | Cypress | Cypress heavier, less modern API, Playwright is 2026 standard |
| react-error-boundary | Custom class components | react-error-boundary provides hooks, better DX, actively maintained |
| @fontsource | Google Fonts CDN | CDN requires network, GDPR concerns, @fontsource is self-hosted |

**Installation:**

```bash
# Testing framework
npm install -D vitest @vitest/ui @vitest/coverage-v8

# React testing
npm install -D @testing-library/react@16.3.1 @testing-library/jest-dom @testing-library/user-event happy-dom

# E2E testing
npm install -D playwright @playwright/test

# Error boundaries
npm install react-error-boundary

# Fonts
npm install @fontsource/geist-sans @fontsource/geist-mono
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── ui/                      # Component primitives (Button, Input, Card)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── NumberStepper.tsx    # Already exists
│   ├── workout/                 # Feature components
│   └── templates/
├── styles/
│   ├── globals.css              # Tailwind imports + @theme
│   └── fonts.css                # Geist font imports
├── tests/
│   ├── setup.ts                 # Test environment setup
│   ├── mocks/
│   │   ├── duckdb.ts           # Mock DuckDB-WASM
│   │   └── zustand.ts          # Zustand store reset utilities
│   └── __fixtures__/           # Test data
└── e2e/
    ├── workout-logging.spec.ts  # E2E tests with real DuckDB
    └── opfs-persistence.spec.ts
```

### Pattern 1: Vitest Setup with React Testing Library

**What:** Configure Vitest to use happy-dom environment with globals and setup file for Jest DOM matchers.

**When to use:** Every React component test needs this base configuration.

**Example:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,                    // Enable describe, it, expect globally
    environment: 'happy-dom',         // Fast DOM for unit tests
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/tests/**'],
    },
  },
})
```

```typescript
// src/tests/setup.ts
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock DuckDB-WASM (too heavy for unit tests)
vi.mock('@duckdb/duckdb-wasm', () => ({
  AsyncDuckDB: vi.fn(),
  getJsDelivrBundles: vi.fn(() => ({})),
  selectBundle: vi.fn(() => ({ mainModule: '', mainWorker: '' })),
  ConsoleLogger: vi.fn(),
  LogLevel: { WARNING: 1 },
  DuckDBAccessMode: { READ_WRITE: 0 },
}))
```

**Source:** [How to Unit Test React Components with Vitest and React Testing Library](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)

### Pattern 2: Testing User Behavior, Not Implementation

**What:** Test components by querying accessible elements (getByRole, getByLabelText) and simulating user interactions, not by accessing internal state.

**When to use:** All React component tests.

**Example:**

```typescript
// src/components/workout/__tests__/SetLogger.test.tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SetLogger } from '../SetLogger'

describe('SetLogger', () => {
  it('allows user to log a set', async () => {
    const onLogSet = vi.fn()

    render(
      <SetLogger
        exerciseId="ex1"
        originalExerciseId="ex1"
        targetRepsMin={8}
        targetRepsMax={12}
        onLogSet={onLogSet}
      />
    )

    // Query by accessible role/label
    const weightInput = screen.getByLabelText(/weight/i)
    const repsInput = screen.getByLabelText(/reps/i)
    const logButton = screen.getByRole('button', { name: /log set/i })

    // Simulate user behavior
    await userEvent.type(weightInput, '80')
    await userEvent.type(repsInput, '10')
    await userEvent.click(logButton)

    // Assert on observable result
    expect(onLogSet).toHaveBeenCalledWith({
      weight_kg: 80,
      reps: 10,
      rir: null,
    })
  })
})
```

**Source:** [Vitest with React Testing Library: A Modern Approach](https://blog.incubyte.co/blog/vitest-react-testing-library-guide/)

### Pattern 3: Playwright E2E for OPFS Testing

**What:** Use Playwright to test DuckDB-WASM initialization and OPFS persistence in real browser.

**When to use:** When testing features that require real browser environment (OPFS, SharedArrayBuffer, WASM initialization).

**Example:**

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

```typescript
// e2e/opfs-persistence.spec.ts
import { test, expect } from '@playwright/test'

test('DuckDB initializes with OPFS persistence', async ({ page }) => {
  await page.goto('/')

  // Wait for DuckDB initialization
  await page.waitForFunction(() => window.duckdb !== undefined, { timeout: 10000 })

  // Verify OPFS database file created
  const dbStatus = await page.evaluate(async () => {
    const db = await window.duckdb.connect()
    const result = await db.query('SELECT 1 as test')
    return { success: true, rows: result.toArray() }
  })

  expect(dbStatus.success).toBe(true)
  expect(dbStatus.rows[0].test).toBe(1)
})
```

**Source:** [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)

### Pattern 4: Granular Error Boundaries with react-error-boundary

**What:** Place error boundaries at feature level (not root only) with contextual fallback UI and recovery options.

**When to use:** Wrap each major feature area so errors don't cascade across the app.

**Example:**

```typescript
// src/components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-6 bg-red-900/30 border border-red-700/50 rounded-lg">
      <h2 className="text-red-400 font-semibold mb-2">Something went wrong</h2>
      <details className="text-sm text-zinc-400 mb-4">
        <summary className="cursor-pointer hover:text-zinc-300">Show details</summary>
        <pre className="mt-2 p-2 bg-zinc-900 rounded overflow-auto">
          {error.message}
        </pre>
      </details>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
      >
        Try Again
      </button>
    </div>
  )
}

// App.tsx - Granular boundaries
function App() {
  return (
    <ReactErrorBoundary FallbackComponent={AppErrorFallback}>
      <main>
        <ReactErrorBoundary FallbackComponent={ErrorFallback}>
          {activeTab === 'workouts' && <WorkoutPage />}
        </ReactErrorBoundary>

        <ReactErrorBoundary FallbackComponent={ErrorFallback}>
          {activeTab === 'analytics' && <AnalyticsPage />}
        </ReactErrorBoundary>
      </main>
    </ReactErrorBoundary>
  )
}
```

**Source:** [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed)

### Pattern 5: Async Error Handling with useErrorHandler

**What:** Use react-error-boundary's useErrorHandler hook to propagate async errors (event handlers, promises) to nearest error boundary.

**When to use:** Event handlers, setTimeout, async operations (error boundaries don't catch these automatically).

**Example:**

```typescript
import { useErrorHandler } from 'react-error-boundary'

function WorkoutForm() {
  const handleError = useErrorHandler()

  const onSubmit = async (data) => {
    try {
      await saveWorkout(data)
    } catch (error) {
      handleError(error) // Propagates to nearest ErrorBoundary
    }
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

**Source:** [Error Handling in React with react-error-boundary](https://certificates.dev/blog/error-handling-in-react-with-react-error-boundary)

### Pattern 6: Tailwind CSS 4 Design Tokens with @theme

**What:** Define design tokens (colors, spacing, typography) in CSS using @theme directive instead of tailwind.config.js.

**When to use:** All design token definitions in Tailwind CSS 4+.

**Example:**

```css
/* src/styles/globals.css */
@import 'tailwindcss';

@theme {
  /* Colors - semantic naming */
  --color-primary: oklch(0.55 0.22 262);        /* Purple for actions */
  --color-primary-hover: oklch(0.50 0.22 262);
  --color-success: oklch(0.65 0.20 145);        /* Green for PRs */
  --color-danger: oklch(0.60 0.25 25);          /* Red for delete */
  --color-surface: oklch(0.20 0.01 270);        /* Dark surface */
  --color-border: oklch(0.30 0.01 270);

  /* Spacing */
  --spacing-card: 1rem;
  --spacing-section: 2rem;

  /* Typography */
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'Courier New', monospace;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-modal: 0 10px 25px -5px rgb(0 0 0 / 0.2);
}
```

```css
/* src/styles/fonts.css */
@import '@fontsource/geist-sans/400.css';
@import '@fontsource/geist-sans/500.css';
@import '@fontsource/geist-sans/600.css';
@import '@fontsource/geist-mono/400.css';
```

**Usage in components:**

```tsx
// Old way (inconsistent)
<button className="bg-purple-600 hover:bg-purple-700 px-4 py-2">

// New way (token-based)
<button className="bg-primary hover:bg-primary-hover px-4 py-2">
```

**Source:** [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

### Pattern 7: Component Primitive Extraction

**What:** Audit existing components to identify most-duplicated patterns, extract to src/components/ui/ with consistent API.

**When to use:** After design tokens are defined, before migrating features.

**Example:**

```typescript
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-hover text-black',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    danger: 'bg-danger hover:bg-danger/90 text-white',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

```typescript
// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-zinc-400">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-zinc-800 border ${
          error ? 'border-danger' : 'border-border'
        } rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
```

**Source:** [Radix UI Primitives](https://www.radix-ui.com/primitives)

### Anti-Patterns to Avoid

- **Testing implementation details:** Don't test useState updates, internal methods, or Zustand store internals. Test observable user behavior.
- **Single root error boundary:** Don't wrap entire app in one boundary. Errors cascade, user loses context. Use granular boundaries per feature.
- **Mixing design tokens with raw Tailwind:** Don't add new design token primitives while leaving old code with raw colors (bg-blue-500). Migrate incrementally but clean up old code.
- **Heavy mocks in E2E tests:** Don't mock DuckDB-WASM in Playwright tests. Use real DB for E2E, mocks for unit tests only.
- **Coverage-driven testing:** Don't write shallow tests to hit coverage metrics. Focus on critical paths, accept 60-70% coverage on high-value tests.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary wrapper | Custom class component with getDerivedStateFromError | react-error-boundary | Hook support (useErrorHandler), fallback customization, automatic error propagation with React 19 Actions, actively maintained |
| DOM assertions | Custom matchers for toBeInTheDocument, toHaveTextContent | @testing-library/jest-dom | Industry standard, comprehensive matcher library, better error messages |
| User event simulation | fireEvent from React Testing Library | @testing-library/user-event | More realistic (keyboard delays, focus management, clipboard), better matches real user behavior |
| Design token system | Custom CSS variable management with JS | Tailwind CSS 4 @theme | CSS-first config, generates utilities + CSS variables, browser-native, no build step needed |
| Font hosting | Self-hosted font files with @font-face | @fontsource packages | NPM-installable, version-controlled, optimized subset files, automatic font-display |
| Component primitive library | Building Button/Input/Card from scratch | Extract from existing code | Project already has custom components, extracting patterns maintains consistency and avoids "second system" syndrome |

**Key insight:** Testing, error boundaries, and design tokens are solved problems in 2026. Use standard libraries, don't reinvent.

## Common Pitfalls

### Pitfall 1: Testing Implementation Details Instead of User Behavior

**What goes wrong:** Tests access component internals (useState, Zustand store), break on refactoring, don't catch real bugs.

**Why it happens:** Developers new to testing write tests that mirror implementation instead of user experience.

**How to avoid:**
- Follow React Testing Library philosophy: test like a user
- Use getByRole, getByLabelText, not getByTestId
- Never access component.state or internal methods
- If refactoring doesn't change UI, tests should still pass
- Focus on integration tests over unit tests for React components

**Warning signs:**
- Tests break after renaming variables
- Tests import component internals or store implementation
- High coverage but production bugs not caught

**Source:** [Common mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Pitfall 2: CI/CD Pipeline Doesn't Test DuckDB-WASM Initialization

**What goes wrong:** Unit tests pass with mocked DB, production fails because WASM files not served correctly or SharedArrayBuffer unavailable.

**Why it happens:** DuckDB-WASM requires specific HTTP headers (COOP/COEP), correct MIME types, proper bundle paths. CI tests run in Node, not browser.

**How to avoid:**
- Add Playwright E2E tests to CI that verify DuckDB initialization
- Test production build locally with `vite preview` before deploying
- Document deployment requirements (COOP/COEP headers)
- Use deployment preview URLs for manual smoke testing
- Monitor production errors with error reporting

**Warning signs:**
- CI passes but production app shows errors
- "SharedArrayBuffer is not defined" in production console
- WASM files 404 or served with wrong MIME type

**Source:** [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)

### Pitfall 3: Error Boundary Doesn't Catch Event Handler Errors

**What goes wrong:** Error boundary added to catch render errors, but event handler errors (onClick, onChange) aren't caught. Critical errors fail silently.

**Why it happens:** Error boundaries only catch errors during render, lifecycle methods, constructors. Event handlers run outside React lifecycle.

**How to avoid:**
- Use react-error-boundary's useErrorHandler hook for event handlers
- Wrap async operations with try/catch and explicit error handling
- Add error reporting in catch blocks
- Test error scenarios explicitly
- Show user-facing error messages via toast/alert, not just error boundary

**Warning signs:**
- Errors logged in console but error boundary doesn't trigger
- Users report "nothing happens" when clicking buttons
- Event handler errors don't show error UI

**Source:** [Why React Error Boundaries Aren't Just Try/Catch for Components](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l)

### Pitfall 4: Design System Migration Without Cleanup

**What goes wrong:** New design token components added, old raw Tailwind classes remain. Two styling systems coexist, visual inconsistency, bloated CSS.

**Why it happens:** Incremental migration without cleanup plan. No enforcement to prevent raw Tailwind in new code.

**How to avoid:**
- Migrate one feature area at a time (templates, then logging, then history)
- Delete old code when migrated (don't leave both)
- Use ESLint rules to block raw Tailwind classes
- Document migration checklist
- Use visual regression testing (Chromatic, Percy)

**Warning signs:**
- Two components with same semantic meaning look different
- CSS bundle size doesn't decrease during migration
- New PRs mix design tokens and raw Tailwind

**Source:** [Design Systems with Tailwind CSS - Makers' Den](https://makersden.io/blog/design-systems-with-tailwind-css)

### Pitfall 5: Playwright SharedArrayBuffer Limitations

**What goes wrong:** Playwright tests fail in WebKit/Firefox with "SharedArrayBuffer is not defined" even though OPFS works in production Chrome.

**Why it happens:** SharedArrayBuffer support differs across Playwright browser builds. WebKit and Firefox builds may not have SharedArrayBuffer enabled.

**How to avoid:**
- Test primarily with Playwright Chromium for OPFS tests
- Document browser-specific limitations
- Consider fallback to in-memory DB for unsupported browsers
- Check Playwright browser build release notes for SharedArrayBuffer support

**Warning signs:**
- Tests pass in Chromium, fail in WebKit/Firefox
- Production works but E2E tests fail
- "SharedArrayBuffer is not defined" in Playwright logs

**Source:** [Playwright SharedArrayBuffer Issues](https://github.com/microsoft/playwright/issues/28513)

## Code Examples

Verified patterns from official sources:

### Unit Test with Mocked DuckDB

```typescript
// src/hooks/__tests__/useHistory.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHistory } from '../useHistory'
import * as duckdbInit from '../../db/duckdb-init'

// Mock DuckDB connection
const mockConn = {
  query: vi.fn(() => ({
    toArray: () => [
      { set_id: 's1', weight_kg: 100, reps: 10, logged_at: '2026-01-30T10:00:00Z' },
    ],
  })),
  close: vi.fn(),
}

vi.spyOn(duckdbInit, 'getDuckDB').mockReturnValue({
  connect: vi.fn(() => Promise.resolve(mockConn)),
} as any)

describe('useHistory', () => {
  it('fetches and returns history', async () => {
    const { result } = renderHook(() =>
      useHistory({ exerciseId: 'ex1', currentGymId: 'g1' })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].weight_kg).toBe(100)
  })
})
```

### E2E Test with Real DuckDB

```typescript
// e2e/workout-logging.spec.ts
import { test, expect } from '@playwright/test'

test('user can log a workout set', async ({ page }) => {
  await page.goto('/')

  // Wait for app to initialize
  await page.waitForSelector('[data-testid="start-workout"]')

  // Start workout
  await page.click('[data-testid="start-workout"]')

  // Select template and gym
  await page.selectOption('select[name="template"]', 'push-day')
  await page.selectOption('select[name="gym"]', 'home-gym')
  await page.click('button:has-text("Start")')

  // Log a set
  await page.fill('input[name="weight"]', '80')
  await page.fill('input[name="reps"]', '10')
  await page.click('button:has-text("Log Set")')

  // Verify set appears in history
  await expect(page.locator('text=80kg × 10')).toBeVisible()
})
```

### Error Boundary with Recovery

```typescript
// src/components/analytics/AnalyticsPage.tsx
import { ErrorBoundary } from 'react-error-boundary'

function AnalyticsErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-6 bg-red-900/30 border border-red-700/50 rounded-lg">
      <h2 className="text-red-400 font-semibold mb-2">Analytics temporarily unavailable</h2>
      <details className="mb-4">
        <summary className="text-sm text-zinc-400 cursor-pointer">Show details</summary>
        <pre className="mt-2 p-2 bg-zinc-900 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </details>
      <div className="flex gap-2">
        <button onClick={resetErrorBoundary} className="btn-secondary">
          Try Again
        </button>
        <a href="/" className="btn-secondary">
          Back to Workouts
        </a>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  return (
    <ErrorBoundary FallbackComponent={AnalyticsErrorFallback}>
      <AnalyticsContent />
    </ErrorBoundary>
  )
}
```

### Geist Font Setup (Non-Next.js)

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/fonts.css'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```css
/* src/styles/fonts.css */
@import '@fontsource/geist-sans/400.css';
@import '@fontsource/geist-sans/500.css';
@import '@fontsource/geist-sans/600.css';
@import '@fontsource/geist-mono/400.css';
```

```css
/* src/styles/globals.css */
@import 'tailwindcss';

@theme {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
}

code, pre, .font-mono {
  font-family: var(--font-mono);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + jsdom | Vitest + happy-dom | 2024-2025 | 10-20x faster tests, Vite-native config reuse |
| tailwind.config.js | @theme in CSS | Tailwind v4 (late 2025) | CSS-first tokens, browser CSS variables, no JS config |
| Custom error boundary classes | react-error-boundary | 2024+ (React 19 hooks) | useErrorHandler for async, better DX |
| next/font for Geist | @fontsource packages | 2025+ | Non-Next.js projects can use Geist, self-hosted |
| Cypress | Playwright | 2023-2024 | Faster, modern API, better cross-browser support |

**Deprecated/outdated:**
- **Jest for Vite projects**: Vitest is Vite-native, Jest requires separate config and loaders
- **jsdom for React tests**: happy-dom is 2-3x faster, sufficient for 90% of tests
- **Manual @font-face for Geist**: @fontsource provides optimized subsets via npm
- **JavaScript Tailwind config**: Tailwind 4 @theme in CSS is the new standard
- **geist npm package for non-Next.js**: Requires Next.js, use @fontsource or non.geist instead

## Open Questions

Things that couldn't be fully resolved:

1. **Playwright SharedArrayBuffer support across all browsers**
   - What we know: Chromium supports SharedArrayBuffer, WebKit/Firefox builds may not
   - What's unclear: Official timeline for full support in all Playwright browsers
   - Recommendation: Test OPFS with Playwright Chromium only, document browser limitations

2. **Test coverage targets for existing codebase**
   - What we know: 60-70% coverage on critical paths is standard
   - What's unclear: Which paths are "critical" without user analytics or bug history
   - Recommendation: Start with happy path tests (log workout, view history), expand based on failure patterns

3. **Component primitive audit specifics**
   - What we know: Button, Input, Card are common primitives
   - What's unclear: Which other patterns are duplicated enough to warrant extraction
   - Recommendation: Audit with grep for className patterns, extract top 3-5 most duplicated

4. **Design token color palette values**
   - What we know: User wants modern, consistent, dark theme inspired by Vercel Dashboard
   - What's unclear: Exact oklch values for primary/success/danger colors
   - Recommendation: Research Vercel Dashboard color palette or use oklch color picker during implementation

5. **E2E test count for adequate coverage**
   - What we know: E2E tests are slower, should focus on critical paths
   - What's unclear: How many E2E tests is "enough" for this app
   - Recommendation: 3-5 critical path E2E tests (log workout, OPFS persistence, navigate app), rest as unit tests

## Sources

### Primary (HIGH confidence)

**Testing:**
- [How to Unit Test React Components with Vitest and React Testing Library](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)
- [Vitest with React Testing Library: A Modern Approach](https://blog.incubyte.co/blog/vitest-react-testing-library-guide/)
- [Guide to React Testing Library using Vitest - Makers' Den](https://makersden.io/blog/guide-to-react-testing-library-vitest)
- [Component Testing | Guide | Vitest](https://vitest.dev/guide/browser/component-testing)
- [Best Practices for Testing WebAssembly Applications](https://blog.pixelfreestudio.com/best-practices-for-testing-webassembly-applications/)
- [Common mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)

**Error Boundaries:**
- [react-error-boundary - npm](https://www.npmjs.com/package/react-error-boundary)
- [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed)
- [Error Handling in React with react-error-boundary](https://certificates.dev/blog/error-handling-in-react-with-react-error-boundary)
- [Why React Error Boundaries Aren't Just Try/Catch for Components](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l)
- [Error Boundaries – React](https://legacy.reactjs.org/docs/error-boundaries.html)

**Design Tokens & Fonts:**
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)
- [Tailwind CSS Best Practices 2025-2026: Design Tokens](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Geist Font](https://vercel.com/font)
- [@fontsource/geist - npm](https://www.npmjs.com/package/@fontsource/geist)
- [non.geist - GitHub](https://github.com/contigen/non.geist)

**Playwright & WASM:**
- [Playwright](https://playwright.dev/)
- [Playwright SharedArrayBuffer WebKit Issue](https://github.com/microsoft/playwright/issues/28513)
- [DuckDB-WASM OPFS Tests](https://github.com/duckdb/duckdb-wasm/blob/main/packages/duckdb-wasm/test/opfs.test.ts)

### Secondary (MEDIUM confidence)

- [Design Systems with Tailwind CSS - Makers' Den](https://makersden.io/blog/design-systems-with-tailwind-css)
- [How to Build a Design Token System for Tailwind That Scales Forever](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Useful Patterns by Use Case | React TypeScript Cheatsheets](https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/)
- [OPFS Caching FTW: React + DuckDB-WASM](https://medium.com/@hadiyolworld007/opfs-caching-ftw-react-duckdb-wasm-blazing-parquet-0442ff695db5)

### Tertiary (LOW confidence)

- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [6 Best React Design Patterns to Know (2026)](https://www.designrush.com/best-designs/websites/trends/react-design-patterns)
- [How to use Playwright for unit testing in 2026](https://www.browserstack.com/guide/playwright-unit-testing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with official docs, npm, recent 2026 sources
- Architecture patterns: HIGH - Official Vitest/RTL docs, react-error-boundary docs, Tailwind CSS v4 docs
- Design tokens/fonts: MEDIUM - Tailwind 4 @theme is new (late 2025), Geist font implementation verified but less documented for non-Next.js
- Pitfalls: HIGH - Kent C. Dodds testing guidance, official React error boundary docs, real GitHub issues
- OPFS testing: MEDIUM - DuckDB-WASM has OPFS tests but Playwright SharedArrayBuffer support is browser-dependent

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - testing tools/practices are relatively stable)
