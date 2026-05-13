---
name: render-dashboard
description: Regenerate the visual dashboard (dashboard.html) from dashboard.md. Use this when the user asks to "refresh the dashboard", "rerender", "update the view", "open the dashboard", "show me the dashboard in the browser", or when dashboard.md has been edited by hand outside of the other skills. Also runs automatically at the end of init-dashboard, process-meeting, process-slack-thread, add-item, and find-stalled-projects.
---

# Render Dashboard

Turn the user's `dashboard.md` into a static `dashboard.html` file they can open in a browser. The page polls itself in the background and swaps in updates without scrolling or flashing when the browser allows `file://` fetches. In stricter browsers it falls back to a scroll-preserved reload at a slower cadence.

## What you're producing

A `dashboard.html` file written next to `dashboard.md`. The user opens it once and keeps the tab pinned. Every mutation to `dashboard.md` shows up within a few seconds.

## Workflow

### Step 1, locate the dashboard

Look for `dashboard.md` in the current working directory.

If it's missing, tell the user to run `/init-dashboard` first.

### Step 2, run the renderer

Run this bash command, replacing the path if the dashboard lives somewhere other than the current directory:

```
node ~/.claude/skills/render-dashboard/render.js dashboard.md
```

The script is zero-dependency Node. No npm install required.

### Step 3, open it the first time

If `dashboard.html` did not exist before this run, open it in the user's default browser:

```
open dashboard.html        # macOS
xdg-open dashboard.html    # Linux
start dashboard.html       # Windows
```

On macOS, `open` works without flags. If the user's platform is unclear, default to `open` and fall back to telling them the file path so they can open it manually.

If `dashboard.html` already existed, do not open it again. The user already has the tab pinned. The page's background poller will pick up the new version within a few seconds.

### Step 4, confirm briefly

One line back to the user:

"Dashboard refreshed. dashboard.html is open in your browser."

Or, if it already existed:

"Dashboard re-rendered. Your open tab will pick it up in a few seconds."

## Output rules

- **Never modify `dashboard.md`.** The renderer is read-only on the source file.
- **Always write to `dashboard.html` next to `dashboard.md`.** Do not invent a new filename.
- **Do not summarize the dashboard.** This skill only renders. Use `/weekly-rollup` for human-readable summaries.

## Edge cases

- **The renderer script is missing:** The skill pack install copies it to `~/.claude/skills/render-dashboard/render.js`. If it's gone, tell the user to reinstall the skill pack from https://github.com/workplace-jw/meeting-to-dashboard.
- **Node is not installed:** Most Claude Code users already have Node. If `node` is not on PATH, tell the user they need Node 16+ to use the viewer, and that `dashboard.md` still works on its own without it.
- **`dashboard.md` does not match the schema:** The renderer is forgiving. It silently drops content that does not match `SCHEMA.md`. If the user reports a project or item missing from the rendered view, check the markdown against `SCHEMA.md` first.

## What this skill does NOT do

- Does not write or modify `dashboard.md`. That's `add-item`, `process-meeting`, `process-slack-thread`, or `find-stalled-projects`.
- Does not produce a stakeholder-ready summary. That's `weekly-rollup`.
- Does not host the dashboard on a server. It's a static HTML file the user opens locally.
