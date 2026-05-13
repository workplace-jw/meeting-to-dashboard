---
name: init-dashboard
description: Create a fresh project dashboard file (dashboard.md) for the user. Use this when the user wants to set up their project dashboard for the first time, when they say "initialize my dashboard", "create a new dashboard", "set up my projects file", or when they want to start tracking projects with this skill pack and there's no existing dashboard.md yet. Also trigger this when the user asks "where do I start" or "how do I begin" with project tracking.
---

# Initialize Project Dashboard

Set up a fresh `dashboard.md` file that the rest of the skill pack will read from and write to.

## What you're producing

A single markdown file at `dashboard.md` (in the current working directory) with the structure below. The file is the source of truth. Every other skill in the pack reads and writes to it.

## Workflow

### Step 1, check for existing dashboard

Before doing anything, look for `dashboard.md` in the current directory. If one exists, ask the user if they want to overwrite it, append to it, or cancel. Do not silently overwrite.

### Step 2, gather starter projects

Ask the user three short questions, one at a time, to get the dashboard primed:

1. "What are the active projects you're running right now? Just list them by name, comma-separated. We can refine details later."
2. "For each project, give me a one-sentence status if you can. If you don't know yet, say skip."
3. "Anyone else owns one of these projects, or are they all yours?"

Keep the questions plain and one at a time. Do not bombard with a form.

### Step 3, create the file

Write `dashboard.md` using the exact template below. Replace placeholders with the user's answers. If the user skipped a field, leave it blank with a placeholder dash so they see where to fill it in later.

The file structure must match `SCHEMA.md` exactly. The renderer parses against that schema and silently drops anything that does not fit.

### Step 4, render the visual dashboard and open it

Run the renderer to produce `dashboard.html` next to `dashboard.md`:

```
node ~/.claude/skills/render-dashboard/render.js dashboard.md
```

Then open it in the user's browser. This is the only time the skill pack auto-opens the file. Every later render just refreshes the existing tab.

```
open dashboard.html        # macOS
xdg-open dashboard.html    # Linux
start dashboard.html       # Windows
```

### Step 5, confirm and explain next steps

Tell the user:

- The file was created at `<path>/dashboard.md`.
- A visual dashboard opened in their browser at `dashboard.html`. The tab self-refreshes every 5 seconds, so they should keep it pinned.
- The next thing to do is run `/process-meeting` after their next meeting to start populating the dashboard automatically.

## Dashboard template

Use exactly this structure. Other skills in the pack depend on these section headings being consistent.

```markdown
---
created: YYYY-MM-DD
last-updated: YYYY-MM-DD
---

# Project Dashboard

Last updated by [skill name] on [YYYY-MM-DD].

## Active Projects

### [Project Name]
- **Owner:** [name or "me"]
- **Status:** [one-line status]
- **Last touched:** YYYY-MM-DD
- **Open action items:**
  - [ ] [action] (owner: [name], due: [date])
- **Recent decisions:**
  - YYYY-MM-DD, [decision], [short rationale]

### [Next Project Name]
...

## Recently Completed

- YYYY-MM-DD, [project name], [what was completed]

## Stalled

(Populated by /find-stalled-projects. Empty on init.)

## Notes and Open Threads

(Free-form notes, ideas, things that don't fit a project yet.)
```

## Edge cases

- **User has no projects in mind:** Create the file with the structure but leave the Active Projects section empty. Suggest they run `/process-meeting` with their next set of notes and the dashboard will populate itself.
- **User lists 20+ projects:** Capture them all but flag that 20 is a lot to track. Suggest grouping or pruning. Do not refuse.
- **Project names with special characters:** Escape them for markdown safely. Do not change the user's wording.

## What this skill does NOT do

- Does not process meeting notes. That is `/process-meeting`.
- Does not add projects to an existing dashboard. That is `/add-item`.
- Does not generate any rollup or report. That is `/weekly-rollup`.

## Quality bar

The user should walk away with a real file they can open in any markdown editor. The file should look ready-to-use, not skeletal. If a section is empty, include a one-line note explaining what populates it (e.g., "Stalled projects appear here after running /find-stalled-projects").
