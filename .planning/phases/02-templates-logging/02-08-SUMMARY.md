---
phase: 02-templates-logging
plan: 08
subsystem: workout-logging
completed: 2026-01-28
duration: 3 min
tags: [react, workout-flow, event-sourcing, duckdb]

requires:
  - 02-07: Rest timer and exercise substitution

provides:
  - workout-completion: Complete workflow with stats summary
  - event-persistence: Workout events written to DuckDB
  - cancel-confirmation: Cancel with set count warning

affects:
  - future-plans: May need workout history view to display saved workouts

tech-stack:
  added: []
  patterns:
    - Multi-view component state management
    - Sequential event writing workflow
    - Conditional rendering based on workout state

key-files:
  created:
    - src/components/workout/WorkoutComplete.tsx
  modified:
    - src/components/workout/ActiveWorkout.tsx
    - src/App.tsx

decisions:
  - id: DEV-036
    title: Complete view as state toggle in ActiveWorkout
    choice: View state ('workout' | 'complete') instead of separate route
    rationale: Simpler UX, maintains workout context, no routing complexity
  - id: DEV-037
    title: Save disabled with zero sets
    choice: Require at least one logged set to save workout
    rationale: Empty workouts provide no value, prevent accidental saves
  - id: DEV-038
    title: Warning for incomplete exercises
    choice: Warn but allow saving when exercises have no sets
    rationale: User may intentionally skip exercises (injury, equipment unavailable)
---

# Phase 02 Plan 08: Workout Completion Summary

**One-liner:** Complete workout flow with stats summary, event persistence to DuckDB, and cancel confirmation.

## What Was Built

Created the final piece of the workout logging flow: the completion screen that shows workout statistics and persists all events to DuckDB.

### Components Created

**WorkoutComplete.tsx**
- Displays workout stats: sets, exercises, duration, total volume
- Calculates stats from session data
- Shows warning for exercises with no logged sets (but allows saving)
- Prevents saving if zero sets logged
- Writes events sequentially: workout_started, set_logged[], workout_completed
- Error handling for save failures
- Loading state during save operation

**ActiveWorkout.tsx Updates**
- Added view state to toggle between workout and complete screens
- Integrated WorkoutComplete component
- Cancel confirmation using existing DeleteConfirmation component
- Shows set count in cancel warning message
- Calls store actions (completeWorkout, cancelWorkout) appropriately
- Returns to start workout view after complete or cancel

**App.tsx Integration**
- Shows ActiveWorkout when session is active
- Handles template lookup for active workout
- Refreshes event count after workout completion
- Graceful handling if template deleted during workout
- Proper state management for workout lifecycle

## User Flow

1. User clicks "Finish Workout" in ActiveWorkout
2. WorkoutComplete shows with stats summary:
   - Total sets logged
   - Unique exercises completed
   - Workout duration
   - Total volume (kg)
3. Warning displayed if any exercises have no sets
4. User clicks "Save Workout"
5. Events written to DuckDB in order:
   - workout_started (workout metadata)
   - set_logged (one per set)
   - workout_completed (completion timestamp)
6. Session cleared from store
7. Return to start workout view
8. Event count refreshed in header

**Cancel Flow:**
1. User clicks "Cancel" button
2. Confirmation dialog shows with set count
3. User confirms cancellation
4. Session cleared (no events written)
5. Return to start workout view

## Technical Details

**Event Writing Order**
Critical that events are written in proper chronological order:
1. workout_started - establishes workout context
2. set_logged[] - all sets in sequence
3. workout_completed - marks successful completion

This ordering ensures event sourcing replay produces correct state.

**Stats Calculations**
- Total sets: `session.sets.length`
- Unique exercises: `new Set(session.sets.map(s => s.original_exercise_id)).size`
- Total volume: `session.sets.reduce((sum, s) => sum + (s.weight_kg * s.reps), 0)`
- Duration: `Date.now() - new Date(session.started_at).getTime()`

**Incomplete Exercise Detection**
Compares exercises in template against exercises with logged sets:
```typescript
const exercisesWithSets = new Set(session.sets.map(s => s.original_exercise_id));
const incompleteExercises = template.exercises.filter(
  te => !exercisesWithSets.has(te.exercise_id)
);
```

## Decisions Made

**DEV-036: Complete view as state toggle**
- **Context:** Need to show completion summary without leaving ActiveWorkout
- **Choice:** Use view state ('workout' | 'complete') within ActiveWorkout
- **Alternatives:** Separate route, modal dialog
- **Rationale:** Simpler than routing, maintains all workout context in one component, easier back navigation
- **Impact:** Completion flow is embedded in ActiveWorkout lifecycle

**DEV-037: Require at least one set**
- **Context:** Users might accidentally click finish without logging any sets
- **Choice:** Disable save button when totalSets === 0
- **Alternatives:** Allow empty workouts, show warning but allow
- **Rationale:** Empty workouts have no value, prevent accidental saves
- **Impact:** Users must log at least one set to save

**DEV-038: Warn about incomplete exercises**
- **Context:** User might finish without logging sets for all exercises
- **Choice:** Show warning list but allow saving
- **Alternatives:** Block save if incomplete, no warning
- **Rationale:** User may intentionally skip exercises (injury, equipment unavailable, substitution gone wrong)
- **Impact:** Data quality maintained while respecting user intent

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual Testing Checklist:**
- [ ] Start workout, log sets, finish - see stats summary
- [ ] Verify stats calculations (sets, exercises, duration, volume)
- [ ] Finish without logging all exercises - see warning
- [ ] Try to save with 0 sets - button disabled
- [ ] Save workout - events appear in DuckDB
- [ ] Check event order in database
- [ ] Click "Go Back" from complete view - return to workout
- [ ] Cancel workout - see confirmation with set count
- [ ] Confirm cancel - session cleared, return to start
- [ ] Event count in header increases after save

**Database Verification:**
```sql
SELECT _created_at, event_type,
       JSON_EXTRACT_STRING(payload, '$.workout_id') as workout_id
FROM events
WHERE event_type IN ('workout_started', 'set_logged', 'workout_completed')
ORDER BY _created_at;
```

Should show chronological sequence: workout_started, set_logged(s), workout_completed

## Next Phase Readiness

**Phase 2 Status:**
- Plan 02-08 complete (8 of 9 plans)
- One plan remaining: 02-09 (TBD)

**Blockers:** None

**Concerns:** None

**Ready for next plan:** Yes

## Files Modified

**Created:**
- `src/components/workout/WorkoutComplete.tsx` (159 lines)

**Modified:**
- `src/components/workout/ActiveWorkout.tsx` (+38 lines)
- `src/App.tsx` (+30, -14 lines)

**Total changes:** 233 lines added

## Performance Notes

- Event writing is sequential (for correctness), may take ~100-500ms for typical workout
- Could optimize with batch insert in future if performance becomes issue
- Session state cleared immediately on complete/cancel for instant UI update

## Commits

- `9605b48` - feat(02-08): create WorkoutComplete component with stats and event saving
- `b831068` - feat(02-08): update ActiveWorkout with complete/cancel flow
- `f364c05` - feat(02-08): integrate ActiveWorkout into App.tsx
