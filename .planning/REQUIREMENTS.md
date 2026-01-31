# Requirements: GymLog v1.3

**Defined:** 2026-01-31
**Core Value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.3 Requirements

### Bug Fix & Data Integrity

- [ ] **BUG-01**: Exercise history persists after plan deletion — non-gym-specific exercises retain all logged data regardless of plan lifecycle
- [ ] **BUG-02**: Error boundary coverage audit — verify all feature areas have graceful fallback UI, fix gaps

### Security & Audit

- [ ] **SEC-01**: No exposed secrets in git history, .env files, or localStorage
- [ ] **SEC-02**: npm audit passes with no high/critical vulnerabilities
- [ ] **SEC-03**: CSP headers configured (compatible with DuckDB-WASM requirements)
- [ ] **SEC-04**: No PII in demo data or committed test fixtures
- [ ] **SEC-05**: .gitignore covers all sensitive and generated files

### Testing

- [ ] **TEST-01**: E2E tests cover plan CRUD with exercise history preservation after deletion
- [ ] **TEST-02**: E2E tests cover batch logging edge cases (empty sets, max values, ghost text)
- [ ] **TEST-03**: E2E tests cover workout rotation advancement and Quick Start
- [ ] **TEST-04**: E2E tests cover demo data import and clear
- [ ] **TEST-05**: E2E tests cover Parquet export/import round-trip

### Workouts UX

- [ ] **UX-01**: Quick Start is primary CTA on Workouts tab, manual template selection collapsed/secondary
- [ ] **UX-02**: Workouts tab uses less vertical space with compact layout

### Analytics

- [ ] **ANLT-01**: Analytics page is single scrollable dashboard: summary stats → volume overview → exercise detail
- [ ] **ANLT-02**: Time range selector (1M/3M/6M/1Y/All) affects all analytics charts globally
- [ ] **ANLT-03**: Volume per muscle group shows research-backed target ranges (Schoenfeld/RP) with color-coded zones
- [ ] **ANLT-04**: Volume zone legend explains MEV/MAV/MRV with source citation

### Color Scheme

- [ ] **CLR-01**: OKLCH color tokens audited for cohesion across all tabs and states
- [ ] **CLR-02**: All text meets WCAG AA contrast ratio (4.5:1 text, 3:1 large text/UI components)
- [ ] **CLR-03**: Orange accent retained as primary brand color

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
| BUG-01 | TBD | Pending |
| BUG-02 | TBD | Pending |
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |
| SEC-05 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| TEST-04 | TBD | Pending |
| TEST-05 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| ANLT-01 | TBD | Pending |
| ANLT-02 | TBD | Pending |
| ANLT-03 | TBD | Pending |
| ANLT-04 | TBD | Pending |
| CLR-01 | TBD | Pending |
| CLR-02 | TBD | Pending |
| CLR-03 | TBD | Pending |
| DEMO-01 | TBD | Pending |
| DEMO-02 | TBD | Pending |
| DEMO-03 | TBD | Pending |
| TOON-01 | TBD | Pending |
| TOON-02 | TBD | Pending |
| TOON-03 | TBD | Pending |
| TOON-04 | TBD | Pending |
| TOON-05 | TBD | Pending |
| PWA-01 | TBD | Pending |
| PWA-02 | TBD | Pending |
| PWA-03 | TBD | Pending |
| PWA-04 | TBD | Pending |
| README-01 | TBD | Pending |
| README-02 | TBD | Pending |
| README-03 | TBD | Pending |
| POLISH-01 | TBD | Pending |
| POLISH-02 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 37 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 37

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
