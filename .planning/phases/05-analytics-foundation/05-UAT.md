---
status: diagnosed
phase: 05-analytics-foundation
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md]
started: 2026-01-30T00:00:00Z
updated: 2026-01-30T10:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Analytics Tab in Navigation
expected: Bottom navigation bar shows 4 tabs: Workouts, Templates, Analytics, Settings. Analytics tab appears between Templates and Settings.
result: pass

### 2. Navigate to Analytics Page
expected: Tapping Analytics tab shows a loading spinner briefly, then the Analytics page loads with an exercise selector dropdown at the top.
result: pass
note: Fixed ResponsiveContainer dimension warning (e6d5352), date-fns BigInt crash (8a2d66f), DECIMAL 1000x scaling (adc7fc5).

### 3. Exercise Selector
expected: Dropdown shows all your exercises with their muscle group in parentheses (e.g., "Bench Press (Chest)"). First exercise is auto-selected on page load.
result: pass

### 4. Progress Chart - Weight Line
expected: Below the selector, a "Progress (Last 4 Weeks)" section shows a line chart. An orange solid line shows max weight over time with dots on data points.
result: issue
reported: "Error: Invalid time value shown instead of chart. DuckDB returns date as numeric timestamp, useAnalytics.ts fails at Date.toISOString() on raw values like 1769731200000. Also OPFS database corrupt causing fallback to in-memory mode."
severity: blocker

### 5. Progress Chart - 1RM Trend
expected: Same chart shows a green dashed line for estimated 1RM overlaid on the weight line. A legend below the chart labels "Max Weight" and "Est. 1RM".
result: issue
reported: "Same Error: Invalid time value as test 4"
severity: blocker

### 6. Progress Chart - Volume Line
expected: A blue line on the chart shows total volume (weight x reps) with its own scale on the right Y-axis.
result: issue
reported: "Same Error: Invalid time value as test 4"
severity: blocker

### 7. Progress Chart - Empty State
expected: Selecting an exercise with no logged workouts shows "No data yet. Log workouts to see your [exercise] progress." instead of the chart.
result: pass

### 8. Week Comparison Card
expected: Below the chart, a "This Week vs Last Week" section shows a card with max weight and volume for the selected exercise, with green/red percentage changes.
result: issue
reported: "Error: Invalid time value shown instead of week comparison card"
severity: blocker

### 9. PR List Section
expected: Below the comparison, an "All-Time PRs" section shows the PR records for the selected exercise.
result: pass

### 10. Switching Exercises
expected: Changing the exercise in the dropdown updates the progress chart, week comparison, and PR list to show data for the newly selected exercise.
result: pass

### 11. Chart Tooltip
expected: Hovering or tapping a data point on the progress chart shows a dark tooltip with the date, max weight in kg, and estimated 1RM in kg.
result: skipped
reason: Charts broken due to date parsing error, can't test tooltips

## Summary

total: 11
passed: 6
issues: 4
pending: 0
skipped: 1

## Gaps

- truth: "Progress chart shows line chart with weight data over time"
  status: failed
  reason: "User reported: Error: Invalid time value. DuckDB returns date/week_start as numeric (e.g. 1769731200000), useAnalytics.ts calls Date.toISOString() which throws RangeError. Affects useExerciseProgress and useWeeklyComparison hooks."
  severity: blocker
  test: 4
  root_cause: "useAnalytics.ts lines 49-52 and 113-116 multiply DuckDB DATE values by 86400000 assuming epoch-day integers, but DuckDB-WASM returns DATE as millisecond-epoch integers. The multiplication produces values ~1.5e+23 which exceed JS Date max (~8.64e+15), causing Invalid Date."
  artifacts:
    - path: "src/hooks/useAnalytics.ts"
      issue: "Lines 49-52: * 86400000 on already-millisecond date values in useExerciseProgress"
    - path: "src/hooks/useAnalytics.ts"
      issue: "Lines 113-116: * 86400000 on already-millisecond week_start values in useWeeklyComparison"
  missing:
    - "Remove * 86400000 multiplication in both number and bigint branches of useExerciseProgress"
    - "Remove * 86400000 multiplication in both number and bigint branches of useWeeklyComparison"
    - "Update comment on line 46 — DuckDB-WASM DATE returns ms, not epoch-day"
  debug_session: ".planning/debug/invalid-time-value-analytics.md"

- truth: "Week comparison card shows this week vs last week with percentage changes"
  status: failed
  reason: "User reported: Same Invalid time value error in useWeeklyComparison hook. week_start value 1769385600000 fails Date.toISOString()."
  severity: blocker
  test: 8
  root_cause: "Same as gap 1 — useAnalytics.ts line 113-116 multiplies already-millisecond week_start by 86400000."
  artifacts:
    - path: "src/hooks/useAnalytics.ts"
      issue: "Lines 113-116: incorrect * 86400000 multiplication"
  missing:
    - "Fix covered by gap 1 fix"
  debug_session: ".planning/debug/invalid-time-value-analytics.md"

- truth: "OPFS database persists data between sessions"
  status: failed
  reason: "User reported: opfs://gymlog.db exists but is not a valid DuckDB database file, falls back to in-memory mode. Data not persisting."
  severity: blocker
  test: 4
  root_cause: "Three compounding issues: (1) Missing accessMode: READ_WRITE in db.open() call at duckdb-init.ts:33 — OPFS file created but never properly initialized. (2) DuckDB-WASM 1.32.0 has known OPFS bug (GitHub #1947) where existing invalid OPFS files cause open failures. (3) No CHECKPOINT calls anywhere in codebase — writes stay in WAL, never flushed to .db file. (4) No OPFS cleanup on corruption — corrupted file persists forever, blocking all future OPFS attempts."
  artifacts:
    - path: "src/db/duckdb-init.ts"
      issue: "Line 33: db.open() missing accessMode: READ_WRITE"
    - path: "src/db/duckdb-init.ts"
      issue: "Lines 49-66: No OPFS cleanup on corruption, no retry"
    - path: "package.json"
      issue: "Pins duckdb-wasm 1.32.0 which has OPFS bug #1947"
  missing:
    - "Add accessMode: DuckDBAccessMode.READ_WRITE to db.open()"
    - "Add CHECKPOINT calls after write operations"
    - "Add OPFS file cleanup logic when corruption detected (delete gymlog.db and gymlog.db.wal, retry)"
    - "Evaluate upgrading duckdb-wasm past 1.32.0 for OPFS fixes"
  debug_session: ".planning/debug/opfs-db-corruption.md"
