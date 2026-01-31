# Phase 10: Workout Features & Demo Data - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can configure named workout rotations that auto-advance between sessions, see enhanced post-workout summaries with PR badges and volume comparison vs last session of the same template, and portfolio reviewers can load realistic demo data with one click from Settings. The start workout flow pre-fills gym and template from the active rotation for minimal friction.

</domain>

<decisions>
## Implementation Decisions

### Rotation setup & behavior
- Named rotations (e.g., "PPL 3x", "Upper Lower 2x") — users can create multiple
- One rotation marked as "default/active" at a time — this drives start screen pre-fill
- Rotations are global (not per-gym); user also sets a default/preferred gym separately
- Rotation is an ordered list of templates; users build it via drag-and-drop reorder
- Rotation management page lives inside Settings tab (not a new top-level tab)
- Cancelled/skipped workouts do NOT advance the rotation — position stays
- Rotation only advances when a workout is completed (marked done), regardless of which template or gym was actually used
- When no rotation is configured, start workout screen shows a hint/banner suggesting setup

### Post-workout summary
- Enhanced dialog (upgrade current WorkoutComplete modal, not a full-screen page)
- PR highlighting: badge per exercise that hit a PR (gold badge/icon with PR type: weight, reps, volume)
- Comparison is against the last session of the same template (not just any last workout)
- Stats content: Claude's discretion on exact stats shown (current has sets, exercises, duration, volume)

### Demo data strategy
- 6 weeks of data, 3-4 workouts per week (~20 workouts total)
- Full setup: demo includes gyms, exercises, templates with rotations, AND workout history
- Realistic patterns: gradual progressive overload with occasional plateau and deload week — triggers all analytics features (progression detection, volume trends, plateau alerts)
- "Load Demo Data" button in Settings page
- If user has existing data: warn that existing data will be erased, then replace with demo data on confirm
- "Clear All Data" / reset button in Settings to wipe everything and return to empty state

### Start workout flow
- Quick-start card: prominent card showing "Next: [Template Name] at [Gym]" with big Start button
- Below the quick-start card, option to change gym/template (editable suggestion)
- Show rotation position indicator: "Workout 3 of 4 in [Rotation Name]"
- Gym pre-filled from default gym setting (set during rotation setup)
- If user overrides template, rotation still advances on completion (any completed workout advances)

### Claude's Discretion
- Exact stats shown in post-workout summary (beyond current sets/exercises/duration/volume)
- Drag-and-drop library choice for rotation editor
- Demo data exercise selection and template composition
- Quick-start card visual design
- How rotation state is persisted (Zustand store vs event sourcing)

</decisions>

<specifics>
## Specific Ideas

- Rotation is global — not tied to a specific gym. User sets preferred gym separately.
- Pre-fill philosophy: minimize clicks to start a workout. Rotation + default gym means one-tap start for the common case.
- Demo data should be portfolio-impressive: show the app's full analytical capabilities (trends, plateaus, deloads, PRs).
- "Load Demo Data" replaces all data (not merge) to keep things clean for reviewers.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-workout-features-demo-data*
*Context gathered: 2026-01-31*
