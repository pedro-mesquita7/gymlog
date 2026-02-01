# Roadmap: GymLog

## Milestones

- Archived: **v1.0 MVP** - Phases 1-4 (shipped 2026-01-28)
- Archived: **v1.1 Analytics** - Phases 5-7 (shipped 2026-01-30)
- Archived: **v1.2 UX & Portfolio Polish** - Phases 8-11 (shipped 2026-01-31)
- Archived: **v1.3 Production Polish & Deploy Readiness** - Phases 12-17 (shipped 2026-02-01)
- In Progress: **v1.4 Comparison, UX & Theme** - Phases 18-21

Previous milestone roadmaps archived in `.planning/milestones/`.

## v1.4 Comparison, UX & Theme

**Milestone Goal:** Add multi-exercise comparison analytics, tighten UX across tabs, and redesign the visual theme to a soft/modern dark aesthetic. Zero new dependencies.

**Phase Numbering:**
- Integer phases (18, 19, 20, 21): Planned milestone work
- Decimal phases (e.g., 19.1): Urgent insertions if needed

### Overview

- [x] **Phase 18: Theme Redesign** - Evolve OKLCH tokens to soft/modern dark aesthetic with rounded corners, shadows, and verified contrast
- [x] **Phase 19: Plans Rename** - Rename "Templates" to "Plans" across all UI text while preserving event type backward compatibility
- [x] **Phase 20: UX Restructure** - Collapsible sections on Workouts tab and settings reorder for streamlined navigation
- [ ] **Phase 21: Comparison Analytics** - Side-by-side exercise comparison with PRs, volume, frequency, and progression status

## Phase Details

### Phase 18: Theme Redesign
**Goal**: Users experience a visually refined soft/modern dark aesthetic across the entire app
**Depends on**: Nothing (foundation -- all later phases inherit new look)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. App backgrounds feel warmer and softer compared to previous sharp dark theme (muted tones, lower chroma OKLCH values)
  2. All cards and interactive elements have visibly rounded corners (12-16px radius)
  3. Cards display subtle shadows and gentle gradient treatments that create depth without harshness
  4. All text remains legible with WCAG AA contrast ratios maintained (4.5:1 minimum for body text, 3:1 for large text)
**Plans**: 6 plans

Plans:
- [x] 18-01-PLAN.md -- Token foundation + UI primitives (Wave 1)
- [x] 18-02-PLAN.md -- Navigation + Workout + top-level components (Wave 2)
- [x] 18-03-PLAN.md -- Templates + History + Rotation components (Wave 2)
- [x] 18-04-PLAN.md -- Analytics + Charts + hardcoded color migration (Wave 2)
- [x] 18-05-PLAN.md -- Settings + Backup components (Wave 2)
- [x] 18-06-PLAN.md -- WCAG contrast verification + visual checkpoint (Wave 3)

### Phase 19: Plans Rename
**Goal**: Users see consistent "Plans" terminology everywhere that previously said "Templates"
**Depends on**: Phase 18 (theme settled before wide-reaching text changes)
**Requirements**: UX-03
**Success Criteria** (what must be TRUE):
  1. Every screen, tab label, heading, button, and toast that previously said "Template(s)" now says "Plan(s)"
  2. Existing user data (events, rotations, workout history) continues to load correctly after rename (no data loss)
  3. E2E tests pass with updated selectors and assertions
**Plans**: 3 plans

Plans:
- [x] 19-01-PLAN.md -- Foundation rename: types, events, data layer, hooks, stores (Wave 1)
- [x] 19-02-PLAN.md -- Component directory rename + all consumer component updates (Wave 2)
- [x] 19-03-PLAN.md -- Test updates + grep audit + full verification (Wave 3)

### Phase 20: UX Restructure
**Goal**: Users navigate Workouts and Settings tabs with less clutter and faster access to primary actions
**Depends on**: Phase 19 (rename complete before restructuring sections that reference Plans)
**Requirements**: UX-01, UX-02, UX-04
**Success Criteria** (what must be TRUE):
  1. Exercises section on Workouts tab is collapsed by default, expandable with a single tap
  2. Gyms section on Workouts tab is collapsed by default, expandable with a single tap
  3. Settings tab shows Rotations at top, then Default Gym, then Create Rotation button, then remaining settings
  4. "Start Workout" / Quick Start remains the most prominent element on Workouts tab without scrolling past collapsed sections
**Plans**: 3 plans

Plans:
- [x] 20-01-PLAN.md -- CollapsibleSection component + Workouts tab restructure (Wave 1)
- [x] 20-02-PLAN.md -- Settings tab reorder with collapsible lower sections (Wave 2)
- [x] 20-03-PLAN.md -- E2E test updates for collapsed sections (Wave 2)

### Phase 21: Comparison Analytics
**Goal**: Users can compare exercises side-by-side to understand relative strength, volume, and progression across their training
**Depends on**: Phase 20 (collapsible section pattern available, theme and UX settled)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. User can select 2-4 exercises from a multi-select picker on the Analytics page
  2. Selected exercises display side-by-side stat cards showing PR (weight and estimated 1RM) per exercise
  3. Stat cards show total volume (sets x reps x weight) per exercise for the selected time range
  4. Stat cards show training frequency (sessions per week/month) per exercise
  5. Stat cards show current progression status (progressing / plateau / regressing) per exercise
**Plans**: TBD

Plans:
- [ ] 21-01: TBD
- [ ] 21-02: TBD
- [ ] 21-03: TBD

## Progress

**Execution Order:** 18 -> 19 -> 20 -> 21

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Theme Redesign | v1.4 | 6/6 | Complete | 2026-02-01 |
| 19. Plans Rename | v1.4 | 3/3 | Complete | 2026-02-01 |
| 20. UX Restructure | v1.4 | 3/3 | Complete | 2026-02-01 |
| 21. Comparison Analytics | v1.4 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-01*
*Last updated: 2026-02-01*
