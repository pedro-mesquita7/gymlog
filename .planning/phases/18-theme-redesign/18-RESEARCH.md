# Phase 18: Theme Redesign - Research

**Researched:** 2026-02-01
**Domain:** CSS theming (OKLCH tokens, Tailwind v4 @theme, shadows, border-radius, Recharts styling)
**Confidence:** HIGH

## Summary

Phase 18 is a pure visual evolution of the existing OKLCH dark theme toward a warm, soft, modern aesthetic (Apple Health dark mode reference). The app already uses Tailwind v4 with `@theme` for CSS custom property tokens and OKLCH color space throughout. The work is mechanical: update token values in `index.css`, add new shadow/gradient tokens, increase border-radius values, and sweep through ~40 component files to apply the new radius and shadow classes.

The architecture is sound for this change. All colors flow through CSS custom properties defined in the `@theme` block in `index.css`. Tailwind v4 generates utility classes from these tokens (e.g., `bg-bg-primary`, `text-text-muted`). Changing token values propagates globally. The main risk is WCAG AA contrast regression when background lightness values shift warmer/brighter, and legacy HSL chart colors drifting from the new OKLCH palette.

**Primary recommendation:** Update tokens in `index.css` first (colors, radius, shadows), verify contrast ratios, then sweep components in batches (ui primitives, workout, templates, analytics/charts, settings/misc).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^4.1.18 | Utility-first CSS framework | Already in use; `@theme` directive manages all design tokens |
| @tailwindcss/postcss | ^4.1.18 | PostCSS integration | Already in use; processes `@theme` directives |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | ^3.7.0 | Chart rendering | Already in use; chart theming via CSS vars + inline `contentStyle` |
| react-muscle-highlighter | ^1.2.0 | SVG body diagram | Already in use; uses direct OKLCH fills, not CSS vars |
| framer-motion | ^12.29.2 | Page transitions | Already in use; no theme changes needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual OKLCH tokens | Design token tools (Style Dictionary) | Overkill for single-theme app, adds build complexity |
| Manual contrast checking | Automated WCAG CI tool | Good for future, out of scope for this phase |
| CSS gradients | SVG gradients | CSS linear-gradient() is simpler and sufficient for card backgrounds |

**Installation:**
```bash
# No new dependencies needed - zero new packages
```

## Architecture Patterns

### Token Architecture (Already In Place)
```
src/
  index.css           # @theme block: ALL color, radius, shadow tokens
  components/
    ui/
      Card.tsx         # Uses bg-bg-secondary, rounded-lg (from tokens)
      Button.tsx       # Uses bg-accent, rounded-lg
      Input.tsx        # Uses bg-bg-tertiary, border-border-secondary, rounded-lg
      Dialog.tsx       # Uses bg-bg-secondary, rounded-lg
      NumberStepper.tsx # Uses bg-bg-elevated, rounded-lg
    Navigation.tsx     # Tab bar: bg-bg-primary, border-t
    analytics/
      *Chart*.tsx      # Recharts: CSS var() in stroke/fill/contentStyle
    ...
```

### Pattern 1: Token-First Propagation
**What:** Change CSS custom property values in `@theme` and all components using those tokens update automatically.
**When to use:** For color changes (backgrounds, text, borders, semantic colors).
**Example:**
```css
/* src/index.css - @theme block */
@theme {
  /* BEFORE: cool gray */
  --color-bg-primary: oklch(18% 0.01 270);
  /* AFTER: warm dark gray */
  --color-bg-primary: oklch(16% 0.015 60);
}
```
All `bg-bg-primary` utility usages update globally. No component changes needed for pure token swaps.

### Pattern 2: New Token Addition for Shadows/Gradients
**What:** Add new CSS custom properties for shadows and card gradients, then apply via Tailwind utilities or custom classes.
**Example:**
```css
@theme {
  /* Shadow tokens - elevation system */
  --shadow-card: 0 2px 8px oklch(0% 0 0 / 0.25), 0 1px 3px oklch(0% 0 0 / 0.15);
  --shadow-elevated: 0 4px 16px oklch(0% 0 0 / 0.3), 0 2px 6px oklch(0% 0 0 / 0.2);

  /* Gradient token for card surface */
  --gradient-card: linear-gradient(to bottom, oklch(24% 0.015 60), oklch(22% 0.015 60));
}
```

### Pattern 3: Component-Level Style Sweep
**What:** Update individual component files to use new radius, shadow, and gradient classes.
**When to use:** When token-only propagation isn't enough (e.g., adding shadow classes, changing `rounded-lg` to `rounded-2xl`).
**Example:**
```tsx
// Card.tsx - BEFORE
const baseStyles = 'bg-bg-secondary rounded-lg p-4';

// Card.tsx - AFTER
const baseStyles = 'bg-bg-secondary rounded-2xl p-4 shadow-card';
```

### Pattern 4: Recharts Theming via CSS Variables
**What:** Pass CSS `var()` references into Recharts props for colors.
**When to use:** All chart components.
**Example:**
```tsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="var(--color-chart-muted)"
  strokeOpacity={0.3}
/>
<Tooltip
  contentStyle={{
    backgroundColor: 'var(--color-chart-tooltip-bg)',
    border: '1px solid var(--color-chart-tooltip-border)',
    borderRadius: '16px',  // Match new card radius
    color: 'var(--color-text-primary)',
  }}
/>
```

### Anti-Patterns to Avoid
- **Hardcoded color values in components:** Several components already have hardcoded OKLCH/HSL values (MuscleHeatMap, DemoDataSection, ExerciseProgressChart). These must be converted to CSS variable references or at least updated to match the new palette.
- **Mixing HSL and OKLCH:** The legacy `--chart-primary`, `--chart-success`, `--accent` HSL values (lines 51-56 of index.css) must be updated to match new OKLCH values. Components still referencing `hsl(var(--accent))` need migration.
- **Applying shadows to transparent/semi-transparent elements:** Shadows on `bg-bg-tertiary/50` elements look odd. Ensure card backgrounds are opaque when shadows are applied.
- **Over-applying gradients:** Only card backgrounds get gradients per the context decisions. Page headers, navigation, and buttons do not.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast checking | Custom OKLCH-to-luminance math | oklch.net, OddContrast, or Chrome DevTools contrast overlay | WCAG 2.2 contrast uses sRGB relative luminance; OKLCH L value is not 1:1 with WCAG luminance |
| Shadow elevation system | Complex multi-layer custom CSS per component | 2-3 `@theme` shadow tokens reused across all cards | Consistency; single source of truth |
| Dark theme gradient | Per-component gradient styles | Single `--gradient-card` token applied via utility class | DRY; easy to tune globally |
| Border radius consistency | Per-component radius values | Updated `--radius-*` tokens in `@theme` + Tailwind `rounded-*` utilities | Tailwind v4 maps `rounded-lg` etc. to custom properties |

**Key insight:** The existing `@theme` token system means 80% of the visual change happens in a single file (`index.css`). Component sweeps handle the remaining 20% (shadows, gradient classes, radius class upgrades, hardcoded color migration).

## Common Pitfalls

### Pitfall 1: WCAG Contrast Regression
**What goes wrong:** Changing background lightness (warmer, slightly brighter) while keeping text colors the same can drop below 4.5:1 contrast ratio.
**Why it happens:** OKLCH lightness (L) does not map directly to WCAG 2.2 relative luminance. A background at `oklch(20% 0.015 60)` may have different WCAG luminance than `oklch(20% 0.01 270)` because chroma and hue affect the sRGB conversion.
**How to avoid:** After changing every background token, compute contrast ratios using an sRGB-aware tool (Chrome DevTools, WebAIM, OddContrast). Test all pairings: bg-primary/text-primary, bg-secondary/text-primary, bg-secondary/text-secondary, bg-secondary/text-muted, bg-tertiary/text-muted.
**Warning signs:** Text looks faint or washed out on warm backgrounds; muted text disappears.

### Pitfall 2: Legacy HSL Variables Drifting
**What goes wrong:** The legacy HSL variables (`--chart-primary`, `--chart-success`, `--accent`) on lines 51-56 of `index.css` are used by `ExerciseProgressChart.tsx` via `hsl(var(--accent))`. If only OKLCH tokens are updated, charts will show mismatched colors.
**Why it happens:** Two parallel color systems (OKLCH tokens + legacy HSL) exist for backward compatibility.
**How to avoid:** Update legacy HSL values to match new OKLCH values, OR migrate all `hsl(var(--...))` references to use OKLCH CSS variable references directly (e.g., `var(--color-accent)`).
**Warning signs:** Chart lines are a different shade of orange than buttons; visual inconsistency between charts and UI.

### Pitfall 3: MuscleHeatMap Hardcoded Colors
**What goes wrong:** `MuscleHeatMap.tsx` has OKLCH colors hardcoded directly in the component (lines 28-32, 39-43) and a hex `#3f3f3f` for `defaultFill`. These won't update when tokens change.
**Why it happens:** SVG fill attributes may not reliably resolve CSS custom properties in all browsers, so colors were hardcoded.
**How to avoid:** Update the hardcoded OKLCH values in the component to match the new warm palette. Test SVG fill with CSS variables; if they work in target browsers, migrate to `var()`. If not, update the literal values.
**Warning signs:** Body diagram colors look cool/blue while rest of app is warm.

### Pitfall 4: Opaque Backgrounds Required for Shadows
**What goes wrong:** Cards using `bg-bg-tertiary/50` (50% opacity) with box-shadow show the shadow bleeding through the semi-transparent background.
**Why it happens:** `box-shadow` renders behind the element; if the element is semi-transparent, the shadow is visible through it.
**How to avoid:** Cards that get shadows must have opaque backgrounds. Replace `bg-bg-tertiary/50` usages with opaque equivalents or a dedicated surface token.
**Warning signs:** Shadowed cards look dirty or have dark patches.

### Pitfall 5: Border Removal Without Shadow Replacement
**What goes wrong:** The context specifies "cards float above background with soft drop shadows (raised, no border)". Removing `border border-border-primary` without adding shadow makes cards invisible against the background.
**Why it happens:** On dark themes, without either border or shadow, two adjacent dark surfaces merge visually.
**How to avoid:** Always add shadow when removing border. Do both changes together in the same commit.
**Warning signs:** Cards disappear into background; layout looks flat and undefined.

### Pitfall 6: Navigation/Tab Bar Special Treatment
**What goes wrong:** The bottom navigation currently uses `border-t border-border-primary`. Moving to the new warm aesthetic requires a complete restyle (warm background, rounded active indicator, softer states) not just a token swap.
**Why it happens:** Navigation has unique visual requirements (fixed position, active state indicators, icon/text alignment).
**How to avoid:** Plan navigation as a dedicated task with its own design treatment. Consider: warm translucent background, rounded pill indicator for active tab, smooth color transitions.
**Warning signs:** Navigation looks disconnected from the rest of the redesigned app.

## Code Examples

### Example 1: Updated @theme Token Block (Warm Dark Palette)
```css
/* src/index.css */
@theme {
  /* Background layers - warm dark progression */
  --color-bg-primary: oklch(16% 0.015 60);     /* page bg - warm near-black */
  --color-bg-secondary: oklch(21% 0.015 60);   /* card surfaces */
  --color-bg-tertiary: oklch(26% 0.015 60);    /* inputs, hover states */
  --color-bg-elevated: oklch(30% 0.015 60);    /* active states */

  /* Text hierarchy - verify contrast after bg changes */
  --color-text-primary: oklch(92% 0.005 60);   /* warm white */
  --color-text-secondary: oklch(73% 0.01 60);  /* warm gray labels */
  --color-text-muted: oklch(60% 0.01 60);      /* warm muted */

  /* Borders */
  --color-border-primary: oklch(27% 0.015 60);
  --color-border-secondary: oklch(38% 0.015 60);

  /* Border radius - updated for soft/rounded feel */
  --radius-sm: 0.5rem;    /* 8px */
  --radius-md: 0.75rem;   /* 12px */
  --radius-lg: 1rem;      /* 16px */

  /* Shadow elevation tokens */
  --shadow-card: 0 2px 8px oklch(0% 0 0 / 0.3), 0 1px 2px oklch(0% 0 0 / 0.2);
  --shadow-elevated: 0 8px 24px oklch(0% 0 0 / 0.4), 0 2px 6px oklch(0% 0 0 / 0.2);
}
```
**Note:** Exact OKLCH values are illustrative. Final values require contrast verification. Hue 60 gives a warm tone; chroma 0.015 keeps it muted. Adjust L values to maintain WCAG 4.5:1 against text tokens.

### Example 2: Card Component with Shadow + Gradient
```tsx
// src/components/ui/Card.tsx
export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const baseStyles = 'bg-bg-secondary rounded-2xl p-4 shadow-card';
  // Gradient applied via CSS class or inline style
  // style={{ background: 'var(--gradient-card)' }}
  // ...
}
```

### Example 3: Navigation Restyle
```tsx
// src/components/Navigation.tsx
<nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-md">
  <div className="max-w-2xl mx-auto flex">
    <button
      className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative ${
        isActive
          ? 'text-accent'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {isActive && (
        <span className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-full" />
      )}
      {label}
    </button>
  </div>
</nav>
```

### Example 4: Migrating Legacy HSL Chart References
```tsx
// BEFORE: ExerciseProgressChart.tsx
stroke="hsl(var(--accent))"
dot={{ r: 3, fill: 'hsl(var(--accent))' }}

// AFTER: Use OKLCH CSS variable directly
stroke="var(--color-accent)"
dot={{ r: 3, fill: 'var(--color-accent)' }}
```

### Example 5: Chart Tooltip with Updated Radius
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'var(--color-chart-tooltip-bg)',
    border: 'none',
    borderRadius: '16px',
    color: 'var(--color-text-primary)',
    boxShadow: 'var(--shadow-card)',
  }}
/>
```

## Codebase Audit

### Files Requiring Changes

**Token file (1 file - propagates globally):**
- `src/index.css` - All token values, new shadow/gradient tokens

**UI primitives (5 files - high leverage):**
- `src/components/ui/Card.tsx` - Add shadow, upgrade radius
- `src/components/ui/Button.tsx` - Upgrade radius
- `src/components/ui/Input.tsx` - Upgrade radius, remove border (or soften)
- `src/components/ui/Dialog.tsx` - Add shadow, upgrade radius
- `src/components/ui/NumberStepper.tsx` - Upgrade radius

**Workout components (8 files):**
- `src/components/workout/SetRow.tsx` - Card-like surface, radius
- `src/components/workout/SetGrid.tsx` - Spacing (minimal)
- `src/components/workout/SetLogger.tsx` - Radius
- `src/components/workout/ExerciseView.tsx` - Radius, borders
- `src/components/workout/ActiveWorkout.tsx` - Border separator
- `src/components/workout/WorkoutComplete.tsx` - Stat cards, warning cards, radius
- `src/components/workout/RestTimer.tsx` - Banner radius
- `src/components/workout/ProgressionAlert.tsx` - Card radius
- `src/components/workout/StartWorkout.tsx` - Details accordion
- `src/components/workout/RecentWorkoutCard.tsx` - Card radius
- `src/components/workout/ExerciseSubstitution.tsx` - Radius, borders

**Template components (4 files):**
- `src/components/templates/TemplateCard.tsx` - Card uses Card component (inherits), dropdown menu
- `src/components/templates/TemplateBuilder.tsx` - Form elements, radius
- `src/components/templates/TemplateList.tsx` - Button, radius
- `src/components/templates/ExerciseRow.tsx` - Row element, radius

**Analytics/chart components (12 files):**
- `src/components/analytics/ExerciseProgressChart.tsx` - HSL->OKLCH migration, tooltip, grid
- `src/components/analytics/VolumeBarChart.tsx` - Tooltip, bar radius
- `src/components/analytics/MuscleHeatMap.tsx` - Hardcoded OKLCH + hex, card radius
- `src/components/analytics/ChartContainer.tsx` - Minimal (wrapper)
- `src/components/analytics/SummaryStatsCards.tsx` - Card radius, border removal, shadow
- `src/components/analytics/ProgressionStatusCard.tsx` - Card radius
- `src/components/analytics/ProgressionDashboard.tsx` - Card radius
- `src/components/analytics/WeekComparisonCard.tsx` - Card radius
- `src/components/analytics/PRListCard.tsx` - Card radius
- `src/components/analytics/CollapsibleSection.tsx` - Border treatment
- `src/components/analytics/TimeRangePicker.tsx` - Pill radius
- `src/components/analytics/AnalyticsPage.tsx` - Container backgrounds, radius
- `src/components/analytics/VolumeLegend.tsx` - Radius
- `src/components/analytics/VolumeZoneIndicator.tsx` - Indicator dots
- `src/components/analytics/SectionHeading.tsx` - Border treatment

**Navigation (1 file):**
- `src/components/Navigation.tsx` - Full restyle

**Settings/backup/other (7 files):**
- `src/components/settings/DemoDataSection.tsx` - Hardcoded OKLCH gradients, radius
- `src/components/settings/ObservabilitySection.tsx` - Radius
- `src/components/settings/DataQualitySection.tsx` - Radius
- `src/components/settings/RotationSection.tsx` - Radius
- `src/components/settings/ToonExportSection.tsx` - Radius
- `src/components/backup/BackupSettings.tsx` - Toggle, buttons, radius
- `src/components/backup/BackupReminder.tsx` - Banner

**Other top-level (5 files):**
- `src/App.tsx` - Header, demo warning banner
- `src/components/ExerciseList.tsx` - List items, borders
- `src/components/ExerciseForm.tsx` - Form, borders
- `src/components/GymList.tsx` - List items, borders
- `src/components/GymForm.tsx` - Form, borders
- `src/components/DeleteConfirmation.tsx` - Modal
- `src/components/history/PRIndicator.tsx` - Badge
- `src/components/history/PRList.tsx` - List items
- `src/components/history/ExerciseHistory.tsx` - Card, borders
- `src/components/history/EstimatedMaxDisplay.tsx` - Display
- `src/components/rotation/QuickStartCard.tsx` - Hero card, border
- `src/components/rotation/RotationEditor.tsx` - Row, border
- `src/components/ui/ErrorCard.tsx` - Error display

### Hardcoded Colors to Migrate
| File | Line(s) | Current Value | Issue |
|------|---------|---------------|-------|
| ExerciseProgressChart.tsx | 81,83,90,100,109,124 | `hsl(var(--accent))`, `hsl(var(--chart-success))`, `hsl(var(--chart-primary))` | Legacy HSL references |
| MuscleHeatMap.tsx | 28-32, 39-43, 80, 95 | Hardcoded OKLCH values, `#3f3f3f` hex | Direct color literals |
| DemoDataSection.tsx | 89, 127 | `oklch(0.65_0.18_60)`, `oklch(0.60_0.15_35)` in Tailwind arbitrary values | Hardcoded gradient colors |

### Radius Audit Summary
- **`rounded-lg`**: 96 occurrences across 36 files (primary target for radius upgrade)
- **`rounded-md`**: 3 occurrences (TimeRangePicker pills, ObservabilitySection, QuickStartCard)
- **`rounded-full`**: 9 occurrences (badges, indicators, toggles - keep as-is)
- **`rounded-none`**: 4 occurrences (TemplateCard dropdown menu items - keep or update)
- **`rounded-sm`**: 0 occurrences
- **Border usage**: 59 border occurrences across 33 files (many will be removed for shadow-based cards)

### Shadow Audit
- Current shadow usage: Only 2 instances (`shadow-lg` in TemplateCard dropdown and PRIndicator badge)
- All cards currently use borders instead of shadows

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL color space | OKLCH color space | 2023-2024 | Perceptually uniform, better for palette generation |
| `tailwind.config.js` theme | `@theme` directive in CSS | Tailwind v4 (2024) | CSS-native tokens, no build config |
| Flat dark cards with borders | Elevated cards with soft shadows | 2024 design trend | Modern depth without harsh edges |
| Sharp corners (4-8px) | Rounded corners (12-16px+) | iOS/Apple design influence | Soft, approachable feel |

**Deprecated/outdated:**
- HSL color values for OKLCH apps: The legacy HSL variables in this codebase are backward compat only and should be migrated
- `tailwind.config.js` theme extension: Not needed in Tailwind v4; `@theme` in CSS is the standard

## Open Questions

1. **SVG fill with CSS variables in react-muscle-highlighter**
   - What we know: The MuscleHeatMap comment says "CSS variables may not work in SVG fill." Colors are hardcoded as a workaround.
   - What's unclear: Whether modern browsers (2025+) handle `var()` in SVG fill attributes reliably.
   - Recommendation: Test with CSS variables. If they work, migrate. If not, update hardcoded values to match new warm palette.

2. **Tailwind v4 shadow token integration**
   - What we know: `@theme` supports custom properties. Tailwind v4 has built-in `shadow-*` utilities.
   - What's unclear: Whether custom `--shadow-card` tokens defined in `@theme` automatically create `shadow-card` utility classes in Tailwind v4.
   - Recommendation: Test the token naming convention. If Tailwind v4 doesn't auto-generate the utility, use `shadow-[var(--shadow-card)]` arbitrary value syntax or define shadows in `@layer utilities`.

3. **Exact OKLCH warm values for WCAG compliance**
   - What we know: Hue ~60 with low chroma creates warm dark tones. L values need to maintain 4.5:1 against text.
   - What's unclear: Exact L/C/H combinations that simultaneously feel "warm" AND maintain WCAG AA ratios.
   - Recommendation: Start with proposed values, verify each bg/text pairing in Chrome DevTools or OddContrast, adjust L as needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/index.css` - Current OKLCH token system, Tailwind v4 @theme directive
- Codebase analysis: All 40+ component files - Exhaustive audit of class usage patterns
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) - @theme directive behavior
- [Recharts Customize Guide](https://recharts.github.io/en-US/guide/customize/) - Chart styling approach

### Secondary (MEDIUM confidence)
- [OddContrast](https://www.oddcontrast.com/) - OKLCH-aware contrast checking tool
- [Evil Martians OKLCH Guide](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - OKLCH theming patterns
- [Josh W. Comeau - Designing Beautiful Shadows](https://www.joshwcomeau.com/css/designing-shadows/) - Layered shadow best practices
- [oklch.net](https://oklch.net/) - OKLCH color picker for token tuning
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - sRGB-based WCAG 2.2 verification
- [Manuel Strehl - Easy Theming with OKLCH](https://manuel-strehl.de/easy_theming_with_oklch) - OKLCH dark mode patterns

### Tertiary (LOW confidence)
- [shadcn/ui Chart Components](https://ui.shadcn.com/docs/components/chart) - Recharts + CSS variable pattern reference (not directly used but validates approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; entire change is within existing Tailwind v4 + OKLCH system
- Architecture: HIGH - Token propagation pattern verified by codebase audit; @theme directive well-understood
- Pitfalls: HIGH - All pitfalls identified from direct codebase analysis (hardcoded colors, HSL legacy, contrast risks)
- Component scope: HIGH - Exhaustive file-by-file audit completed with specific line references

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable domain; tokens and CSS patterns don't change rapidly)
