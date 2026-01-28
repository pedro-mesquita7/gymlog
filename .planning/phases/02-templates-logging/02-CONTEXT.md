# Phase 2: Templates & Logging - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Create workout templates (reusable workout plans with ordered exercises) and enable active workout logging with set tracking. Users can define templates, start workouts from templates at a gym, log sets with weight/reps/RIR, substitute exercises when needed, and use rest timers between sets.

Templates define WHAT exercises to do; actual weights logged are per-workout and tied to the selected gym.

</domain>

<decisions>
## Implementation Decisions

### Template Builder UX
- Add exercises via **checkbox list** (flat alphabetical, not grouped by muscle)
- **Drag handles** for reordering exercises in template
- **Single range field** for target reps (accepts "8-12" or just "10")
- **Expand row to add** replacement exercises (click exercise to expand, shows add replacement option)
- **Suggested set count** per exercise, but user can add more sets during workout
- **Name only** for template metadata (no description or category)
- Templates are **global** (not gym-specific) — gym is selected when starting workout
- **Duplicate action** available to copy existing template as starting point
- **Archive option** for templates (hide without deleting, can restore later)
- **Dedicated Templates tab** in bottom navigation
- **Rest time per exercise** can be defined in template
- Each exercise can only appear **once per template**

### Active Logging Flow
- **One exercise at a time** display (focused view, swipe/button to navigate)
- **Hybrid input** for weight/reps: tap to type directly + stepper buttons for quick adjustments
- **Show last values as reference** (displayed nearby, but fields start empty — not pre-filled)
- **Auto-advance** after entering reps, with ability to go back and edit previous sets
- **RIR always visible** alongside weight/reps for every set
- **Exercise picker** to jump to any exercise out of order
- **Progress bar with exercise count** ("3 of 6 exercises" + visual bar)
- **Warn but allow** finishing workout with incomplete exercises (shows which have no sets)

### Exercise Substitution
- **Inline dropdown** when tapping exercise name (shows predefined replacements + "Other")
- **Both options** for custom: pick from full exercise library OR type one-off custom name
- **Subtle indicator** on substituted exercises (small icon/badge, not verbose)
- **Undo available** — can revert substitution back to original during workout

### Rest Timer
- **Manual start** — user taps "Start Rest" button (not auto-start after set)
- **Both vibration + sound** notification when rest complete
- **Skip + extend** controls (end early, or add 30s/1min)
- **Global default** rest time (e.g., 90 sec), overridden by template's per-exercise rest if set

### Claude's Discretion
- Exact stepper increment values (likely 2.5kg for weight, 1 for reps)
- Visual design of progress bar and exercise picker
- Animation/transition between exercises
- Sound choice for timer notification
- Exact archive UI placement

</decisions>

<specifics>
## Specific Ideas

- Templates work like "Upper A" or "Push Day" — predefined workout plans the user creates
- Weight history is per-gym: logging Lat Pulldown at Gym A stores separately from Gym B
- Phase 3 will show "last time at this gym" during logging for reference

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-templates-logging*
*Context gathered: 2026-01-28*
