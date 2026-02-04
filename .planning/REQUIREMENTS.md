# Requirements: GymLog

**Defined:** 2026-02-02
**Core Value:** Track workout performance with proper data engineering -- both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.5 Requirements

Requirements for v1.5 Real Workout Polish. Each maps to roadmap phases.

### Bug Fixes

- [x] **BUG-01**: Rotation "plan or gym not found" error resolved when default gym and active rotation exist
- [x] **BUG-02**: TS build errors fixed in QuickStartCard.tsx and StartWorkout.tsx (templateId->planId)

### Theme

- [x] **THEME-01**: Orange accent replaced with cool blue/teal color palette
- [x] **THEME-02**: All OKLCH tokens updated for blue/teal aesthetic
- [x] **THEME-03**: WCAG AA contrast maintained across all text/background combinations
- [x] **THEME-04**: Charts and data visualizations use new color palette

### Analytics Simplification

- [x] **ANLY-01**: Analytics page shows exercise progress charts (weight, 1RM, volume trends)
- [x] **ANLY-02**: Analytics page shows weekly volume per muscle group
- [x] **ANLY-03**: Comparison section, progression dashboard, and plateau detection removed
- [x] **ANLY-04**: Time range filtering retained for remaining analytics

### UI Polish

- [x] **UIPOL-01**: Collapsed sections show clean headers without redundant text (Exercises, Gyms, Settings)
- [x] **UIPOL-02**: Set logging uses batch grid layout for mobile density
- [x] **UIPOL-03**: Settings restructured: Default Gym + Rotation + TOON export visible at top level
- [x] **UIPOL-04**: Debug sections (observability, data quality, demo data) behind Developer toggle
- [x] **UIPOL-05**: Rotation UX: current rotation prominent, others expandable, create-new collapsed

### Exercise Notes

- [x] **NOTE-01**: Free text field per exercise during workout logging
- [x] **NOTE-02**: Notes saved with workout session data via event sourcing
- [x] **NOTE-03**: Notes visible in exercise history on next workout

### Warmup System

- [x] **WARM-01**: Global warmup for all weighted exercises (per CONTEXT.md: no per-exercise toggle)
- [x] **WARM-02**: Two warmup tiers with configurable percentage and reps (default: 50% x 5, 75% x 3)
- [x] **WARM-03**: Warmup tier configuration accessible in Settings
- [x] **WARM-04**: Working weight auto-calculated from max weight in last completed session (not PR)
- [x] **WARM-05**: Warmup sets displayed with calculated weights during workout logging

### Production Polish

- [x] **PROD-01**: README and architecture diagrams updated for v1.5 changes
- [x] **PROD-02**: Unused files and dead code cleaned up (including removed comparison code)
- [x] **PROD-03**: Final E2E test updates for changed UI structure

## v2+ Requirements

Deferred to future release. Not in current roadmap.

### Advanced Features

- **ADV-01**: Chart export as image
- **ADV-02**: Supersets (paired exercises)
- **ADV-03**: Plate calculator for barbell loading
- **ADV-04**: Progress summary notifications
- **ADV-05**: Personal volume targets per muscle group
- **ADV-06**: Light mode toggle

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync/backup | Keeping local-first, manual export sufficient |
| Multi-user support | Personal use only |
| Mobile native app | PWA covers mobile use case |
| Overlay progress charts for comparison | Comparison feature being removed in v1.5 |
| Social/sharing features | Not relevant for personal tool |
| Dynamic N-tier warmup | Fixed 2 tiers covers standard protocol |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 22 | Complete |
| BUG-02 | Phase 22 | Complete |
| THEME-01 | Phase 22 | Complete |
| THEME-02 | Phase 22 | Complete |
| THEME-03 | Phase 22 | Complete |
| THEME-04 | Phase 22 | Complete |
| ANLY-01 | Phase 23 | Complete |
| ANLY-02 | Phase 23 | Complete |
| ANLY-03 | Phase 23 | Complete |
| ANLY-04 | Phase 23 | Complete |
| UIPOL-01 | Phase 24 | Complete |
| UIPOL-02 | Phase 24 | Complete |
| UIPOL-03 | Phase 24 | Complete |
| UIPOL-04 | Phase 24 | Complete |
| UIPOL-05 | Phase 24 | Complete |
| NOTE-01 | Phase 25 | Complete |
| NOTE-02 | Phase 25 | Complete |
| NOTE-03 | Phase 25 | Complete |
| WARM-01 | Phase 26 | Complete |
| WARM-02 | Phase 26 | Complete |
| WARM-03 | Phase 26 | Complete |
| WARM-04 | Phase 26 | Complete |
| WARM-05 | Phase 26 | Complete |
| PROD-01 | Phase 27 | Complete |
| PROD-02 | Phase 27 | Complete |
| PROD-03 | Phase 27 | Complete |

**Coverage:**
- v1.5 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-04 after phase 27 completion*
