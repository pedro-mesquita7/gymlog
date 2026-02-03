# Phase 26: Warmup System - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-calculated warmup sets displayed as informational hints before working sets during workout logging. Users see recommended warmup weight/reps based on their last session. Warmup sets are NOT logged — they are display-only guidance. No per-exercise toggle; warmup applies globally to all weighted exercises.

</domain>

<decisions>
## Implementation Decisions

### Warmup display
- Warmup is informational only — not logged sets, just hints showing recommended warmup weight/reps
- Tap-to-reveal inside the exercise header area (keeps UI compact by default)
- Compact inline format: e.g., "Warmup: 5×30kg (50%) → 3×45kg (75%)"
- Single line with arrow between tiers

### Toggle behavior
- No per-exercise toggle — warmup applies to all exercises globally
- Always on — no global toggle in Settings needed
- Skip bodyweight exercises — only show warmup hints when there's a non-zero weight to calculate from
- New exercises with no history show placeholder: "Log your first session to see warmup suggestions"

### Weight calculation
- Based on max working weight from the most recent session of that exercise (last session only, not all-time best)
- Always uses the original (non-substituted) exercise's history — walks back through sessions to find the most recent one where the original exercise was actually performed
- If original exercise has never been logged (only substitutions exist), treat as new exercise — show placeholder, no warmup hint
- Round calculated weights to nearest 2.5kg

### Tier configuration
- Default tiers: 50% × 5 reps and 75% × 3 reps
- Users can edit percentage and rep count for each tier in Settings
- Fixed at 2 tiers (no adding/removing tiers)
- Settings UI nested inside an existing settings group (not its own top-level section)
- "Reset to defaults" button available to restore 50%×5 and 75%×3

### Claude's Discretion
- Tier editor UI pattern (inline inputs vs tap-to-edit modal)
- Exact placement within exercise header for the warmup tap target
- Placeholder message wording
- Which existing Settings section to nest warmup config under

</decisions>

<specifics>
## Specific Ideas

- "Warmup should be additional info, not a set to be logged — just a small hint"
- 100% reference weight = the weight from last session inside the rep range of working sets
- For substituted exercises, always look up the original exercise's history, even if it means going back multiple sessions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-warmup-system*
*Context gathered: 2026-02-03*
