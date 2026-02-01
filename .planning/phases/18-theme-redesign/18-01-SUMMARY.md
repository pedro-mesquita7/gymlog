# Phase 18 Plan 01: Token Foundation + UI Primitives Summary

**One-liner:** Warm OKLCH token system (hue 60) with shadow/gradient/radius tokens and 6 updated UI primitives

## Metadata

- **Phase:** 18-theme-redesign
- **Plan:** 01
- **Started:** 2026-02-01T15:50:57Z
- **Completed:** 2026-02-01T15:57:02Z
- **Duration:** ~6 minutes
- **Tasks:** 2/2

## What Was Done

### Task 1: Update OKLCH tokens, add shadow/gradient/radius tokens
**Commit:** `3c421f8`
**Files:** `src/index.css`

Shifted the entire OKLCH color system from cool (hue 270) to warm (hue 60):
- Background layers: bg-primary (16% L), bg-secondary (20%), bg-tertiary (25%), bg-elevated (28%)
- Text hierarchy: warm tint while maintaining WCAG AA contrast ratios
- Borders: shifted to warm hue with preserved separation
- Chart tooltip and chart-muted: shifted to warm range
- Legacy HSL chart-muted updated to warm hue (40 5% 65%)

New tokens added:
- `--shadow-card`, `--shadow-card-hover`, `--shadow-dialog`, `--shadow-nav`
- `--gradient-card-surface` (subtle top-to-bottom card gradient)
- Updated radius: sm=8px, md=12px, lg=16px

### Task 2: Update UI primitive components
**Commit:** `c157a87`
**Files:** Card.tsx, Button.tsx, Input.tsx, Dialog.tsx, NumberStepper.tsx, ErrorCard.tsx

- **Card:** rounded-2xl, shadow-card, gradient background, hover shadow transition
- **Button:** rounded-2xl (all variants)
- **Input/Select:** rounded-xl, softened border (border-primary instead of border-secondary)
- **Dialog:** rounded-2xl, shadow-dialog
- **NumberStepper:** rounded-xl (buttons and input field)
- **ErrorCard:** rounded-2xl, shadow-card

## Commits

| Hash | Message |
|------|---------|
| `3c421f8` | feat(18-01): update OKLCH tokens to warm palette, add shadow/gradient/radius tokens |
| `c157a87` | feat(18-01): update UI primitives with new radius and shadow tokens |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Tailwind v4 auto-generates shadow-* utilities from @theme tokens | Verified in build output -- no need for arbitrary value syntax or @utility rules |
| Card uses inline style for gradient background | CSS custom property for gradient applied via `style={{ background }}` since Tailwind has no gradient token utility |
| Input uses border-primary (softer) instead of border-secondary | Per plan specification -- subtler border for warm aesthetic |

## Verification Results

- Build succeeds with no errors
- Zero `rounded-lg` remaining in `src/components/ui/` directory
- Shadow classes present in Card.tsx and Dialog.tsx
- All OKLCH background tokens use hue ~60 (warm), none at 270 (cool)
- `--radius-lg` is 1rem (16px)

## Key Files

### Created
None

### Modified
- `src/index.css` -- All OKLCH tokens, new shadow/gradient/radius tokens
- `src/components/ui/Card.tsx` -- Shadow, gradient, rounded-2xl
- `src/components/ui/Button.tsx` -- rounded-2xl
- `src/components/ui/Input.tsx` -- rounded-xl, softer border
- `src/components/ui/Dialog.tsx` -- Shadow-dialog, rounded-2xl
- `src/components/ui/NumberStepper.tsx` -- rounded-xl
- `src/components/ui/ErrorCard.tsx` -- Shadow-card, rounded-2xl

## Next Phase Readiness

Plans 18-02 through 18-05 can proceed immediately. Token changes already propagate globally through Tailwind utilities -- remaining plans apply component-level radius/shadow updates and migrate hardcoded colors.
