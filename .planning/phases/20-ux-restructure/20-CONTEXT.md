# Phase 20: UX Restructure - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Collapsible sections on Workouts tab and settings reorder for streamlined navigation. Users navigate Workouts and Settings tabs with less clutter and faster access to primary actions. No new capabilities — restructuring existing content.

</domain>

<decisions>
## Implementation Decisions

### Collapsed section behavior
- Header + count badge when collapsed (e.g., "Exercises (12)")
- Always start collapsed — state does not persist across sessions
- Smooth slide animation (~200ms) for expand/collapse
- Multiple sections can be expanded simultaneously (not accordion)

### Workouts tab layout
- Order when workout active: Active Workout → Quick Start → Exercises → Gyms
- When no active workout: Quick Start moves to top (active workout area absent, not hidden)
- Quick Start is a section with plan picker (shows current rotation plan + Start button, user can switch plan before starting)
- Spacing only between Quick Start and collapsible sections below (no divider line)

### Settings tab reorder
- Top order: Rotations (with Create Rotation button inside) → Default Gym → TOON Export
- These three sections always visible (not collapsible)
- Everything below these three is collapsible (collapsed by default)
- Claude arranges remaining settings sections in logical order

### Visual treatment
- Chevron arrow indicator (▶/▼) for collapse/expand
- Chevron rotates smoothly in sync with content animation
- Card-style section headers with subtle background — clear tappable area
- Count shown as plain parenthetical in muted text (not colored pill)

### Claude's Discretion
- Exact animation timing and easing curve
- Card header background color/opacity within theme
- Order of remaining settings sections below the top three
- Spacing values between sections

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the Phase 18 theme system.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-ux-restructure*
*Context gathered: 2026-02-01*
