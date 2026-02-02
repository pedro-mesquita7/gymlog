# Phase 25: Exercise Notes - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Free text notes per exercise per workout session, with the ability to review all historical notes when logging the same exercise in future sessions. Notes are stored via event sourcing. Creating, viewing, and reviewing notes only — no search, tagging, or export of notes.

</domain>

<decisions>
## Implementation Decisions

### Note entry UX
- Tap-to-reveal: small icon/button that expands a text area when tapped (keeps logging compact by default)
- Placement: below the sets, after the last set row
- Auto-save on blur/debounce — no explicit save button needed
- Icon only (no label text) for the add-note trigger

### Note history display
- Expandable "Previous notes" collapsible section
- Shows all historical notes for this exercise (not limited to recent sessions)
- Each history entry shows session date + note text (no weight/set context)
- Previous notes are read-only — history is for reference only

### Note content scope
- One note per exercise per session (not per set)
- Plain text only — no formatting or markdown
- ~70 character limit — concise annotations
- Character counter appears only when approaching the limit (last ~15 characters)

### Empty/default state
- No note: icon-only button visible below sets
- Text area placeholder: "Quick note..."
- No history: show "Previous notes" section with "No previous notes" message (don't hide the section)
- Notes are independent of warmup (Phase 26) — no special accommodation needed

### Claude's Discretion
- Exact icon choice and filled/outline indicator for notes with content
- Text area dimensions and expand/collapse animation
- Debounce timing for auto-save
- Styling of history entries (typography, spacing, date formatting)

</decisions>

<specifics>
## Specific Ideas

- Placeholder text should be "Quick note..." — user specified this exactly
- Character limit is intentionally very short (~70 chars) to keep notes as quick annotations, not journals
- Character counter only appears near the limit to avoid visual clutter during normal use

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-exercise-notes*
*Context gathered: 2026-02-02*
