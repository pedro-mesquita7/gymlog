# Phase 7: Progression Intelligence - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver automatic progression detection (plateau, regression, progressing) for each exercise, a dashboard overview showing status across all exercises, and contextual alerts during active workout logging. All detection must be gym-aware for gym-specific exercises.

</domain>

<decisions>
## Implementation Decisions

### Alert presentation
- Tone is **encouraging/actionable** — not just facts, include what to do next (e.g., "Try varying rep ranges")
- Alerts are **dismissible per session** — user can dismiss during a workout, but they return next session if condition persists
- Visual distinction via **icons** — different icons for plateau (flat line), regression (down arrow), progressing (up arrow) with subtle color
- **Show all three statuses** — green/positive for progressing, not just problem flags. Full picture across exercises.

### Detection sensitivity
- Plateau: no PR in 4+ weeks AND weight change **< 5%** (moderate threshold — catches most real plateaus)
- Regression baseline: compare current week to average of **last 8 weeks** — longer baseline smooths out vacation/sick weeks
- Regression triggers: weight drops 10%+ OR volume drops 20%+ from 8-week average
- Minimum data: require **2+ sessions** before analyzing an exercise for progression
- **Gym-aware detection** — only compare sessions at the same gym for gym-specific exercises (avoids false regressions from equipment differences)

### Dashboard layout
- **Summary counts at top** — "3 progressing, 2 plateaued, 1 regressing" overview before the detail list
- Claude's discretion: card layout vs table, sort order, page placement within Analytics

### Workout logging alerts
- Include **actionable suggestions** with each alert (specific tips based on trend data)
- Show **all statuses** during logging — green "progressing" for positive reinforcement, not just problem alerts
- Claude's discretion: banner vs inline badge, exact timing of when alert appears

### Claude's Discretion
- Dashboard layout style (cards vs table vs hybrid)
- Dashboard sort order (problems-first vs recency vs alphabetical)
- Dashboard placement on Analytics page (top, middle, or separate section)
- Workout alert visual treatment (banner vs badge vs inline)
- Alert timing (on exercise start vs before first set)
- Specific suggestion text for plateaus and regressions

</decisions>

<specifics>
## Specific Ideas

- Gym-aware detection is important because the user goes to multiple gyms — gym-specific equipment (machines) will naturally have different weights across locations
- Encouraging tone aligns with the "no guilt-based alerts" out-of-scope decision from PROJECT.md
- Session-dismissible alerts keep the workout experience clean without permanently hiding useful information
- 8-week baseline for regression catches real trends while ignoring one-off bad sessions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-progression-intelligence*
*Context gathered: 2026-01-30*
