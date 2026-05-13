# Dashboard Schema

`dashboard.md` is the source of truth for the skill pack. The renderer parses it. The skills write to it. Anything outside this schema risks getting dropped from the rendered view.

Keep the structure strict. Add content freely.

## File header

YAML frontmatter, two required keys, both ISO dates.

```yaml
---
created: 2026-05-01
last-updated: 2026-05-13
---
```

## Title

Exactly this, followed by one line noting which skill last touched the file.

```
# Project Dashboard

Last updated by <skill-name> on YYYY-MM-DD.
```

## Sections

Four sections, in this order, all required. If a section has no entries, include a single-line placeholder so the headings stay stable.

1. `## Active Projects`
2. `## Recently Completed`
3. `## Stalled`
4. `## Notes and Open Threads`

## Active project block

Each project lives under `### <Project Name>` inside `## Active Projects`.

```
### <Project Name>
- **Owner:** <name or "me">
- **Status:** <one-line status>
- **Last touched:** YYYY-MM-DD
- **Open action items:**
  - [ ] <action> (owner: <name>, due: YYYY-MM-DD)
  - [x] <action> (owner: <name>, due: YYYY-MM-DD)
- **Recent decisions:**
  - YYYY-MM-DD, <decision>, reason: <one-line rationale>
```

Required: `Owner`, `Status`, `Last touched`.

`Open action items` and `Recent decisions` labels must always exist. The sub-bullets may be empty.

### Action item rules

- Each item starts with `- [ ]` (open) or `- [x]` (done).
- Owner defaults to `me` if not specified.
- Due date is optional. Omit `, due: ...` entirely when unknown.
- Format the parenthetical as `(owner: <name>, due: YYYY-MM-DD)` or `(owner: <name>)`.

### Decision rules

- Each decision starts with a date, `YYYY-MM-DD,`.
- The decision text is one line, comma-separated from the date.
- Optional rationale appended as `, reason: <one line>`.

## Recently Completed

```
- YYYY-MM-DD, <project name>, <what was completed>
```

One bullet per completed item. Sort newest first.

## Stalled

Populated by `find-stalled-projects`. One bullet per stalled project.

```
- **<Project Name>:** Last activity YYYY-MM-DD, N days ago. Likely cause: <one line>. Suggested next move: <one line>.
```

## Notes and Open Threads

Free-form bullet list. No required structure. The renderer surfaces these verbatim.

```
- <note>
```

## Rendering

After any mutation, run the renderer to update `dashboard.html`:

```
node ~/.claude/skills/render-dashboard/render.js dashboard.md
```

The renderer writes `dashboard.html` next to `dashboard.md`. The page polls itself in the background and swaps in new content within a few seconds when the markdown changes. In browsers that block `file://` fetches (Chrome, Safari, Arc) it falls back to a scroll-preserved reload at a slower cadence.
