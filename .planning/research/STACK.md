# Stack Research: v1.4 Exercise Comparison, Theme Redesign, UX Tightening

**Project:** GymLog PWA
**Researched:** 2026-02-01
**Overall confidence:** HIGH
**Mode:** Ecosystem (stack dimension for subsequent milestone)

---

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Comparison view charting | **No new library** - use existing Recharts + custom stat cards | v1.4 comparison is stat cards, not overlaid chart lines. Recharts already handles individual exercise charts. |
| Soft/modern theme | **Evolve existing OKLCH tokens** - no new CSS library | Current 18-token system is well-structured. Adjust L/C values, add shadow + gradient tokens. |
| Fonts | **Keep Geist Sans + Geist Mono** | Geist is already modern, clean, Apple-adjacent. Switching fonts is high-churn, low-value. |
| CSS animations | **No animation library** - use Tailwind `@theme` `--animate-*` + existing framer-motion | Tailwind CSS 4 natively supports `--animate-*` namespace for custom keyframes. framer-motion (already installed) handles orchestrated transitions. |
| Glassmorphism/blur | **Selective `backdrop-filter` via Tailwind** - no library needed | CSS `backdrop-filter` is well-supported (92%+ in 2025). Use sparingly (2-3 elements max per viewport) for performance. |
| Collapsible sections | **Enhance existing `CollapsibleSection`** - already built with native `<details>` | Component exists at `src/components/analytics/CollapsibleSection.tsx`. Just needs styling refinement. |
| Drag reordering | **Existing `@dnd-kit`** handles settings tab reorder | Already in dependencies (`@dnd-kit/core` ^6.3.1, `@dnd-kit/sortable` ^10.0.0). |

---

## No New Dependencies Required

v1.4 requires **zero new npm packages**. Every capability needed is covered by the existing stack or native CSS/Tailwind features.

This is the correct outcome for a UX/theme refinement milestone. Adding libraries here would be scope creep.

---

## Theme Approach: Evolving OKLCH Tokens for Soft/Modern Dark

### Current State

The app has 18 OKLCH tokens in `src/index.css` under `@theme {}`. The current aesthetic is "Linear/Notion" - clean but slightly stark. The theme uses:
- Background layers: L=18%/22%/27%/30%, C=0.01, H=270 (cool gray)
- Text: L=90%/72%/59%, low chroma
- Accent: orange at oklch(72% 0.19 45)
- Border radius: 6px/8px/12px

### Changes for Apple Health / Soft Modern Style

**1. Increase border radius across the board**

Current radius tokens are conservative. Apple Health uses generous rounding (16px-20px for cards, 12px for buttons).

```css
@theme {
  /* Current → New */
  --radius-sm: 0.5rem;    /* was 0.375rem (6px) → 8px */
  --radius-md: 0.75rem;   /* was 0.5rem (8px) → 12px */
  --radius-lg: 1rem;      /* was 0.75rem (12px) → 16px */
  --radius-xl: 1.25rem;   /* NEW: 20px - hero cards, modals */
}
```

**2. Add soft shadow tokens**

Apple Health uses subtle, layered shadows for depth rather than borders. Tailwind CSS 4 `@theme` supports `--shadow-*` namespace natively.

```css
@theme {
  --shadow-soft: 0 2px 8px oklch(0% 0 0 / 0.15), 0 1px 3px oklch(0% 0 0 / 0.1);
  --shadow-card: 0 4px 16px oklch(0% 0 0 / 0.2), 0 2px 6px oklch(0% 0 0 / 0.1);
  --shadow-elevated: 0 8px 32px oklch(0% 0 0 / 0.25), 0 4px 12px oklch(0% 0 0 / 0.15);
  --shadow-glow-accent: 0 0 20px oklch(72% 0.19 45 / 0.15);
}
```

These generate `shadow-soft`, `shadow-card`, `shadow-elevated`, `shadow-glow-accent` utilities automatically.

**3. Warm the background hue slightly**

Apple Health backgrounds are warmer than pure cool gray. Shift hue from 270 (blue-gray) toward 260-265 (slightly warmer) and increase lightness slightly for the "softer" feel.

```css
@theme {
  /* Warmer, slightly lifted backgrounds */
  --color-bg-primary: oklch(16% 0.008 260);     /* was 18% 0.01 270 - darker but warmer */
  --color-bg-secondary: oklch(21% 0.008 260);   /* was 22% 0.01 270 */
  --color-bg-tertiary: oklch(26% 0.01 260);     /* was 27% 0.01 270 */
  --color-bg-elevated: oklch(30% 0.012 260);    /* was 30% 0.01 270 - subtle warmth */
}
```

**4. Add gradient tokens for soft card headers**

Apple Health uses subtle gradients on cards. Define as CSS custom properties (not `@theme` since gradients are not a Tailwind namespace). Use `:root` for these.

```css
:root {
  --gradient-card-subtle: linear-gradient(
    135deg,
    oklch(24% 0.015 260) 0%,
    oklch(21% 0.008 260) 100%
  );
  --gradient-accent-soft: linear-gradient(
    135deg,
    oklch(72% 0.19 45 / 0.08) 0%,
    oklch(72% 0.12 45 / 0.03) 100%
  );
}
```

**5. Add transition/animation tokens**

Tailwind CSS 4 `@theme` supports `--animate-*` and `--ease-*` namespaces. Define smooth micro-interactions.

```css
@theme {
  --ease-soft: cubic-bezier(0.25, 0.1, 0.25, 1.0);
  --ease-bounce-soft: cubic-bezier(0.34, 1.56, 0.64, 1.0);

  --animate-fade-in: fade-in 0.2s var(--ease-soft);
  --animate-slide-up: slide-up 0.25s var(--ease-soft);
  --animate-scale-in: scale-in 0.15s var(--ease-soft);

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
}
```

This generates `animate-fade-in`, `animate-slide-up`, `animate-scale-in` utilities. Use for card entry animations instead of framer-motion where simple CSS suffices (less JS overhead).

**6. Optional: selective backdrop-filter for hero elements**

For 1-2 key surfaces (e.g., bottom nav, comparison header), add frosted glass:

```css
.glass-surface {
  backdrop-filter: blur(12px) saturate(1.2);
  background: oklch(21% 0.008 260 / 0.7);
  border: 1px solid oklch(38% 0.01 260 / 0.3);
}
```

Performance constraint: limit to 2-3 elements per viewport. Do NOT apply to scrollable list items.

### What NOT to Change

- **Do NOT change fonts.** Geist Sans is modern and Apple-adjacent. Font swaps are high-churn refactors for minimal visual gain.
- **Do NOT add a CSS-in-JS library.** Tailwind + OKLCH tokens handle everything.
- **Do NOT adopt a component library (shadcn, Radix, etc.).** The app already has Card, Button, Input, Dialog primitives. Adding a component library mid-project creates inconsistency.
- **Do NOT switch from OKLCH to hex/HSL.** OKLCH is the right choice. It makes the soft theme trivially achievable by lowering chroma values.

---

## Comparison View Stack

### Architecture: Stat Cards, Not Overlaid Charts

The v1.4 comparison feature is side-by-side stat cards comparing 2-3 exercises. This is NOT a chart-overlay problem. It is a layout + data problem.

**What exists already:**
- `WeekComparisonCard` - shows week-over-week stats for one exercise (grid layout, percentage changes)
- `SummaryStatsCards` - shows grid of stat values
- `Card` component - base card with `default` and `interactive` variants
- `ChartContainer` + `ExerciseProgressChart` - individual exercise progress lines
- DuckDB SQL queries for PRs, volume, frequency data

**What to build (no new libraries):**
- `ExerciseComparisonCard` - a new composite component showing side-by-side stats
- Uses CSS Grid (`grid-cols-2` or `grid-cols-3`) for horizontal comparison
- Each column: exercise name, PR weight, volume trend, frequency, last session date
- Optional: small sparkline per exercise using existing Recharts `LineChart` with minimal config (no axes, no grid, just a line)

**Sparkline pattern with existing Recharts:**
```tsx
<LineChart width={80} height={30} data={recentData}>
  <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={1.5} dot={false} />
</LineChart>
```

No `ResponsiveContainer` needed for fixed-size sparklines. This is a well-documented Recharts pattern.

### Data Layer

Comparison queries already have foundations in DuckDB:
- PR data: `int_sets__with_prs.sql` exists
- Volume aggregation: existing analytics queries
- New SQL needed: cross-exercise comparison view (simple `UNION ALL` or `PIVOT` of existing per-exercise queries)

---

## What NOT to Add (and Why)

| Library Considered | Why Rejected |
|-------------------|-------------|
| **Nivo** (@nivo/core) | Heavier than Recharts, would introduce second charting library. Recharts already handles all chart types needed. |
| **Victory** (victory-native) | React Native focused. Not relevant for web PWA. |
| **Chart.js / react-chartjs-2** | Canvas-based (not SVG). Would conflict with existing Recharts SVG approach. No benefit for stat cards. |
| **Radix UI / shadcn** | Component library adds 15-30 new dependencies. App already has Card, Button, Input, Dialog. Not worth the migration churn. |
| **Headless UI** | Only needed for complex dropdowns/comboboxes not in scope for v1.4. |
| **tailwind-animate** | Unnecessary. Tailwind CSS 4 `@theme` `--animate-*` namespace provides the same capability natively without an extra dependency. |
| **@tailwindcss/typography** | Not needed. App is data-focused, not content/prose focused. |
| **clsx / tailwind-merge** | Nice-to-have for className merging, but the app has been fine without them. Not worth adding mid-project. |
| **Tremor** | Dashboard component library built on Recharts. Would add significant bundle weight and styling conflicts with the custom OKLCH system. |
| **Vaul (drawer)** | Bottom sheet library. Could be useful for mobile exercise selection, but `<details>` + existing Dialog handle current UX needs. Defer to v1.5 if needed. |

---

## Integration Notes

### framer-motion: Keep for Orchestrated Transitions Only

The app uses `LazyMotion` with `domAnimation` features (tree-shaken bundle). Current usage in `App.tsx`:
- Page transitions via `AnimatePresence` + `m` components
- This is the correct use: orchestrated enter/exit transitions that CSS cannot handle

For v1.4, use framer-motion for:
- Comparison card enter/exit when exercises are added/removed from comparison
- Collapsible section smooth height animation (if `<details>` native animation is insufficient)

For everything else (hover effects, card entry, fade-in), use the new Tailwind `--animate-*` tokens. CSS animations are cheaper than JS-driven ones.

### Recharts: No Changes Needed

Current Recharts 3.7.0 usage is correct:
- `ResponsiveContainer` wrapping for responsive charts
- CSS variable references for colors (`var(--color-chart-*)`)
- Memoized data props

For comparison view sparklines, use Recharts `LineChart` at fixed dimensions without `ResponsiveContainer`. This is a documented pattern for small inline charts.

### Tailwind CSS 4: Already Well-Configured

Current setup uses `@tailwindcss/postcss` plugin (v4.1.18). The `@theme` directive is already in use for OKLCH tokens. The `tailwind.config.js` file exists but is minimal (just content paths) - Tailwind CSS 4 primarily uses the CSS-first approach, which the project already follows.

Key Tailwind 4 features to leverage for v1.4:
- `--shadow-*` namespace for soft shadows (generates `shadow-soft`, `shadow-card` utilities)
- `--radius-*` namespace update (increase all values)
- `--animate-*` namespace for micro-interactions (generates `animate-fade-in`, etc.)
- `--ease-*` namespace for custom timing functions
- Container queries via `--container-*` if comparison cards need responsive behavior within their container

### OKLCH: The Right Tool for Soft Theme

OKLCH makes the "soft modern" theme adjustment trivial:
- **Softer backgrounds**: Lower L (lightness) by 1-2%, shift H (hue) warmer
- **Muted accents**: Lower C (chroma) for secondary accent uses
- **Consistent contrast**: L controls perceived lightness linearly, so WCAG calculations remain predictable
- **Derived states**: Use `oklch(from var(--color-accent) calc(l * 0.8) c h)` for hover states (CSS relative color syntax, 92%+ support)

### Legacy HSL Cleanup

The current `index.css` still has legacy HSL tokens:
```css
--chart-primary: 220 70% 50%;
--chart-success: 142 76% 36%;
--chart-muted: 240 5% 65%;
--accent: 16 100% 50%;
```

And `ExerciseProgressChart.tsx` still references `hsl(var(--accent))` and `hsl(var(--chart-success))`. v1.4 theme redesign is the right time to migrate these last HSL references to OKLCH, eliminating the dual color system.

---

## Token Migration Plan (Theme Redesign)

### Phase 1: Update existing tokens (non-breaking)
- Adjust L/C/H on all 18 existing OKLCH tokens for softer look
- Increase all `--radius-*` values
- Add `--shadow-*` tokens (new)
- Add `--animate-*` and `--ease-*` tokens (new)

### Phase 2: Migrate legacy HSL (breaking for chart components)
- Replace `--chart-primary`, `--chart-success`, `--chart-muted`, `--accent` HSL tokens with OKLCH equivalents
- Update `ExerciseProgressChart.tsx` to use `var(--color-accent)` instead of `hsl(var(--accent))`
- Remove legacy HSL block from `index.css`

### Phase 3: Component styling updates
- Update `Card` component: add `shadow-soft`, increase rounding to `rounded-lg` (now 16px)
- Update `CollapsibleSection`: smoother styling, optional animation
- Apply gradient tokens to key surfaces

### Estimated Token Count After v1.4

| Category | Current | After v1.4 |
|----------|---------|------------|
| Background colors | 4 | 4 (adjusted values) |
| Text colors | 3 | 3 (adjusted values) |
| Border colors | 2 | 2 (adjusted values) |
| Accent colors | 3 | 3 (adjusted values) |
| Semantic colors | 3 | 3 |
| Chart colors | 3 OKLCH + 5 zone + 2 tooltip | 3 + 5 + 2 (adjusted) |
| Legacy HSL | 4 | **0 (removed)** |
| Shadows | 0 | **4 (new)** |
| Radius | 3 | **4 (expanded)** |
| Animations | 0 | **3 (new)** |
| Easing | 0 | **2 (new)** |
| **Total** | **~32** | **~38** |

---

## Sources

- [Tailwind CSS 4 Theme Variables](https://tailwindcss.com/docs/theme) - Official docs confirming `--shadow-*`, `--animate-*`, `--radius-*` namespaces (HIGH confidence)
- [Tailwind CSS 4 Functions and Directives](https://tailwindcss.com/docs/functions-and-directives) - `@theme` directive documentation (HIGH confidence)
- [OKLCH: The Modern CSS Color Space (2025)](https://medium.com/@alexdev82/oklch-the-modern-css-color-space-you-should-be-using-in-2025-52dd1a4aa9d0) - OKLCH soft theme approach (MEDIUM confidence)
- [OKLCH in CSS - Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - OKLCH design token patterns (HIGH confidence)
- [Recharts Official](https://recharts.github.io/en-US/) - Composable chart components, sparkline patterns (HIGH confidence)
- [Apple HIG - Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) - Apple dark mode design principles (HIGH confidence)
- [Inclusive Dark Mode - Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) - Accessible dark theme patterns (MEDIUM confidence)
- [backdrop-filter - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) - Browser support and usage (HIGH confidence)
- [Next-level frosted glass - Josh Comeau](https://www.joshwcomeau.com/css/backdrop-filter/) - Performance considerations for backdrop-filter (MEDIUM confidence)
