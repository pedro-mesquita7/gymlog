# Phase 18: Theme Redesign - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Evolve the existing OKLCH dark theme to a soft/modern dark aesthetic (Apple Health style) across every component in the app. Update token values, border-radius, shadows, and gradients. Maintain WCAG AA contrast. No new features, no layout changes — pure visual evolution.

</domain>

<decisions>
## Implementation Decisions

### Color direction
- Warm neutral background tone — slightly warm dark grays, not cool/blue
- Muted chroma across the board, EXCEPT:
  - Primary CTA buttons (blue/green) keep saturation
  - PR badges (gold/yellow) keep saturation
  - Status indicators (progression green, plateau amber, regression red) keep saturation
- Reference: Apple Health dark mode — warm blacks, soft card surfaces, muted pastels with occasional vivid accents

### Surface treatment
- Cards float above background with soft drop shadows (raised, no border)
- Subtle top-to-bottom gradient on card backgrounds only (slightly lighter at top)
- No gradients on page headers — depth comes from shadows
- Elevation levels: Claude's discretion
- Shadow intensity: Claude's discretion

### Border radius + spacing
- Cards and containers: very rounded (16px+), iOS widget feel
- Buttons: match card radius (16px), not pill-shaped
- Input fields (text, selects): Claude's discretion on whether to match 16px or use tighter 8-10px
- Spacing between cards: keep current density (don't increase gaps)

### Component scope
- Full sweep — every component gets the theme treatment
- Batch logging grid: soften it (round cells, softer borders) — keep consistent with new theme
- Tab bar / navigation: full restyle (warm background, rounded indicators, softer active state)
- Charts (Recharts): update chart grid lines, tooltips, and backgrounds to align with warm theme

### Claude's Discretion
- Surface elevation levels (2 or 3)
- Shadow intensity
- Input field border-radius
- Exact OKLCH token values (within the warm/muted direction)
- Chart color adjustments

</decisions>

<specifics>
## Specific Ideas

- Apple Health dark mode is the primary visual reference — warm blacks, soft surfaces, muted pastels, vivid accents only for important data
- Batch logging grid should feel part of the same app, not a separate "spreadsheet tool"
- Tab bar should feel integrated into the warm aesthetic, not a flat strip

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-theme-redesign*
*Context gathered: 2026-02-01*
