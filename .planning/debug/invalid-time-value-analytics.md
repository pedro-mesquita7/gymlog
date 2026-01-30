---
status: diagnosed
trigger: "Invalid time value in useAnalytics.ts - RangeError from Date.toISOString()"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - see Resolution
test: n/a
expecting: n/a
next_action: none (diagnosis only)

## Symptoms

expected: Exercise progress charts and weekly comparison cards render correctly
actual: RangeError "Invalid time value" thrown at Date.toISOString() on lines 50 and 114
errors: |
  useAnalytics.ts:50 - new Date(dateVal * 86400000).toISOString() throws RangeError
  useAnalytics.ts:114 - new Date(wsVal * 86400000).toISOString() throws RangeError
  Console logs show: date value = 1769731200000, week_start value = 1769385600000
reproduction: Render any exercise progress chart or weekly comparison card
started: Unknown

## Eliminated

- hypothesis: "Values are not valid timestamps at all"
  evidence: 1769731200000 ms = 2026-01-30 and 1769385600000 ms = 2026-01-26, both valid dates
  timestamp: 2026-01-30

## Evidence

- timestamp: 2026-01-30
  checked: SQL queries in compiled-queries.ts (lines 271-302 and 305-360)
  found: |
    EXERCISE_PROGRESS_SQL uses: DATE_TRUNC('day', CAST(logged_at AS TIMESTAMPTZ))::DATE AS date
    WEEKLY_COMPARISON_SQL uses: DATE_TRUNC('week', CAST(logged_at AS TIMESTAMPTZ))::DATE AS week_start
    Both cast the result to ::DATE type.
  implication: DuckDB-WASM returns DATE columns as millisecond-epoch integers, NOT epoch-day integers

- timestamp: 2026-01-30
  checked: Console log output from error trace
  found: |
    date type: number, date value: 1769731200000
    week_start type: number, week_start value: 1769385600000
  implication: Values are already millisecond timestamps (1769731200000 / 86400000 = 20483.0 days, which as a date = ~2026-01-30, correct)

- timestamp: 2026-01-30
  checked: useAnalytics.ts lines 46-57 (useExerciseProgress) and lines 111-120 (useWeeklyComparison)
  found: |
    Code comment on line 46 says: "DuckDB DATE returns epoch-day integers"
    Code on line 50: new Date(dateVal * 86400000).toISOString()
    This multiplies the value by 86400000 (ms per day), treating it as epoch-days.
    But the value is ALREADY in milliseconds.
    1769731200000 * 86400000 = 1.529...e+23, which is ~4.8 billion years in the future.
    This exceeds Date's valid range (up to year 275760), causing RangeError.
  implication: The code incorrectly assumes epoch-day integers but DuckDB-WASM is returning millisecond timestamps.

- timestamp: 2026-01-30
  checked: Arithmetic verification
  found: |
    new Date(1769731200000) => 2026-01-30T00:00:00.000Z (valid, correct date)
    new Date(1769731200000 * 86400000) => RangeError (value = 1.53e+23, far exceeds max safe Date)
    new Date(1769385600000) => 2026-01-26T00:00:00.000Z (valid, correct date - a Monday, consistent with week_start)
    new Date(1769385600000 * 86400000) => RangeError
  implication: Removing the * 86400000 multiplication would fix both functions

## Resolution

root_cause: |
  The code in useAnalytics.ts assumes DuckDB-WASM returns DATE columns as
  "epoch-day integers" (number of days since Unix epoch), and multiplies
  by 86400000 to convert to milliseconds before passing to `new Date()`.

  However, DuckDB-WASM actually returns DATE values as millisecond-epoch
  integers (already in milliseconds). The values logged in the console
  (1769731200000 and 1769385600000) are valid millisecond timestamps
  corresponding to 2026-01-30 and 2026-01-26 respectively.

  Multiplying these millisecond values by 86400000 produces numbers on the
  order of 1.5e+23, which vastly exceeds JavaScript's Date maximum valid
  value (~8.64e+15, year 275760). This causes `new Date()` to return an
  Invalid Date, and calling `.toISOString()` on an Invalid Date throws
  RangeError: Invalid time value.

  The bug exists in both:
  - Line 50: new Date(dateVal * 86400000).toISOString()
  - Line 114: new Date(wsVal * 86400000).toISOString()

  Both the `number` and `bigint` branches have the same incorrect multiplication.

fix: (not applied - diagnosis only)
verification: (not applied - diagnosis only)
files_changed: []
