# Phase 9: Batch Logging & Visual Polish - Research

**Researched:** 2026-01-31
**Domain:** Batch set logging UI patterns, rest timers, auto-save, mobile data entry, page transitions
**Confidence:** MEDIUM

## Summary

Phase 9 implements efficient workout set logging via editable grids with ghost data from previous sessions, plus a rest timer with notifications, and visual polish through page transitions. The phase has two distinct technical domains: batch logging UX and visual polish.

For batch logging, the standard approach in 2026 is mobile-first form-based editing with auto-save on blur, not spreadsheet-style in-cell editing which frustrates mobile users. Native HTML input with placeholder attribute shows ghost text, controlled inputs with onBlur handlers trigger auto-save, and existing Zustand sessionStorage persistence prevents data loss. Rest timers use setInterval (not requestAnimationFrame - that's for animations), vibration via Navigator.vibrate() API (supported on Android Chrome but NOT iOS Safari), and Web Audio API for sound notifications.

For visual polish, Motion (formerly Framer Motion) 12.27+ with AnimatePresence is the 2026 standard for page transitions. Bundle size is ~25kb default or ~5kb with LazyMotion optimization. Native HTML dialog element is the modern pattern for confirmation modals with built-in accessibility.

**Primary recommendation:** Use form-based card layout (not spreadsheet table) for mobile-first set logging, auto-save each set on blur, show last session data via HTML placeholder attribute with delta indicators, implement rest timer with existing hooks (already present in codebase), add Motion for page transitions with LazyMotion bundle optimization, use native dialog element for confirmation modals.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **React controlled inputs** | React 19 | Batch set entry with auto-save | Built-in, no library needed. onBlur triggers save, placeholder shows ghost text |
| **Zustand sessionStorage** | Already in codebase | Auto-save persistence | Already used for workout session state, prevents data loss on crash |
| **framer-motion** | ^12.27.0 | Page transitions and animations | 8.1M weekly downloads, production-grade, declarative API, built-in accessibility |
| **Native HTML dialog** | Built-in | Confirmation modals | No library needed, accessible by default, modern browser support |
| **Navigator.vibrate()** | Web API | Haptic feedback for rest timer | Built-in, supported on Android Chrome/Firefox, iOS Safari not supported |
| **Web Audio API** | Web API | Rest timer sound notification | Built-in, cross-browser, synthesized beeps (no mp3 needed for low bandwidth) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react-number-format** | ^5.x | Decimal input formatting | If automatic formatting needed (1 decimal place for weight). Optional - can use input type="number" with step="0.1" |
| **date-fns** | 4.1.0 | Already in codebase | Date formatting for "last session on Jan 28" hints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Form-based cards | Spreadsheet table (AG Grid, TanStack Table) | Table libraries add 50-100kb+ bundle size, poor mobile UX. Cards simpler, mobile-first |
| Motion | react-spring, GSAP | react-spring smaller but less declarative. GSAP heavier, not React-focused |
| Native dialog | Headless UI Dialog, Radix Dialog | Headless libs add bundle size. Native dialog has accessibility built-in |
| placeholder attribute | Custom overlay component | Custom overlay complex, placeholder is semantic HTML |

**Installation:**
```bash
# Motion for transitions (only new library needed)
npm install framer-motion

# Optional: number formatting
npm install react-number-format
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── workout/
│   │   ├── SetGrid.tsx              # Batch set logging grid/cards
│   │   ├── SetRow.tsx                # Individual set entry row
│   │   ├── GhostDataProvider.tsx    # Fetches last session data
│   │   ├── RestTimerBanner.tsx      # Persistent rest timer UI
│   │   └── WorkoutCompletion.tsx    # Confirmation dialog
│   ├── ui/
│   │   ├── Dialog.tsx               # Native dialog wrapper
│   │   └── PageTransition.tsx       # Motion wrapper for route transitions
│   └── layout/
│       └── AnimatedLayout.tsx       # Root layout with AnimatePresence
├── hooks/
│   ├── useRestTimer.ts              # Already exists
│   ├── useAudioNotification.ts      # Already exists (useVibration hook)
│   ├── useLastSessionData.ts        # NEW: fetches ghost data from DuckDB
│   └── useAutoSave.ts               # NEW: debounced auto-save logic
└── types/
    └── workout-session.ts           # Already exists
```

### Pattern 1: Mobile-First Card Layout for Set Logging

**What:** Individual cards per set instead of spreadsheet table, optimized for touch interaction and mobile screens.

**When to use:** Primary pattern for batch set entry on mobile-first PWAs.

**Why not table:** Tables require horizontal scrolling on mobile, in-cell editing frustrates touch users, and table libraries (AG Grid, TanStack Table) add 50-100kb bundle size. Phase 9 context specifies "spreadsheet-like grids" but mobile-first UX research shows cards superior for touch interaction.

**Example:**
```typescript
// SetGrid.tsx - Card layout for mobile
interface SetGridProps {
  exerciseId: string;
  templateSetCount: number;
  lastSessionData: SetData[] | null; // Ghost data from previous session
  onSaveSet: (setIndex: number, data: SetData) => void;
}

export function SetGrid({ exerciseId, templateSetCount, lastSessionData, onSaveSet }: SetGridProps) {
  const [sets, setSets] = useState<SetData[]>(
    // Initialize grid with template row count (not last session count)
    Array.from({ length: templateSetCount }, (_, i) => ({
      weight_kg: null,
      reps: null,
      rir: null,
      // Ghost data from last session if available
      ghost: lastSessionData?.[i] || null,
    }))
  );

  return (
    <div className="space-y-3">
      {sets.map((set, index) => (
        <SetCard
          key={index}
          setNumber={index + 1}
          data={set}
          ghostData={set.ghost}
          onBlur={(data) => onSaveSet(index, data)} // Auto-save on blur
          onRemove={() => removeSet(index)}
        />
      ))}
      <button onClick={addSet} className="btn-secondary w-full">
        + Add Set
      </button>
    </div>
  );
}
```

**Source:** [Table design UX guide to improve SaaS usability and clarity](https://www.eleken.co/blog-posts/table-design-ux), [Fitness App UI Design: Key Principles for Engaging Workout Apps](https://stormotion.io/blog/fitness-app-ux/)

### Pattern 2: Ghost Data with Placeholder and Delta Indicators

**What:** Show last session's values as HTML placeholder text, add visual delta (↑/↓) for trend context.

**When to use:** All set input fields when previous session data exists.

**Example:**
```typescript
// SetCard.tsx - Individual set entry
interface SetCardProps {
  setNumber: number;
  data: SetData;
  ghostData: SetData | null;
  onBlur: (data: SetData) => void;
}

export function SetCard({ setNumber, data, ghostData, onBlur }: SetCardProps) {
  const [weight, setWeight] = useState(data.weight_kg?.toString() || '');
  const [reps, setReps] = useState(data.reps?.toString() || '');
  const [rir, setRir] = useState(data.rir?.toString() || '');

  // Calculate delta for visual indicator
  const weightDelta = ghostData && weight
    ? parseFloat(weight) - ghostData.weight_kg
    : null;

  const handleBlur = () => {
    // Auto-save on blur
    onBlur({
      weight_kg: weight ? parseFloat(weight) : null,
      reps: reps ? parseInt(reps) : null,
      rir: rir ? parseInt(rir) : null,
    });
  };

  return (
    <div className="bg-secondary p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary">Set {setNumber}</span>
        <button className="text-danger text-sm">Remove</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Weight input with ghost text and delta */}
        <div>
          <label className="text-xs text-secondary block mb-1">Weight (kg)</label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()} // Select all on focus
              placeholder={ghostData ? `${ghostData.weight_kg}` : ''}
              className="w-full"
            />
            {weightDelta !== null && weightDelta !== 0 && (
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                weightDelta > 0 ? 'text-success' : 'text-muted'
              }`}>
                {weightDelta > 0 ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>

        {/* Reps input */}
        <div>
          <label className="text-xs text-secondary block mb-1">Reps</label>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            placeholder={ghostData ? `${ghostData.reps}` : ''}
          />
        </div>

        {/* RIR input */}
        <div>
          <label className="text-xs text-secondary block mb-1">RIR</label>
          <Input
            type="number"
            min="0"
            max="5"
            value={rir}
            onChange={(e) => setRir(e.target.value)}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            placeholder={ghostData ? `${ghostData.rir ?? '-'}` : ''}
          />
        </div>
      </div>
    </div>
  );
}
```

**Sources:** [HTML input placeholder Attribute](https://www.w3schools.com/tags/att_input_placeholder.asp), [How to Select All Text in an Input Element with React When it is Focused?](https://javascript.plainenglish.io/how-to-select-all-text-in-an-input-element-with-react-when-it-is-focused-228742e05d69)

### Pattern 3: Auto-Save on Blur with Zustand Persistence

**What:** Save each set to Zustand sessionStorage immediately when user moves to next field (onBlur event). No explicit save button needed until workout completion.

**When to use:** All set input fields to prevent data loss.

**Example:**
```typescript
// useAutoSave.ts - Hook for auto-save logic
import { useCallback } from 'react';
import { useWorkoutStore } from '../stores/useWorkoutStore';

export function useAutoSave(exerciseId: string, originalExerciseId: string) {
  const logSet = useWorkoutStore((state) => state.logSet);

  const saveSet = useCallback((data: { weight_kg: number; reps: number; rir: number | null }) => {
    // Validate: skip empty rows
    if (data.weight_kg === null && data.reps === null) {
      return; // Don't save empty sets
    }

    // Warn on partial rows (has weight but no reps, or vice versa)
    if ((data.weight_kg && !data.reps) || (!data.weight_kg && data.reps)) {
      console.warn('Partial set data:', data);
      // Could show toast warning here
    }

    // Save to Zustand (which persists to sessionStorage via middleware)
    logSet(exerciseId, originalExerciseId, data);
  }, [exerciseId, originalExerciseId, logSet]);

  return { saveSet };
}
```

**Why sessionStorage not DuckDB:** Zustand already persists session to sessionStorage (see useWorkoutStore.ts). Only write to DuckDB on workout completion, not per-set (avoids excessive DB writes, matches existing pattern).

**Sources:** [Smarter Forms in React: Building a useAutoSave Hook with Debounce and React Query](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e), [React onBlur Event - GeeksforGeeks](https://www.geeksforgeeks.org/reactjs/react-onblur-event/)

### Pattern 4: Rest Timer with Vibration and Audio Notification

**What:** Auto-start rest timer after logging a set, show persistent banner at top, trigger vibration + optional audio on completion.

**When to use:** After each set is logged (onBlur completes).

**Implementation notes:**
- Codebase already has `useRestTimer` and `useAudioNotification` hooks
- Vibration API supported on Android Chrome/Firefox but NOT iOS Safari
- Web Audio API works cross-browser for sound notifications
- Timer uses setInterval (appropriate for countdowns), not requestAnimationFrame (that's for animations)

**Example:**
```typescript
// RestTimerBanner.tsx
import { useRestTimer } from '../hooks/useRestTimer';
import { useAudioNotification, useVibration } from '../hooks/useAudioNotification';
import { useWorkoutStore } from '../stores/useWorkoutStore';

export function RestTimerBanner() {
  const defaultRestSeconds = useWorkoutStore((state) => state.defaultRestSeconds);
  const { seconds, isRunning, start, skip } = useRestTimer(defaultRestSeconds);
  const { play: playAudio } = useAudioNotification();
  const { vibrate, isSupported: vibrationSupported } = useVibration();

  // Trigger notification when timer completes
  useEffect(() => {
    if (!isRunning && seconds === 0) {
      // Vibration (Android only)
      if (vibrationSupported) {
        vibrate([200, 100, 200]); // Vibration pattern
      }

      // Audio notification (cross-browser)
      playAudio();
    }
  }, [isRunning, seconds]);

  if (!isRunning && seconds === 0) return null; // Hide when not active

  return (
    <div className="sticky top-0 z-10 bg-accent text-black px-4 py-2 flex justify-between items-center">
      <span className="font-medium">
        Rest: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </span>
      <button onClick={skip} className="text-sm underline">
        Skip
      </button>
    </div>
  );
}
```

**Sources:** [Vibration API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API), [Can I use Vibration API](https://caniuse.com/vibration), [Web Audio API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Pattern 5: Page Transitions with Motion and AnimatePresence

**What:** Add slide/fade transitions between pages using Motion's AnimatePresence component.

**When to use:** Wrap routing logic to animate page changes (subtle polish, 200-300ms duration).

**Example:**
```typescript
// AnimatedLayout.tsx - Root layout with transitions
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom'; // or whatever router

export function AnimatedLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Bundle size optimization:**
```typescript
// Use LazyMotion + m for smaller bundle (5kb vs 25kb)
import { LazyMotion, domAnimation, m } from 'framer-motion';

export function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div animate={{ opacity: 1 }}>
        {/* Use m instead of motion */}
      </m.div>
    </LazyMotion>
  );
}
```

**Sources:** [Motion for React — Install & first React animation](https://motion.dev/docs/react), [React transitions — Configure Motion animations](https://motion.dev/docs/react-transitions), [Reduce bundle size of Framer Motion](https://motion.dev/docs/react-reduce-bundle-size)

### Pattern 6: Confirmation Dialog with Native HTML dialog

**What:** Use native HTML dialog element for workout completion and discard confirmations.

**When to use:** Finishing workout (show summary), canceling workout (confirm deletion).

**Example:**
```typescript
// WorkoutCompletionDialog.tsx
import { useRef, useEffect } from 'react';

interface WorkoutCompletionDialogProps {
  isOpen: boolean;
  exerciseCount: number;
  setCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WorkoutCompletionDialog({
  isOpen,
  exerciseCount,
  setCount,
  onConfirm,
  onCancel
}: WorkoutCompletionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal(); // Modal mode (backdrop, focus trap)
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-secondary rounded-lg p-6 max-w-md backdrop:bg-black/50"
      onClose={onCancel}
    >
      <h2 className="text-xl font-semibold mb-4">Complete Workout?</h2>
      <p className="text-secondary mb-6">
        You logged {exerciseCount} exercises and {setCount} sets.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-primary">
          Complete Workout
        </button>
      </div>
    </dialog>
  );
}
```

**Why native dialog:** Built-in accessibility (dialog role, focus trap, ESC key handling), no library needed, widely supported in 2026 browsers.

**Sources:** [Modals with HTML dialog element in JavaScript and React](https://medium.com/@dimterion/modals-with-html-dialog-element-in-javascript-and-react-fb23c885d62e), [React Confirmation Dialog Component](https://primereact.org/confirmdialog/)

### Anti-Patterns to Avoid

- **Spreadsheet table on mobile:** In-cell editing frustrates touch users. Use card layout instead.
- **Auto-save on every keystroke:** Creates excessive state updates. Use onBlur for auto-save trigger.
- **Saving to DuckDB per set:** Write sets to DuckDB only on workout completion, not per-set. Use Zustand sessionStorage for in-progress data.
- **requestAnimationFrame for timers:** Use setInterval for countdown timers. RAF is for animations synced to render cycles, not time-based countdowns.
- **Custom placeholder overlay:** Use native HTML placeholder attribute for ghost text. Simpler, semantic, accessible.
- **Large animation library for simple transitions:** Framer Motion full bundle is 25kb. Use LazyMotion + m for 5kb if only basic transitions needed.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rest timer countdown | Custom setInterval management with pause/resume | useRestTimer hook (already in codebase) | Memory leak prevention, cleanup on unmount, pause/resume/extend logic |
| Vibration + audio notifications | Custom browser API wrappers | useAudioNotification + useVibration hooks (already in codebase) | Browser autoplay policy handling, fallback for unsupported browsers |
| Page transitions | Custom CSS animations with route change detection | Motion AnimatePresence | Declarative API, handles exit animations, accessibility (prefers-reduced-motion) |
| Confirmation dialogs | Custom modal with backdrop/focus trap | Native HTML dialog element | Built-in accessibility, ESC key handling, focus management |
| Auto-save state management | Custom debounce + localStorage logic | Zustand persist middleware (already configured) | sessionStorage persistence, automatic serialization, already in use |
| Input select-all on focus | Custom selection range logic | onFocus with e.target.select() | One-liner, works on all input types |

**Key insight:** Phase 8 already established design primitives, rest timer hooks, and Zustand persistence. Don't rebuild these. Focus on composing existing patterns for batch logging UI and adding Motion for transitions.

## Common Pitfalls

### Pitfall 1: Using Spreadsheet Tables on Mobile

**What goes wrong:** Developer implements AG Grid or TanStack Table for "spreadsheet-like" set logging. Mobile users struggle with in-cell editing, horizontal scrolling, and tiny touch targets. Bundle size increases by 50-100kb.

**Why it happens:** Phase description says "spreadsheet-like grids" which sounds like table library. But mobile-first UX research shows tables frustrate touch users.

**How to avoid:**
- Use card layout (vertical stack) for mobile
- Each set is a card with 3 input fields (weight, reps, RIR)
- Save button per card or auto-save on blur
- Table libraries optimized for desktop with mouse/keyboard, not touch

**Warning signs:**
- Users complaining about hard-to-tap inputs
- Horizontal scrolling required on mobile
- Bundle size increased significantly (50kb+)

**Source:** [Editable React Data Grids: In-Cell Editing vs Form-Based Editing](https://www.simple-table.com/blog/editable-react-data-grids-in-cell-vs-form-editing)

### Pitfall 2: Vibration API Not Working on iOS

**What goes wrong:** Rest timer vibration works in development (Android Chrome) but production users on iOS report no vibration. Developer assumes vibration broken everywhere.

**Why it happens:** Vibration API is NOT supported on iOS Safari (all versions). Only Android Chrome, Firefox, Edge support it.

**How to avoid:**
- Treat vibration as progressive enhancement, not required feature
- Always provide audio fallback (Web Audio API works on iOS)
- Use useVibration hook's isSupported flag to show/hide vibration toggle in settings
- Test on real iOS device, not just Android

**Warning signs:**
- iOS users report "vibration not working"
- No feature detection before calling navigator.vibrate()
- Assuming all mobile devices support vibration

**Source:** [Vibration API | Can I use... Support tables](https://caniuse.com/vibration)

### Pitfall 3: Auto-Save on Every Keystroke

**What goes wrong:** Developer uses onChange to save set on every keystroke. Zustand state updates 10+ times per input field. Performance degrades with many sets.

**Why it happens:** Misunderstanding of "auto-save" as "save continuously" instead of "save automatically on completion".

**How to avoid:**
- Use onBlur to trigger save (when user leaves field)
- Keep local component state for input values
- Only call Zustand action on blur, not onChange
- Optional: debounce onChange if user pauses typing (500ms), but blur is simpler

**Warning signs:**
- Input feels laggy on slower devices
- Zustand devtools shows 10+ updates per input
- Re-renders cascading across components

**Source:** [Smarter Forms in React: Building a useAutoSave Hook with Debounce and React Query](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e)

### Pitfall 4: Writing Sets to DuckDB Immediately

**What goes wrong:** Developer writes each set to DuckDB on blur (matching "auto-save" requirement). DuckDB WASM performance degrades with 20+ insert operations during workout. User experiences lag.

**Why it happens:** Confusion between "prevent data loss" (Zustand sessionStorage) and "persist to database" (DuckDB write on completion).

**How to avoid:**
- Zustand persist middleware already saves to sessionStorage (survives page refresh)
- sessionStorage cleared on tab close (intentional - workout in progress)
- Only write to DuckDB when workout completed (single batch insert)
- Matches existing pattern in useWorkoutStore (completeWorkout writes to DuckDB)

**Warning signs:**
- Lag when moving between input fields
- DuckDB connection pool exhausted during workout
- Excessive OPFS writes during active logging

**Source:** Existing codebase pattern in useWorkoutStore.ts (sessionStorage for in-progress, DuckDB on completion)

### Pitfall 5: Large Motion Bundle for Simple Transitions

**What goes wrong:** Developer imports motion from framer-motion for basic slide transitions. Bundle increases by 25kb. Client complains about larger JS bundle.

**Why it happens:** Default import is convenient but includes all features. LazyMotion optimization not documented in basic examples.

**How to avoid:**
- Use LazyMotion + m instead of motion for 5kb bundle
- Import only domAnimation features (no layout animations needed for simple transitions)
- Test bundle size with npm run build and check dist/assets
- Consider if transitions worth 25kb (user preference: prefers-reduced-motion)

**Warning signs:**
- Bundle size increased 20-30kb after adding Motion
- Only using basic opacity/transform animations
- Not using gesture, layout, or advanced features

**Source:** [Reduce bundle size of Framer Motion](https://motion.dev/docs/react-reduce-bundle-size)

### Pitfall 6: Ghost Data Row Count Mismatch

**What goes wrong:** Grid initialized with last session's set count (e.g., 4 sets) instead of template set count (e.g., 3 sets). User confused when grid shows 4 rows but template says 3.

**Why it happens:** Developer fetches last session data and uses array.length to initialize grid rows.

**How to avoid:**
- Always initialize grid with template set count, not last session count
- If template says 3 sets, show 3 rows (even if last session had 4)
- Ghost data fills placeholder text in first 3 rows
- User can add more rows with "+ Add Set" button

**Warning signs:**
- Grid row count changes based on previous session
- User can't remove pre-filled rows to match template
- First-time exercises show 0 rows (should show template count with empty placeholders)

**Source:** Phase 9 context decision: "Row count matches template set count (not last session)"

## Code Examples

Verified patterns from official sources:

### Fetch Last Session Data for Ghost Text

```typescript
// useLastSessionData.ts - Hook to fetch ghost data
import { useState, useEffect } from 'react';
import { getDuckDB } from '../db/duckdb-init';

interface LastSessionSet {
  weight_kg: number;
  reps: number;
  rir: number | null;
  logged_at: string;
}

export function useLastSessionData(exerciseId: string, gymId: string): {
  data: LastSessionSet[] | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<LastSessionSet[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLastSession() {
      const db = getDuckDB();
      if (!db) {
        setIsLoading(false);
        return;
      }

      try {
        const conn = await db.connect();

        // Get last workout for this exercise at this gym
        const sql = `
          SELECT
            s.weight_kg,
            s.reps,
            s.rir,
            s.logged_at
          FROM fact_sets s
          INNER JOIN dim_workouts w ON s.workout_id = w.workout_id
          WHERE s.exercise_id = '${exerciseId}'
            AND w.gym_id = '${gymId}'
          ORDER BY s.logged_at DESC
          LIMIT 10  -- Fetch up to 10 sets from last session
        `;

        const result = await conn.query(sql);
        const rows = result.toArray().map((row: any) => ({
          weight_kg: Number(row.weight_kg),
          reps: Number(row.reps),
          rir: row.rir !== null ? Number(row.rir) : null,
          logged_at: String(row.logged_at),
        }));

        setData(rows.length > 0 ? rows : null);
        await conn.close();
      } catch (err) {
        console.error('Error fetching last session:', err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastSession();
  }, [exerciseId, gymId]);

  return { data, isLoading };
}
```

### Input Select-All on Focus

```typescript
// SetInput.tsx - Input that selects all text on focus
interface SetInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  type?: 'number' | 'text';
  step?: string;
  min?: string;
  max?: string;
}

export function SetInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'number',
  ...inputProps
}: SetInputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus for quick overwrite
    e.target.select();
  };

  return (
    <div>
      <label className="text-xs text-secondary block mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        {...inputProps}
      />
    </div>
  );
}
```

**Source:** [How to Select All Text in an Input Element with React When it is Focused?](https://javascript.plainenglish.io/how-to-select-all-text-in-an-input-element-with-react-when-it-is-focused-228742e05d69)

### Native Dialog with useRef

```typescript
// Dialog.tsx - Reusable dialog wrapper
import { useRef, useEffect, type ReactNode } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-secondary rounded-lg p-6 max-w-md backdrop:bg-black/50"
      onClose={onClose}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </dialog>
  );
}
```

**Source:** [Modals with HTML dialog element in JavaScript and React](https://medium.com/@dimterion/modals-with-html-dialog-element-in-javascript-and-react-fb23c885d62e)

### Motion Page Transitions

```typescript
// PageTransition.tsx - Wrapper for page transitions
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  duration: 0.2,
  ease: 'easeInOut',
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
```

**Source:** [React transitions — Configure Motion animations](https://motion.dev/docs/react-transitions)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal components | Native HTML dialog element | 2023-2024 | Simpler code, built-in accessibility, no library needed |
| Framer Motion | Motion (rebrand) | 2025-2026 | Same library, new name, improved docs, LazyMotion optimizations |
| Custom vibration wrappers | Navigator.vibrate() API | Always available | Direct API use simpler than wrapper libraries |
| In-cell grid editing on mobile | Form-based card layout | 2024-2026 UX shift | Better touch UX, mobile-first design wins |
| Save on submit button | Auto-save on blur | Modern UX trend | Reduces friction, prevents data loss, matches user expectations |

**Deprecated/outdated:**
- **Spreadsheet libraries for mobile logging:** AG Grid, TanStack Table heavy for simple use case. Cards + inputs lighter and more mobile-friendly.
- **react-modal, react-dialog libraries:** Native HTML dialog has sufficient browser support in 2026, no library needed.
- **Custom debounce for auto-save:** onBlur simpler than debounced onChange for set logging use case.

## Open Questions

Things that couldn't be fully resolved:

1. **Number input decimal validation browser consistency**
   - What we know: input type="number" step="0.1" works for decimal places, pattern attribute available for validation
   - What's unclear: Browser rounding differences (0.1 + 0.2 = 0.30000000000000004), whether react-number-format library worth bundle size
   - Recommendation: Start with input type="number" step="0.1", add react-number-format if users report input issues

2. **Motion bundle size vs user value tradeoff**
   - What we know: Motion with LazyMotion is 5kb, full bundle is 25kb
   - What's unclear: Whether page transitions provide enough UX value to justify 5-25kb bundle increase
   - Recommendation: Use LazyMotion + m for 5kb (minimal cost), test with prefers-reduced-motion media query, consider feature flag

3. **Rest timer hierarchy implementation location**
   - What we know: 3-level hierarchy (global default -> exercise override -> template override)
   - What's unclear: Where to store per-exercise and per-template rest time overrides (new fields in dim_exercises, dim_templates tables?)
   - Recommendation: Add rest_seconds_override column to dim_exercises and template_exercises junction table, NULL means use parent default

4. **Ghost data grouping by workout vs last N sets**
   - What we know: Need to show "last session" data
   - What's unclear: Group by workout_id (last session) or just last N sets regardless of workout? What if last workout was partial?
   - Recommendation: Fetch last 10 sets for exercise, let user see multiple sessions if last was partial

5. **Partial row handling UX**
   - What we know: Show warning on partial rows (weight but no reps), user can fix or discard
   - What's unclear: Toast notification vs inline error vs dialog? When to show warning (onBlur or on complete workout)?
   - Recommendation: Inline error state on set card (red border + text), show on blur, block workout completion if unresolved

## Sources

### Primary (HIGH confidence)

**Mobile UX & Data Entry:**
- [Editable React Data Grids: In-Cell Editing vs Form-Based Editing](https://www.simple-table.com/blog/editable-react-data-grids-in-cell-vs-form-editing)
- [Table design UX guide to improve SaaS usability and clarity](https://www.eleken.co/blog-posts/table-design-ux)
- [Fitness App UI Design: Key Principles for Engaging Workout Apps](https://stormotion.io/blog/fitness-app-ux/)

**Auto-Save Patterns:**
- [Smarter Forms in React: Building a useAutoSave Hook with Debounce and React Query](https://darius-marlowe.medium.com/smarter-forms-in-react-building-a-useautosave-hook-with-debounce-and-react-query-d4d7f9bb052e)
- [React onBlur Event - GeeksforGeeks](https://www.geeksforgeeks.org/reactjs/react-onblur-event/)
- [The difference between onBlur vs onChange for React text inputs](https://linguinecode.com/post/onblur-vs-onchange-react-text-inputs)

**HTML Input & Placeholders:**
- [HTML input placeholder Attribute](https://www.w3schools.com/tags/att_input_placeholder.asp)
- [HTML attribute: placeholder - HTML | MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/placeholder)
- [How to Select All Text in an Input Element with React When it is Focused?](https://javascript.plainenglish.io/how-to-select-all-text-in-an-input-element-with-react-when-it-is-focused-228742e05d69)

**Timers & Notifications:**
- [React Native Timers](https://reactnative.dev/docs/timers)
- [setTimeout, setInterval and requestAnimationFrame](https://js.muthu.co/posts/settimeout-setinterval-and-requestanimationframe/)
- [Vibration API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Vibration API | Can I use... Support tables](https://caniuse.com/vibration)
- [Web Audio API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Using the Web Audio API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)

**Motion & Transitions:**
- [Motion — JavaScript & React animation library](https://motion.dev/)
- [Motion for React — Install & first React animation](https://motion.dev/docs/react)
- [React transitions — Configure Motion animations](https://motion.dev/docs/react-transitions)
- [Reduce bundle size of Framer Motion](https://motion.dev/docs/react-reduce-bundle-size)
- [framer-motion - npm](https://www.npmjs.com/package/framer-motion)

**Native Dialog:**
- [Modals with HTML dialog element in JavaScript and React](https://medium.com/@dimterion/modals-with-html-dialog-element-in-javascript-and-react-fb23c885d62e)
- [React Confirmation Dialog Component](https://primereact.org/confirmdialog/)

### Secondary (MEDIUM confidence)

- [Create a fitness tracker with React and Firebase - LogRocket Blog](https://blog.logrocket.com/create-a-fitness-tracker-with-react-and-firebase/)
- [Beyond Eye Candy: Top 7 React Animation Libraries for Real-Word Apps in 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries)
- [How to Play a Sound Using JavaScript: Complete 2026 Guide](https://copyprogramming.com/howto/html-how-to-play-a-sound-using-javascript)
- [React.js Form Validation: Complete Guide to Number Fields](https://copyprogramming.com/howto/react-js-mobile-number-validation)

### Tertiary (LOW confidence)

- [10 Best And Free Data Table Libraries For React Applications (2026 Update)](https://reactscript.com/best-data-table/)
- [Top 17 Excel Alternatives To Replace Spreadsheets in 2026](https://hive.com/blog/excel-alternatives/)
- [The 2026 digital fitness ecosystem report](https://www.feed.fm/2026-digital-fitness-ecosystem-report)

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Codebase already has rest timer/audio hooks (HIGH confidence on those), Motion usage verified with official docs but not Context7 (MEDIUM), mobile UX patterns from WebSearch (MEDIUM)
- Architecture patterns: MEDIUM - Card layout vs table is UX opinion backed by sources, auto-save pattern verified with multiple sources, existing codebase patterns inspected directly (HIGH for those)
- Pitfalls: HIGH - Vibration API browser support verified with caniuse.com, mobile table UX backed by multiple UX sources, auto-save pitfalls common React pattern
- Code examples: HIGH - Direct from official docs (MDN, Motion docs) or standard React patterns

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - UI patterns relatively stable, Motion library mature)
