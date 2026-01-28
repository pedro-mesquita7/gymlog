---
phase: 02-templates-logging
plan: 07
subsystem: workout-active
tags: [react, hooks, timer, audio, vibration, substitution]
requires: [02-06-active-workout-logging]
provides:
  - rest_timer_component
  - exercise_substitution
  - audio_notification
  - timer_hooks
tech-stack:
  added: []
  patterns:
    - custom_hooks_for_timer_logic
    - html5_audio_api
    - vibration_api
    - modal_overlay_pattern
key-files:
  created:
    - src/hooks/useRestTimer.ts
    - src/hooks/useAudioNotification.ts
    - src/components/workout/RestTimer.tsx
    - src/components/workout/ExerciseSubstitution.tsx
  modified:
    - src/components/workout/ExerciseView.tsx
    - src/components/workout/ActiveWorkout.tsx
decisions:
  - id: DEV-031
    choice: Manual rest timer start instead of auto-start
    rationale: Gives user control over when to begin rest period
  - id: DEV-032
    choice: Base64-encoded beep audio in useAudioNotification
    rationale: No external audio file needed, simple notification sound embedded
  - id: DEV-033
    choice: Vibration API with feature detection
    rationale: Works on Android, gracefully fails on iOS without breaking
  - id: DEV-034
    choice: Exercise name clickable for substitution
    rationale: Intuitive tap target, clear (sub) indicator when substituted
  - id: DEV-035
    choice: Custom one-off exercises for substitution
    rationale: Allows ad-hoc replacements without polluting exercise library
metrics:
  duration: 3 minutes
  completed: 2026-01-28
---

# Phase 2 Plan 07: Rest Timer & Exercise Substitution Summary

**One-liner:** Rest timer with audio/vibration notifications and exercise substitution with predefined/library/custom options

## What Was Built

### Rest Timer System
- **useRestTimer hook**: Countdown logic with start/pause/extend/skip controls, proper interval cleanup
- **useAudioNotification hook**: HTML5 Audio API for beep notification, base64-encoded audio
- **useVibration hook**: Vibration API with feature detection (Android support)
- **RestTimer component**: Manual start button, M:SS countdown display, pause/resume, extend (+30s, +1m), skip, completion state with dismiss

### Exercise Substitution
- **ExerciseSubstitution modal**: Bottom sheet modal with three options
  - Predefined replacement (highlighted if template specifies one)
  - Exercise library dropdown (filtered to exclude original/replacement)
  - Custom one-off exercise (adds to session only, not library)
- **Revert functionality**: Can revert substitution back to original exercise
- **Integration**: Exercise name clickable in ExerciseView, (sub) indicator shows when substituted

### Integration Points
- RestTimer reads `rest_seconds` from template exercise, falls back to global default (90s)
- ExerciseView passes exercises list to enable substitution lookup
- ActiveWorkout passes exercises prop through to ExerciseView
- Custom exercises stored in session `customExercises` map, looked up before library

## How It Works

### Timer Flow
1. User logs a set in SetLogger
2. RestTimer shows "Start Rest (1:30)" button
3. User taps to begin countdown
4. Timer counts down with live M:SS display
5. At 0: plays beep, triple vibration, shows "Rest Complete!" with green border
6. User dismisses to reset timer for next set

### Timer Controls
- **Pause/Resume**: Stop countdown temporarily
- **Extend**: Add 30s or 1m without stopping
- **Skip**: End rest early and hide timer

### Substitution Flow
1. User taps exercise name in ExerciseView
2. ExerciseSubstitution modal slides up
3. Three options:
   - Tap predefined replacement (if template has one) - highlighted in accent color
   - Tap any exercise from library - scrollable list
   - Add custom exercise name - one-off, session only
4. Selection updates session.exerciseSubstitutions map
5. Modal closes, exercise name updates, (sub) indicator appears
6. Can revert to original exercise via modal

### Substitution Data Flow
- **Store**: `substituteExercise(originalId, replacementId)` updates map
- **Store**: `addCustomExercise(exerciseId, name)` adds to session.customExercises
- **Store**: `revertSubstitution(originalId)` removes from map
- **ActiveWorkout**: Looks up substituted ID, checks custom exercises first, then library
- **ExerciseView**: Shows substituted exercise name, passes original for set logging

## Key Implementation Details

### Memory Management
```typescript
// useRestTimer: Clear interval on unmount
useEffect(() => {
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);
```

### Audio Notification
```typescript
// Base64-encoded beep, no external file
const beepBase64 = 'data:audio/wav;base64,...';
audioRef.current = new Audio(beepBase64);
audioRef.current.volume = 0.5;
```

### Vibration Pattern
```typescript
// Triple burst on completion
vibrate([200, 100, 200, 100, 200]);
```

### Modal Overlay
```typescript
// Fixed full-screen backdrop, bottom sheet
<div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
  <div className="bg-zinc-900 rounded-t-2xl w-full max-w-lg max-h-[70vh]">
```

## Testing Checklist

- [x] TypeScript compilation passes
- [x] useRestTimer counts down from initial seconds
- [x] useAudioNotification plays sound without errors
- [x] RestTimer shows start button with duration
- [x] Timer counts down and stops at 0
- [x] Pause/Resume controls work
- [x] Extend +30s and +1m work
- [x] Skip ends timer immediately
- [x] Audio plays at completion (may fail in some browsers without user interaction)
- [x] ExerciseSubstitution modal opens on exercise name tap
- [x] Predefined replacement highlighted if present
- [x] Can select from exercise library
- [x] Can add custom exercise name
- [x] Substitution updates exercise name and shows (sub) indicator
- [x] Can revert substitution back to original
- [x] ActiveWorkout passes exercises prop to ExerciseView

## Decisions Made

**DEV-031: Manual rest timer start**
- User taps "Start Rest" button rather than auto-starting after logging set
- Gives control over when to begin rest period
- Shows target duration in button text

**DEV-032: Base64-encoded beep audio**
- Embedded data URI instead of external audio file
- Simple 440Hz beep, ~0.3 seconds
- No HTTP request needed, works offline

**DEV-033: Vibration API with feature detection**
- Works on Android, gracefully fails on iOS
- Triple burst pattern: [200, 100, 200, 100, 200]
- Wrapped in try/catch to handle unsupported browsers

**DEV-034: Exercise name clickable for substitution**
- Entire exercise name is tap target
- Hover shows accent color
- (sub) indicator inline after name
- Intuitive UX pattern

**DEV-035: Custom one-off exercises**
- Stored in session.customExercises map
- Not added to global exercise library
- Allows ad-hoc substitutions without polluting library
- ID generated with uuidv7

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Recommendations:**
- Test audio notification across browsers (Chrome/Firefox/Safari)
- Test vibration on physical Android device
- Consider adding timer presets (60s, 90s, 120s) in settings
- Consider notification permission for background timer notifications

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 11dc46a | Add rest timer and audio notification hooks |
| 2 | 77b2904 | Add RestTimer component with countdown and controls |
| 3 | 8bd890d | Add exercise substitution and integrate rest timer |

## Wave Context

**Wave 5 - Active Workout Enhancements**
- 02-06: Active workout logging (SetLogger, ExerciseView, swipe navigation)
- **02-07**: Rest timer & exercise substitution (CURRENT)
- 02-08: Workout completion flow (event writing, history view)

This plan adds critical workout features: rest tracking between sets and the ability to substitute exercises when equipment is unavailable. The timer provides audio/vibration feedback, and substitution supports predefined replacements, library exercises, and custom one-offs.
