---
phase: 05-analytics-foundation
plan: 06
subsystem: hooks
tags: [bugfix, date-parsing, duckdb-wasm, analytics]

# Dependency graph
requires:
  - phase: 05-analytics-foundation
    plan: 03
    provides: Analytics hooks (useExerciseProgress, useWeeklyComparison)
provides:
  - Correct date parsing for DuckDB-WASM DATE values in analytics hooks
affects: [charts, week-comparison, analytics-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DuckDB-WASM DATE returns millisecond-epoch integers (not epoch-day)"

key-files:
  modified:
    - src/hooks/useAnalytics.ts
---

## Accomplishments

- Removed incorrect `* 86400000` multiplication from `useExerciseProgress` date parsing (lines 49-52)
- Removed incorrect `* 86400000` multiplication from `useWeeklyComparison` week_start parsing (lines 113-116)
- Updated comments to correctly document DuckDB-WASM DATE behavior (millisecond-epoch, not epoch-day)

## Root Cause

DuckDB-WASM returns DATE columns as millisecond-epoch integers (e.g., `1769731200000` = 2026-01-30). The code multiplied these by `86400000` (ms per day), assuming they were epoch-day counts. This produced values ~1.5e+23, exceeding JS Date maximum (~8.64e+15), causing `RangeError: Invalid time value`.

## UAT Gaps Closed

- Test 4: Progress Chart - Weight Line
- Test 5: Progress Chart - 1RM Trend
- Test 6: Progress Chart - Volume Line
- Test 8: Week Comparison Card
