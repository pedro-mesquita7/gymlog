# Phase 22: Bug Fixes + Theme Overhaul - Research

**Researched:** 2026-02-02
**Domain:** Bug fixes (rotation logic, TS types) + CSS theme system (OKLCH tokens, Tailwind v4)
**Confidence:** HIGH

## Summary

Phase 22 has two distinct workstreams: fixing two bugs (rotation property mismatch and TS build errors) and overhauling the entire color system from warm orange to cool blue/teal.

The bug workstream is straightforward. The `selectNextPlan` selector in `useRotationStore.ts` returns `{ planId }` but both `QuickStartCard.tsx` and `StartWorkout.tsx` access `nextPlan.templateId` (a non-existent property). This silently returns `undefined`, causing the "plan or gym not found" error and the TS build issue. The fix is a simple property rename in 2 files.

The theme workstream is larger but mechanical. The entire color system lives in `src/index.css` inside a `@theme {}` block (Tailwind v4 CSS-first configuration). There are ~20 OKLCH token definitions plus 3 legacy HSL variables. The accent color (orange at `oklch(72% 0.19 45)`) is referenced via Tailwind classes (`bg-accent`, `text-accent`, `border-accent`) across 44 files (108 occurrences). Charts use a mix of CSS variable references and hardcoded OKLCH values. The volume zone system (5 zones with semantic red/yellow/green/orange colors) needs conversion to a teal gradient per CONTEXT.md decisions.

**Primary recommendation:** Fix bugs first (2 files, 10 minutes), then update index.css tokens (single source of truth), then sweep hardcoded colors in charts, then audit `text-black` on accent backgrounds (teal may need `text-white` instead), and finally verify WCAG AA contrast.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^4.1.18 | Utility-first CSS with `@theme` block | Already in use, v4 CSS-first config |
| @tailwindcss/postcss | ^4.1.18 | PostCSS integration | Already in use |
| Recharts | ^3.7.0 | Chart library (Line, Bar) | Already in use |
| react-muscle-highlighter | ^1.2.0 | SVG body diagram | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | Theme changes are pure CSS token updates | - |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual WCAG checking | `wcag-contrast` npm package | Overkill for one-time audit; manual OKLCH contrast calculation is sufficient |

**Installation:**
No new packages needed. All changes are CSS tokens and component class updates.

## Architecture Patterns

### Color System Architecture (Current)
```
src/index.css                    # Single source of truth
  @theme {
    --color-bg-*                 # Background layers (4 tokens)
    --color-text-*               # Text hierarchy (3 tokens)
    --color-border-*             # Border tokens (2 tokens)
    --color-accent*              # Accent + hover + muted (3 tokens)
    --color-success/error/warning # Semantic colors (3 tokens)
    --color-chart-*              # Chart colors (3 tokens)
    --color-chart-zone-*         # Volume zones (5 tokens)
    --color-chart-tooltip-*      # Tooltip (2 tokens)
    --shadow-*                   # Shadow system (4 tokens)
    --gradient-*                 # Card gradient (1 token)
    --accent (legacy HSL)        # Used by ExerciseProgressChart
    --chart-* (legacy HSL)       # Used by ExerciseProgressChart
  }
```

### Pattern 1: Token-Driven Theming
**What:** All colors defined as OKLCH tokens in `@theme {}`, consumed via Tailwind classes
**When to use:** Always -- this is the existing pattern
**Key insight:** Changing a token in index.css automatically propagates to all Tailwind class usages (`bg-accent`, `text-accent`, etc.)

### Pattern 2: Hardcoded Colors in Charts (Anti-Pattern to Fix)
**What:** `ExerciseProgressChart.tsx` uses `hsl(var(--accent))` and `hsl(var(--chart-*))` referencing legacy HSL tokens
**What:** `MuscleHeatMap.tsx` hardcodes OKLCH values directly in JS objects (lines 28-33, 39-43)
**Fix:** Migrate to `var(--color-*)` OKLCH tokens everywhere

### Pattern 3: Text-on-Accent Contrast
**What:** Many components use `text-black` for text on accent backgrounds (buttons, badges, rest timer)
**Key decision:** With a teal accent, `text-black` may not provide sufficient contrast. Need to evaluate whether teal accent is light enough for black text or needs white text.
**Impact:** 17 occurrences of `text-black` paired with `bg-accent` across ~12 files

### Anti-Patterns to Avoid
- **Hardcoding OKLCH values in components:** MuscleHeatMap currently does this. All colors should reference CSS variables.
- **Using legacy HSL tokens:** ExerciseProgressChart uses `hsl(var(--accent))`. Migrate to OKLCH `var(--color-accent)`.
- **Partial migration:** Don't leave some components on old orange while others use teal. Do a complete sweep.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast checking | Custom contrast ratio calculator | Browser DevTools or online OKLCH contrast checker (oklch.com) | One-time verification, not runtime |
| Color palette generation | Manual color picking | OKLCH color space math (fixed hue ~180-190, vary lightness/chroma) | Perceptually uniform spacing |
| Finding all color usages | Manual file-by-file search | `grep -r "accent\|orange\|hsl(var"` across src/ | Completeness |

**Key insight:** The theme change is a token replacement + sweep operation, not a design system rebuild. The architecture is already correct (centralized tokens, Tailwind utilities). The work is updating values and fixing stragglers.

## Common Pitfalls

### Pitfall 1: templateId vs planId Property Mismatch
**What goes wrong:** `selectNextPlan` returns `{ planId }` but consumers access `.templateId`, getting `undefined`
**Why it happens:** The selector was renamed from `templateId` to `planId` but consumers weren't updated
**How to avoid:** Fix consumers to use `.planId`, then run `tsc --noEmit` and test Quick Start flow
**Warning signs:** Quick Start shows "Rotation configured but plan or gym not found" even when rotation and gym exist
**Files affected:**
- `src/components/rotation/QuickStartCard.tsx` (lines 48, 62, 70) - references `nextPlan.templateId`
- `src/components/workout/StartWorkout.tsx` (line 25) - references `nextPlan?.templateId`
**Note:** `tsc --noEmit` currently passes because the selector return type includes `planId` and TS doesn't error on accessing non-existent properties of union types in this pattern. The bug is a runtime data issue, not a compile error.

### Pitfall 2: text-black on Teal Accent Backgrounds
**What goes wrong:** Orange (`oklch(72% 0.19 45)`) has 72% lightness making black text readable. If teal accent has lower lightness (e.g., 50-60%), black text becomes unreadable.
**Why it happens:** The current pattern assumes accent is always a light/bright color
**How to avoid:** Choose teal accent lightness carefully. If L >= 65%, black text works. If L < 65%, switch to white text.
**Warning signs:** Button text hard to read, rest timer text invisible
**Files with text-black on accent:** Button.tsx, RestTimer.tsx, PlanList.tsx, PlanBuilder.tsx, DataQualitySection.tsx, ExerciseSubstitution.tsx, PRIndicator.tsx, PRList.tsx, RotationSection.tsx, ToonExportSection.tsx, BackupSettings.tsx

### Pitfall 3: Hardcoded Colors in MuscleHeatMap SVG
**What goes wrong:** `MuscleHeatMap.tsx` has hardcoded OKLCH strings in JavaScript (not CSS variables). Changing index.css tokens won't affect this component.
**Why it happens:** SVG `fill` attributes may not resolve CSS custom properties in all browsers
**How to avoid:** Update the hardcoded values in MuscleHeatMap.tsx to match the new teal gradient. Consider using `getComputedStyle` to read CSS variables, or accept hardcoded OKLCH values as the pattern for SVG fills.
**Warning signs:** Body diagram still shows red/yellow/green after theme change

### Pitfall 4: Legacy HSL Variables Not Updated
**What goes wrong:** `ExerciseProgressChart.tsx` uses `hsl(var(--accent))`, `hsl(var(--chart-success))`, `hsl(var(--chart-primary))` which reference legacy HSL tokens at the bottom of index.css
**Why it happens:** These were kept for backward compatibility but need updating too
**How to avoid:** Either (a) update the HSL values to approximate teal in HSL, or (b) migrate these 4 references to use OKLCH `var(--color-*)` tokens directly
**Recommendation:** Option (b) -- migrate to OKLCH tokens. Removes legacy debt.

### Pitfall 5: Volume Zone Color Semantic Shift
**What goes wrong:** Volume zones currently use semantic colors (red=under, yellow=minimum, green=optimal, orange=high, red=over). CONTEXT.md requires teal gradient instead.
**Why it happens:** Deliberate design decision to make data viz monochrome/brand-cohesive
**How to avoid:** Define 5 new teal gradient zone tokens (varying lightness: light teal=under, medium=optimal, dark=over). Update `VolumeBarChart.tsx`, `MuscleHeatMap.tsx`, `VolumeLegend.tsx`, `VolumeZoneIndicator.tsx`.
**Warning signs:** Users can't distinguish zones if lightness steps are too small. Ensure >= 10% lightness difference between adjacent zones.

### Pitfall 6: Border Radius Reduction Breaks Visual Tests
**What goes wrong:** CONTEXT.md specifies 10-12px radius (down from current 12-16px). Current `--radius-lg: 1rem (16px)` used on cards, and `rounded-2xl` (Tailwind's 1rem = 16px) used extensively.
**Why it happens:** `rounded-2xl` is a Tailwind utility, not a CSS variable
**How to avoid:** Update `--radius-lg` to 0.75rem (12px) in index.css. For `rounded-2xl` usages (108 occurrences across 44 files), either (a) replace with `rounded-xl` or a custom class, or (b) accept that Tailwind's `rounded-2xl` stays at 16px and only token-based radii change. Recommendation: update `--radius-lg` and selectively replace `rounded-2xl` with `rounded-lg` (which maps to `--radius-lg`).

## Code Examples

### Bug Fix: templateId -> planId in QuickStartCard.tsx
```typescript
// BEFORE (broken):
const plan = plans.find(t => t.template_id === nextPlan.templateId);
const effectivePlanId = editPlanId || nextPlan.templateId;
setEditPlanId(nextPlan.templateId);

// AFTER (fixed):
const plan = plans.find(t => t.template_id === nextPlan.planId);
const effectivePlanId = editPlanId || nextPlan.planId;
setEditPlanId(nextPlan.planId);
```

### Bug Fix: templateId -> planId in StartWorkout.tsx
```typescript
// BEFORE (broken):
const [selectedPlanId, setSelectedPlanId] = useState<string>(() => nextPlan?.templateId || '');

// AFTER (fixed):
const [selectedPlanId, setSelectedPlanId] = useState<string>(() => nextPlan?.planId || '');
```

### Theme Token Update: index.css @theme block
```css
/* BEFORE: Warm orange accent */
--color-accent: oklch(72% 0.19 45);
--color-accent-hover: oklch(65% 0.17 45);
--color-accent-muted: oklch(72% 0.06 45);

/* AFTER: Soft teal accent (muted blue-green) */
/* Hue ~180-190 (teal), moderate chroma ~0.08-0.12 (muted, not vibrant) */
/* Lightness ~65-70% for sufficient contrast with black text */
--color-accent: oklch(68% 0.10 185);
--color-accent-hover: oklch(60% 0.09 185);
--color-accent-muted: oklch(68% 0.04 185);
```

### Theme: Background tokens (elevated dark gray)
```css
/* BEFORE: Warm backgrounds (hue 60) */
--color-bg-primary: oklch(16% 0.01 60);

/* AFTER: Neutral/cool backgrounds (hue ~220 or neutral, low chroma) */
/* ~#111 = oklch(15-16% ~0.005 ~220) */
--color-bg-primary: oklch(15% 0.005 220);
--color-bg-secondary: oklch(19% 0.005 220);
--color-bg-tertiary: oklch(24% 0.005 220);
--color-bg-elevated: oklch(27% 0.005 220);
```

### Theme: Text hierarchy (Apple-style whites)
```css
/* BEFORE: Warm-tinted whites */
--color-text-primary: oklch(92% 0.005 60);
--color-text-secondary: oklch(72% 0.01 60);
--color-text-muted: oklch(60% 0.01 60);

/* AFTER: Pure/cool whites (minimal chroma) */
/* Primary: ~pure white, Secondary: ~60% white, Muted: ~30% white */
--color-text-primary: oklch(93% 0 0);          /* pure white */
--color-text-secondary: oklch(70% 0 0);        /* ~60% white */
--color-text-muted: oklch(55% 0 0);            /* ~30% white, WCAG AA 4.5:1 vs bg-primary */
```

### Theme: Volume zone teal gradient
```css
/* BEFORE: Semantic red/yellow/green */
--color-chart-zone-under: oklch(63% 0.22 25);     /* red */
--color-chart-zone-minimum: oklch(75% 0.15 85);   /* yellow */
--color-chart-zone-optimal: oklch(65% 0.17 145);  /* green */
--color-chart-zone-high: oklch(70% 0.15 65);      /* orange */
--color-chart-zone-over: oklch(63% 0.22 25);      /* red */

/* AFTER: Teal gradient (light-to-dark intensity) */
/* Light teal = under-training, medium = optimal, dark = high volume */
--color-chart-zone-under: oklch(80% 0.08 185);    /* lightest teal */
--color-chart-zone-minimum: oklch(70% 0.10 185);  /* light-medium teal */
--color-chart-zone-optimal: oklch(60% 0.12 185);  /* medium teal (optimal) */
--color-chart-zone-high: oklch(48% 0.10 185);     /* dark teal */
--color-chart-zone-over: oklch(38% 0.08 185);     /* darkest teal */
```

### Migrating Legacy HSL References in ExerciseProgressChart
```typescript
// BEFORE: Legacy HSL
stroke="hsl(var(--accent))"
dot={{ r: 3, fill: 'hsl(var(--accent))' }}
stroke="hsl(var(--chart-success))"
stroke="hsl(var(--chart-primary))"

// AFTER: OKLCH via CSS variables
stroke="var(--color-accent)"
dot={{ r: 3, fill: 'var(--color-accent)' }}
stroke="var(--color-chart-success)"
stroke="var(--color-chart-primary)"
```

## Inventory of Changes

### Files Requiring Token-Only Changes (automatic via CSS variable propagation)
All 44 files using Tailwind `accent`/`bg-accent`/`text-accent` classes will automatically pick up new accent color when `--color-accent` is updated in index.css. **No file edits needed** for these.

### Files Requiring Manual Edits

| File | What to Change | Why |
|------|---------------|-----|
| `src/index.css` | All OKLCH token values in `@theme {}` | Central theme definition |
| `src/components/rotation/QuickStartCard.tsx` | `templateId` -> `planId` (3 occurrences) | BUG-01 fix |
| `src/components/workout/StartWorkout.tsx` | `templateId` -> `planId` (1 occurrence) | BUG-02 fix |
| `src/components/analytics/ExerciseProgressChart.tsx` | `hsl(var(--accent))` -> `var(--color-accent)`, `hsl(var(--chart-*))` -> `var(--color-chart-*)` | Legacy HSL removal |
| `src/components/analytics/MuscleHeatMap.tsx` | Hardcoded OKLCH values in JS (lines 28-33, 39-43, 80, 95) | Teal zone gradient + neutral default fill |
| `src/components/analytics/VolumeZoneIndicator.tsx` | Zone legend colors (currently uses `bg-error`, `bg-success`, `bg-warning`) | Needs teal zone indicators |
| `src/components/ExerciseForm.tsx` | `bg-orange-950/30` hardcoded Tailwind orange | Replace with teal equivalent |
| `src/components/ui/Button.tsx` | Possibly `text-black` -> `text-white` depending on teal lightness | Contrast |
| `src/components/workout/RestTimer.tsx` | Possibly `text-black` -> text color, `bg-black/10` -> appropriate overlay | Contrast on teal |

### Files Potentially Requiring text-black -> text-white
Depends on final teal accent lightness. If accent L >= 65%, black text works. If < 65%, these need updating:
- Button.tsx (line 24)
- RestTimer.tsx (line 93, 102, 109, 116, 122)
- PlanList.tsx (line 89)
- PlanBuilder.tsx (line 219)
- DataQualitySection.tsx (line 53)
- ExerciseSubstitution.tsx (line 136)
- PRIndicator.tsx (line 33)
- PRList.tsx (line 63)
- RotationSection.tsx (line 135)
- ToonExportSection.tsx (lines 161, 184, 207, 223)
- BackupSettings.tsx (lines 104, 114, 182)

### Border Radius Changes
- `src/index.css`: `--radius-lg: 1rem` -> `0.75rem` (16px -> 12px)
- `--radius-md`: `0.75rem` -> `0.625rem` (12px -> 10px)
- `rounded-2xl` (Tailwind built-in, 16px): 108 occurrences across 44 files. Replace with `rounded-xl` (12px) to match Apple-subtle feel.

### Shadow Changes
- `src/index.css`: Reduce shadow intensity. CONTEXT.md says "minimal -- rely on surface color difference for depth, not shadow."
- `src/components/ui/Card.tsx`: Currently uses `shadow-card`. May need to reduce or remove.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL color tokens | OKLCH color tokens | Tailwind v4 / 2024 | Better perceptual uniformity, easier to reason about lightness for contrast |
| Tailwind config.js theming | CSS-first `@theme {}` block | Tailwind v4 | All tokens in index.css, no JS config needed |
| `tailwind.config.js` | Minimal/empty (v4 auto-detect) | Already done | Config file exists but is mostly empty |

**Deprecated/outdated:**
- Legacy HSL tokens (`--accent`, `--chart-primary`, `--chart-success`, `--chart-muted`): Should be removed after migrating ExerciseProgressChart.tsx

## Open Questions

1. **Exact teal accent lightness for text-black vs text-white**
   - What we know: Current orange is L=72%, black text works. Teal at L >= 65% should also work with black.
   - What's unclear: The exact OKLCH values haven't been finalized. CONTEXT.md says "softer teal (muted blue-green, not vibrant)."
   - Recommendation: Start with `oklch(68% 0.10 185)` -- light enough for black text, muted enough to not be vibrant. Adjust after visual review.

2. **Volume zone teal gradient distinguishability**
   - What we know: 5 zones need to be visually distinct using only teal lightness variation
   - What's unclear: Whether 5 stops across a single hue provides enough visual distinction
   - Recommendation: Use a wide lightness range (38-80%) and slightly vary chroma too. Test with the volume bar chart.

3. **react-muscle-highlighter SVG fill and CSS variable support**
   - What we know: MuscleHeatMap currently hardcodes OKLCH values because "CSS variables may not work in SVG fill"
   - What's unclear: Whether modern browsers support CSS custom properties in SVG fill attributes
   - Recommendation: Keep hardcoded OKLCH approach for SVG fills (safest). Just update the values to teal gradient.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/index.css`, `src/stores/useRotationStore.ts`, `src/components/rotation/QuickStartCard.tsx`, `src/components/workout/StartWorkout.tsx`
- Direct codebase analysis: all 44 files referencing accent/chart colors
- Tailwind v4 `@theme {}` block pattern verified in existing `src/index.css`

### Secondary (MEDIUM confidence)
- OKLCH color space properties (perceptual uniformity, lightness = brightness) - well-established CSS Color Level 4 spec
- WCAG AA contrast ratio 4.5:1 requirement - W3C standard

### Tertiary (LOW confidence)
- Exact OKLCH token values in code examples are recommendations, not tested. Visual review needed after implementation.
- SVG CSS variable support claim needs browser testing

## Metadata

**Confidence breakdown:**
- Bug fixes (BUG-01, BUG-02): HIGH - root cause identified with exact line numbers
- Theme token architecture: HIGH - single source of truth in index.css, propagation via Tailwind classes
- Exact OKLCH values: LOW - recommendations only, need visual tuning
- Impact surface (which files need changes): HIGH - comprehensive grep/analysis done
- WCAG contrast compliance: MEDIUM - depends on final token values chosen

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (stable domain, no external dependencies changing)
