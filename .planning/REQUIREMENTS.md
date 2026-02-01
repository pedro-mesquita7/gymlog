# Requirements: GymLog

**Defined:** 2026-02-01
**Core Value:** Track workout performance with proper data engineering -- both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.4 Requirements

Requirements for milestone v1.4: Comparison, UX & Theme.

### Comparison Analytics

- [x] **COMP-01**: User can select 2-4 exercises to compare side-by-side
- [x] **COMP-02**: Comparison view shows stat cards with PRs per exercise
- [x] **COMP-03**: Comparison view shows volume per exercise
- [x] **COMP-04**: Comparison view shows training frequency per exercise
- [x] **COMP-05**: Comparison view shows progression status per exercise

### UX Tightening

- [x] **UX-01**: Exercises section on Workouts tab is collapsible (collapsed by default)
- [x] **UX-02**: Gyms section on Workouts tab is collapsible (collapsed by default)
- [x] **UX-03**: "Templates" renamed to "Plans" in all UI text (event types unchanged)
- [x] **UX-04**: Settings tab reordered: Rotations → Default Gym → Create Rotation → rest

### Theme Redesign

- [x] **THEME-01**: OKLCH token values updated for soft/modern dark aesthetic (muted tones, lower chroma, warmer backgrounds)
- [x] **THEME-02**: Border-radius increased across all components (rounded corners)
- [x] **THEME-03**: Card shadows and gentle gradients applied
- [x] **THEME-04**: WCAG AA contrast maintained after token changes

## Future Requirements

Deferred to v1.5+.

- **COMP-06**: Overlay progress charts (weight/1RM) for selected exercises
- **THEME-05**: Migrate HSL chart colors to OKLCH-consistent palette

## Out of Scope

| Feature | Reason |
|---------|--------|
| Comparison charts (overlay) | Stat cards sufficient for v1.4; charts deferred |
| Chart color migration to OKLCH | Functional as-is; defer to theme polish milestone |
| Cloud sync/backup | Keeping local-first |
| Mobile native app | PWA covers mobile use case |
| SCD Type 2 | Complexity not justified |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | Phase 21 | Complete |
| COMP-02 | Phase 21 | Complete |
| COMP-03 | Phase 21 | Complete |
| COMP-04 | Phase 21 | Complete |
| COMP-05 | Phase 21 | Complete |
| UX-01 | Phase 20 | Complete |
| UX-02 | Phase 20 | Complete |
| UX-03 | Phase 19 | Complete |
| UX-04 | Phase 20 | Complete |
| THEME-01 | Phase 18 | Complete |
| THEME-02 | Phase 18 | Complete |
| THEME-03 | Phase 18 | Complete |
| THEME-04 | Phase 18 | Complete |

**Coverage:**
- v1.4 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after Phase 21 completion*
