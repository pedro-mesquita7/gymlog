# Phase 17: PWA, Performance, README & Final Polish - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Make GymLog deploy-ready: verified offline PWA support, documented performance budgets, a portfolio-grade README showcasing the data engineering story, and a tab-by-tab polish pass eliminating rough edges. All features are complete from prior phases — this phase hardens and presents them.

</domain>

<decisions>
## Implementation Decisions

### README & portfolio presentation
- Lead with data engineering narrative — DuckDB-WASM, event sourcing, OKLCH color system. Target audience: hiring managers and senior engineers
- Hero GIF at top showing key workflow (logging a workout, viewing analytics), then screenshot grid below for detail
- Architecture diagram showing DuckDB-WASM, event sourcing flow, component structure
- Key technical decisions section explaining "why" choices (e.g., DuckDB-WASM over IndexedDB)
- Minimal "run locally" instructions: clone + npm install + npm run dev — assumes developer audience
- Live demo link placed prominently

### Offline & PWA behavior
- Precache all assets on first load — guaranteed offline after initial visit
- Auto-update service worker silently; user gets new version on next app open (no update prompt)
- Offline should be seamless and invisible — all data is local via DuckDB-WASM, no special offline handling needed
- Polished mobile install experience: custom install prompt, proper splash screen, correct icons at all sizes, theme color matching the app's OKLCH palette

### Performance budgets & CI checks
- Lighthouse target: 90+ across all four categories (Performance, Accessibility, Best Practices, SEO)
- Bundle size enforcement: Claude's discretion on hard fail vs warning in CI
- Track DuckDB-WASM initialization time and document it
- Track chart rendering performance with large datasets
- Performance metrics documented in separate PERFORMANCE.md, linked from README

### Final polish & consistency pass
- Tab-by-tab audit approach: Workouts, History, Analytics, Settings — fix issues found in each
- Every screen must have proper empty, loading, and error states — no blank screens or hanging spinners
- Visual consistency: spacing, typography, colors, component styles feel cohesive
- Interaction polish: smooth transitions, proper focus management, adequate touch targets
- No additional accessibility work beyond Phase 14's WCAG AA contrast — contrast coverage is sufficient
- Let the audit discover issues systematically rather than targeting known problems

### Claude's Discretion
- Bundle size budget threshold and enforcement level (hard fail vs warning)
- Architecture diagram format (Mermaid, ASCII, or image)
- GIF recording tool and specific flows to capture
- Service worker implementation details (Workbox vs custom)
- Specific touch target sizes and transition timings
- Which screenshots best showcase the app

</decisions>

<specifics>
## Specific Ideas

- README should feel like a senior engineer explaining their side project — technical depth with clear reasoning
- The architecture diagram + decisions list combo tells the "why" story that hiring managers look for
- Precache strategy matches the use case: gym-goers need the app to work without thinking about connectivity

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-pwa-performance-readme-polish*
*Context gathered: 2026-02-01*
