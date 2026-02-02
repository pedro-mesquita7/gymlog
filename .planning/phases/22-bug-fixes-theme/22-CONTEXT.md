# Phase 22: Bug Fixes + Theme Overhaul - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the rotation "plan or gym not found" bug and TS build errors (templateId→planId), then replace the entire orange/warm accent color system with a cool blue/teal palette inspired by Apple dark mode. Every OKLCH token, chart color, and component style updates in this phase — subsequent phases inherit the new aesthetic.

</domain>

<decisions>
## Implementation Decisions

### Reference & Overall Vibe
- Apple dark mode aesthetic — clean, minimal, professional
- Dark-only (no light mode toggle)
- Softer teal accent (not Apple system blue #0A84FF — more muted, slightly green-shifted)
- Slightly elevated dark gray base (~#111) with lighter card surfaces — not stark black like OLED Apple

### Color Palette
- Primary accent: softer teal (muted blue-green, not vibrant)
- Backgrounds: slightly elevated dark gray base, lighter surfaces for cards/sections
- Text hierarchy: Apple-style whites — pure white primary, ~60% white secondary, ~30% white tertiary
- Semantic status colors: green (success/PRs), yellow (warning), red (error) — standard, not teal-ified
- Volume zones: teal gradient (light-to-dark teal intensity) instead of red/yellow/green

### Component Feel
- Border radius: Apple-subtle 10-12px (down from current 12-16px)
- Shadows: minimal — rely on surface color difference for depth, not shadow
- Borders: thin 1px separator lines at ~15% white opacity — minimal and clean
- Buttons: filled teal for primary actions, ghost/text for secondary, subtle hover states

### Chart Colors
- Primary chart color: same teal accent as UI (consistent brand)
- Volume zones: teal gradient (light teal = under-training, medium = optimal, dark = high volume)
- Multi-series differentiation: Claude's discretion (teal shades or teal + gray)

### Claude's Discretion
- Exact OKLCH token values (as long as they achieve the described aesthetic)
- Multi-series chart differentiation approach
- Hover/focus state specifics
- Exact shadow values (minimal is the directive)
- How to handle the HSL→OKLCH migration for remaining legacy tokens

</decisions>

<specifics>
## Specific Ideas

- "Apple vibe with dark mode only" — the guiding aesthetic principle
- Not the stark black of Apple OLED — slightly elevated, more like Apple's "elevated" dark appearance
- Teal should feel softer/more muted than Apple's vibrant system blue
- Volume zones switching from semantic (red/yellow/green) to teal gradient is a deliberate choice — keeps the data viz layer cohesive and monochrome
- Semantic colors (green/yellow/red) reserved for explicit status: PRs, errors, warnings only

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 22-bug-fixes-theme*
*Context gathered: 2026-02-02*
