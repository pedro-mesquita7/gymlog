---
phase: 02-templates-logging
plan: 04
subsystem: templates-ui
status: complete
tags: [react, ui, crud, navigation, templates]
requires: [02-01, 02-02, 02-03]
provides:
  - TemplateCard component with action menu
  - TemplateList with create/edit/list views
  - Navigation bottom tabs for workouts/templates
  - Full template CRUD UI in App
affects: [02-05, 02-06]
tech-stack:
  added: []
  patterns:
    - "Action menu pattern with backdrop for dropdowns"
    - "Multi-view state machine (list/create/edit) in single component"
    - "Bottom navigation tabs with fixed positioning"
key-files:
  created:
    - src/components/templates/TemplateCard.tsx
    - src/components/templates/TemplateList.tsx
    - src/components/Navigation.tsx
  modified:
    - src/App.tsx
decisions:
  - id: DEV-020
    what: "Action menu with backdrop pattern for dropdowns"
    why: "Ensures menu closes when clicking outside, common UX pattern"
    impact: "Reusable pattern for future dropdown menus"
  - id: DEV-021
    what: "Show archived toggle instead of separate page"
    why: "Simpler UX, all templates in one view with filter"
    impact: "Follows archiving pattern similar to soft deletes"
  - id: DEV-022
    what: "Bottom navigation with pb-20 padding on container"
    why: "Fixed bottom nav needs padding to prevent content overlap"
    impact: "All main views need to account for bottom nav spacing"
metrics:
  duration: 3 min
  tasks: 3
  commits: 3
  files_created: 3
  files_modified: 1
  completed: 2026-01-28
---

# Phase 02 Plan 04: Template List UI Summary

**One-liner:** Tab-based navigation with full CRUD UI for templates including action menus, archive/restore, and duplicate functionality.

## What Was Built

Created the user-facing template management UI with bottom tab navigation for switching between workouts and templates sections.

### Components Created

**TemplateCard** (`src/components/templates/TemplateCard.tsx`)
- Displays individual template with name, exercise count, and exercise preview (first 3)
- Action menu (vertical dots) with Edit, Duplicate, Archive/Restore, Delete
- Archive visual indicator (opacity + badge)
- Delete confirmation modal using existing DeleteConfirmation component
- Exercise name lookup from Exercise array

**TemplateList** (`src/components/templates/TemplateList.tsx`)
- List/Create/Edit view state machine
- Show archived toggle to filter archived templates
- Empty states for no templates or no active templates
- Imports and renders TemplateBuilder component from 02-03
- Duplicate creates copy with "(Copy)" suffix
- Maps TemplateFormData to template events with proper null handling

**Navigation** (`src/components/Navigation.tsx`)
- Fixed bottom navigation bar
- Workouts and Templates tabs
- Active tab highlighted with accent color and top border
- Exported Tab type for type safety

**App Integration** (`src/App.tsx`)
- Added tab state with useState<Tab>
- Conditional rendering based on activeTab
- Workouts tab: GymList + ExerciseList
- Templates tab: TemplateList
- Bottom padding (pb-20) for fixed navigation
- Navigation component rendered at bottom

## Technical Implementation

### Action Menu Pattern

Used backdrop + absolute positioning pattern:
```typescript
{showMenu && (
  <>
    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
    <div className="absolute right-0 mt-1 w-40 bg-zinc-700 rounded-lg shadow-lg z-20 py-1">
      {/* Menu items */}
    </div>
  </>
)}
```

This ensures clicking outside closes the menu, avoiding z-index battles.

### Multi-View State Machine

TemplateList manages view state internally:
- `list`: Shows template cards with actions
- `create`: Renders TemplateBuilder without template prop
- `edit`: Renders TemplateBuilder with editingTemplate

This keeps routing simple (no need for React Router yet) while providing clean UX transitions.

### TemplateBuilder Integration

Successfully imported and rendered TemplateBuilder from 02-03:
```typescript
import { TemplateBuilder } from './TemplateBuilder';
import type { TemplateFormData } from './TemplateBuilder';
```

Maps form data to event format with proper null handling for optional fields.

### Tab Navigation

Fixed bottom nav requires:
1. `pb-20` on main container to prevent overlap
2. `fixed bottom-0 left-0 right-0` positioning
3. Border-top accent indicator for active tab
4. -mt-px to prevent double border

## Decisions Made

**DEV-020: Action menu with backdrop pattern**
- **What:** Dropdown menu with fixed inset-0 backdrop for click-outside detection
- **Why:** Standard UX pattern, avoids complex z-index management, handles mobile well
- **Impact:** Reusable pattern for future action menus (exercise rows, workout actions, etc.)

**DEV-021: Show archived toggle instead of separate page**
- **What:** Single template list with checkbox to toggle archived visibility
- **Why:** Simpler UX, fewer views to manage, clear visual indicator of archive state
- **Impact:** Archived templates accessible but hidden by default, easy to restore
- **Alternative considered:** Separate "Archived Templates" page - rejected as over-engineered

**DEV-022: Bottom navigation with pb-20 padding**
- **What:** Fixed bottom nav requires padding on main container
- **Why:** Prevents content from being hidden behind fixed navigation
- **Impact:** All tab views need to account for this spacing
- **Note:** pb-20 (5rem/80px) accounts for nav height (64px) plus safe area

## Test Coverage

TypeScript compilation: ✅ All types valid, no errors

Manual verification points:
- TemplateCard displays template info correctly
- Action menu opens/closes on button click
- Clicking backdrop closes menu
- Archive toggle shows/hides badge
- Delete shows confirmation modal
- TemplateList switches between list/create/edit views
- Show archived toggle filters templates
- Empty states render when no templates
- Navigation tabs switch content
- Active tab highlighted correctly
- Bottom padding prevents nav overlap

## Next Phase Readiness

**Blocks cleared:**
- ✅ Template UI complete for creating/editing templates
- ✅ Tab navigation ready for workout view (02-05)
- ✅ Action menu pattern established for future use

**Handoff to 02-05 (Start Workout):**
- Templates can now be selected from UI
- Navigation provides Workouts tab for workout start flow
- TemplateList exports for reuse in workout selection

**Known limitations:**
- No search/filter for templates yet (fine for MVP)
- No template categories/tags (not in scope for Phase 2)
- Exercise preview limited to 3 (sufficient for quick identification)

## Files Changed

**Created:**
- `src/components/templates/TemplateCard.tsx` - Template display with actions (110 lines)
- `src/components/templates/TemplateList.tsx` - Template CRUD UI (139 lines)
- `src/components/Navigation.tsx` - Bottom tab navigation (35 lines)

**Modified:**
- `src/App.tsx` - Tab state and conditional rendering (+12/-12 lines)

**Total:** 3 new files, 1 modified, ~300 lines added

## Deviations from Plan

None - plan executed exactly as written. All specified components created with required functionality.

## Performance Notes

- TemplateList filters activeTemplates on every render (acceptable, typically <100 templates)
- Exercise name lookup in TemplateCard via `find()` (O(n) but n is small, typically <50 exercises)
- No virtualization needed for template list (unlikely to exceed 50 templates)

## Commits

1. `efa1644` - feat(02-04): add TemplateCard component with action menu
2. `c89506a` - feat(02-04): add TemplateList and Navigation components
3. `bfc7a93` - feat(02-04): integrate tab navigation in App.tsx

---

**Status:** Complete ✅
**Duration:** 3 min
**Next:** 02-05-PLAN.md (Start Workout Flow)
