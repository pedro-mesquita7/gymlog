# Phase 9: Batch Logging & Visual Polish - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Efficient workout set logging via spreadsheet-like grids with last-session ghost data and rest timer, plus consistent visual design across all app screens. Users can log weight/reps/RIR per set, see what they did last time, and get timed rest prompts. All screens follow a unified dark, modern design language using Phase 8 design tokens.

</domain>

<decisions>
## Implementation Decisions

### Grid layout & structure
- Claude's discretion on grid style (spreadsheet table vs stacked cards) — pick based on mobile-first patterns and codebase
- Columns: Weight (kg/lbs, 1 decimal place) + Reps + RIR (0-5, number input)
- Plus button at bottom to add rows, X button per row to delete
- Tapping a cell selects all text for quick overwrite
- Weight supports one decimal place (e.g., 62.5 kg) for fractional plates
- kg/lbs toggle in settings, applies globally

### Exercise navigation
- Claude's discretion on navigation pattern (vertical scroll vs swipe/tabs) — pick based on existing patterns and mobile UX

### Rest timer
- Auto-starts after logging a set (row completed)
- Displays as persistent banner at top of screen — user can still scroll and prep next set
- Duration configurable with 3-level hierarchy:
  1. Global default in settings (2 minutes)
  2. Per-exercise override (set when creating the exercise)
  3. Per-template override (in template editor, overrides exercise default)
- Timer dismiss: Claude's discretion on dismiss pattern
- Notification: vibration by default + optional sound toggle in settings
- Timer alert when rest period ends

### Set numbering & auto-advance
- Claude's discretion on whether to show set number column
- Claude's discretion on auto-advance behavior (focus next row after completing a row)

### Ghost data & pre-fill
- Show exact values from last session as HTML placeholder text (stays visible until user types)
- Include delta hint (up/down indicator vs previous session) for trend context
- Row count matches template set count (not last session — if template says 3, show 3 ghost rows)
- First-time exercises: empty rows with "First time — no previous data" hint above grid

### Save & completion flow
- Auto-save per row: each set persists as soon as user moves to next row / field loses focus. No data loss on crash
- Finishing workout: confirmation dialog showing summary (X exercises, Y sets)
- Partial rows (e.g., weight but no reps): warning shown, user can fix or discard
- Empty rows silently discarded
- Cancel/discard workout: confirmation dialog, deletes all auto-saved sets from session

### Visual polish
- Full app consistency pass — every screen gets design token treatment (spacing, typography, colors)
- Dark, modern aesthetic — clean and focused
- Reference: Strong Workout app (clean grids, dark theme, functional design)
- Subtle slide/fade transitions between screens for polished, native-like feel

### Claude's Discretion
- Grid structure choice (table vs cards)
- Exercise navigation pattern (scroll vs swipe)
- Set number column visibility
- Auto-advance behavior after completing a row
- Rest timer dismiss interaction
- Loading states and skeleton designs
- Exact spacing, typography scale, and color application within design tokens
- Error state handling for failed saves
- Animation timing and easing

</decisions>

<specifics>
## Specific Ideas

- "I want it to feel like the Strong Workout app" — clean grids, dark theme, functional design
- Rest timer hierarchy: settings default (2min) -> exercise override -> template override
- Weight should support decimal (62.5 kg) for fractional plates
- Ghost text shows deltas (arrows) vs previous session, not just raw values
- Select-all-on-focus for fast cell overwriting during workouts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-batch-logging-visual-polish*
*Context gathered: 2026-01-31*
