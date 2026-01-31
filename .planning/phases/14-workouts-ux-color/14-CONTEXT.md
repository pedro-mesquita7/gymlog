# Phase 14: Workouts UX & Color Scheme - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the Workouts tab for a one-tap start experience with compact layout, and establish a cohesive OKLCH color system across the entire app. Quick Start becomes the hero, manual template selection becomes secondary, and all color tokens are unified for dark theme with orange accent. No new workout features — this is UX and visual cohesion only.

</domain>

<decisions>
## Implementation Decisions

### Quick Start prominence
- Quick Start card is the hero element at top of Workouts tab
- Card shows: next workout in rotation (template name) + default gym name
- One tap on the card immediately starts the workout (no confirmation)
- Edit mode: tap an edit icon on the card to reveal gym and template selectors, tap again to confirm
- Edit mode changes gym and template only — rotation position management is separate
- Manual template selection collapsed behind "Browse all templates" accordion below Quick Start
- When no active plan/rotation exists: show "No workout plan yet — Create one" prompt with button to plan creation

### Workouts tab density
- Above the fold: Quick Start card + recent workout summary card
- Recent workout summary: compact card with template name, date, exercise count, total volume, and duration
- "Browse all templates" accordion expands to mini cards per template (name, exercise count, muscle groups)
- Templates displayed as flat list (not grouped by plan)

### Color palette direction
- Clean, modern, dark theme — Linear/Notion dark mode aesthetic
- Dark gray backgrounds (soft dark, #1e1e2e to #2a2a3a range — not near-black)
- Orange as signature accent throughout: icons, active tabs, progress indicators, CTAs
- Semantic color palette alongside orange: green for success/PRs, red for errors, blue for info
- All colors in OKLCH for perceptual uniformity

### Contrast & accessibility
- Soft white primary text (off-white ~#e0e0e0 range), lighter gray for secondary text
- Interactive elements: bold and clearly popping against background while maintaining clean look — discoverable but not garish
- Disabled states: same color at ~40% opacity
- Card/surface elevation: cards slightly lighter than page background (brightness-based layering, not borders)
- All text must pass WCAG AA (4.5:1 normal, 3:1 large/UI components)

### Claude's Discretion
- Rotation position indicator on Quick Start card (show "2 of 4" or keep minimal)
- Exact OKLCH token values and scale
- Spacing, typography, and animation details
- Loading skeleton design for Workouts tab
- Error state treatment
- Exact semantic color values that harmonize with orange in OKLCH

</decisions>

<specifics>
## Specific Ideas

- Dark gray feel like Linear/Notion dark mode — not Discord/VS Code level dark
- Orange should be the signature color that appears everywhere, not just CTAs
- Quick Start should feel like "open app, one tap, you're working out"
- Cards use lighter background layers for elevation, not borders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-workouts-ux-color*
*Context gathered: 2026-01-31*
