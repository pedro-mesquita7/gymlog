# Requirements: GymLog v1.3

**Defined:** 2026-01-31
**Core Value:** Track workout performance with proper data engineering -- both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.3 Requirements

### Bug Fix & Data Integrity

- [x] **BUG-01**: Exercise history persists after plan deletion -- non-gym-specific exercises retain all logged data regardless of plan lifecycle
- [x] **BUG-02**: Error boundary coverage audit -- verify all feature areas have graceful fallback UI, fix gaps

### Security & Audit

- [x] **SEC-01**: No exposed secrets in git history, .env files, or localStorage
- [x] **SEC-02**: npm audit passes with no high/critical vulnerabilities
- [x] **SEC-03**: CSP headers configured (compatible with DuckDB-WASM requirements)
- [x] **SEC-04**: No PII in demo data or committed test fixtures
- [x] **SEC-05**: .gitignore covers all sensitive and generated files

### Testing

- [x] **TEST-01**: E2E tests cover plan CRUD with exercise history preservation after deletion
- [x] **TEST-02**: E2E tests cover batch logging edge cases (empty sets, max values, ghost text)
- [x] **TEST-03**: E2E tests cover workout rotation advancement and Quick Start
- [x] **TEST-04**: E2E tests cover demo data import and clear
- [x] **TEST-05**: E2E tests cover Parquet export/import round-trip

### Workouts UX

- [x] **UX-01**: Quick Start is primary CTA on Workouts tab, manual template selection collapsed/secondary
- [x] **UX-02**: Workouts tab uses less vertical space with compact layout

### Analytics

- [x] **ANLT-01**: Analytics page is single scrollable dashboard: summary stats -> volume overview -> exercise detail
- [x] **ANLT-02**: Time range selector (1M/3M/6M/1Y/All) affects all analytics charts globally
- [x] **ANLT-03**: Volume per muscle group shows research-backed target ranges (Schoenfeld/RP) with color-coded zones
- [x] **ANLT-04**: Volume zone legend explains MEV/MAV/MRV with source citation

### Color Scheme

- [x] **CLR-01**: OKLCH color tokens audited for cohesion across all tabs and states
- [x] **CLR-02**: All text meets WCAG AA contrast ratio (4.5:1 text, 3:1 large text/UI components)
- [x] **CLR-03**: Orange accent retained as primary brand color

### Demo Data

- [ ] **DEMO-01**: Import button has gradient/warning styling indicating destructive one-time action
- [ ] **DEMO-02**: "Clear Historical Data" button wipes workout/set logs but preserves exercises, gyms, and plans
- [ ] **DEMO-03**: Confirmation dialog before both import and clear actions

### TOON Export

- [ ] **TOON-01**: Export last workout as TOON format to clipboard
- [ ] **TOON-02**: Export last workout as .toon file download
- [ ] **TOON-03**: Export current rotation cycle (completed workouts only) as TOON
- [ ] **TOON-04**: Export all data from configurable time range (last N months/year) as TOON
- [ ] **TOON-05**: TOON export includes context headers (exercise definitions, date range, muscle groups)

### PWA & Performance

- [ ] **PWA-01**: Service worker caching verified for offline functionality
- [ ] **PWA-02**: PWA manifest has correct icons, theme color, and installability metadata
- [ ] **PWA-03**: Lighthouse performance score documented with targets
- [ ] **PWA-04**: Bundle size budget established and checked in CI

### README & Portfolio

- [ ] **README-01**: Live demo link prominently displayed
- [ ] **README-02**: Screenshots or GIF showing key features
- [ ] **README-03**: Clear "run locally" instructions that work from clean clone

### General Polish

- [ ] **POLISH-01**: UX inconsistencies identified and resolved across all tabs
- [ ] **POLISH-02**: Edge case handling reviewed (empty states, max data, error recovery)

## Future Requirements

Deferred beyond v1.3:

- **CHART-EXP**: Chart export as image
- **MULTI-CMP**: Multi-exercise comparison on one chart
- **VOL-TARGETS**: Personal volume targets per muscle group (custom overrides)
- **SUPER**: Supersets (paired exercises)
- **PLATE**: Plate calculator for barbell loading
- **NOTIF**: Progress summary notifications

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom date picker for analytics | Pill buttons (1M/3M/6M/1Y/All) sufficient for v1.3 |
| TOON import | One-way export only; import from TOON not needed |
| Auto-export on workout completion | Manual export is sufficient |
| Cloud sync/backup | Keeping local-first architecture |
| Multi-user support | Personal use only |
| Mobile native app | PWA covers mobile use case |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 12 | Complete |
| BUG-02 | Phase 12 | Complete |
| SEC-01 | Phase 12 | Complete |
| SEC-02 | Phase 12 | Complete |
| SEC-03 | Phase 12 | Complete |
| SEC-04 | Phase 12 | Complete |
| SEC-05 | Phase 12 | Complete |
| TEST-01 | Phase 13 | Complete |
| TEST-02 | Phase 13 | Complete |
| TEST-03 | Phase 13 | Complete |
| TEST-04 | Phase 13 | Complete |
| TEST-05 | Phase 13 | Complete |
| UX-01 | Phase 14 | Complete |
| UX-02 | Phase 14 | Complete |
| ANLT-01 | Phase 15 | Complete |
| ANLT-02 | Phase 15 | Complete |
| ANLT-03 | Phase 15 | Complete |
| ANLT-04 | Phase 15 | Complete |
| CLR-01 | Phase 14 | Complete |
| CLR-02 | Phase 14 | Complete |
| CLR-03 | Phase 14 | Complete |
| DEMO-01 | Phase 16 | Pending |
| DEMO-02 | Phase 16 | Pending |
| DEMO-03 | Phase 16 | Pending |
| TOON-01 | Phase 16 | Pending |
| TOON-02 | Phase 16 | Pending |
| TOON-03 | Phase 16 | Pending |
| TOON-04 | Phase 16 | Pending |
| TOON-05 | Phase 16 | Pending |
| PWA-01 | Phase 17 | Pending |
| PWA-02 | Phase 17 | Pending |
| PWA-03 | Phase 17 | Pending |
| PWA-04 | Phase 17 | Pending |
| README-01 | Phase 17 | Pending |
| README-02 | Phase 17 | Pending |
| README-03 | Phase 17 | Pending |
| POLISH-01 | Phase 17 | Pending |
| POLISH-02 | Phase 17 | Pending |

**Coverage:**
- v1.3 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-02-01 -- Phase 15 requirements (ANLT-01, ANLT-02, ANLT-03, ANLT-04) marked Complete*
