# Phase 27: Production Polish - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Codebase cleanup, documentation update, and E2E test fixes/additions for the v1.5 release. README rewrite targeting portfolio reviewers, dead code removal across the entire codebase, E2E test updates for changed UI plus new coverage for notes and warmup features, and version bump to 1.5.0.

</domain>

<decisions>
## Implementation Decisions

### README scope
- Primary audience: portfolio reviewers (hiring managers, recruiters)
- Include animated GIF demos of key workflows (logging, analytics, settings)
- Highlight event sourcing + DuckDB as data engineering centerpiece
- Include architecture diagram showing data flow (events -> DuckDB -> analytics)
- Full stack overview but with stronger emphasis on data engineering skills
- No "removed features" or changelog section -- only show current state
- Full "Getting Started" section: clone, install, run dev server, seed demo data
- Include deployment documentation (Vercel/Netlify/GitHub Pages) for portfolio demos

### Dead code strategy
- Broader sweep: removed features (comparison/progression/plateau) PLUS orphan components, unused hooks, utilities, unreferenced types
- Remove ToonExportSection (previously kept as orphan in d24-02-02) -- clean slate
- Clean up unused npm dependencies from package.json too
- Claude discovers dead code through analysis (no specific targets identified)

### E2E test approach
- Fix broken tests AND add new coverage for notes and warmup features
- Cover all major flows: logging, analytics view, settings changes, notes, warmups
- Tests run against demo/seed data (not own fixtures)
- Test framework: Claude discovers from codebase during research

### Release verification
- Version bump to 1.5.0 in package.json
- Full build check: run build, check bundle size, verify no warnings/errors, TypeScript strict check
- No Lighthouse audit needed

### Claude's Discretion
- Architecture diagram format and tooling
- GIF capture approach and which exact screens to demo
- Dead code detection methodology
- E2E test organization and naming conventions
- Bundle size thresholds for build verification

</decisions>

<specifics>
## Specific Ideas

- README should showcase this as a senior Data Engineer portfolio piece
- Event sourcing pattern and DuckDB analytics engine are the technical differentiators to emphasize
- GIF demos should show the daily-use workflow, not just static screens
- Deploy docs should make it easy for a reviewer to see a live demo

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 27-production-polish*
*Context gathered: 2026-02-03*
