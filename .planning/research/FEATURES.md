# Features Research: v1.4 Exercise Comparison, UX Tightening, Theme Redesign

**Domain:** Fitness/Strength Training Tracker (PWA)
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (competitive analysis verified, design patterns well-documented)

---

## 1. Exercise Comparison

### How Competitors Do It

**Hevy** (the most mature comparison feature in the space):
- Social-first: compare your stats with another user on shared exercises
- Side-by-side view shows muscle split distribution (bar chart), total volume, workout count, time trained, exercises in common
- Per-exercise comparison accessed via "Compare" button on shared movements
- Time range filters: 30 days, 3 months, 1 year, all time
- Your data in blue, theirs in grey on the same chart

**Strong:**
- No direct exercise-to-exercise comparison feature
- Focuses on single-exercise progression over time (weight chart, 1RM chart, volume chart)
- Previous performance shown inline during workouts for progressive overload reference

**JEFIT:**
- Social comparison with friends via leaderboards
- Exercise-level records comparison
- Body measurement comparison (less relevant for pure strength tracking)

**Key insight:** No major competitor offers a **self-comparison** between two of your own exercises (e.g., comparing Bench Press vs Overhead Press progression). This is what GymLog v1.4 targets -- comparing your own exercises side-by-side, not social comparison.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Side-by-side stat cards for 2+ exercises | Core value proposition of comparison | Medium | Existing PR data, progression status |
| PR comparison (weight PR, estimated 1RM) | Most meaningful strength metric to compare | Low | `int_sets__with_prs.sql` already computes this |
| Volume comparison (total sets per week/month) | Second most important metric after strength | Low | `useVolumeAnalytics` already aggregates |
| Frequency comparison (sessions per time period) | How often you train each exercise | Low | Session count available from progression hook |
| Progression status comparison (progressing/plateau/regressing) | Already have this data, obvious to include | Low | `useProgressionStatus` hook exists |
| Exercise selector (pick 2-3 exercises to compare) | Users must choose what to compare | Medium | Exercise list already available |
| Time range consistency with analytics page | Users expect same 1M/3M/6M/1Y/All filter | Low | `TimeRangePicker` component exists |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Muscle group auto-suggest (compare within same group) | Reduces selection friction, surfaces meaningful comparisons | Low | `muscle_group` field on exercises |
| Sparkline mini-charts on comparison cards | Visual trend at a glance without full chart view | Medium | Recharts already in bundle |
| "Which is stronger?" summary verdict | Opinionated insight, not just raw data | Low | Computed from PR data |
| Comparison shareable as image/screenshot | Social sharing without social features | High | Canvas/HTML-to-image needed |
| Historical comparison (your bench press: Jan vs now) | Self-vs-self over time, not exercise-vs-exercise | Medium | Requires date-windowed queries |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social/user-to-user comparison | Requires accounts, server infra, privacy concerns. Out of scope for local-first PWA | Focus on self-comparison between your own exercises |
| Full chart overlay (two exercise lines on same chart) | Confusing when scales differ (e.g., 100kg bench vs 60kg OHP). Hard to read on mobile | Use side-by-side cards with consistent stat layout |
| Unlimited exercise comparison (4+ at once) | Becomes unreadable on mobile. More than 3 creates cognitive overload | Cap at 2-3 exercises. Suggest 2 as default |
| Auto-generated comparison recommendations | "You should compare these exercises" feels presumptuous without understanding user's program | Let user choose. Optionally suggest within same muscle group |
| Comparison requiring minimum data threshold | Blocking comparison because "not enough data" is frustrating | Show what data exists with "insufficient data" labels on missing metrics |

### Recommended Comparison Card Layout

Based on competitive analysis, each comparison card should show:

```
+---------------------------+  +---------------------------+
| Bench Press               |  | Overhead Press            |
| Chest                     |  | Shoulders                 |
|                           |  |                           |
| Weight PR:  100kg         |  | Weight PR:  60kg          |
| Est 1RM:    112kg         |  | Est 1RM:    67kg          |
| Volume/wk:  24 sets       |  | Volume/wk:  18 sets       |
| Frequency:  2.1x/wk      |  | Frequency:  1.8x/wk      |
| Status:     Progressing   |  | Status:     Plateau       |
| Last PR:    3 days ago    |  | Last PR:    6 weeks ago   |
+---------------------------+  +---------------------------+
```

On mobile (< 640px), stack vertically rather than side-by-side. Use consistent row alignment so metrics line up visually even when stacked.

---

## 2. Theme Redesign (Soft/Modern Dark)

### What Makes Apple Health / Strava / Nike Training Club Feel "Soft"

Based on research into dark mode design patterns and analysis of GymLog's current theme:

**Current GymLog theme analysis:**
- Background: `oklch(18% 0.01 270)` -- already a good soft dark gray, not pure black
- Cards: `oklch(22% 0.01 270)` -- appropriate elevation step
- Border radius: `0.375rem / 0.5rem / 0.75rem` (6px/8px/12px) -- on the conservative side
- No shadows currently used (flat design)
- No gradients on surfaces
- Accent: vibrant orange `oklch(72% 0.19 45)` -- high saturation, which is energetic but not "soft"

**What "soft" means in concrete CSS terms:**

1. **Larger border-radius**: Apple Health uses 16-20px radius on cards. Current 8-12px feels more Linear/Notion. Bump to 12-16px for softer feel.
2. **Subtle inner shadows or inset glows**: Instead of flat cards, a `box-shadow: inset 0 1px 0 rgba(255,255,255,0.03)` creates a gentle top edge highlight.
3. **Background gradients on elevated surfaces**: Subtle `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)` on cards.
4. **De-saturated accent colors**: Reduce orange saturation by ~15-20% for a less "loud" feel. Apple Health uses softer pinks, blues, greens.
5. **Layered elevation via opacity, not shadow**: Dark mode elevation works via lighter surfaces, not drop shadows. GymLog already does this correctly.
6. **Softer text contrast**: Primary text at 85-88% lightness instead of 90%. Feels less harsh.
7. **Subtle border opacity**: Borders at 6-8% white opacity instead of distinct lines.

### Table Stakes (What Makes It Feel "Soft/Modern")

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Increased border-radius (12-16px on cards, 8-10px on buttons) | Single biggest visual impact for "soft" feel | Low | Update `--radius-md` and `--radius-lg` in CSS theme |
| Subtle surface gradients on cards | Creates gentle depth without shadows | Low | Add to Card component base styles |
| De-saturated accent color | Current orange is high-energy; softer feels more premium | Low | Adjust `--color-accent` oklch chroma from 0.19 to ~0.14 |
| Softer text hierarchy (reduce primary text lightness 2-3%) | Less harsh contrast feels gentler | Low | Adjust `--color-text-primary` |
| Consistent spacing system (more generous padding) | Apple Health uses 16-20px card padding vs current 16px) | Low | Audit and bump where needed |
| Smooth transitions on all interactive elements | 150-200ms ease transitions on color/background changes | Low | Already partially done, audit for gaps |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Subtle glassmorphism on navigation bar | Frosted glass effect creates visual sophistication | Low | `backdrop-filter: blur(12px)` + semi-transparent bg |
| Animated accent color glow on active states | Soft glow instead of hard border for focus/active | Low | `box-shadow: 0 0 20px rgba(accent, 0.15)` |
| Micro-gradient status indicators | Progression status badges with subtle gradient fills instead of flat colors | Low | CSS gradient on status pill backgrounds |
| Card hover lift effect (desktop) | Subtle translateY(-1px) + shadow on hover | Low | Add to Card interactive variant |
| Refined loading states (skeleton screens) | Pulsing placeholder shapes instead of "Loading..." text | Medium | New skeleton component needed |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Neumorphism (full soft-UI) | Accessibility nightmare: low contrast, hard to distinguish interactive from decorative elements. Fails WCAG | Use subtle surface gradients and layered elevation instead |
| Light mode toggle | Massive scope increase. Every component needs dual theme. Ship dark-only and iterate | Single refined dark theme. Consider light mode in future milestone |
| Heavy glassmorphism everywhere | Performance cost of backdrop-filter on every element. Looks gimmicky if overdone | Apply glassmorphism only to navigation bar and possibly modals |
| Theme customization (user picks accent color) | Feature creep. Not a v1.4 concern | Ship one refined palette. Custom themes are a v2+ feature |
| Animated gradient backgrounds | Battery drain, distracting, looks dated quickly | Static subtle gradients only |
| Pure white text on dark backgrounds | Creates halation effect (white bleeds into dark surroundings). Causes eye strain | Use 85-90% lightness, slightly warm-tinted white |

### Specific CSS Token Recommendations

```css
/* BEFORE (current) */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */

/* AFTER (soft/modern) */
--radius-sm: 0.5rem;     /* 8px */
--radius-md: 0.75rem;    /* 12px */
--radius-lg: 1rem;       /* 16px */
--radius-xl: 1.25rem;    /* 20px - for large cards, modals */

/* Accent: reduce chroma for softer feel */
--color-accent: oklch(72% 0.14 45);          /* was 0.19, now softer */
--color-accent-hover: oklch(65% 0.12 45);    /* was 0.17 */

/* Text: slightly softer */
--color-text-primary: oklch(88% 0.005 270);  /* was 90% */

/* New: card surface treatment */
--card-gradient: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
--card-inner-highlight: inset 0 1px 0 rgba(255,255,255,0.03);

/* Nav glassmorphism */
--nav-bg: oklch(18% 0.01 270 / 0.85);
--nav-blur: blur(12px);
```

**Confidence: MEDIUM** -- These are design recommendations based on pattern analysis, not verified against a specific design system. Visual testing required.

---

## 3. UX Tightening

### 3a. Collapsible Exercises/Gyms on Workouts Tab

**Current state:** ExerciseList and GymList are always fully expanded on the Workouts tab. As users add more exercises/gyms, the page becomes long and the "Start Workout" section (the primary action) gets pushed down.

**Research findings (NN/g, Mobbin, Cieden):**

| Practice | Recommendation | Source Confidence |
|----------|---------------|-------------------|
| Default state | Collapse sections users access infrequently. Exercises/Gyms are "set and forget" -- collapse by default | HIGH (NN/g) |
| Icon | Downward-facing caret (not plus, not right arrow). Right arrow implies navigation to new page | HIGH (NN/g) |
| Tap target | Entire header row must be tappable, not just icon | HIGH (NN/g, Android guidelines) |
| Animation | Smooth height transition, 150-200ms. Prevents disorientation | MEDIUM |
| Multiple open | Allow multiple sections open simultaneously. Forced single-open is frustrating | HIGH (Cieden, Mobbin) |
| Remember state | Persist open/closed state in localStorage so user's preference survives page navigation | MEDIUM |
| Item count in header | Show "(12 exercises)" in collapsed header so user knows content exists | HIGH (common pattern) |

**Existing component:** `CollapsibleSection` already exists in `src/components/analytics/CollapsibleSection.tsx` using native HTML `<details>/<summary>`. This is a good accessible foundation. It can be reused or adapted for the Workouts tab.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Collapsible Exercises section (default closed) | Primary action is Start Workout, not manage exercises | Low | Reuse existing `CollapsibleSection` |
| Collapsible Gyms section (default closed) | Same rationale. Gym management is infrequent | Low | Reuse existing `CollapsibleSection` |
| Item count in collapsed header ("12 exercises", "3 gyms") | Users need to know content is there without expanding | Low | Data already available |
| Smooth expand/collapse animation | Prevents disorientation, feels polished | Low | CSS transition on max-height or `<details>` with animation |
| Persist collapsed state across tab changes | Frustrating to re-collapse every time user switches tabs | Low | localStorage or Zustand slice |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Quick-action buttons visible in collapsed state | "Add Exercise" visible without expanding | Low | Put action button in header row |
| Section reordering (drag sections up/down) | Let user put most-used section first | High | Not worth complexity for v1.4 |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Accordion (only one section open at a time) | Forces choice. User may want both Exercises and Gyms visible | Independent collapsibles, not accordion |
| Deep nesting (collapsible within collapsible) | Cognitive overload on mobile. One level of collapse is sufficient | Flat structure with filter dropdowns |
| Auto-collapse on scroll | Disorienting. User loses context of what they were looking at | Let user control collapse state |

### 3b. "Templates" to "Plans" Rename

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Rename "Templates" to "Plans" in navigation tab | Clearer mental model. "Plan" implies intent, "template" implies boilerplate | Low | Update Navigation.tsx text and Tab type |
| Rename throughout all UI copy | Consistency. Cannot have mixed terminology | Low | Search-and-replace in component text |
| Update data-testid attributes if they reference "template" | Test stability | Low | Grep for testid=".*template.*" |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Renaming internal data model (template_id, etc.) | Unnecessary churn. Internal naming does not affect UX | Keep `template_id` in code, only change user-facing labels |
| Renaming database columns | Breaking migration for cosmetic change | Keep as-is internally |

### 3c. Settings Page Reorganization

**Current settings order:**
1. Workout Rotations (with inline Create Rotation form)
2. Workout Preferences (weight unit, rest timer, sound)
3. Data Backup (export/import)
4. Restore from Backup
5. TOON Export
6. Demo Data & Clear All
7. System Observability
8. Data Quality

**Research-backed settings organization principles:**
- Put most frequently accessed items first (Android guidelines, Toptal, Netguru)
- Use progressive disclosure -- hide rarely-used options
- Group by user mental model, not implementation
- Smart defaults reduce need for settings interaction

**Proposed reorder based on frequency of use:**

1. **Default Gym** (used every session, currently buried in Rotations)
2. **Workout Rotations** (configured once, occasionally edited) -- with "Create Rotation" as a button, not inline form
3. **Workout Preferences** (set once, rarely changed)
4. **Data Backup** (periodic action)
5. **TOON Export** (infrequent)
6. **Demo Data** (one-time or rare)
7. **System Observability** (developer/debug, collapse by default)
8. **Data Quality** (developer/debug, collapse by default)

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Default Gym promoted to top of settings | Most frequently changed setting. Currently buried inside Rotations section | Low | Extract from RotationSection, create standalone component |
| Rotation creation as button (opens modal/form) not inline form | Inline form wastes space when not creating. Progressive disclosure | Medium | Convert create form to modal/expandable |
| Group debug sections (Observability, Data Quality) behind collapsible | These are developer tools, not user settings | Low | Wrap in CollapsibleSection, default closed |
| Section headers with descriptive subtitles | "Workout Rotations -- Cycle through your plans automatically" | Low | UI text changes |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Settings search | Find settings by keyword (useful when settings grow) | High | Not worth it for current settings count (~10 items) |
| Settings categories with icons | Visual scanning. Each section gets a small icon | Low | Icon set needed (heroicons or similar) |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Nested settings sub-pages (iOS-style drill-down) | Overkill for current settings count. Adds navigation complexity | Single scrollable page with sections |
| Settings requiring confirmation dialog | Friction for preference changes that are easily reversible | Apply changes immediately with visual feedback |
| Alphabetical ordering | Ignores frequency of use. Users scan top-to-bottom by importance | Order by frequency/importance |

---

## 4. Feature Dependencies Map

```
Theme Redesign (CSS tokens)
  --> All other features inherit new visual style
  --> Should be done FIRST so other work uses new design language

Collapsible Sections (reuse CollapsibleSection)
  --> No data dependencies
  --> Purely UI, can be done independently

Exercise Comparison
  --> Depends on: useProgressionStatus, useExerciseProgress, PR data
  --> All data hooks already exist
  --> New: comparison-specific component + exercise multi-select

Settings Reorder
  --> Depends on: RotationSection refactor (extract Default Gym)
  --> Collapsible sections pattern (for debug sections)

"Plans" Rename
  --> No dependencies. Pure text change across components
  --> Should be done as a single atomic change to avoid mixed terminology
```

---

## 5. Complexity Assessment

| Feature | Complexity | Estimated Effort | Dependencies | Risk |
|---------|-----------|-----------------|--------------|------|
| Theme token updates (border-radius, colors) | Low | 2-4 hours | None -- CSS only | Low: visual regression testing needed |
| Card component gradient/shadow treatment | Low | 1-2 hours | Theme tokens | Low |
| Nav glassmorphism | Low | 1 hour | Theme tokens | Low: test on older mobile browsers |
| Collapsible Exercises/Gyms sections | Low | 2-3 hours | Existing CollapsibleSection | Low |
| "Templates" to "Plans" rename | Low | 1-2 hours | None | Low: grep-and-replace |
| Settings reorder + Default Gym extraction | Medium | 3-4 hours | RotationSection refactor | Low |
| Rotation create as button/modal | Medium | 2-3 hours | Settings restructure | Low |
| Debug sections collapsible | Low | 1 hour | CollapsibleSection | Low |
| Exercise comparison cards | Medium | 6-8 hours | Existing hooks, new component | Medium: query performance with multiple exercises |
| Exercise multi-select for comparison | Medium | 3-4 hours | Exercise list, comparison cards | Low |
| Comparison sparkline charts | Medium | 3-4 hours | Recharts, comparison data | Low: Recharts already bundled |

**Total estimated effort: 25-37 hours**

---

## 6. MVP Recommendation for v1.4

### Must-have (ship in v1.4):
1. **Theme redesign** -- Soft token updates (radius, colors, gradients). Biggest perceived improvement for least effort
2. **Collapsible Exercises/Gyms** -- Immediate UX improvement on most-used tab
3. **"Plans" rename** -- Small effort, improves terminology consistency
4. **Settings reorder** -- Extract Default Gym to top, collapse debug sections
5. **Exercise comparison cards** (2-exercise, basic stats) -- Headline feature of the milestone

### Defer to v1.5+:
- Comparison sparkline charts (adds complexity for modest value)
- Skeleton loading states (nice polish but not essential)
- Comparison sharing as image (significant complexity, niche use case)
- Settings search (insufficient settings count to justify)
- Light mode (massive scope, save for dedicated milestone)

---

## Sources

- [Hevy: Workout Comparison Feature](https://www.hevyapp.com/features/workout-comparison/) -- Exercise comparison UX patterns
- [Strong vs Hevy Comparison (2025)](https://gymgod.app/blog/strong-vs-hevy) -- Competitive feature analysis
- [Best Weightlifting Apps 2025](https://just12reps.com/best-weightlifting-apps-of-2025-compare-strong-fitbod-hevy-jefit-just12reps/) -- Feature landscape
- [Complete Dark Mode Design Guide 2025](https://ui-deploy.com/blog/complete-dark-mode-design-guide-ui-patterns-and-implementation-best-practices-2025) -- Dark theme patterns
- [Smashing Magazine: Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) -- Accessibility in dark themes
- [Apple HIG: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) -- Apple's elevation/material approach
- [NN/g: Accordions on Mobile](https://www.nngroup.com/articles/mobile-accordions/) -- Collapsible UX research
- [Mobbin: Accordion UI](https://mobbin.com/glossary/accordion) -- Accordion design variants
- [Cieden: Accordion UI Design](https://cieden.com/book/atoms/accordion/accordion-ui-design) -- Best practices
- [Toptal: Settings UX](https://www.toptal.com/designers/ux/settings-ux) -- Settings page organization
- [Android: Settings Pattern](https://developer.android.com/design/ui/mobile/guides/patterns/settings) -- Settings hierarchy guidelines
- [Josh W. Comeau: Designing Shadows](https://www.joshwcomeau.com/css/designing-shadows/) -- Layered shadow technique
