# Phase 24: Settings + UI Polish - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure settings for daily mobile use (not developer exploration), compact the set logging grid, improve rotation section UX, and clean up redundant header text in collapsible sections. No new features — this is polish and reorganization of existing UI.

</domain>

<decisions>
## Implementation Decisions

### Settings organization
- Top-level settings shows: Default Gym (inline dropdown), Rotation (inline dropdown), Export Data (simple button)
- Developer Mode toggle switch at the bottom of settings, off by default
- Flipping Developer Mode on reveals: System Observability, Data Quality, Demo Data sections
- No sub-page navigation — Default Gym and Rotation are inline dropdown selectors on the settings page
- TOON Export is a single "Export Data" button, no extra options or section

### Compact logging grid
- Primary problem is too much vertical space per set row — padding, margins, input heights are oversized
- All planned sets visible at once (e.g., 4 empty rows), not progressive reveal
- Medium touch targets for weight and reps inputs — big enough for thumbs, small enough to fit on one row
- Set numbers: Claude's discretion (explicit vs implied by position)

### Rotation section UX
- Active rotation shown with a colored "Active" badge, visually distinct from others in the list
- Non-active rotations in a collapsed accordion — tap to expand and see exercises
- "Create New Rotation" is a "+" icon button in the Rotation section header
- Switching active rotation requires inline confirmation ("Set as active?"), not a modal

### Header cleanup
- Problem: expandable sections repeat their title inside expanded content (e.g., "System Observability" header + "System Observability" title inside)
- Remove redundant inner titles from collapsible sections
- Count badges only where useful (Exercises, Gyms — skip where count isn't meaningful)
- No icons on section headers — text-only, clean
- Chevron right/down as expand/collapse indicator (rotates on toggle)

### Claude's Discretion
- Set number display (explicit vs implied by row position)
- Exact padding/margin reduction values for compact logging
- Which sections get count badges beyond Exercises and Gyms
- Loading/transition animations for accordion expand/collapse

</decisions>

<specifics>
## Specific Ideas

- Collapsible sections like "System Observability" and "Demo Data" currently show a redundant title when expanded — strip that inner title so the section header IS the title
- Settings should feel like a quick config page, not a developer dashboard

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-settings-ui-polish*
*Context gathered: 2026-02-02*
