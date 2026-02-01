# Phase 20: UX Restructure - Research

**Researched:** 2026-02-01
**Domain:** React collapsible sections, layout restructuring, CSS animations
**Confidence:** HIGH

## Summary

This phase restructures two existing tabs (Workouts and Settings) by wrapping sections in collapsible containers and reordering content. The codebase already has all the tools needed: framer-motion 12.x for smooth height animations, a `CollapsibleSection` component in analytics (using native `<details>`), and Tailwind v4 for styling. The existing `<details>` pattern in `StartWorkout.tsx` already demonstrates inline accordion behavior.

The primary challenge is choosing between native `<details>/<summary>` (zero-JS, accessible by default, but no smooth height animation) and a React state + framer-motion approach (smooth ~200ms slide animation as specified in CONTEXT.md). Given the explicit requirement for "smooth slide animation (~200ms)" and "chevron rotates smoothly in sync with content animation," the framer-motion approach is the correct choice. The existing `LazyMotion` provider in `App.tsx` already wraps all content, so `m.div` with `AnimatePresence` is available everywhere.

The settings reorder is straightforward: `BackupSettings.tsx` currently renders sections in a flat `space-y-8` div. Reordering means moving `RotationSection` to top (already there), extracting Default Gym into its own visible section, placing `ToonExportSection` third, then wrapping remaining sections (Workout Preferences, Data Backup, Restore, Demo Data, Observability, Data Quality) in collapsible wrappers.

**Primary recommendation:** Create a shared `CollapsibleSection` component in `src/components/ui/` using framer-motion for animated height transitions, then wrap Exercises and Gyms on Workouts tab and lower settings sections on Settings tab.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.29.2 | Animated height transitions, chevron rotation | Already in bundle, LazyMotion provider exists in App.tsx |
| React | ^19.2.0 | State management for open/closed | Already in use |
| Tailwind CSS | ^4.1.18 | Styling collapsible headers, spacing | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | (existing) | NOT needed for collapse state | State does not persist per CONTEXT.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion height animation | Native `<details>` element | No smooth animation; `<details>` toggle is instant. Decision locked: smooth slide required. |
| framer-motion height animation | CSS `grid-template-rows` transition | Works in modern browsers but harder to coordinate with chevron rotation timing. framer-motion already loaded. |
| Local React state | Zustand store for open/closed | Over-engineering; CONTEXT says state does not persist across sessions. useState is correct. |

**Installation:**
```bash
# No new dependencies needed - everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── ui/
│   │   └── CollapsibleSection.tsx    # NEW: shared animated collapsible
│   ├── ExerciseList.tsx              # MODIFY: accept collapsed wrapper or be wrapped in App.tsx
│   ├── GymList.tsx                   # MODIFY: same as ExerciseList
│   ├── backup/
│   │   └── BackupSettings.tsx        # MODIFY: reorder sections, wrap lower ones
│   └── settings/
│       └── RotationSection.tsx       # MODIFY: extract Default Gym & Create Rotation positioning
├── App.tsx                           # MODIFY: wrap ExerciseList/GymList in CollapsibleSection
```

### Pattern 1: Animated CollapsibleSection Component
**What:** A reusable component that wraps content in a smooth expand/collapse animation with a tappable header showing title, count badge, and rotating chevron.
**When to use:** Any section that needs collapse/expand behavior.
**Approach:**

The component uses React `useState` for open/closed state and framer-motion `m.div` with `animate` for height transition. The key technique is animating from `height: 0; overflow: hidden` to `height: "auto"` using framer-motion's built-in auto-height support.

```typescript
// src/components/ui/CollapsibleSection.tsx
import { useState, type ReactNode } from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReducedMotion ? 0 : 0.2;

  return (
    <section>
      {/* Tappable header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-bg-secondary hover:bg-bg-tertiary transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-text-primary">{title}</span>
          {count !== undefined && (
            <span className="text-sm text-text-muted">({count})</span>
          )}
        </span>
        <m.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration }}
          className="text-text-muted text-sm"
        >
          &#9654;
        </m.span>
      </button>

      {/* Animated content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-4">
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
```

### Pattern 2: Workouts Tab Layout with Conditional Ordering
**What:** The Workouts tab renders differently based on whether a workout is active.
**When to use:** In `App.tsx` `renderWorkoutsContent()`.
**Key logic:**
- Active workout: ActiveWorkout component (already handles this case, no change needed)
- No active workout: Quick Start at top, then collapsible Exercises and Gyms below

```typescript
// In App.tsx renderWorkoutsContent() - no active workout branch
return (
  <div className="space-y-4">
    {/* Quick Start - always prominent at top */}
    <StartWorkout plans={plans} gyms={gyms} onStarted={() => {}} />

    {/* Collapsible sections below with spacing */}
    <div className="space-y-3 pt-2">
      <CollapsibleSection title="Exercises" count={exercises.length}>
        <ExerciseList ... />
      </CollapsibleSection>

      <CollapsibleSection title="Gyms" count={gyms.length}>
        <GymList ... />
      </CollapsibleSection>
    </div>
  </div>
);
```

### Pattern 3: Settings Tab Reorder with Mixed Visibility
**What:** Settings tab has top sections always visible, bottom sections collapsible.
**When to use:** In `BackupSettings.tsx`.
**Key changes:**
1. Rotations (with Create Rotation inside) - always visible
2. Default Gym - always visible (extract from RotationSection into its own visible block)
3. TOON Export - always visible
4. Everything below collapsible (collapsed by default)

### Anti-Patterns to Avoid
- **Persisting collapse state in localStorage:** CONTEXT explicitly says "state does not persist across sessions." Use plain `useState(false)`.
- **Accordion behavior (only one open at a time):** CONTEXT says "multiple sections can be expanded simultaneously."
- **Using native `<details>` for animated sections:** The `<details>` element does not support smooth height animation natively. The existing `CollapsibleSection` in analytics uses `<details>` but has no animation. Phase 20 requires smooth slide.
- **Moving ExerciseList/GymList into separate route or lazy component:** These are small components that should remain eagerly loaded.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Height animation | CSS max-height hack | framer-motion `animate={{ height: 'auto' }}` | max-height requires guessing a value; framer-motion measures real content height |
| Reduced motion | Custom media query hook | `window.matchMedia('(prefers-reduced-motion: reduce)')` inline check | Already used this pattern in App.tsx line 167 |
| Chevron rotation | CSS keyframes | framer-motion `animate={{ rotate: 90 }}` | Syncs with content animation timing automatically |
| Accessible expand/collapse | Custom ARIA | `aria-expanded` on button + `role` attributes | Native button with aria-expanded is the standard pattern |

**Key insight:** framer-motion's `animate={{ height: 'auto' }}` with `AnimatePresence` is the standard React pattern for collapsible content. It handles measuring content height automatically, which CSS-only solutions cannot do cleanly.

## Common Pitfalls

### Pitfall 1: Height Animation Flash on Mount
**What goes wrong:** When `AnimatePresence` mounts with `initial={false}`, the content can flash briefly at full height before collapsing.
**Why it happens:** The content needs to be measured before it can be hidden.
**How to avoid:** Set `initial={{ height: 0, opacity: 0 }}` on the motion div and use `AnimatePresence initial={false}` to skip the entry animation on first render (since sections start collapsed).
**Warning signs:** Content briefly visible then snaps closed on page load.

### Pitfall 2: Overflow Clipping During Animation
**What goes wrong:** Content like dropdown menus or form modals inside a collapsible section get clipped by `overflow: hidden`.
**Why it happens:** The animated container needs `overflow: hidden` during height transition.
**How to avoid:** Forms/modals triggered from within collapsible sections (ExerciseForm, GymForm) already render as portals or absolute-positioned overlays. Verify that the ExerciseForm and GymForm modal dialogs are not affected by the overflow clipping. The current ExerciseForm renders inline within the section, so it may need attention.
**Warning signs:** Form fields cut off at the bottom of the collapsible section.

### Pitfall 3: E2E Tests Break Due to Hidden Content
**What goes wrong:** E2E tests that click "+ Add" in the Exercises or Gyms sections fail because the sections are collapsed by default.
**Why it happens:** Playwright cannot interact with elements inside collapsed (height: 0) sections.
**How to avoid:** Update E2E test helpers (`seed.ts`) and test specs (`workout-rotation.spec.ts`) to first expand the relevant section before interacting with its content. Add a click on the section header before clicking "+ Add".
**Warning signs:** Playwright timeout errors on selectors that previously worked.

### Pitfall 4: Existing CollapsibleSection Conflict
**What goes wrong:** Confusion between the existing `analytics/CollapsibleSection.tsx` (using `<details>`) and the new `ui/CollapsibleSection.tsx` (using framer-motion).
**Why it happens:** Same component name in different directories.
**How to avoid:** Either (a) rename the analytics one to `AnalyticsCollapsible` or `DetailsSummary`, or (b) replace it with the new animated version if analytics sections should also animate, or (c) keep both but use clear import paths. Recommended: keep both, they serve different purposes. The analytics one is intentionally zero-JS.
**Warning signs:** Wrong import selected by auto-import.

### Pitfall 5: Settings Tab Default Gym Extraction
**What goes wrong:** Default Gym selector is currently embedded inside `RotationSection.tsx`. Moving it to be a standalone visible section requires extracting it without breaking the rotation setup flow.
**Why it happens:** `RotationSection` currently manages Default Gym as part of its own state.
**How to avoid:** The Default Gym selector reads from `useRotationStore` directly. Extract it into a standalone `DefaultGymSection` component or inline it in `BackupSettings.tsx`. The store API (`setDefaultGym`) is already a standalone action.
**Warning signs:** Default gym selection stops working after extraction.

### Pitfall 6: Section Header Styling Must Accommodate Internal "+ Add" Buttons
**What goes wrong:** The ExerciseList and GymList currently have their own headers with "+ Add" buttons. Wrapping them in CollapsibleSection creates duplicate headers.
**Why it happens:** Each list component renders its own `<h2>` and action button.
**How to avoid:** Two approaches: (a) Remove the internal header from ExerciseList/GymList and let CollapsibleSection provide the header, passing an `onAdd` callback for the "+ Add" button. (b) Keep internal headers but hide the section title in the CollapsibleSection. Approach (a) is cleaner. The CollapsibleSection header could include an optional action slot for the "+ Add" button.
**Warning signs:** Double headers, or the "+ Add" button disappears when section is collapsed.

## Code Examples

### Animated Height with framer-motion (Verified Pattern)
```typescript
// Source: framer-motion docs - AnimatePresence with height animation
// Already used in App.tsx for page transitions
import { m, AnimatePresence } from 'framer-motion';

// Height auto animation - framer-motion measures content automatically
<AnimatePresence initial={false}>
  {isOpen && (
    <m.div
      key="content"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </m.div>
  )}
</AnimatePresence>
```

### Chevron Rotation Synced with Content
```typescript
// Source: framer-motion animate prop
<m.span
  animate={{ rotate: isOpen ? 90 : 0 }}
  transition={{ duration: 0.2, ease: 'easeInOut' }}
  className="text-text-muted text-sm inline-block"
>
  &#9654;  {/* Right-pointing triangle */}
</m.span>
```

### Collapsible Header with Count Badge and Card Styling
```typescript
// Matches CONTEXT.md decisions:
// - Card-style section headers with subtle background
// - Count shown as plain parenthetical in muted text
// - Clear tappable area
<button
  type="button"
  onClick={() => setIsOpen(!isOpen)}
  className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-bg-secondary hover:bg-bg-tertiary transition-colors"
  aria-expanded={isOpen}
>
  <span className="flex items-center gap-2">
    <span className="text-base font-semibold text-text-primary">{title}</span>
    {count !== undefined && (
      <span className="text-sm text-text-muted">({count})</span>
    )}
  </span>
  {/* Animated chevron */}
  <ChevronIcon isOpen={isOpen} />
</button>
```

### Prefers-Reduced-Motion (Existing Pattern in Codebase)
```typescript
// Source: App.tsx line 167 - already established pattern
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReducedMotion ? 0 : 0.2;
```

### E2E Helper Update for Expanding Sections
```typescript
// E2E tests must expand sections before interacting with content inside them
// seed.ts - updated createGym helper
export async function createGym(page: Page, name: string, location: string) {
  await page.click(SEL.navWorkouts);
  // Expand Gyms section (collapsed by default in Phase 20)
  const gymsHeader = page.locator('button', { hasText: 'Gyms' });
  await gymsHeader.click();
  // Then click "+ Add" within the now-expanded section
  await page.locator('text="+ Add"').first().click();
  // ... rest of form fill
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native `<details>/<summary>` | framer-motion height animation | Phase 20 requirement | Smooth 200ms slide instead of instant toggle |
| Flat section layout in Workouts | Collapsible sections with Quick Start prominent | Phase 20 | Less clutter, faster access to primary action |
| All Settings sections visible | Top 3 visible, rest collapsible | Phase 20 | Focused settings experience |

**Deprecated/outdated:**
- The existing `analytics/CollapsibleSection.tsx` uses `<details>` with no animation. It remains valid for analytics but should not be used as the pattern for Phase 20 sections.

## Open Questions

1. **ExerciseList/GymList internal headers vs. CollapsibleSection header**
   - What we know: Both components render their own `<h2>` with section title and "+ Add" button
   - What's unclear: Whether to strip internal headers and add action slot to CollapsibleSection, or modify internal headers to be collapse-aware
   - Recommendation: Strip internal `<h2>` header from both components when used in collapsible mode. Add an optional `action` prop to CollapsibleSection for the "+ Add" button. This keeps the CollapsibleSection as the single source of header rendering.

2. **ExerciseForm/GymForm rendering inside collapsed overflow:hidden**
   - What we know: ExerciseForm renders inline (not as a portal/dialog). When the section has `overflow: hidden`, the form may be clipped.
   - What's unclear: Exact rendering behavior - need to verify during implementation
   - Recommendation: If forms get clipped, either (a) remove overflow:hidden after animation completes (set to `visible` in `onAnimationComplete`) or (b) convert forms to use Dialog component which renders as a portal.

3. **RotationSection restructuring scope**
   - What we know: CONTEXT says "Rotations (with Create Rotation button inside) at top, then Default Gym, then TOON Export." Currently RotationSection has Default Gym embedded.
   - What's unclear: Whether to extract Default Gym out of RotationSection or duplicate it
   - Recommendation: Extract Default Gym into BackupSettings.tsx directly (it's just a `<select>` reading from `useRotationStore`). Remove it from RotationSection. This is ~15 lines of JSX to move.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `App.tsx` - existing framer-motion LazyMotion setup, page transitions, prefersReducedMotion pattern
- Codebase inspection: `analytics/CollapsibleSection.tsx` - existing collapsible pattern (native `<details>`)
- Codebase inspection: `StartWorkout.tsx` - existing `<details>` usage for manual select accordion
- Codebase inspection: `BackupSettings.tsx` - current Settings tab layout and section ordering
- Codebase inspection: `RotationSection.tsx` - Default Gym selector embedded within rotation settings
- Codebase inspection: `ExerciseList.tsx`, `GymList.tsx` - current section headers with "+ Add" buttons
- Codebase inspection: `index.css` - theme tokens (bg-secondary, bg-tertiary, text-muted, etc.)
- Codebase inspection: `Card.tsx` - existing card styling pattern (rounded-2xl, shadow-card, gradient)
- Codebase inspection: `seed.ts`, `workout-rotation.spec.ts` - E2E test helpers that locate sections by text content

### Secondary (MEDIUM confidence)
- framer-motion `animate={{ height: 'auto' }}` - well-documented feature, verified by existing usage in codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - patterns derived from existing codebase analysis, clear CONTEXT.md decisions
- Pitfalls: HIGH - identified from concrete code inspection (E2E tests, overflow issues, header duplication)

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable - no external dependency changes expected)
