# Phase 16: Demo Data UX & TOON Export - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Two capabilities: (1) Portfolio reviewers can safely import and reset demo data with clear destructive-action UX, and (2) users can export workout data in LLM-optimized TOON format for sharing or analysis. Both live on the Settings page.

</domain>

<decisions>
## Implementation Decisions

### Demo Data Import
- Button lives on Settings page (not empty state)
- Warning gradient styling — distinct from normal buttons, signals destructive one-time action
- Simple confirmation dialog: "This will replace all your data with demo data. This cannot be undone." + Confirm/Cancel
- After import, stay on Settings page with success toast

### Clear Historical Data
- Separate button from Import Demo Data — two independent operations
- Wipes everything except exercises and gyms (plans, templates, workout logs, sets, PRs all deleted)
- Destructive red button styling
- Same simple warning confirmation pattern: "This will delete all workout data. Exercises and gyms will be kept. Cannot be undone."

### TOON Export Location & Scopes
- All TOON export lives on Settings page
- Single "Export TOON" section with scope picker (radio/dropdown), not separate buttons
- Three scopes available:
  - **Last Workout** — most recent completed session
  - **Rotation Cycle** — user picks how many past rotations to include (1, 2, 3)
  - **Time Range** — reuse same options as Analytics: 1M/3M/6M/1Y/All
- Output: copy to clipboard as primary action, download .toon file as secondary

### TOON Content & Format
- Rich context headers: exercise definitions (muscle group, equipment), date range, gym names, plan name, rotation position
- Set data includes weight + reps + PR markers inline (e.g., "85kg x 6 [PR: weight]")
- Raw data only — no computed analytics or summary stats (let the LLM analyze)
- No muscle group mappings — keep it lean, LLM infers from exercise names

### Claude's Discretion
- Exact scope picker UI (radio buttons vs dropdown vs segmented control)
- Confirmation dialog component implementation
- TOON section layout relative to existing Parquet export section
- Toast notification styling and duration

</decisions>

<specifics>
## Specific Ideas

- Warning gradient on import button should feel visually distinct from the OKLCH design system's normal interactive elements — it's a "you probably only do this once" action
- The TOON scope picker should feel lightweight, not overwhelming — three clear options, not a complex form
- Copy to clipboard should show immediate feedback (button text change or toast)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-demo-data-toon-export*
*Context gathered: 2026-02-01*
