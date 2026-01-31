# Features Research: v1.3 Production Polish & Deploy Readiness

**Date:** 2026-01-31
**Focus:** How target features typically work in fitness/analytics apps

## Analytics Dashboard Design

**Table Stakes:**
- Summary stats at top (total workouts, current streak, PRs this month)
- Muscle group volume overview (bar chart with zone coloring)
- Exercise-level detail sections below
- Time range selector that affects all charts globally
- Clear visual hierarchy: summary → overview → detail

**Differentiators:**
- Anatomical heat map integrated into dashboard (already built)
- Progression status badges inline with exercise cards
- Volume zone indicators with research-backed ranges

**Anti-features:**
- Click-to-drill navigation (user explicitly rejected this)
- Separate tabs for different analytics views
- Auto-playing animations or transitions between views

## Time Range Selection

**Table Stakes:**
- Pill/chip buttons: 1M, 3M, 6M, 1Y, All
- Selected range persists across page sections
- All charts update simultaneously when range changes
- Default to a sensible range (3M or 6M)

**Implementation patterns:**
- Global state (Zustand) for selected range
- Pass range as parameter to all analytics SQL queries
- Date filtering in SQL WHERE clauses (most performant)

**Anti-features:**
- Custom date picker (overkill for this use case)
- Per-chart range selection (inconsistent UX)

## Volume Recommendations

**Table Stakes:**
- Show user's current weekly sets per muscle group
- Compare against research-backed optimal ranges
- Color-coded zones: under-training, optimal, high, over-training
- Source citation (Schoenfeld et al., Renaissance Periodization)

**Differentiators:**
- Muscle-group-specific thresholds (not one-size-fits-all)
- MEV/MAV/MRV landmarks shown on volume chart
- Trend over time: is volume trending up/down?

**Anti-features:**
- AI-generated personalized recommendations
- Prescriptive "you should do X more sets" (just show data)

## TOON Export

**Table Stakes:**
- Export last workout to clipboard (one-click)
- Export to .toon file download
- Context headers (user info, date range, exercise definitions)
- Clear scope selection: last workout, current rotation, last N months

**Differentiators:**
- Clipboard + file download options
- Rotation-aware export (only completed workouts in current cycle)
- Token count estimate shown before export

**Anti-features:**
- Import from TOON (one-way export only)
- Real-time streaming export
- Auto-export on workout completion

## Demo Data UX

**Table Stakes:**
- Gradient/warning styling on destructive import button
- Confirmation dialog before import
- "Clear Historical Data" that preserves config (exercises, gyms, plans)
- Clear messaging about what gets preserved vs deleted

**Differentiators:**
- Two-step confirmation for destructive actions
- Visual preview of what will be affected

**Anti-features:**
- Undo for data clearing (too complex for local-first)
- Partial demo data import

## Workouts Tab Streamlining

**Table Stakes:**
- Quick Start as primary CTA (large, prominent)
- Manual template selection collapsed/secondary
- Reduce vertical space usage
- One-tap to start workout via rotation

**Patterns:**
- Hero CTA pattern: large Quick Start button at top
- Expandable section or secondary row for "Choose template"
- Template list only shown on demand

**Anti-features:**
- Wizard/multi-step template selection
- Template preview before starting
