# Phase 8: Testing & Design Foundation - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-grade testing infrastructure, error boundaries with graceful recovery, and visual design primitives (tokens + components) that Phase 9+ will build on. No feature changes — this is foundation work.

</domain>

<decisions>
## Implementation Decisions

### Error recovery UX
- Inline error cards replace broken sections — rest of app stays usable
- Simple message by default ("Something went wrong"), expandable "Show details" reveals technical info (query name, error message)
- Retry button on each error card
- Catastrophic failures (DuckDB init): Claude's discretion on full-page vs inline

### Error logging
- Claude's discretion on whether to log errors to localStorage for Phase 11 observability dashboard

### Design tokens — Color palette
- Evolve the current zinc + orange palette — make it more modern and consistent
- Claude defines the new color scheme (keep dark theme approach)
- Systematize into proper Tailwind tokens

### Design tokens — Typography
- Geist font family (Vercel's font — designed for code-heavy UIs)
- Includes monospace variant (Geist Mono) for data/metrics
- Replaces current system-ui + generic monospace

### Design tokens — Spacing
- Claude's discretion on spacing scale systematization

### Testing strategy
- Broad coverage target (~60-70%)
- Mock DuckDB-WASM in unit tests (fast), real DB only in E2E
- Include E2E tests (Playwright) — test actual workout logging flow in real browser
- Coverage enforcement: Claude's discretion (enforce threshold vs report only)

### Component primitives
- Claude audits codebase and extracts most-duplicated patterns
- Button, Input, Card as likely core three — Claude decides if more needed (Modal, Badge, EmptyState, etc.)
- File structure: Claude's discretion (likely src/components/ui/ since NumberStepper already lives there)
- Opinionation level: Claude's discretion

### Claude's Discretion
- DuckDB init failure handling (full-page vs inline)
- Error logging to localStorage (for Phase 11 observability)
- Exact color palette values (modern, consistent, dark theme)
- Spacing scale details
- Coverage enforcement threshold
- Which primitives beyond Button/Input/Card
- Primitive file structure
- Primitive opinionation level (variants vs className overrides)

</decisions>

<specifics>
## Specific Ideas

- Visual reference: Vercel Dashboard — modern, data-focused, dark mode, Geist font
- Error cards should have expandable details section (simple message + "Show details" toggle)
- Geist font chosen specifically because it has a monospace variant (Geist Mono) — good for a data app

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-testing-design-foundation*
*Context gathered: 2026-01-30*
