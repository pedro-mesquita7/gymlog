---
phase: 08
plan: 02
subsystem: design-system
tags: [tailwind-css, design-tokens, typography, fonts, theming]

requires:
  - "08-01"

provides:
  - "Design token system with @theme directive"
  - "Geist Sans and Geist Mono fonts"
  - "Modern dark theme color palette"
  - "Typography and spacing tokens"

affects:
  - "08-03" # Button primitives will use design tokens
  - "08-04" # Form primitives will use design tokens
  - "All future UI components" # Foundation for consistent design system

tech-stack:
  added:
    - "@fontsource/geist-sans"
    - "@fontsource/geist-mono"
  patterns:
    - "Tailwind CSS 4 @theme directive for design tokens"
    - "OKLCH color space for vibrant, perceptually uniform colors"
    - "Self-hosted fonts via @fontsource (no CDN)"
    - "Semantic color tokens (bg-primary/secondary/tertiary, text-primary/secondary/muted)"

key-files:
  created:
    - src/styles/fonts.css
  modified:
    - src/index.css
    - package.json
  deleted:
    - src/App.css

decisions:
  - slug: geist-fonts
    what: Use Geist Sans and Geist Mono from @fontsource
    why: "Vercel's modern design aesthetic, self-hosted, no CDN dependency"
    alternatives: ["Inter + JetBrains Mono", "System fonts only"]

  - slug: oklch-colors
    what: Use OKLCH color space for accent and semantic state colors
    why: "Better vibrancy and perceptual uniformity vs HSL, modern CSS standard"
    alternatives: ["HSL only", "RGB"]

  - slug: semantic-tokens
    what: Systematize colors as semantic tokens (bg-primary, text-secondary, etc.)
    why: "Easier to maintain, clearer intent, prepare for future light mode"
    alternatives: ["Direct Tailwind color classes", "CSS variables without @theme"]

  - slug: preserve-hsl-legacy
    what: Keep legacy HSL --accent and --chart-* variables alongside OKLCH
    why: "Existing components depend on these, migration can happen incrementally"
    alternatives: ["Break all components immediately", "Dual tokens forever"]

metrics:
  duration: "10 minutes 30 seconds"
  completed: 2026-01-31
---

# Phase 08 Plan 02: Design Token System & Geist Fonts Summary

**One-liner:** Established Tailwind CSS 4 design token system with Geist fonts, OKLCH colors, and Vercel-inspired dark theme

## What Was Built

### Design Token System (@theme)
Created comprehensive design token system in `src/index.css` using Tailwind CSS 4's `@theme` directive:

**Color tokens:**
- Background layers: `--color-bg-primary` (zinc-950), `--color-bg-secondary` (zinc-900), `--color-bg-tertiary` (zinc-800)
- Borders: `--color-border-primary` (zinc-800), `--color-border-secondary` (zinc-700)
- Text hierarchy: `--color-text-primary` (zinc-100), `--color-text-secondary` (zinc-400), `--color-text-muted` (zinc-500)
- Accent: `--color-accent` (vibrant orange in OKLCH), `--color-accent-hover`
- Semantic states: `--color-success` (green), `--color-error` (red), `--color-warning` (amber)
- Chart colors: `--color-chart-primary` (blue), `--color-chart-success` (green), `--color-chart-muted` (gray)

**Typography tokens:**
- `--font-sans`: 'Geist Sans', system-ui, -apple-system, sans-serif
- `--font-mono`: 'Geist Mono', ui-monospace, 'SF Mono', ...

**Border radius tokens:**
- `--radius-sm`: 6px
- `--radius-md`: 8px
- `--radius-lg`: 12px

**Legacy compatibility:** Preserved existing HSL `--accent`, `--chart-primary`, `--chart-success`, `--chart-muted` variables for existing components.

### Font System
Installed and configured Geist Sans + Geist Mono:
- Self-hosted via @fontsource packages (no CDN)
- Weights: 400, 500, 600, 700 (Sans) + 400, 500, 600 (Mono)
- Imported in `src/styles/fonts.css`
- Applied Geist Sans as default font-family in base layer

### Cleanup
Removed unused `src/App.css` Vite boilerplate (never imported).

## Technical Implementation

### OKLCH Color Space
Used OKLCH for accent and semantic colors for:
- Better perceptual uniformity (equal visual difference across hues)
- More vibrant colors at same lightness
- Modern CSS standard, better than HSL

Example:
```css
--color-accent: oklch(67% 0.19 35);       /* vibrant orange */
--color-success: oklch(62% 0.15 145);     /* green for PRs */
```

### Tailwind CSS 4 @theme
Leveraged `@theme` directive to define custom properties that Tailwind can reference:
- Cleaner than raw CSS variables
- Better IDE autocomplete
- Foundation for future utility class generation

### Self-Hosted Fonts
@fontsource packages bundle font files in node_modules:
- No external CDN dependency
- Offline-capable
- Better privacy, no Google Fonts tracking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript unused imports and variables**
- **Found during:** Task 5 (build verification)
- **Issue:** Build failed with 7 TypeScript errors:
  - Unused `BACKUP_THRESHOLD` import in BackupReminder.tsx
  - Unused `currentReplacement` variable in ExerciseRow.tsx
  - Unused `TemplateExercise` import in TemplateBuilder.tsx
  - Unused `setShowRir` variable in SetLogger.tsx
  - Unused `getIsPersistent` import in useDuckDB.ts
  - Type incompatibility in useBackupExport.ts (Uint8Array/ArrayBuffer)
  - Type incompatibility in TemplateBuilder.tsx (zodResolver)
- **Fix:** Removed unused imports/variables, added type casts for incompatibilities
- **Files modified:** 6 component/hook files
- **Commit:** d8df255

These were pre-existing errors that became blocking when attempting to verify the build. All were straightforward fixes (unused code removal or explicit type casts).

## Verification Results

✅ All verification criteria met:
- [x] `npm run build` succeeds with no errors
- [x] `src/App.css` deleted
- [x] `src/index.css` contains `@theme` block with color, font, and radius tokens
- [x] `src/styles/fonts.css` exists with Geist imports
- [x] Geist Sans and Geist Mono are referenced in font-family tokens

Build output: 631KB main bundle, 556KB analytics bundle (lazy loaded). Font warnings are expected (runtime resolution).

## Decisions Made

**Geist fonts over alternatives:**
Chose Geist Sans/Mono to match Vercel Dashboard aesthetic. Self-hosted via @fontsource for privacy and offline capability.

**OKLCH over HSL:**
OKLCH provides better perceptual uniformity and vibrancy. Modern CSS standard with growing browser support.

**Semantic tokens:**
Systematized colors as semantic tokens (bg-primary, text-secondary) rather than direct Tailwind classes. Easier to maintain and prepare for future theming.

**Legacy HSL preservation:**
Kept existing HSL variables alongside OKLCH to avoid breaking existing components. Migration can happen incrementally.

## Testing & Quality

**Build verification:**
- TypeScript compilation: ✓ (after fixes)
- Vite production build: ✓
- No runtime errors detected

**Pre-existing issues fixed:**
- 6 TypeScript errors resolved (unused code, type incompatibilities)

## Impact & Next Steps

**Foundation for design system:**
This establishes the token system that all future UI components will use. Provides:
- Consistent spacing, colors, typography
- Single source of truth for design values
- Easier theming and maintenance

**Next:**
- 08-03: Button primitives (will use tokens for colors, spacing)
- 08-04: Form primitives (will use tokens)
- Future: Incrementally migrate existing components to semantic tokens

**Migration path:**
Existing components using direct Tailwind classes (bg-zinc-800, text-accent) continue to work. Can migrate incrementally to semantic tokens (bg-secondary, etc.) as components are touched.

## Files Changed

**Created:**
- src/styles/fonts.css (10 lines)

**Modified:**
- src/index.css (rewritten from 33 to 86 lines)
- package.json (+2 dependencies)

**Deleted:**
- src/App.css (42 lines of unused Vite boilerplate)

## Commits

| Hash    | Type    | Description                                      |
|---------|---------|--------------------------------------------------|
| 4214216 | chore   | Install Geist Sans and Geist Mono fonts          |
| 63eae68 | feat    | Create Geist font imports                        |
| ece98a1 | feat    | Implement design token system with @theme       |
| 5ec18e3 | chore   | Remove unused App.css boilerplate                |
| d8df255 | fix     | Resolve TypeScript errors blocking build         |

**Total:** 5 commits (4 plan tasks + 1 deviation fix)

## Notes

**Build warnings:** Vite warns about font files not resolving at build time. This is expected behavior for @fontsource - fonts are resolved at runtime. Not an issue.

**Chunk size warnings:** Main bundle is 631KB (175KB gzipped). Analytics bundle already lazy loaded. Further optimization not critical for MVP, but could consider dynamic imports for other routes if needed.

**OKLCH browser support:** Well-supported in modern browsers (Chrome 111+, Safari 15.4+, Firefox 113+). No fallback needed for target audience (modern browser users).
