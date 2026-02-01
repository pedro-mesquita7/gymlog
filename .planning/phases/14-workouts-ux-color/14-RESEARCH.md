# Phase 14: Workouts UX & Color Scheme - Research

**Researched:** 2026-02-01
**Domain:** React UX redesign + OKLCH color system (Tailwind CSS v4)
**Confidence:** HIGH

## Summary

This phase has two parallel workstreams: (1) redesigning the Workouts tab for one-tap Quick Start prominence with compact layout, and (2) migrating the entire app to a cohesive OKLCH color token system with WCAG AA compliance.

The codebase already uses Tailwind CSS v4 with `@theme` directive and has partial OKLCH adoption (accent and semantic colors). Background/text/border colors are split between semantic tokens (`bg-bg-primary`, `text-text-secondary`) and hardcoded Tailwind zinc classes (`bg-zinc-800`, `text-zinc-500`). There are ~201 hardcoded zinc references across 31 files that need migration to semantic tokens. The existing `CollapsibleSection` component using `<details>/<summary>` provides a ready pattern for the "Browse all templates" accordion.

**Primary recommendation:** Execute color token migration first (establishes the new visual foundation), then redesign the Workouts tab layout (Quick Start hero, recent workout card, accordion). This order ensures the new layout is built with the final color system from the start.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4.1.18 | CSS framework with `@theme` | Already in use; v4 uses OKLCH natively, supports `@theme` CSS-first config |
| React | v19.2.0 | UI framework | Already in use |
| Zustand | v5.0.10 | State management (rotation store) | Already in use for Quick Start data |
| Framer Motion | v12.29.2 | Animations | Already in use (App.tsx page transitions only) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| OddContrast | web tool | OKLCH contrast checking | Verify WCAG AA compliance for all token pairs |
| oklch.fyi | web tool | OKLCH color picking/conversion | Generate and explore OKLCH color values |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual OKLCH tokens | Tailwind default zinc in OKLCH | Default zinc already uses OKLCH in v4, but custom tokens give us the soft dark (#1e1e2e range) look the user wants vs zinc-950 (#09090b) which is near-black |
| `<details>/<summary>` accordion | Headless UI Disclosure | Already have a working CollapsibleSection component; no new dependency needed |
| New `useRecentWorkout` hook | Inline DuckDB query | Follow existing hook pattern (useAnalytics, useHistory) for consistency |

**Installation:**
```bash
# No new packages needed - all tools already in use
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.css                    # @theme block: ALL color tokens defined here
├── components/
│   ├── workout/
│   │   ├── StartWorkout.tsx     # Restructured: Quick Start hero + accordion
│   │   └── ...                  # Existing workout components
│   ├── rotation/
│   │   └── QuickStartCard.tsx   # Redesigned: hero card with edit mode
│   ├── ui/
│   │   ├── Button.tsx           # Updated: semantic color tokens
│   │   ├── Card.tsx             # Updated: semantic tokens, elevation layers
│   │   ├── Input.tsx            # Updated: semantic tokens
│   │   └── Dialog.tsx           # Updated: semantic tokens
│   └── ...                      # All components: zinc → semantic migration
├── hooks/
│   └── useRecentWorkout.ts      # NEW: fetches last completed workout summary
└── styles/
    └── fonts.css                # Unchanged
```

### Pattern 1: OKLCH Color Token System in @theme
**What:** Define all colors as OKLCH values in `@theme` block, with semantic naming that maps to design intent rather than color values.
**When to use:** All color definitions across the app.
**Example:**
```css
/* Source: Tailwind CSS v4 @theme docs */
@theme {
  /* Background layers - soft dark (Linear/Notion aesthetic) */
  --color-bg-primary: oklch(18% 0.01 270);      /* ~#1a1a2e - page background */
  --color-bg-secondary: oklch(22% 0.01 270);     /* ~#22223a - card backgrounds */
  --color-bg-tertiary: oklch(27% 0.01 270);      /* ~#2a2a40 - input/hover */
  --color-bg-elevated: oklch(30% 0.01 270);      /* ~#323248 - elevated surfaces */

  /* Text hierarchy */
  --color-text-primary: oklch(90% 0.005 270);    /* ~#e0e0ea - primary text */
  --color-text-secondary: oklch(70% 0.01 270);   /* ~#9898aa - secondary text */
  --color-text-muted: oklch(55% 0.01 270);       /* ~#6e6e82 - muted/placeholder */

  /* Borders */
  --color-border-primary: oklch(27% 0.01 270);   /* Matches bg-tertiary */
  --color-border-secondary: oklch(35% 0.01 270); /* Lighter borders */

  /* Accent - orange */
  --color-accent: oklch(72% 0.19 45);            /* Vibrant orange */
  --color-accent-hover: oklch(65% 0.17 45);      /* Dimmed orange */
  --color-accent-muted: oklch(72% 0.08 45);      /* Subtle orange for backgrounds */

  /* Semantic */
  --color-success: oklch(65% 0.17 145);          /* Green - PRs */
  --color-error: oklch(63% 0.22 25);             /* Red - errors */
  --color-warning: oklch(75% 0.15 85);           /* Amber - warnings */
  --color-info: oklch(65% 0.15 250);             /* Blue - informational */
}
```

**Key constraint:** Background must be soft dark (#1e1e2e to #2a2a3a range), NOT near-black. Current `--color-bg-primary: #09090b` (zinc-950) must shift to ~oklch(18% 0.01 270) range. This is a significant visual change.

### Pattern 2: Brightness-Based Card Elevation
**What:** Cards sit on slightly lighter backgrounds than their parent. No borders for elevation.
**When to use:** All card components.
**Example:**
```tsx
// Card elevation through background lightness, not borders
// Page bg: bg-bg-primary (L=18%)
// Card bg: bg-bg-secondary (L=22%)
// Nested/hover: bg-bg-tertiary (L=27%)
// Elevated overlay: bg-bg-elevated (L=30%)

function Card({ children }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-4">
      {children}
    </div>
  );
}
```

### Pattern 3: Quick Start Hero Card with Edit Mode
**What:** Quick Start is a prominent hero card with one-tap start. Edit mode toggled by icon reveals selectors.
**When to use:** Top of Workouts tab when rotation is configured.
**Example:**
```tsx
function QuickStartCard({ templates, gyms, onStart }) {
  const [editMode, setEditMode] = useState(false);

  // Default state: show next workout, one tap starts
  // Edit state: reveal gym/template selectors
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-6">
      {!editMode ? (
        // Hero display: template name, gym, one-tap start
        <button onClick={() => onStart(templateId, gymId)} className="w-full">
          <div className="text-accent text-sm">Next workout</div>
          <div className="text-2xl font-bold">{templateName}</div>
          <div className="text-text-secondary">at {gymName}</div>
        </button>
      ) : (
        // Edit mode: select gym/template
        <div>
          <Select ... />
          <Select ... />
          <Button onClick={confirmEdit}>Done</Button>
        </div>
      )}
      <button onClick={() => setEditMode(!editMode)} className="absolute top-4 right-4">
        <EditIcon />
      </button>
    </div>
  );
}
```

### Pattern 4: Recent Workout Summary Hook
**What:** A new hook that queries the most recent completed workout's summary data.
**When to use:** Workouts tab to show the recent workout card below Quick Start.
**Example:**
```typescript
// Following existing hook patterns (useAnalytics, useHistory)
export function useRecentWorkout(): {
  data: RecentWorkout | null;
  isLoading: boolean;
} {
  // Query DuckDB for most recent completed workout:
  // - template name (from workout_started → template_id → exercise_created events)
  // - date (from workout_completed)
  // - exercise count (distinct exercise_id from set_logged)
  // - total volume (SUM(weight_kg * reps) from set_logged)
  // - duration (workout_completed - workout_started timestamps)
}
```

### Pattern 5: Accordion for Template Browser
**What:** "Browse all templates" uses existing `<details>/<summary>` pattern, collapsed by default.
**When to use:** Below Quick Start card on Workouts tab.
**Example:**
```tsx
// Reuse CollapsibleSection pattern from analytics
<details className="border-b border-border-primary pb-4">
  <summary className="cursor-pointer text-sm font-medium text-text-secondary">
    Browse all templates
  </summary>
  <div className="pt-3 space-y-2">
    {templates.map(t => <MiniTemplateCard key={t.template_id} template={t} />)}
  </div>
</details>
```

### Anti-Patterns to Avoid
- **Mixing hardcoded zinc with semantic tokens:** After migration, NO component should reference `zinc-*` classes directly. All colors go through semantic tokens.
- **Using borders for card elevation:** Design spec says brightness-based layering, not borders. Remove border classes from cards.
- **Opacity for disabled instead of token:** Use `opacity-40` on the element, consistent with the 40% opacity decision.
- **Breaking existing E2E test selectors:** All `data-testid` attributes must be preserved. The restructuring must keep existing test hooks working.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OKLCH contrast checking | Manual math or RGB conversion | OddContrast (oddcontrast.com) | OKLCH contrast requires specialized computation; web tool is authoritative |
| Color token definition | JavaScript config | Tailwind v4 `@theme` in CSS | CSS-first is the v4 way; `@theme` makes tokens available as CSS variables |
| Accordion/collapsible | Custom state management | `<details>/<summary>` HTML | Already proven in CollapsibleSection.tsx; zero-JS, accessible by default |
| Page transitions | Custom animation logic | Framer Motion `AnimatePresence` | Already in use in App.tsx; proven pattern |
| Recent workout data | Inline SQL in component | Custom hook (useRecentWorkout) | Follows established pattern of useAnalytics, useHistory, etc. |

**Key insight:** The app already has all the infrastructure needed. No new libraries, no new patterns. This phase is a visual/layout refactor using existing tools.

## Common Pitfalls

### Pitfall 1: Contrast Ratio Failure with OKLCH Orange on Dark Backgrounds
**What goes wrong:** Orange accent text on dark backgrounds may not meet WCAG AA 4.5:1 ratio, especially at lower lightness values.
**Why it happens:** OKLCH perceptual lightness makes this predictable but the orange-on-dark combo is inherently low-contrast. `oklch(67% 0.19 35)` (current accent) on `oklch(18% 0.01 270)` (proposed bg) gives roughly 5.5:1 which passes. But the hover state `oklch(62% 0.17 35)` drops to ~4.5:1, which is borderline.
**How to avoid:** Verify every accent-on-background pair with OddContrast before finalizing tokens. Keep accent lightness >= 65% for text usage, or use accent only for large text/UI components (3:1 threshold).
**Warning signs:** Orange text that looks faded or hard to read on the dark background.

### Pitfall 2: Zinc-to-Semantic Migration Breaking Opacity Modifiers
**What goes wrong:** Existing classes like `bg-zinc-800/50` use opacity modifiers. Replacing `zinc-800` with a semantic token like `bg-bg-tertiary` changes the underlying color value, and opacity modifiers work differently with OKLCH.
**Why it happens:** `zinc-800` = `#27272a`, while the new `bg-tertiary` may be a different OKLCH value. `bg-zinc-800/50` and `bg-bg-tertiary/50` will look different if the base colors differ.
**How to avoid:** Audit all opacity modifier usages. The Card component uses `bg-zinc-800/50` as its base style. The new design uses brightness-based elevation without borders, so opacity modifiers on backgrounds may be replaced with solid lighter backgrounds.
**Warning signs:** Cards or surfaces that look washed out or too transparent after migration.

### Pitfall 3: Near-Black to Soft-Dark Background Shift Affecting All Pages
**What goes wrong:** Changing `bg-primary` from `#09090b` (near-black) to `~#1a1a2e` (soft dark) affects the ENTIRE app, not just the Workouts tab. Every screen must look good with the new background.
**Why it happens:** `bg-bg-primary` is used globally (body tag, App.tsx loading state, error state). The shift is visible on every page.
**How to avoid:** Test all tabs (Workouts, Templates, Analytics, Settings) after the background change. Pay special attention to charts (Recharts) which may have hardcoded colors that clash.
**Warning signs:** Analytics charts with zinc-colored axes that disappear against the new background.

### Pitfall 4: E2E Test Breakage from Layout Restructuring
**What goes wrong:** Restructuring the Workouts tab (moving gym/exercise lists, adding accordion) breaks E2E selectors and interaction flows.
**Why it happens:** E2E tests for workout-rotation.spec.ts reference `quick-start-card`, `btn-quick-start`, `gym-select`, `template-select`. If the manual selection moves inside an accordion, tests need to open the accordion first.
**How to avoid:** Keep all `data-testid` attributes. If elements move inside accordions, ensure tests expand the accordion before interacting. The `<details>` element can be opened via `.click()` on the `<summary>`.
**Warning signs:** E2E tests that worked before phase 14 now timeout waiting for elements.

### Pitfall 5: HSL Legacy Color References
**What goes wrong:** The codebase has legacy HSL color definitions (`--accent: 16 100% 50%`, `--chart-primary: 220 70% 50%`) used by `.text-accent` and `.bg-accent` utility classes. These classes are used in ~25 files.
**Why it happens:** Migration to OKLCH was partial. The legacy HSL accent is referenced via `hsl(var(--accent))` in component classes defined in index.css.
**How to avoid:** Remove the legacy HSL variables entirely. The `@theme` OKLCH accent (`--color-accent`) automatically generates `text-accent` and `bg-accent` utilities in Tailwind v4, making the `@layer components` overrides unnecessary. However, confirm that all usages of `text-accent` work with the OKLCH value before removing the legacy definitions.
**Warning signs:** Accent-colored elements changing appearance or disappearing after removing legacy HSL.

### Pitfall 6: Hardcoded Colors in Recharts/Analytics Components
**What goes wrong:** Analytics components (charts, cards) use extensive hardcoded zinc/color classes. The analytics components have ~60+ hardcoded zinc references.
**Why it happens:** Charts were built before the semantic token system was established.
**How to avoid:** Include analytics components in the migration sweep. Use CSS variables for Recharts `stroke`, `fill` colors where possible.
**Warning signs:** Charts that look visually inconsistent with the rest of the app.

## Code Examples

### Complete @theme Color Token Block
```css
/* Source: Tailwind CSS v4 @theme docs + project decisions */
@import "tailwindcss";

@theme {
  /* Background layers - soft dark (Linear/Notion aesthetic)
     L values: 18% → 22% → 27% → 30% (4-5% steps for subtle elevation) */
  --color-bg-primary: oklch(18% 0.01 270);
  --color-bg-secondary: oklch(22% 0.01 270);
  --color-bg-tertiary: oklch(27% 0.01 270);
  --color-bg-elevated: oklch(30% 0.01 270);

  /* Text hierarchy - soft whites (not pure white)
     Must pass WCAG AA (4.5:1) against bg-primary */
  --color-text-primary: oklch(90% 0.005 270);    /* ~#e0e0ea - 7.6:1 vs bg-primary */
  --color-text-secondary: oklch(70% 0.01 270);   /* ~#9898aa - 4.8:1 vs bg-primary */
  --color-text-muted: oklch(55% 0.01 270);       /* ~#6e6e82 - for non-essential text */

  /* Borders */
  --color-border-primary: oklch(27% 0.01 270);
  --color-border-secondary: oklch(35% 0.01 270);

  /* Accent - vibrant orange (signature color) */
  --color-accent: oklch(72% 0.19 45);
  --color-accent-hover: oklch(65% 0.17 45);
  --color-accent-muted: oklch(72% 0.06 45);

  /* Semantic state colors */
  --color-success: oklch(65% 0.17 145);
  --color-error: oklch(63% 0.22 25);
  --color-warning: oklch(75% 0.15 85);
  --color-info: oklch(65% 0.15 250);

  /* Chart colors */
  --color-chart-primary: oklch(60% 0.15 250);
  --color-chart-success: oklch(62% 0.15 145);
  --color-chart-muted: oklch(55% 0.02 270);

  /* Typography */
  --font-sans: 'Geist Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

### Quick Start Hero Card (Redesigned)
```tsx
// QuickStartCard.tsx - Hero element at top of Workouts tab
export function QuickStartCard({ templates, gyms, onStart }: QuickStartCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const nextTemplate = useRotationStore(useShallow(selectNextTemplate));
  const defaultGymId = useRotationStore(state => state.defaultGymId);

  // No rotation: prompt to create
  if (!nextTemplate) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 text-center">
        <p className="text-text-secondary mb-3">No workout plan yet</p>
        <Button variant="primary" size="md">Create one</Button>
      </div>
    );
  }

  const template = templates.find(t => t.template_id === nextTemplate.templateId);
  const gym = gyms.find(g => g.gym_id === defaultGymId);

  // Hero card - one tap to start
  return (
    <div
      data-testid="quick-start-card"
      className="relative bg-accent/10 rounded-xl p-6 cursor-pointer"
      onClick={() => !isEditing && onStart(nextTemplate.templateId, defaultGymId!)}
    >
      {/* Edit toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
        className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
      >
        {/* pencil icon SVG */}
      </button>

      {!isEditing ? (
        <>
          <div className="text-accent text-sm font-medium mb-1">
            Next workout ({nextTemplate.position + 1} of {nextTemplate.total})
          </div>
          <div className="text-2xl font-bold text-text-primary mb-1">
            {template?.name}
          </div>
          <div className="text-text-secondary">at {gym?.name}</div>
        </>
      ) : (
        <div className="space-y-3">
          <Select value={...} onChange={...}>...</Select>
          <Select value={...} onChange={...}>...</Select>
          <Button onClick={() => setIsEditing(false)}>Done</Button>
        </div>
      )}
    </div>
  );
}
```

### Semantic Token Migration Pattern
```tsx
// BEFORE (hardcoded zinc)
<div className="bg-zinc-800/50 rounded-lg p-4">
  <h3 className="text-zinc-200 font-medium">Title</h3>
  <p className="text-zinc-500 text-sm">Description</p>
</div>

// AFTER (semantic tokens)
<div className="bg-bg-secondary rounded-lg p-4">
  <h3 className="text-text-primary font-medium">Title</h3>
  <p className="text-text-muted text-sm">Description</p>
</div>
```

### Recent Workout Summary Hook
```typescript
// useRecentWorkout.ts - follows useAnalytics hook pattern
export interface RecentWorkout {
  template_name: string;
  completed_at: string;
  exercise_count: number;
  total_volume_kg: number;
  duration_minutes: number;
}

export function useRecentWorkout(): { data: RecentWorkout | null; isLoading: boolean } {
  const [data, setData] = useState<RecentWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = getDuckDB();
      if (!db) { setIsLoading(false); return; }
      const conn = await db.connect();
      try {
        const result = await conn.query(`
          WITH latest AS (
            SELECT
              s.payload->>'workout_id' as workout_id,
              s.payload->>'template_id' as template_id,
              s._created_at as started_at,
              c._created_at as completed_at
            FROM events s
            JOIN events c ON c.payload->>'workout_id' = s.payload->>'workout_id'
            WHERE s.event_type = 'workout_started'
              AND c.event_type = 'workout_completed'
            ORDER BY c._created_at DESC
            LIMIT 1
          )
          SELECT
            t.payload->>'name' as template_name,
            l.completed_at,
            COUNT(DISTINCT sets.payload->>'original_exercise_id') as exercise_count,
            SUM(CAST(sets.payload->>'weight_kg' AS DOUBLE) * CAST(sets.payload->>'reps' AS DOUBLE)) as total_volume_kg,
            EXTRACT(EPOCH FROM (l.completed_at - l.started_at)) / 60.0 as duration_minutes
          FROM latest l
          JOIN events t ON t.payload->>'template_id' = l.template_id AND t.event_type = 'template_created'
          JOIN events sets ON sets.payload->>'workout_id' = l.workout_id AND sets.event_type = 'set_logged'
          GROUP BY t.payload->>'name', l.completed_at, l.started_at
        `);
        // ... parse result
      } finally {
        await conn.close();
      }
    }
    fetch();
  }, []);

  return { data, isLoading };
}
```

### Disabled State Pattern
```tsx
// Disabled at 40% opacity (per design decision)
<Button disabled className="opacity-40 cursor-not-allowed">
  Disabled Button
</Button>

// In Button component: disabled state already uses opacity-50
// Update to opacity-40 per design decision
const disabledStyles = 'opacity-40 cursor-not-allowed';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind JS config (tailwind.config.js) | CSS-first `@theme` directive | Tailwind CSS v4 (2025) | Color tokens defined in CSS, not JS config |
| RGB/HSL color values | OKLCH color space | Tailwind v4 default palette | Perceptually uniform; better for accessibility |
| Hardcoded zinc-* classes | Semantic color tokens | Best practice (ongoing) | Theme-ability, consistency, maintainability |
| Borders for card elevation | Background lightness layering | Modern dark UI trend (Linear, Notion) | Cleaner visual hierarchy |

**Deprecated/outdated:**
- `tailwind.config.js` theme extension: Tailwind v4 uses `@theme` in CSS. The existing `tailwind.config.js` is empty and can remain as-is.
- HSL accent variables (`--accent: 16 100% 50%`): Replace with OKLCH `--color-accent`. The `@layer components` overrides for `.text-accent`, `.bg-accent`, `.border-accent` become unnecessary since `@theme` auto-generates these utilities.

## Codebase Audit Summary

### Files Requiring Color Token Migration (31 files, ~201 hardcoded zinc refs)

**UI Components (4 files):**
- `src/components/ui/Button.tsx` - 3 zinc refs
- `src/components/ui/Card.tsx` - 2 zinc refs
- `src/components/ui/Input.tsx` - 1 zinc ref
- `src/components/ui/Dialog.tsx` - 3 zinc refs

**Workout Components (8 files):**
- `src/components/workout/WorkoutComplete.tsx` - 24 zinc refs (largest)
- `src/components/workout/ExerciseSubstitution.tsx` - 15 zinc refs
- `src/components/workout/SetRow.tsx` - 9 zinc refs
- `src/components/workout/SetLogger.tsx` - 7 zinc refs
- `src/components/workout/ExerciseView.tsx` - 7 zinc refs
- `src/components/workout/StartWorkout.tsx` - 5 zinc refs
- `src/components/workout/ActiveWorkout.tsx` - 4 zinc refs
- `src/components/workout/SetGrid.tsx` - 2 zinc refs

**Analytics Components (9 files):**
- `src/components/analytics/AnalyticsPage.tsx` - 17 zinc refs
- `src/components/analytics/WeekComparisonCard.tsx` - 10 zinc refs
- `src/components/analytics/MuscleHeatMap.tsx` - 10 zinc refs
- `src/components/analytics/VolumeZoneIndicator.tsx` - 7 zinc refs
- `src/components/analytics/ProgressionStatusCard.tsx` - 6 zinc refs
- `src/components/analytics/ExerciseProgressChart.tsx` - 3 zinc refs
- `src/components/analytics/CollapsibleSection.tsx` - 3 zinc refs
- `src/components/analytics/ProgressionDashboard.tsx` - 2 zinc refs
- `src/components/analytics/VolumeBarChart.tsx` - 1 zinc ref
- `src/components/analytics/PRListCard.tsx` - 1 zinc ref

**History Components (3 files):**
- `src/components/history/ExerciseHistory.tsx` - 11 zinc refs
- `src/components/history/PRList.tsx` - 8 zinc refs
- `src/components/history/EstimatedMaxDisplay.tsx` - 5 zinc refs

**Template Components (2 files):**
- `src/components/templates/ExerciseRow.tsx` - 17 zinc refs
- `src/components/templates/ExerciseList.tsx` - 1 zinc ref

**Other Components (3 files):**
- `src/components/ui/NumberStepper.tsx` - 5 zinc refs
- `src/components/ExerciseList.tsx` - 2 zinc refs
- `src/App.tsx` - 1 zinc ref

**Root:**
- `src/index.css` - 9 zinc refs (in @theme + @layer base)

### Files with Hardcoded Semantic Colors (red-/green-/yellow-/amber-/blue-*): 18 files, ~70 refs
These should be migrated to use `text-error`, `text-success`, `text-warning`, `text-info` semantic tokens.

### Workouts Tab Current Structure (needs redesign)
```
StartWorkout.tsx
├── QuickStartCard (if rotation exists)
├── "or choose manually" divider
├── "Start Workout" heading
├── Gym select dropdown
├── Template select dropdown
└── Start Workout button

Below StartWorkout (in App.tsx renderWorkoutsContent):
├── GymList (gym management)
└── ExerciseList (exercise management)
```

### Workouts Tab Target Structure
```
[Quick Start Hero Card]          ← Prominent, one-tap
[Recent Workout Summary Card]    ← Compact stats card
[Browse All Templates accordion] ← Collapsed by default
  └── Mini template cards        ← Flat list
```

**Note:** GymList and ExerciseList are currently shown on the Workouts tab. These are management views that should move elsewhere (Settings tab or stay below the accordion) to keep the Workouts tab focused on starting workouts.

### Existing Test Coverage to Preserve
- `src/components/workout/StartWorkout.test.tsx` - 8 unit tests (gym/template selection, start button, empty states)
- `src/e2e/workout-rotation.spec.ts` - E2E tests using `quick-start-card`, `btn-quick-start`, `gym-select`, `template-select` selectors
- `src/e2e/batch-logging.spec.ts` - Uses workout flow selectors

## Open Questions

1. **Where do GymList and ExerciseList move?**
   - What we know: Currently on Workouts tab, but design calls for Workouts tab to be focused on starting workouts
   - What's unclear: Whether they go to Settings tab, get their own tab, or stay collapsed at bottom of Workouts tab
   - Recommendation: Keep them at the bottom of Workouts tab below the "Browse all templates" accordion. They're used infrequently and don't clutter if below the fold. No tab restructuring needed.

2. **Exact OKLCH token values and contrast ratios**
   - What we know: Target range is soft dark (#1e1e2e to #2a2a3a), off-white text (~#e0e0e0), orange accent
   - What's unclear: Exact OKLCH L/C/H values that pass all WCAG AA checks in combination
   - Recommendation: Start with the values in the code example above (L=18% bg, L=90% text, L=72% accent). Verify all critical pairs with OddContrast during implementation. Adjust as needed.

3. **Template name in Recent Workout card**
   - What we know: Need template name, date, exercise count, total volume, duration
   - What's unclear: Template name comes from `template_created` events but may need fallback if template was deleted
   - Recommendation: Use COALESCE with 'Unknown Template' fallback in SQL query.

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 `@theme` documentation: https://tailwindcss.com/docs/theme
- Tailwind CSS v4 color customization: https://tailwindcss.com/docs/customizing-colors
- Codebase analysis: All 45+ source files in `src/components/`, `src/hooks/`, `src/stores/`

### Secondary (MEDIUM confidence)
- OddContrast OKLCH contrast checker: https://www.oddcontrast.com/
- oklch.fyi color picker: https://oklch.fyi/
- Evil Martians OKLCH guide: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- Atmos contrast checker: https://atmos.style/contrast-checker

### Tertiary (LOW confidence)
- Tailwind v4 OKLCH palette reference: https://tailwindcolor.com/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed; all tools already in codebase
- Architecture: HIGH - Patterns follow existing codebase conventions (hooks, @theme, components)
- Pitfalls: HIGH - Identified through direct codebase audit of all 31 affected files
- Color values: MEDIUM - Exact OKLCH values need verification with contrast tools during implementation

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable - Tailwind v4 and OKLCH are well-established)
