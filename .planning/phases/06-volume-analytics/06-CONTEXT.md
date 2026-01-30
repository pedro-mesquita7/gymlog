# Phase 6: Volume Analytics - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver muscle group volume tracking with visual indicators for training balance. Users see sets per week by muscle group, color-coded volume zones (under/optimal/over), and an anatomical heat map showing training frequency distribution. All within the existing Analytics page.

</domain>

<decisions>
## Implementation Decisions

### Chart layout & grouping
- Volume metric is **sets per week** (simple count, not total load)
- Always show a **fixed standard list** of major muscle groups (chest, back, shoulders, legs, arms, core) even if some have zero data
- Claude's discretion: stacked vs grouped bars, and number of weeks to display

### Volume zone thresholds
- Zones apply **per muscle group per week**: red <10 sets, green 10-20 sets, yellow 20+ sets
- Thresholds should be **user-configurable** (not hardcoded) — allow adjustment per muscle group
- Claude's discretion: visual treatment (bar colors, background bands, or both) and zone legend placement

### Heat map design
- **Anatomical body diagram** (not grid/matrix) showing muscle groups colored by training volume
- **Front and back views** — anatomically accurate mapping of muscle groups
- Time range: **last 4 weeks** aggregate
- Color intensity driven by **total sets** (same metric as the bar chart)

### Page integration
- Volume analytics lives on the **same Analytics page**, scrollable below exercise progress
- **Exercise progress section stays at top**, volume sections added below
- **Section headers** with clear visual separation (e.g., "Exercise Progress", "Volume Analytics")
- Sections are **collapsible** — users can expand/collapse to manage page length

### Claude's Discretion
- Bar chart style (stacked vs grouped) and time range (4 or 8 weeks)
- Volume zone visual treatment (bar colors, background bands, legend approach)
- Body diagram SVG implementation details
- Collapsible section animation and default state (expanded/collapsed)
- Threshold configuration UI design

</decisions>

<specifics>
## Specific Ideas

- Body diagram should show front AND back views for anatomical accuracy (back, hamstrings, glutes mapped separately)
- Volume zones based on evidence-based hypertrophy research (10-20 sets per muscle group per week is the commonly cited optimal range)
- Configurable thresholds suggest a settings/preferences mechanism — could be inline on the chart or a separate settings area

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-volume-analytics*
*Context gathered: 2026-01-30*
