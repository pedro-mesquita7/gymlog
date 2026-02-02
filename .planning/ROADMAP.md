# Roadmap: GymLog v1.5 Real Workout Polish

## Overview

Transform GymLog from a feature-complete analytics tool into a polished daily-use workout app. Starting with a cool blue/teal theme overhaul and bug fixes that propagate globally, then simplifying analytics by removing underused features, restructuring settings and UI for mobile density, adding exercise notes and warmup systems with event sourcing integration, and finishing with production cleanup.

## Milestones

- v1.0 MVP -- Phases 1-4 (shipped 2026-01-28)
- v1.1 Analytics -- Phases 5-7 (shipped 2026-01-30)
- v1.2 UX & Portfolio Polish -- Phases 8-11 (shipped 2026-01-31)
- v1.3 Production Polish & Deploy Readiness -- Phases 12-17 (shipped 2026-02-01)
- v1.4 Comparison, UX & Theme -- Phases 18-21 (shipped 2026-02-02)
- **v1.5 Real Workout Polish -- Phases 22-27 (in progress)**

## Phases

- [ ] **Phase 22: Bug Fixes + Theme Overhaul** - Fix rotation/TS bugs and replace orange accent with cool blue/teal palette
- [ ] **Phase 23: Analytics Simplification** - Remove comparison/progression/plateau, keep exercise progress + volume
- [ ] **Phase 24: Settings + UI Polish** - Restructure settings, compact logging, rotation UX, clean headers
- [ ] **Phase 25: Exercise Notes** - Free text notes per exercise per session with history display
- [ ] **Phase 26: Warmup System** - Per-exercise warmup toggle with 2-tier auto-calculated warmup sets
- [ ] **Phase 27: Production Polish** - README update, dead code cleanup, E2E test updates

## Phase Details

### Phase 22: Bug Fixes + Theme Overhaul
**Goal**: Users see a clean blue/teal app with no rotation or build errors
**Depends on**: Phase 21 (v1.4 complete)
**Requirements**: BUG-01, BUG-02, THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. Quick Start works without "plan or gym not found" error when default gym and rotation exist
  2. TypeScript build completes with zero errors (`tsc --noEmit` passes)
  3. All accent colors are blue/teal throughout the app (no orange remnants)
  4. Charts and data visualizations use the new blue/teal palette
  5. All text/background combinations pass WCAG AA contrast (4.5:1 ratio)
**Plans:** 5 plans
Plans:
- [ ] 22-01-PLAN.md — Fix rotation bug + overhaul index.css color tokens
- [ ] 22-02-PLAN.md — Migrate hardcoded chart/component colors to teal
- [ ] 22-03-PLAN.md — Fix text-black contrast on accent backgrounds
- [ ] 22-04-PLAN.md — Replace rounded-2xl with rounded-xl app-wide
- [ ] 22-05-PLAN.md — Verification sweep + visual checkpoint

### Phase 23: Analytics Simplification
**Goal**: Analytics page is focused on what matters -- exercise progress and volume
**Depends on**: Phase 22 (theme tokens applied to charts)
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04
**Success Criteria** (what must be TRUE):
  1. Analytics page shows exercise progress charts (weight, 1RM, volume trends)
  2. Analytics page shows weekly volume summary per muscle group
  3. Comparison section, progression dashboard, and plateau detection are gone from the UI
  4. Time range filtering (1M/3M/6M/1Y/All) still works on remaining analytics
**Plans**: TBD

### Phase 24: Settings + UI Polish
**Goal**: Settings and UI are organized for daily mobile use, not developer exploration
**Depends on**: Phase 22 (theme applied), Phase 23 (removed analytics sections)
**Requirements**: UIPOL-01, UIPOL-02, UIPOL-03, UIPOL-04, UIPOL-05
**Success Criteria** (what must be TRUE):
  1. Collapsed Exercises/Gyms/Settings sections show clean headers without redundant text
  2. Set logging grid is compact and mobile-friendly (batch grid layout)
  3. Settings top level shows Default Gym, Rotation, and TOON Export only
  4. Debug sections (observability, data quality, demo data) are hidden behind a Developer toggle
  5. Rotation section shows current rotation prominently, others are expandable, create-new is collapsed
**Plans**: TBD

### Phase 25: Exercise Notes
**Goal**: Users can write and review notes about exercises across workout sessions
**Depends on**: Phase 22 (theme), Phase 24 (UI polish context)
**Requirements**: NOTE-01, NOTE-02, NOTE-03
**Success Criteria** (what must be TRUE):
  1. User sees a free text field per exercise during workout logging
  2. Notes persist after workout completion (stored via event sourcing)
  3. Previous session notes are visible when logging the same exercise in a future workout
**Plans**: TBD

### Phase 26: Warmup System
**Goal**: Users get auto-calculated warmup sets before working sets in their workout
**Depends on**: Phase 22 (theme), Phase 25 (notes may share logging UI changes)
**Requirements**: WARM-01, WARM-02, WARM-03, WARM-04, WARM-05
**Success Criteria** (what must be TRUE):
  1. User can toggle warmup on/off per exercise in the plan editor
  2. Warmup-enabled exercises show 2 warmup sets with auto-calculated weights during logging
  3. Warmup weights are based on max weight within exercise's rep range (not all-time PR)
  4. Default warmup tiers are 50% x 5 reps and 75% x 3 reps, configurable in Settings
**Plans**: TBD

### Phase 27: Production Polish
**Goal**: Codebase is clean, documented, and tested for the v1.5 release
**Depends on**: All previous phases (22-26)
**Requirements**: PROD-01, PROD-02, PROD-03
**Success Criteria** (what must be TRUE):
  1. README and architecture diagrams reflect v1.5 changes (removed features, new features)
  2. No dead code from removed comparison/progression/plateau features remains
  3. E2E tests pass against the updated UI structure (settings, analytics, logging changes)
**Plans**: TBD

## Progress

**Execution Order:** 22 -> 23 -> 24 -> 25 -> 26 -> 27

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 22. Bug Fixes + Theme Overhaul | 0/TBD | Not started | - |
| 23. Analytics Simplification | 0/TBD | Not started | - |
| 24. Settings + UI Polish | 0/TBD | Not started | - |
| 25. Exercise Notes | 0/TBD | Not started | - |
| 26. Warmup System | 0/TBD | Not started | - |
| 27. Production Polish | 0/TBD | Not started | - |
