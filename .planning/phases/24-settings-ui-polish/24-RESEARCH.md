# Phase 24: Settings + UI Polish - Research

**Researched:** 2026-02-02
**Domain:** React UI restructuring, mobile-first layout, Tailwind CSS v4, Zustand state management
**Confidence:** HIGH

## Summary

This phase is pure UI restructuring and CSS polish of existing React components. No new libraries are needed. The codebase already has all required tools: Tailwind CSS v4 with OKLCH theme tokens, framer-motion for animations, Zustand for state persistence, and a well-established `CollapsibleSection` component.

The work involves five distinct areas: (1) restructuring BackupSettings.tsx to reorganize settings with a Developer Mode toggle, (2) compacting the SetRow/SetGrid components for mobile density, (3) redesigning RotationSection.tsx with active-rotation-prominent UX, (4) removing redundant inner titles from collapsible section children, and (5) simplifying ToonExportSection to a single "Export Data" button.

**Primary recommendation:** Edit existing components in-place. No new files needed except possibly a small `useSettingsStore` (or add `developerMode` to the existing `useRotationStore` which already persists settings-like state). Keep all changes within Tailwind utility classes and existing component patterns.

## Standard Stack

### Core (already installed, no changes needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use |
| Tailwind CSS | ^4.1.18 | Utility-first styling | Already in use, v4 with `@theme` in index.css |
| framer-motion | ^12.29.2 | Animations (CollapsibleSection) | Already in use for accordions and page transitions |
| Zustand | ^5.0.10 | State management with persistence | Already in use for workout, rotation, backup stores |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/* | ^6.3/^10.0 | Drag-and-drop for rotation editor | Already used in RotationEditor.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New settings store | Add to useRotationStore | Rotation store already holds `defaultGymId`; adding `developerMode` boolean here avoids a new store file |

**Installation:** None needed. All dependencies are already present.

## Architecture Patterns

### Current File Structure (relevant files)
```
src/
├── components/
│   ├── backup/
│   │   └── BackupSettings.tsx      # MAIN TARGET: current settings page container
│   ├── settings/
│   │   ├── RotationSection.tsx     # TARGET: rotation UX redesign
│   │   ├── ToonExportSection.tsx   # TARGET: simplify to single button
│   │   ├── DemoDataSection.tsx     # TARGET: move behind developer toggle
│   │   ├── ObservabilitySection.tsx # TARGET: move behind developer toggle + remove inner h2
│   │   └── DataQualitySection.tsx  # TARGET: move behind developer toggle + remove inner h2
│   ├── ui/
│   │   └── CollapsibleSection.tsx  # TARGET: already has chevron rotation, verify header cleanup
│   ├── workout/
│   │   ├── SetGrid.tsx            # TARGET: compact spacing
│   │   └── SetRow.tsx             # TARGET: compact padding/margins
│   ├── ExerciseList.tsx           # TARGET: remove redundant inner titles
│   └── GymList.tsx                # TARGET: remove redundant inner titles
├── stores/
│   ├── useRotationStore.ts        # TARGET: add developerMode boolean
│   └── useWorkoutStore.ts         # Reference: has weightUnit, soundEnabled, restTimer prefs
└── index.css                       # Theme tokens (no changes needed)
```

### Pattern 1: Developer Mode Toggle via Zustand Persist
**What:** Add a `developerMode: boolean` to the rotation store (which already persists `defaultGymId` and rotation data).
**When to use:** When the Developer Mode toggle state needs to survive page refreshes.
**Example:**
```typescript
// In useRotationStore.ts - add to state interface and implementation
interface RotationState {
  // ... existing fields
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
}

// In persist partialize:
partialize: (state) => ({
  rotations: state.rotations,
  activeRotationId: state.activeRotationId,
  defaultGymId: state.defaultGymId,
  developerMode: state.developerMode,
}),
```

### Pattern 2: Conditional Rendering with Developer Toggle
**What:** The BackupSettings page conditionally renders debug sections based on `developerMode`.
**When to use:** For hiding System Observability, Data Quality, and Demo Data sections.
**Example:**
```typescript
// In BackupSettings.tsx
const developerMode = useRotationStore((state) => state.developerMode);
const setDeveloperMode = useRotationStore((state) => state.setDeveloperMode);

// At bottom of settings:
<div className="flex items-center justify-between">
  <label className="text-sm text-text-secondary">Developer Mode</label>
  <button
    onClick={() => setDeveloperMode(!developerMode)}
    className={`w-12 h-6 rounded-full transition-colors relative ${
      developerMode ? 'bg-accent' : 'bg-bg-tertiary'
    }`}
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
      developerMode ? 'left-7' : 'left-1'
    }`} />
  </button>
</div>

{developerMode && (
  <>
    <CollapsibleSection title="System Observability">...</CollapsibleSection>
    <CollapsibleSection title="Data Quality">...</CollapsibleSection>
    <CollapsibleSection title="Demo Data & Reset">...</CollapsibleSection>
  </>
)}
```

### Pattern 3: Compact SetRow Layout
**What:** Reduce padding and vertical spacing in SetRow to fit more sets on screen.
**When to use:** The SetRow currently uses `p-4 space-y-3` with a separate header row and input grid. This can be compacted.
**Current SetRow structure (96px+ per row):**
```
┌─────────────────────────────┐
│ [1] PR badge        [✕]     │  ← header row (h-8 + p-4 top = ~32px)
│                              │  ← space-y-3 (12px)
│ [Weight] [Reps] [RIR]       │  ← input grid (input p-3 = ~44px)
│                              │  ← p-4 bottom (16px)
└─────────────────────────────┘
```
**Compact target (~64px per row):**
```
┌─────────────────────────────┐
│ 1 [Weight] [Reps] [RIR] [✕] │  ← single row, p-2.5, inline set number
└─────────────────────────────┘
```

### Pattern 4: Inline Confirmation for Active Rotation
**What:** Instead of a modal, show an inline "Set as active?" prompt when clicking a non-active rotation.
**When to use:** Per CONTEXT.md decision: inline confirmation, not modal.
**Example:**
```typescript
const [confirmingId, setConfirmingId] = useState<string | null>(null);

// On click:
{confirmingId === rotation.rotation_id ? (
  <div className="flex items-center gap-2">
    <span className="text-sm text-text-secondary">Set as active?</span>
    <Button size="sm" variant="primary" onClick={() => { setActiveRotation(rotation.rotation_id); setConfirmingId(null); }}>Yes</Button>
    <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>No</Button>
  </div>
) : (
  <button onClick={() => setConfirmingId(rotation.rotation_id)}>...</button>
)}
```

### Anti-Patterns to Avoid
- **Creating new page/route for settings sub-sections:** CONTEXT.md explicitly says "no sub-page navigation" -- everything is inline on the settings page.
- **Using modals for rotation switching:** Decision says inline confirmation only.
- **Adding icons to section headers:** Decision says text-only, clean headers.
- **Progressive reveal for set rows:** All planned sets must be visible at once.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion animation | Custom height animation | Existing `CollapsibleSection` with framer-motion | Already handles height animation, overflow management, reduced-motion |
| Toggle switch | Custom CSS toggle | Copy existing pattern from `BackupSettings.tsx` (soundEnabled toggle) | Already has the exact toggle switch UI at line 149-160 |
| Persisted boolean state | localStorage directly | Zustand persist (add to existing store) | Consistent with rest of app; handles serialization, hydration |
| Drag-and-drop reorder | Custom drag implementation | Existing `RotationEditor` with @dnd-kit | Already works for rotation plan ordering |

**Key insight:** Every UI pattern needed in this phase already exists somewhere in the codebase. The toggle switch, collapsible section, accordion, and inline confirmations all have existing implementations to reference or reuse.

## Common Pitfalls

### Pitfall 1: Redundant Inner Titles in Collapsible Sections
**What goes wrong:** When content components like `ObservabilitySection`, `DataQualitySection`, `DemoDataSection`, `ExerciseList`, and `GymList` are placed inside `CollapsibleSection`, they render their own `<h2>` title, duplicating the section header.
**Why it happens:** These components were originally standalone sections with their own titles. When wrapped in CollapsibleSection, both the wrapper header AND the inner title render.
**How to avoid:** Remove the `<h2>` (and associated wrapper like `<section>`) from each child component when it's rendered inside a CollapsibleSection. Options: (a) add a `hideTitle` prop, or (b) simply remove the inner titles since these components are always used inside CollapsibleSection now.
**Warning signs:** Seeing "System Observability" twice -- once in the collapsible header, once inside the expanded content.
**Current offenders (verified from code):**
- `ObservabilitySection.tsx`: line 48 has `<h2>System Observability</h2>`
- `DataQualitySection.tsx`: line 46 has `<h2>Data Quality</h2>`
- `DemoDataSection.tsx`: line 76 has `<h2>Demo & Data Management</h2>`
- `ExerciseList.tsx`: lines 60-63 have "Library" subtitle + "Exercises" title
- `GymList.tsx`: lines 53-57 have "Locations" subtitle + "Your Gyms" title

### Pitfall 2: Touch Target Sizing on Mobile
**What goes wrong:** Making inputs too small in the compact layout, causing mis-taps on mobile.
**Why it happens:** Over-optimizing for density without testing touch targets.
**How to avoid:** Minimum 44x44px touch targets (Apple HIG recommendation). The compact SetRow should use `py-2.5` or `min-h-[44px]` for inputs. Current Input component uses `p-3` (12px padding) which gives ~44px height with text -- reducing to `p-2` (8px) gives ~36px, which is borderline. Use `py-2 px-2.5` for a good compromise.
**Warning signs:** Users struggling to tap the correct input field.

### Pitfall 3: Zustand Persist Migration
**What goes wrong:** Adding `developerMode` to an existing persisted store without handling hydration of old state that doesn't have the field.
**Why it happens:** Zustand persist `merge` function needs to handle missing keys from old persisted state.
**How to avoid:** The existing `merge` function in `useRotationStore` uses spread: `{ ...currentState, ...(persistedState as Partial<RotationState>) }`. This correctly falls back to `currentState` defaults for new fields. The default value of `developerMode: false` in the store definition ensures old persisted state (which lacks the key) will use `false`. No migration code needed.
**Warning signs:** `developerMode` being `undefined` instead of `false` after upgrade.

### Pitfall 4: Accordion Overflow with Forms Inside
**What goes wrong:** CollapsibleSection clips dropdown menus or form content that extends beyond the section bounds.
**Why it happens:** The accordion animation sets `overflow: hidden` during transitions.
**How to avoid:** The existing `CollapsibleSection` already handles this correctly -- it resets overflow to `visible` after expand animation completes (line 60-68 of CollapsibleSection.tsx). No changes needed.
**Warning signs:** Dropdowns being clipped inside expanded sections.

### Pitfall 5: Breaking Existing E2E Tests
**What goes wrong:** Restructuring settings page DOM breaks selectors in E2E tests.
**Why it happens:** Tests may rely on specific DOM structure or data-testid attributes.
**How to avoid:** Check existing E2E tests that interact with settings page before restructuring. Key test files: `src/e2e/demo-data.spec.ts`, `src/e2e/parquet-roundtrip.spec.ts`. Preserve `data-testid` attributes on buttons.
**Warning signs:** CI failures in E2E tests after settings restructure.

## Code Examples

### Example 1: Compact SetRow (single-line layout)
```typescript
// Source: Derived from existing SetRow.tsx pattern
// Current: bg-bg-secondary rounded-xl p-4 space-y-3 (two rows: header + inputs)
// Compact: bg-bg-secondary rounded-xl p-2.5 (single row: number + inputs + remove)

<div className="bg-bg-secondary rounded-xl p-2.5">
  <div className="flex items-center gap-2">
    {/* Set number - compact circle */}
    <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-medium text-text-muted flex-shrink-0">
      {setNumber}
    </div>

    {/* Input grid - 3 columns inline */}
    <div className="grid grid-cols-3 gap-2 flex-1">
      <Input
        type="number"
        placeholder={ghostWeight}
        value={weightKg}
        onChange={...}
        className="py-2 px-2.5 text-sm"
      />
      <Input
        type="number"
        placeholder={ghostReps}
        value={reps}
        onChange={...}
        className="py-2 px-2.5 text-sm"
      />
      <Input
        type="number"
        placeholder={ghostRir}
        value={rir}
        onChange={...}
        className="py-2 px-2.5 text-sm"
      />
    </div>

    {/* Remove button - compact */}
    <button onClick={onRemove} className="text-text-muted hover:text-error text-xs flex-shrink-0 p-1">
      ✕
    </button>
  </div>
  {/* PR badge inline if applicable */}
  {prStatus && (
    <span className="text-xs text-warning font-medium ml-8">PR!</span>
  )}
</div>
```

### Example 2: Settings Page Restructure (BackupSettings.tsx)
```typescript
// Source: Existing BackupSettings.tsx patterns
// New structure:
// 1. Default Gym (inline dropdown)
// 2. Active Rotation (inline dropdown)
// 3. Export Data (single button)
// ---hr---
// 4. Workout Preferences (collapsible)
// 5. Data Backup (collapsible)
// 6. Restore from Backup (collapsible)
// ---
// 7. Developer Mode toggle
// 8. [if developer mode] System Observability, Data Quality, Demo Data
```

### Example 3: Rotation Section - Active Prominent
```typescript
// Source: Existing RotationSection.tsx patterns
// Active rotation: colored border, "Active" badge, expanded by default
// Other rotations: collapsed accordion items
// Create new: "+" button in section header, form collapsed by default

// Active rotation display
<div className="border border-accent/30 bg-bg-secondary rounded-xl p-4">
  <div className="flex items-center justify-between">
    <h4 className="font-medium text-text-primary">{activeRotation.name}</h4>
    <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Active</span>
  </div>
  <p className="text-sm text-text-secondary mt-1">
    Position {currentPos + 1}/{total} plans
  </p>
</div>

// Non-active rotations in accordion
{inactiveRotations.map(rotation => (
  <CollapsibleSection key={rotation.rotation_id} title={rotation.name}>
    {/* rotation details, set-active button with inline confirm */}
  </CollapsibleSection>
))}
```

### Example 4: Toggle Switch Pattern (existing in codebase)
```typescript
// Source: BackupSettings.tsx line 149-160 (soundEnabled toggle)
<button
  onClick={() => setDeveloperMode(!developerMode)}
  className={`w-12 h-6 rounded-full transition-colors relative ${
    developerMode ? 'bg-accent' : 'bg-bg-tertiary'
  }`}
  aria-label="Toggle developer mode"
>
  <span
    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
      developerMode ? 'left-7' : 'left-1'
    }`}
  />
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 config file | Tailwind v4 `@theme` in CSS | Already applied | Theme tokens defined in `index.css`, not config |
| framer-motion `motion.div` | `m.div` with LazyMotion | Already applied | Tree-shaking friendly, used in App.tsx |
| sessionStorage for workout | localStorage (migrated) | Already applied | Active workout survives refresh |

**Deprecated/outdated:**
- None relevant. All patterns in use are current.

## Open Questions

1. **TOON Export simplification scope**
   - What we know: CONTEXT.md says "TOON Export is a single Export Data button, no extra options or section." Current ToonExportSection.tsx has scope picker (Last Workout / Rotation / Time Range), rotation count, and time range options with Copy + Download buttons.
   - What's unclear: Should the "Export Data" button do the Parquet backup export (like current "Export Backup" in Data Backup section) or the TOON export? The CONTEXT.md mentions "Export Data (simple button)" for top-level settings and "TOON Export is a single Export Data button."
   - Recommendation: Simplify to a single "Export Data" button that does the TOON Last Workout export (most common use case). Move the Parquet backup export into the "Data Backup" collapsible section (which is where it currently lives). If more TOON export options are needed, they can go in a collapsible section.

2. **Rotation dropdown vs section**
   - What we know: CONTEXT.md says "Rotation (inline dropdown)" at top level. But the current rotation section has create, edit, delete, reorder, and active-switching functionality that goes well beyond a dropdown.
   - What's unclear: Does "inline dropdown" mean just a selector for the active rotation, with the full CRUD in a separate collapsible section?
   - Recommendation: Top-level shows an inline dropdown to select active rotation (from existing rotations). Full rotation management (create, edit, delete, reorder) goes in a collapsible "Manage Rotations" section below, or the rotation section itself with the redesigned UX (active prominent, others collapsed, create collapsed).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 15+ files listed in Architecture Patterns section
- Verified all component APIs, props, and state management patterns from source code
- Tailwind CSS v4 `@theme` usage confirmed from `src/index.css`
- Zustand persist patterns confirmed from `useRotationStore.ts` and `useWorkoutStore.ts`
- framer-motion `m` component usage confirmed from `CollapsibleSection.tsx` and `App.tsx`

### Secondary (MEDIUM confidence)
- Touch target sizing: Apple Human Interface Guidelines (44pt minimum) - well-established standard

### Tertiary (LOW confidence)
- None. All findings are from direct codebase analysis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all patterns verified from existing code
- Architecture: HIGH - All target files read and analyzed, restructuring plan is clear
- Pitfalls: HIGH - Identified from actual code patterns (duplicate titles verified line-by-line, persist migration verified from merge function)

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (stable; no external dependencies to go stale)
