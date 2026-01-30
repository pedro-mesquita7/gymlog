# Pitfalls: UX Polish & Portfolio Features (v1.2)

**Domain:** Adding polish features to existing local-first React PWA
**Researched:** 2026-01-30
**Context:** Adding batch logging, design system, testing, CI/CD, observability, demo data, and error boundaries to existing GymLog workout tracker PWA

**Relationship to PITFALLS.md:** This document covers v1.2 polish and infrastructure-specific pitfalls. See PITFALLS.md for general local-first PWA pitfalls, and PITFALLS-ANALYTICS.md for charting-specific pitfalls.

---

## Critical Pitfalls

Mistakes that cause rewrites, major performance issues, or user-facing problems.

### Pitfall 1: Refactoring to Batch Input Without State Isolation

**What goes wrong:** Converting single-item SetLogger to batch grid logging by adding array state at the parent level causes every cell edit to re-render the entire grid. With 5 sets × 3 inputs (weight, reps, RIR) = 15 inputs, this creates 15× unnecessary renders, freezing the UI.

**Why it happens:** Developers add grid state to existing component without restructuring. Zustand store holds entire grid as single state object, triggering subscribers on every keystroke. Context API used for grid data, re-rendering all consumers.

**Consequences:**
- Every cell input triggers full grid re-render (15+ components)
- Typing in weight field lags by 100-300ms on mobile
- PR detection recalculates for all rows on every keystroke
- Battery drain from constant re-renders during workout
- Users abandon batch logging due to poor UX

**Prevention:**
- Isolate each grid row's state independently:
  ```typescript
  // BAD: Single state object for entire grid
  const [gridData, setGridData] = useState({ row1: {...}, row2: {...} });

  // GOOD: Each row manages own state
  function GridRow({ index }) {
    const [weight, setWeight] = useState(0);
    const [reps, setReps] = useState(0);
    const [rir, setRir] = useState(null);
    // ...
  }
  ```
- Use form libraries designed for grids (React Hook Form with useFieldArray, TanStack Form)
- Keep Zustand store updates minimal - only write to DB on submit, not on keystroke
- Profile with React DevTools Profiler BEFORE and AFTER refactor
- Use React.memo on GridRow components with stable props
- Consider uncontrolled inputs for weight/reps if validation allows

**Detection:**
- Typing in one cell feels laggy (>50ms delay)
- React DevTools Profiler shows GridRow components rendering on unrelated cell changes
- CPU usage spikes when editing grid cells
- Mobile devices heat up during batch logging
- Users report "keyboard lag" or "slow typing"

**Which phase:** Phase 1: Batch logging UI refactor (architecture decision before implementation)

**Sources:**
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)
- [Using React Hook Form with AG Grid](https://blog.ag-grid.com/using-react-hook-form-with-ag-grid/)
- [React Hook Form with Zod Complete Guide 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)

---

### Pitfall 2: Adding Design System Classes Without Removing Existing Tailwind

**What goes wrong:** New design system components are added with design tokens, but existing components still use raw Tailwind classes. App now has two styling systems, causing visual inconsistency, bloated CSS, and regression risk when refactoring.

**Why it happens:** Incremental migration without cleanup plan. Developers add new design-system-compliant components but leave existing code untouched. No enforcement to prevent raw Tailwind in new code.

**Consequences:**
- Two buttons side-by-side look different (one uses design tokens, one uses `bg-blue-500`)
- CSS bundle grows because both systems ship
- Maintenance nightmare - which system should new code use?
- Visual regressions when refactoring old components
- Designer-developer handoff breaks (which blue is correct?)

**Prevention:**
- Migration must be phased with explicit cleanup:
  1. Define design tokens first (colors, spacing, typography in `tailwind.config.js`)
  2. Create component library using tokens
  3. Migrate one feature area at a time (templates, then logging, then history)
  4. Delete old code when migrated (don't leave both)
- Use ESLint rules to block raw Tailwind classes:
  ```json
  // .eslintrc
  {
    "rules": {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/bg-(?!background|surface|accent)/]",
          "message": "Use design tokens (bg-background, bg-surface, bg-accent) not raw colors"
        }
      ]
    }
  }
  ```
- Document migration in checklist: [ ] Old component deleted, [ ] Design tokens used, [ ] Visual regression test passes
- Use Chromatic or Percy for visual regression testing during migration
- Create before/after screenshots for stakeholder review

**Detection:**
- Two components with same semantic meaning look different
- CSS bundle size doesn't decrease during "design system migration"
- New PRs mix design tokens and raw Tailwind
- Impossible to answer "what blue should I use?"
- Visual bugs when changing token values

**Which phase:** Phase 1: Design system token definition (before any component migration)

**Sources:**
- [Design Systems with Tailwind CSS - Makers' Den](https://makersden.io/blog/design-systems-with-tailwind-css)
- [Design system driven upgrade migrations - Tailwind PR](https://github.com/tailwindlabs/tailwindcss/pull/17831)
- [Real-World Migration Steps Tailwind v3 to v4](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3)

---

### Pitfall 3: Testing Implementation Details Instead of User Behavior

**What goes wrong:** Retroactive tests written for existing code focus on internal state and private functions rather than observable behavior. Tests pass but don't catch real bugs. Refactoring breaks tests even when functionality is unchanged.

**Why it happens:** Developers new to testing write tests that mirror implementation. Testing "does useState update correctly?" instead of "does user see correct value?". Accessing component internals via `.instance()` or testing store implementation.

**Consequences:**
- High test coverage (80%+) but bugs still reach production
- Refactoring requires rewriting tests (tests become maintenance burden)
- False confidence from "green" tests that don't validate user experience
- Tests break on harmless changes (renaming state variable)
- Team loses trust in tests, stops maintaining them

**Prevention:**
- Follow React Testing Library philosophy - test like a user:
  ```typescript
  // BAD: Testing implementation
  test('increments weight state', () => {
    const { result } = renderHook(() => useState(0));
    const [, setWeight] = result.current;
    act(() => setWeight(10));
    expect(result.current[0]).toBe(10);
  });

  // GOOD: Testing user behavior
  test('user can log a set with 10kg', () => {
    render(<SetLogger />);
    const weightInput = screen.getByLabelText(/weight/i);
    userEvent.type(weightInput, '10');
    userEvent.click(screen.getByRole('button', { name: /log set/i }));
    expect(screen.getByText(/10kg/i)).toBeInTheDocument();
  });
  ```
- Never test Zustand store internals - test components that use the store
- Focus on integration tests over unit tests for React components
- Use getByRole, getByLabelText, not getByTestId (forces accessible markup)
- Test error states, loading states, edge cases (empty data, slow queries)
- If refactoring doesn't change UI, tests should still pass

**Detection:**
- Tests break after renaming variables or restructuring code
- Test file imports component internals or store implementation
- Tests use `.instance()`, `.state()`, or access private methods
- High coverage but production bugs not caught by tests
- Team spends more time fixing tests than writing features

**Which phase:** Phase 1: Testing strategy definition (before writing first test)

**Sources:**
- [Common mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Best Practices for React UI Testing 2026](https://trio.dev/best-practices-for-react-ui-testing/)
- [React Testing Overview](https://legacy.reactjs.org/docs/testing.html)

---

### Pitfall 4: CI/CD Pipeline Doesn't Test DuckDB-WASM Initialization

**What goes wrong:** CI pipeline runs unit tests with mocked database, deploys successfully, but production app fails because DuckDB-WASM files aren't correctly served or initialized. Users see blank screen on first visit.

**Why it happens:** DuckDB-WASM requires specific HTTP headers (COOP/COEP for SharedArrayBuffer), correct MIME types for .wasm files, and proper bundle paths. Static hosting providers differ in configuration. CI tests run in Node, not browser environment.

**Consequences:**
- Production deploys succeed but app doesn't load
- "Failed to load wasm module" errors in production
- Works locally (dev server configured correctly) but not in production
- Rollback required, downtime for users
- Lost confidence in CI/CD - "deployment doesn't mean it works"

**Prevention:**
- Add browser-based E2E tests to CI that verify DuckDB initialization:
  ```yaml
  # GitHub Actions example
  - name: E2E tests
    run: |
      npm run build
      npm run preview & # Start production preview server
      npx playwright test --project=chromium

  # playwright.config.ts
  test('DuckDB initializes correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.duckdb !== undefined);
    // Run test query
    const result = await page.evaluate(async () => {
      const conn = await window.db.connect();
      const res = await conn.query('SELECT 1 as test');
      return res.toArray();
    });
    expect(result[0].test).toBe(1);
  });
  ```
- Test production build locally with `vite preview` before deploying
- Document deployment requirements (COOP/COEP headers, WASM MIME types)
- Use deployment preview URLs (Vercel/Netlify) for manual smoke testing
- Add deployment checklist: [ ] WASM files served, [ ] Headers configured, [ ] E2E test passes
- Monitor production errors with error reporting service

**Detection:**
- CI passes but production app shows errors
- "SharedArrayBuffer is not defined" in production console
- WASM files 404 or served with wrong MIME type
- Works in dev/preview but not production
- Rollback required after deployment

**Which phase:** Phase 1: CI/CD setup (must test deployment config, not just unit tests)

**Sources:**
- [Deploying DuckDB-WASM - Official Docs](https://duckdb.org/docs/stable/clients/wasm/deploying_duckdb_wasm)
- [Continuous deployment for PWAs - CircleCI](https://circleci.com/blog/cd-for-pwa/)
- [PWA CI/CD Pipeline Comprehensive Guide](https://kasata.medium.com/from-pwa-setup-to-ci-cd-pipeline-a-comprehensive-guide-for-react-applications-f4ad99467c06)

---

### Pitfall 5: Demo Data Mixed with Real User Data in Same Database

**What goes wrong:** Demo mode populates sample workouts into production schema. User logs real workout, now has mix of demo and real data. Can't distinguish which is which. Deleting demo data risks deleting real data.

**Why it happens:** Demo data inserted with regular INSERT statements into production tables without "demo mode" flag. No isolation between demo and production data. Cleanup logic deletes by date range, not by demo flag.

**Consequences:**
- User's real workouts mixed with sample data
- Analytics show inflated numbers (includes demo sets)
- "Clear demo data" button deletes user's actual workouts
- User loses trust after accidental data loss
- Support burden from confused users

**Prevention:**
- Use separate demo database instance entirely:
  ```typescript
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';
  const dbPath = isDemoMode ? ':memory:' : 'gymlog.db';
  const db = await DuckDB.create(dbPath);
  ```
- OR flag all demo data explicitly:
  ```sql
  ALTER TABLE fact_sets ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;

  -- Insert demo data
  INSERT INTO fact_sets (..., is_demo) VALUES (..., TRUE);

  -- User queries exclude demo
  SELECT * FROM fact_sets WHERE is_demo = FALSE OR is_demo IS NULL;
  ```
- Provide clear "Exit Demo Mode" button that switches to real DB
- Never auto-populate demo data on first use - require explicit "Try Demo" action
- Visual indicator when in demo mode (banner, different color scheme)
- Document demo data lifecycle in code comments

**Detection:**
- Users report "data I didn't log" appearing in history
- Analytics numbers don't match user's memory
- Support tickets about "deleting demo deleted my real data"
- Can't answer "is this workout real or demo?"

**Which phase:** Phase 1: Demo data architecture (before implementing demo feature)

**Sources:**
- [Keep Your Demo Data Separate From Your Seed Data](https://lostechies.com/derickbailey/2011/05/09/keep-your-demo-data-separate-from-your-seed-data/)
- [How To Maintain Seed Files - Neon](https://neon.com/blog/how-to-maintain-seed-data)
- [Seed Data For Your Database - Medium](https://medium.com/@melissavaiden/seed-data-for-your-database-f3f0cb868f1a)

---

### Pitfall 6: Error Boundary Catches Event Handler Errors

**What goes wrong:** Error boundary added to catch render errors, but developers assume it catches all errors. Event handler errors (onClick, onChange) aren't caught by error boundaries. Critical errors go unreported.

**Why it happens:** Misunderstanding React error boundary limitations. Error boundaries only catch errors during render, lifecycle methods, and constructors. Event handlers run outside React lifecycle.

**Consequences:**
- Critical errors in event handlers fail silently
- "Log Set" button errors don't show error UI
- Users see no feedback when action fails
- Error reporting service doesn't capture event handler errors
- Support tickets: "button doesn't work but no error message"

**Prevention:**
- Use react-error-boundary's useErrorHandler hook for event handlers:
  ```typescript
  import { useErrorHandler } from 'react-error-boundary';

  function SetLogger() {
    const handleError = useErrorHandler();

    const onLogSet = async () => {
      try {
        await db.query('INSERT INTO ...');
      } catch (error) {
        handleError(error); // Re-throws to nearest ErrorBoundary
      }
    };
  }
  ```
- Wrap async operations with try/catch and explicit error handling
- Add error reporting in catch blocks (send to Sentry/LogRocket)
- Show user-facing error messages via toast/alert, not just error boundary
- Test error scenarios explicitly (network failure, DB constraint violation)
- Document which errors are caught by boundary vs require manual handling

**Detection:**
- Errors logged in console but error boundary doesn't trigger
- Users report "nothing happens" when clicking buttons
- Error reporting shows uncaught exceptions in production
- Event handler errors don't show error UI

**Which phase:** Phase 2: Error boundary implementation (when adding error handling)

**Sources:**
- [Use react-error-boundary to handle errors - Kent C. Dodds](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
- [Why React Error Boundaries Aren't Just Try/Catch](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l)
- [React Error Boundaries Complete Guide](https://www.meticulous.ai/blog/react-error-boundaries-complete-guide)

---

### Pitfall 7: Client-Side Observability Sends PII to Third-Party Service

**What goes wrong:** Performance monitoring added to track Core Web Vitals and errors. Configuration includes "capture all user interactions" which sends workout data (weights, reps, exercise names) to third-party service, violating privacy expectations.

**Why it happens:** Default observability SDK configuration captures everything. Developers don't review what data is collected. Privacy policy not updated to reflect data sharing.

**Consequences:**
- User's workout data sent to Sentry/LogRocket without consent
- GDPR/privacy violations
- User trust destroyed when discovered
- Potential legal issues
- Bad press if security researcher exposes it

**Prevention:**
- Configure observability with privacy-first settings:
  ```typescript
  // Sentry example
  Sentry.init({
    dsn: '...',
    beforeSend(event) {
      // Strip PII from events
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      // Remove user data from breadcrumbs
      event.breadcrumbs = event.breadcrumbs?.filter(
        crumb => !crumb.message?.includes('logged set')
      );
      return event;
    },
    // Don't capture user input
    sendDefaultPii: false,
    // Mask sensitive data
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
  ```
- Only send error messages and stack traces, not user data
- Use IP anonymization
- Document what data is collected in privacy policy
- Test in production with real data to verify no PII sent
- Consider self-hosted observability (Plausible, Umami) for complete control

**Detection:**
- Observability dashboard shows workout details (weights, reps)
- Session replays capture form inputs
- Error events include user identifiers
- Privacy audit fails

**Which phase:** Phase 1: Observability setup (configure privacy before collecting data)

**Sources:**
- [Data Privacy in Frontend Observability - Grafana](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/data-privacy/)
- [2026 Observability Predictions - APMdigest](https://www.apmdigest.com/2026-observability-predictions-7)
- [Top 5 Observability Predictions for 2026](https://www.motadata.com/blog/observability-predictions/)

---

### Pitfall 8: Polish Milestone Scope Creeps Into Never-Shipping Refinement Loop

**What goes wrong:** "Polish" milestone starts with defined features (batch logging, design system, tests). Team finds "just one more thing" to improve. Animations, transitions, loading states, micro-interactions. Milestone never completes because there's always something to polish.

**Why it happens:** No clear definition of "done" for polish work. Perfectionism without shipping pressure. Each improvement reveals another improvement. No forcing function to declare victory.

**Consequences:**
- Milestone drags from 2 weeks to 2 months
- Portfolio showcase delayed indefinitely
- Team morale drops from lack of shipping
- Other features blocked waiting for polish to complete
- Diminishing returns - later polish has minimal user impact

**Prevention:**
- Define polish scope with specific, measurable criteria:
  ```markdown
  ## v1.2 Definition of Done
  - [ ] Batch logging works for 3-5 sets (no animations required)
  - [ ] Design tokens applied to 80% of components (not 100%)
  - [ ] 60% test coverage on critical paths (not 100%)
  - [ ] CI/CD deploys successfully with E2E test passing
  - [ ] Demo mode accessible from home page
  - [ ] Error boundaries on route level (not every component)
  - [ ] Core Web Vitals in "Good" range (not perfect)

  ## Explicitly OUT OF SCOPE
  - Micro-animations on state transitions
  - Perfect design consistency (allow 20% old style)
  - Testing every edge case
  - Performance optimization beyond "Good" metrics
  - Advanced demo features (just basic data)
  ```
- Use timeboxing: 2 weeks max, ship what's done
- Create "v1.3 polish backlog" for nice-to-haves discovered during v1.2
- Shipping is the forcing function - set public demo date and commit to it
- Review progress daily: "Are we refining or are we goldplating?"
- Get external feedback early to validate polish is valuable

**Detection:**
- Milestone "90% complete" for 3+ weeks
- Team discussions focus on subjective improvements
- "Just one more thing" becomes team joke
- No concrete shipping date
- PR reviews request design changes, not bug fixes

**Which phase:** Phase 0: Milestone planning (define scope before starting work)

**Sources:**
- [Project milestones strategic planning 2026 - Monday](https://monday.com/blog/project-management/project-milestones/)
- [How to Prevent Scope Creep - Creative Agency Book](https://www.creativeagencybook.com/blog/scope-creep-how-to-prevent-it)
- [Handling Scope Creep During Backlog Refinement](https://www.growingscrummasters.com/blog/handling-scope-creep-during-product-backlog-refinement/)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or sub-optimal UX.

### Pitfall 9: Batch Logging Validation Happens on Submit, Not Per-Cell

**What goes wrong:** User fills out 5-row batch grid, clicks submit, sees "Row 3 weight must be positive" error. Must scroll back to row 3, fix, submit again. Poor UX compared to inline validation.

**Why it happens:** Single-item form validation patterns applied to grid. Validation logic centralized at form level, not cell level. React Hook Form default behavior validates on submit.

**Consequences:**
- User must submit multiple times to find all validation errors
- Frustration from "trial and error" validation
- Abandonment of batch logging in favor of single-item mode
- Negative feedback in user testing

**Prevention:**
- Use per-field validation with immediate feedback:
  ```typescript
  // React Hook Form with Zod
  const schema = z.object({
    sets: z.array(z.object({
      weight: z.number().positive('Must be positive'),
      reps: z.number().int().positive().max(100),
      rir: z.number().int().min(0).max(10).nullable(),
    }))
  });

  // Set mode to 'all' for onBlur + onChange validation
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'all', // Validate on blur and change
  });
  ```
- Show validation errors immediately on blur or after typing stops
- Highlight invalid cells with red border and error message
- Disable submit button until all cells are valid
- Consider "smart defaults" to reduce validation errors (pre-fill weight from last set)

**Detection:**
- User testing shows frustration with validation
- Support requests about "why won't it submit?"
- Users abandon batch logging after validation errors

**Which phase:** Phase 2: Batch logging validation (parallel with UI implementation)

**Sources:**
- [React Hook Form with Zod Complete Guide 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)
- [Validation in React Grid - Syncfusion](https://ej2.syncfusion.com/react/documentation/grid/editing/validation)
- [TanStack Form Validation Guide](https://tanstack.com/form/v1/docs/framework/react/guides/validation)

---

### Pitfall 10: Design System Migration Without Visual Regression Tests

**What goes wrong:** Components migrated to design system look correct in isolation but break in context. Button height changes, breaking layout. Color contrast decreases, failing accessibility. No automated way to catch visual regressions.

**Why it happens:** Manual visual testing doesn't scale. Developer checks component in Storybook but not in all contexts. Subtle CSS changes compound across components.

**Consequences:**
- Visual bugs discovered in production
- Rollback required
- Lost confidence in design system migration
- "It worked in development" syndrome

**Prevention:**
- Use visual regression testing tools:
  ```yaml
  # GitHub Actions + Percy
  - name: Build Storybook
    run: npm run build-storybook
  - name: Percy snapshots
    run: npx percy storybook ./storybook-static
    env:
      PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  ```
- Chromatic (Storybook's service) automatically detects visual changes
- Percy integrates with existing CI pipeline
- Take baseline snapshots before migration
- Review visual diffs in PR before merging
- Test in multiple viewports (mobile, tablet, desktop)
- Test in light/dark mode if supported

**Detection:**
- Visual bugs discovered after deploy
- "It looked fine in Storybook" explanations
- CSS regression bugs in bug tracker

**Which phase:** Phase 1: Design system migration setup (before migrating first component)

**Sources:**
- [Real-World Migration Steps Tailwind v3 to v4](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3)
- [Design system driven upgrade migrations - Tailwind PR](https://github.com/tailwindlabs/tailwindcss/pull/17831)

---

### Pitfall 11: Test Coverage Metrics Become Goal Instead of Outcome

**What goes wrong:** Team sets "80% test coverage" as goal. Developers write shallow tests to hit metric. Tests exercise code but don't validate behavior. High coverage, low quality.

**Why it happens:** Coverage metrics easy to measure, hard to game. Management tracks coverage as proxy for quality. Developers optimize for metric, not for quality.

**Consequences:**
- False confidence from high coverage numbers
- Tests don't catch real bugs
- Maintenance burden from low-value tests
- Team frustration with "busywork" testing

**Prevention:**
- Focus on critical path coverage, not percentage:
  ```markdown
  ## Test Priority
  1. Critical: User can log workout and see in history (must test)
  2. Important: PR detection works correctly (should test)
  3. Nice: Animation timings are correct (optional test)

  ## Coverage Guidelines
  - Aim for 60-70% coverage on critical paths
  - 100% coverage not required (diminishing returns)
  - Prefer integration tests over unit tests
  - If test doesn't catch bugs, delete it
  ```
- Measure test effectiveness, not just coverage:
  - Mutation testing (Stryker) - do tests catch bugs we inject?
  - Production bug correlation - do tested features have fewer bugs?
- Review tests in PR for quality, not just quantity
- Allow coverage to decrease if tests are low-value

**Detection:**
- High coverage but bugs reach production
- Tests described as "just for coverage"
- Tests don't fail when code is broken
- Team complains about "meaningless tests"

**Which phase:** Phase 1: Testing strategy (before writing tests)

**Sources:**
- [React Test Coverage - Compile N Run](https://www.compilenrun.com/docs/framework/react/react-testing/react-test-coverage/)
- [How to improve test coverage in JavaScript React](https://dev.to/andrewbaisden/how-to-improve-test-coverage-in-a-javascript-react-project-235p)
- [Best Practices for React UI Testing 2026](https://trio.dev/best-practices-for-react-ui-testing/)

---

### Pitfall 12: DuckDB-WASM Bundle Size Not Accounted for in CI Bundle Size Checks

**What goes wrong:** CI pipeline checks JavaScript bundle size, sees 200KB, approves deploy. Production users download 3.2MB of DuckDB-WASM files on first visit, exceeding performance budget.

**Why it happens:** Bundle size checks only measure main.js, not WASM files. DuckDB-WASM files served separately, not counted in bundle analysis.

**Consequences:**
- First-time load significantly slower than CI predicts
- Lighthouse performance scores drop in production
- Mobile users on slow connections wait 10+ seconds
- Poor user experience contradicts "fast PWA" goal

**Prevention:**
- Include WASM files in performance budget:
  ```json
  // package.json
  {
    "scripts": {
      "analyze": "vite-bundle-visualizer && du -sh dist/**/*.wasm"
    }
  }

  // CI check
  - name: Check bundle size
    run: |
      npm run build

      # Check JS bundle
      JS_SIZE=$(du -sb dist/assets/*.js | awk '{sum+=$1} END {print sum}')
      if [ $JS_SIZE -gt 524288 ]; then  # 512KB
        echo "JS bundle too large: $JS_SIZE bytes"
        exit 1
      fi

      # Check total download (including WASM)
      TOTAL_SIZE=$(du -sb dist | awk '{print $1}')
      if [ $TOTAL_SIZE -gt 4194304 ]; then  # 4MB
        echo "Total bundle too large: $TOTAL_SIZE bytes"
        exit 1
      fi
  ```
- Document total download size in README
- Use DuckDB-WASM mvp bundle (smallest) if features allow
- Consider lazy-loading DuckDB only when needed (after initial render)
- Test on 3G connection throttling to verify acceptable load time

**Detection:**
- Lighthouse scores worse in production than local
- First load takes significantly longer than expected
- Users on mobile complain about slow initial load
- CI shows small bundle but production feels slow

**Which phase:** Phase 1: CI/CD setup (include WASM in bundle checks from start)

**Sources:**
- [Deploying DuckDB-WASM - Official Docs](https://duckdb.org/docs/stable/clients/wasm/deploying_duckdb_wasm)
- [DuckDB-WASM Overview](https://duckdb.org/docs/stable/clients/wasm/overview)

---

### Pitfall 13: Demo Data Becomes Stale and Misleading

**What goes wrong:** Demo data created with "last 4 weeks" dates. Six months later, demo data shows workouts from January when it's June. Demo mode looks broken, showing "no recent activity" charts.

**Why it happens:** Demo data uses hardcoded dates relative to creation time. Data isn't regenerated or kept fresh. Date logic uses absolute dates, not relative to "today".

**Consequences:**
- Demo mode shows empty charts ("no data in last 4 weeks")
- Potential users think app is broken
- Demo doesn't showcase features effectively
- Support burden from "demo doesn't work" reports

**Prevention:**
- Generate demo data with relative dates at runtime:
  ```typescript
  function generateDemoData() {
    const today = new Date();
    const workouts = [];

    // Generate workouts for last 4 weeks
    for (let i = 0; i < 28; i++) {
      const workoutDate = new Date(today);
      workoutDate.setDate(today.getDate() - i);

      workouts.push({
        workout_id: uuidv7(),
        started_at: workoutDate.toISOString(),
        // ... rest of workout data
      });
    }

    return workouts;
  }

  // Regenerate demo data on each demo mode entry
  function enterDemoMode() {
    const demoData = generateDemoData();
    await db.query('DELETE FROM fact_sets WHERE is_demo = TRUE');
    await db.query('INSERT INTO fact_sets VALUES ...', demoData);
  }
  ```
- OR use SQL relative dates:
  ```sql
  INSERT INTO fact_workouts (started_at, is_demo)
  VALUES (CURRENT_DATE - INTERVAL '7 days', TRUE);
  ```
- Regenerate demo data on app startup if stale (check oldest demo record)
- Test demo mode monthly to catch staleness

**Detection:**
- Demo mode charts show "no data"
- Demo workouts have dates from months ago
- Demo doesn't showcase recent features
- User feedback: "demo looks broken"

**Which phase:** Phase 2: Demo data implementation (use relative dates from start)

**Sources:**
- [How To Maintain Seed Files - Neon](https://neon.com/blog/how-to-maintain-seed-data)
- [Seeding and Resetting - Rainforest QA](https://help.rainforestqa.com/docs/seeding-and-resetting)

---

### Pitfall 14: Error Boundaries Placed Too Broadly, Swallowing Errors

**What goes wrong:** Single error boundary wraps entire app. Any error anywhere shows generic error page, losing all context. User can't recover, must reload page. Poor UX.

**Why it happens:** Adding error boundary at root level is easiest. Thinking "one error boundary catches all errors". Not considering error locality and recovery.

**Consequences:**
- Small error in analytics chart crashes entire app
- User loses workout in progress because unrelated component errored
- No way to recover without full page reload
- Error reporting shows errors but not context

**Prevention:**
- Use granular error boundaries for feature isolation:
  ```typescript
  function App() {
    return (
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <Router>
          <Routes>
            <Route path="/" element={
              <ErrorBoundary FallbackComponent={WorkoutErrorFallback}>
                <WorkoutPage />
              </ErrorBoundary>
            } />
            <Route path="/analytics" element={
              <ErrorBoundary FallbackComponent={AnalyticsErrorFallback}>
                <AnalyticsPage />
              </ErrorBoundary>
            } />
          </Routes>
        </Router>
      </ErrorBoundary>
    );
  }
  ```
- Analytics error shouldn't crash workout logging
- Provide contextual error messages and recovery actions:
  ```typescript
  function AnalyticsErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div>
        <h2>Analytics temporarily unavailable</h2>
        <p>{error.message}</p>
        <button onClick={resetErrorBoundary}>Try again</button>
        <Link to="/">Continue logging workouts</Link>
      </div>
    );
  }
  ```
- Root error boundary catches catastrophic errors only
- Feature-level boundaries allow isolated recovery

**Detection:**
- Small errors crash entire app
- Users complain about losing work due to unrelated errors
- Error reports lack context about what user was doing
- No way to recover except reload

**Which phase:** Phase 2: Error boundary implementation (use granular boundaries from start)

**Sources:**
- [React Error Boundaries Complete Guide](https://www.meticulous.ai/blog/react-error-boundaries-complete-guide)
- [Catching Errors in React with Error Boundaries](https://blog.openreplay.com/catching-errors-in-react-with-error-boundaries/)

---

### Pitfall 15: Observability Performance Overhead Not Measured

**What goes wrong:** Observability SDK added with default config. Performance monitoring records every user interaction. CPU usage increases 20%, battery drains faster. Users report app "feels slower" after update.

**Why it happens:** Default observability configs prioritize data collection over performance. Session replay records every DOM mutation. Breadcrumbs track every click and state change.

**Consequences:**
- App performance degrades with monitoring enabled
- Mobile battery drains faster
- Lighthouse performance scores drop
- Users notice lag
- Irony: performance monitoring makes performance worse

**Prevention:**
- Profile observability overhead with Chrome DevTools:
  ```typescript
  // Measure before adding observability
  performance.mark('app-start');
  // ... app initialization
  performance.mark('app-interactive');
  performance.measure('startup', 'app-start', 'app-interactive');

  // Measure after adding observability
  // Compare metrics to quantify overhead
  ```
- Use sampling to reduce overhead:
  ```typescript
  Sentry.init({
    dsn: '...',
    tracesSampleRate: 0.1, // Sample 10% of sessions
    replaysSessionSampleRate: 0.01, // Record 1% of sessions
    replaysOnErrorSampleRate: 1.0, // Record all error sessions
  });
  ```
- Disable expensive features in production if overhead too high
- Test on low-end mobile devices to quantify impact
- Consider "observability-free" mode for users who opt out

**Detection:**
- Performance metrics degrade after adding observability
- Battery usage increases
- Mobile users report "app feels slow"
- CPU usage higher with observability enabled
- Lighthouse scores drop after observability added

**Which phase:** Phase 2: Observability implementation (measure overhead before production)

**Sources:**
- [Data Privacy in Frontend Observability - Grafana](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/data-privacy/)
- [11 Key Observability Best Practices 2026](https://spacelift.io/blog/observability-best-practices)

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

### Pitfall 16: Batch Logging Grid Not Keyboard-Navigable

**What goes wrong:** User must tap each cell on mobile or click with mouse on desktop. No tab navigation between cells. No Enter to submit. Poor accessibility and power-user UX.

**Why it happens:** Custom grid implementation doesn't handle keyboard events. Focus management not implemented. Developer tests with mouse only.

**Consequences:**
- Slow data entry for power users
- Accessibility failure (keyboard-only navigation required)
- Poor UX compared to spreadsheet-like grid

**Prevention:**
- Implement keyboard navigation from start:
  ```typescript
  function GridCell({ rowIndex, colIndex, value, onChange }) {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        // Focus next cell
        const nextCell = document.querySelector(
          `[data-cell="${rowIndex}-${colIndex + 1}"]`
        );
        nextCell?.focus();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        // Move to same column, next row
        const nextCell = document.querySelector(
          `[data-cell="${rowIndex + 1}-${colIndex}"]`
        );
        nextCell?.focus();
        e.preventDefault();
      }
    };

    return (
      <input
        data-cell={`${rowIndex}-${colIndex}`}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    );
  }
  ```
- Tab moves to next cell (weight → reps → RIR → next row weight)
- Enter moves down to same column (spreadsheet behavior)
- Shift+Tab moves backward
- Test with keyboard only (no mouse)

**Detection:**
- Can't navigate grid with keyboard
- Accessibility audit fails
- Power users complain about slow data entry

**Which phase:** Phase 2: Batch logging UI implementation (add keyboard nav early)

**Sources:**
- [Accessible Touch Targets - Web.dev](https://web.dev/accessible-tap-targets/)
- [Using React Hook Form with AG Grid](https://blog.ag-grid.com/using-react-hook-form-with-ag-grid/)

---

### Pitfall 17: Design System Documentation Lags Behind Implementation

**What goes wrong:** Design tokens defined in code but not documented. New developer doesn't know which token to use. Documentation shows outdated examples. Component usage unclear.

**Why it happens:** Documentation is manual, code changes are fast. No automation to keep docs in sync. Documentation treated as "nice to have".

**Consequences:**
- Developers use wrong tokens
- Design system adoption slows
- Questions in Slack instead of self-service docs
- Inconsistent usage across team

**Prevention:**
- Use Storybook or similar for living documentation:
  ```tsx
  // Button.stories.tsx
  export default {
    title: 'Components/Button',
    component: Button,
    parameters: {
      docs: {
        description: {
          component: 'Primary button using design tokens. Use bg-accent for primary actions.'
        }
      }
    }
  };

  export const Primary = {
    args: {
      children: 'Log Set',
      className: 'bg-accent text-black'
    }
  };
  ```
- Generate token documentation from `tailwind.config.js`:
  ```bash
  npx tailwindcss-config-viewer
  ```
- Document as you code (not after)
- Include examples in every component
- Review docs in PR (not just code)

**Detection:**
- Frequent questions about "which token to use?"
- Inconsistent token usage in PRs
- Documentation examples outdated
- Onboarding friction for new contributors

**Which phase:** Phase 1: Design system setup (document while building)

**Sources:**
- [How to Build React TS Tailwind Design System](https://dev.to/hamatoyogi/how-to-build-a-react-ts-tailwind-design-system-1ppi)
- [Building Unified Design System with React Tailwind Figma](https://medium.com/@roman_fedyskyi/building-a-unified-design-system-with-react-tailwind-css-and-figma-part-2-0ec66658deb7)

---

### Pitfall 18: Test Data Cleanup Isn't Automated

**What goes wrong:** Tests create database records but don't clean up. Test DB grows over time. Tests start failing due to unexpected data from previous tests. Flaky tests.

**Why it happens:** Writing tests without teardown logic. Assuming fresh DB on every test. Not using test isolation patterns.

**Consequences:**
- Flaky tests (pass locally, fail in CI, or vice versa)
- Test failures due to data conflicts
- Slower tests as DB grows
- "Works on my machine" syndrome

**Prevention:**
- Use beforeEach/afterEach for test isolation:
  ```typescript
  describe('Workout logging', () => {
    let db;

    beforeEach(async () => {
      // Fresh in-memory DB for each test
      db = await DuckDB.create(':memory:');
      await db.query('CREATE TABLE fact_sets (...)');
    });

    afterEach(async () => {
      await db.close();
    });

    test('logs a set', async () => {
      // Test runs in isolation
    });
  });
  ```
- Use in-memory database for tests (fast, isolated)
- Or use transactions and rollback:
  ```typescript
  beforeEach(async () => {
    await db.query('BEGIN TRANSACTION');
  });

  afterEach(async () => {
    await db.query('ROLLBACK');
  });
  ```
- Never use production database for tests

**Detection:**
- Tests pass locally but fail in CI
- Tests fail when run in different order
- Test DB file grows over time
- Random test failures

**Which phase:** Phase 1: Test setup (implement isolation from first test)

**Sources:**
- [React Testing Overview](https://legacy.reactjs.org/docs/testing.html)
- [Best Practices for React UI Testing 2026](https://trio.dev/best-practices-for-react-ui-testing/)

---

### Pitfall 19: CI Pipeline Caches Outdated Dependencies

**What goes wrong:** Package.json updated, CI uses cached node_modules from previous run. Tests pass in CI with old dependency, fail in production with new dependency. Or vice versa.

**Why it happens:** Aggressive caching to speed up CI. Cache key doesn't include package-lock.json hash. Cache invalidation not configured correctly.

**Consequences:**
- CI doesn't catch dependency-related bugs
- "Works in CI, fails in production"
- Time wasted debugging cache issues
- False confidence from green CI

**Prevention:**
- Use correct cache key in CI:
  ```yaml
  # GitHub Actions
  - name: Cache node modules
    uses: actions/cache@v3
    with:
      path: node_modules
      # Key includes lock file hash - invalidates when deps change
      key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
  ```
- Or use npm ci (clean install, ignores cache):
  ```yaml
  - name: Install dependencies
    run: npm ci  # NOT npm install
  ```
- Add "clear cache" workflow for emergency cache invalidation
- Monitor for cache-related failures (CI passes, production fails)

**Detection:**
- CI passes with old deps, production fails with new
- Different behavior in CI vs local
- Dependency updates don't trigger test failures
- "It works in CI" but not production

**Which phase:** Phase 1: CI/CD setup (configure cache correctly from start)

**Sources:**
- [CI/CD Best Practices 2026 - BrowserStack](https://www.browserstack.com/guide/difference-between-continuous-integration-and-continuous-delivery)
- [What Is CI/CD Stages and Best Practices](https://octopus.com/devops/ci-cd/)

---

### Pitfall 20: Demo Mode Doesn't Reset Between Sessions

**What goes wrong:** User enters demo mode, logs some workouts, exits. Next user enters demo mode, sees previous user's demo data mixed with original demo data. Confusing.

**Why it happens:** Demo mode uses persistent :memory: database that survives across demo sessions. Or demo flag isn't cleared properly.

**Consequences:**
- Demo data accumulates across sessions
- Demo looks messy with too much data
- User confusion about "whose data is this?"

**Prevention:**
- Reset demo database on each demo entry:
  ```typescript
  async function enterDemoMode() {
    // Clear all demo data
    await db.query('DELETE FROM fact_sets WHERE is_demo = TRUE');
    await db.query('DELETE FROM fact_workouts WHERE is_demo = TRUE');

    // Regenerate fresh demo data
    const demoData = generateDemoData();
    await insertDemoData(demoData);

    localStorage.setItem('demo_mode', 'true');
  }

  function exitDemoMode() {
    localStorage.removeItem('demo_mode');
    // Clear demo data on exit
    db.query('DELETE FROM fact_sets WHERE is_demo = TRUE');
  }
  ```
- Provide "Reset Demo" button for users who want fresh start
- Show "Demo data will be reset" warning when entering demo mode

**Detection:**
- Demo mode shows accumulated data from multiple sessions
- Demo data grows over time
- User reports "demo has too much data"

**Which phase:** Phase 2: Demo mode implementation (implement reset from start)

**Sources:**
- [Seeding and Resetting - Rainforest QA](https://help.rainforestqa.com/docs/seeding-and-resetting)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Batch Logging Refactor | State management causes re-render hell | Isolate row state, use React.memo, profile with DevTools before/after |
| Design System Migration | Mixing old Tailwind with new design tokens | ESLint rules to block raw colors, phased migration with cleanup, visual regression tests |
| Testing Strategy | Testing implementation instead of behavior | Follow React Testing Library philosophy, test user flows not internals |
| CI/CD Setup | Doesn't test DuckDB-WASM initialization | Add browser E2E tests, test production build preview, verify WASM headers |
| Demo Data | Confusion with real user data | Separate database or explicit demo flag, clear visual indicator, reset on entry |
| Error Boundaries | Placed too broadly or miss event handlers | Granular boundaries per feature, use useErrorHandler for async/events |
| Observability | Privacy violations or performance overhead | Privacy-first config, sample data collection, measure overhead |
| Polish Scope | Never-ending refinement loop | Define "done" criteria upfront, timebox milestone, create v1.3 backlog |

---

## Integration with Existing Architecture

### Special Considerations for GymLog v1.2

**What works well:**
- Batch logging can reuse existing SetLogger validation logic (weight > 0, reps > 0)
- Design tokens align with existing accent/background color usage
- Demo mode can use existing dbt views (vw_exercise_history, fact_sets)
- Error boundaries can wrap existing route components without refactor
- Observability can track existing DuckDB query patterns for performance insights

**What to watch for:**
- Batch state management conflicts with Zustand's single-item logSet pattern
- Design system migration must respect existing PR detection styling
- Tests must handle DuckDB-WASM async initialization (not instant like mocks)
- CI/CD must account for 3.2MB DuckDB-WASM files in performance budget
- Demo data must respect gym-specific vs global exercise filtering logic

---

## Research Confidence

**Overall confidence: HIGH** for React refactoring and testing patterns
**MEDIUM** for DuckDB-WASM CI/CD and observability integration (fewer specific sources)

### By Area:

| Area | Confidence | Evidence |
|------|-----------|----------|
| Batch logging state management | HIGH | Multiple 2025-2026 sources on React Hook Form, grid patterns, state batching |
| Design system migration | HIGH | Tailwind v4 migration guides, visual regression testing docs |
| Retroactive testing | HIGH | Kent C. Dodds articles, React Testing Library official docs, 2026 best practices |
| CI/CD for static PWA | MEDIUM | General PWA CI/CD patterns, less specific to DuckDB-WASM deployment |
| Demo data management | MEDIUM | General seed data patterns, not specific to browser-only databases |
| Error boundaries | HIGH | Official React docs, react-error-boundary library docs, recent articles |
| Client-side observability | MEDIUM | 2026 observability trends, privacy-first patterns, but limited PWA-specific guidance |
| Polish scope management | HIGH | Project management best practices, scope creep prevention strategies |

---

## Gaps to Address

**Unresolved questions for deeper research:**

1. **Batch logging performance baseline** - Should profile current single-item SetLogger render time and set target for batch grid (e.g., <50ms per keystroke)

2. **Design system token inventory** - Need to audit existing Tailwind usage to identify all colors/spacing/typography in use before defining tokens

3. **Test coverage targets** - Should identify critical paths empirically (user analytics, bug history) rather than arbitrary 60% number

4. **DuckDB-WASM CI/CD specifics** - Need to research exact header requirements across deployment platforms (Vercel, Netlify, GitHub Pages) for SharedArrayBuffer

5. **Demo data complexity** - Should user-test "how much demo data is helpful?" to avoid overwhelming new users while showcasing features

6. **Observability sampling rates** - Need to determine optimal sample rate balancing data quality with performance overhead for typical PWA usage

7. **Polish milestone timeboxing** - Should validate 2-week timebox is realistic or if 1 week / 3 weeks is better based on team velocity

---

## Sources

### Primary (HIGH confidence)

**Batch Logging & State Management:**
- [React State Management in 2025 - Developer Way](https://www.developerway.com/posts/react-state-management-2025)
- [State Management in 2026 - Nucamp](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [React Hook Form with Zod Complete Guide 2026 - DEV](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)
- [Using React Hook Form with AG Grid - AG Grid Blog](https://blog.ag-grid.com/using-react-hook-form-with-ag-grid/)
- [TanStack Form Validation Guide](https://tanstack.com/form/v1/docs/framework/react/guides/validation)

**Design System & Visual Regression:**
- [Design Systems with Tailwind CSS - Makers' Den](https://makersden.io/blog/design-systems-with-tailwind-css)
- [Design system driven upgrade migrations - Tailwind PR #17831](https://github.com/tailwindlabs/tailwindcss/pull/17831)
- [Real-World Migration Steps Tailwind v3 to v4 - DEV](https://dev.to/mridudixit15/real-world-migration-steps-from-tailwind-css-v3-to-v4-1nn3)

**Testing:**
- [Common mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Best Practices for React UI Testing 2026 - Trio](https://trio.dev/best-practices-for-react-ui-testing/)
- [React Testing Overview - Official Docs](https://legacy.reactjs.org/docs/testing.html)

**CI/CD & Deployment:**
- [Deploying DuckDB-WASM - Official Docs](https://duckdb.org/docs/stable/clients/wasm/deploying_duckdb_wasm)
- [Continuous deployment for PWAs - CircleCI](https://circleci.com/blog/cd-for-pwa/)
- [PWA CI/CD Pipeline Comprehensive Guide - Medium](https://kasata.medium.com/from-pwa-setup-to-ci-cd-pipeline-a-comprehensive-guide-for-react-applications-f4ad99467c06)

**Demo/Seed Data:**
- [Keep Your Demo Data Separate From Your Seed Data - Los Techies](https://lostechies.com/derickbailey/2011/05/09/keep-your-demo-data-separate-from-your-seed-data/)
- [How To Maintain Seed Files - Neon](https://neon.com/blog/how-to-maintain-seed-data)

**Error Boundaries:**
- [Use react-error-boundary to handle errors - Kent C. Dodds](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
- [Why React Error Boundaries Aren't Just Try/Catch - Epic React](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l)
- [React Error Boundaries Complete Guide - Meticulous](https://www.meticulous.ai/blog/react-error-boundaries-complete-guide)

**Observability & Privacy:**
- [Data Privacy in Frontend Observability - Grafana](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/data-privacy/)
- [2026 Observability Predictions - APMdigest](https://www.apmdigest.com/2026-observability-predictions-7)
- [Top 5 Observability Predictions for 2026 - Motadata](https://www.motadata.com/blog/observability-predictions/)

**Scope Management:**
- [Project milestones strategic planning 2026 - Monday](https://monday.com/blog/project-management/project-milestones/)
- [How to Prevent Scope Creep - Creative Agency Book](https://www.creativeagencybook.com/blog/scope-creep-how-to-prevent-it)
- [Handling Scope Creep During Backlog Refinement - Growing Scrum Masters](https://www.growingscrummasters.com/blog/handling-scope-creep-during-product-backlog-refinement/)

### Secondary (MEDIUM confidence)

- [React Batching - Robin Wieruch](https://www.robinwieruch.de/react-batching/)
- [Validation in React Grid - Syncfusion](https://ej2.syncfusion.com/react/documentation/grid/editing/validation)
- [How to Build React TS Tailwind Design System - DEV](https://dev.to/hamatoyogi/how-to-build-a-react-ts-tailwind-design-system-1ppi)
- [React Test Coverage - Compile N Run](https://www.compilenrun.com/docs/framework/react/react-testing/react-test-coverage/)
- [DuckDB-WASM Overview - Official Docs](https://duckdb.org/docs/stable/clients/wasm/overview)
- [Seeding and Resetting - Rainforest QA](https://help.rainforestqa.com/docs/seeding-and-resetting)
- [Catching Errors in React with Error Boundaries - OpenReplay](https://blog.openreplay.com/catching-errors-in-react-with-error-boundaries/)
- [11 Key Observability Best Practices 2026 - Spacelift](https://spacelift.io/blog/observability-best-practices)
- [CI/CD Best Practices 2026 - BrowserStack](https://www.browserstack.com/guide/difference-between-continuous-integration-and-continuous-delivery)

### Tertiary (LOW confidence - general guidance)

- [7 Top React State Management Libraries 2026 - Trio](https://trio.dev/7-top-react-state-management-libraries/)
- [33 React JS Best Practices For 2026 - Technostacks](https://technostacks.com/blog/react-best-practices/)
- [10 best cloud app deployment platforms 2026 - Northflank](https://northflank.com/blog/best-cloud-app-deployment-platforms)
- [Top 6 Observability Trends 2026 - Motadata](https://www.motadata.com/blog/observability-trends/)

---

**Research completed:** 2026-01-30
**Applicable to:** GymLog v1.2 UX & Portfolio Polish milestone
**Next steps:** Use this to inform roadmap phase structure, add research flags where deeper investigation needed during execution
