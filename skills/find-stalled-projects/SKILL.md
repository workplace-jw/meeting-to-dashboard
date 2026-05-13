---
name: find-stalled-projects
description: Scan the user's dashboard.md for projects that have gone quiet (no activity in the recent past) and surface them with a short diagnosis of why each one might be stalled. Use this whenever the user asks "what's stalled", "what's gone quiet", "any projects dying", "what am I forgetting", "what hasn't moved", or asks for a review of dormant work. Also trigger when the user runs a weekly review or check-in and wants to surface neglected items.
---

# Find Stalled Projects

Look at the dashboard.md and find projects that have not moved in a while. Tell the user which ones, why each might have stalled, and what the next move could be.

## What you're producing

A short, scannable list of stalled projects, ordered most-stale-first, each with:

- Project name
- Last touched date and how many days ago that was
- A one-line guess at why it stalled (based on dashboard context)
- A suggested next action

You also update the Stalled section of the dashboard with the current snapshot.

## Workflow

### Step 1, find and read the dashboard

Look for `dashboard.md`. If missing, tell the user to run `/init-dashboard` first.

Read every Active Project. For each one, capture:

- Last touched date
- Status line
- Open action items (count, who owns them)
- Any decisions logged in the last 30 days

### Step 2, define "stalled"

Default threshold is 14 days. A project with no last-touched activity in 14+ days is stalled.

If the user gave a different threshold ("show me anything older than a week", "find the ones older than a month"), use theirs.

If a project has open action items but no recent activity, that's a stronger stall signal than a project with no action items at all.

### Step 3, diagnose each stalled project

For each stalled project, look at the dashboard context and form a one-line guess about why it stalled. Use these patterns:

| Pattern in dashboard | Likely cause |
|---|---|
| Open action items owned by someone else, no follow-up | Waiting on someone, needs a chase |
| Open action items owned by user, no recent decisions | User is bottlenecked |
| Status says "blocked on X" | Genuinely blocked, X may need escalation |
| No open action items at all | Project may be done or abandoned, not actually stalled |
| Decisions logged but no follow-through | Plan exists, execution stopped |
| Recently created project, never updated | New project that didn't get traction |

If none of these patterns fit, just say "unclear, last activity was [status]."

### Step 4, write the output

Use this structure:

```markdown
## Stalled projects, as of [today's date]

Threshold: no activity in [14] days.

### 1. [Project Name]
- **Last touched:** YYYY-MM-DD, [N] days ago
- **Likely cause:** [diagnosis from the table above]
- **Suggested next move:** [one specific action the user could take this week]

### 2. [Project Name]
...

(Continue for each stalled project.)
```

Order the list by days-stale, most stale first.

If nothing is stalled, say so plainly: "Nothing stalled. Every active project in your dashboard has had activity in the last [N] days."

### Step 5, update the dashboard

After showing the user the list, also update the Stalled section of `dashboard.md` to reflect the current snapshot.

Each stalled project must be written as a single bullet matching this exact shape (the renderer parses against this format and will silently drop entries that do not match):

```
- **<Project Name>:** Last activity YYYY-MM-DD, N days ago. Likely cause: <one line>. Suggested next move: <one line>.
```

Update the dashboard's `last-updated` field at the top.

### Step 6, refresh the visual dashboard

After saving the updated Stalled section, regenerate `dashboard.html` so the user's browser tab picks up the new state on its next 5-second refresh:

```
node ~/.claude/skills/render-dashboard/render.js dashboard.md
```

Do not open the file. The user already has the tab pinned from `/init-dashboard`.

### Step 7, ask one question

After delivering the list, ask the user one focused question: "Want me to draft a chase email or follow-up message for any of these?" If they say yes for a specific project, draft it for them. Keep it short, polite, project-specific.

## Output rules

- **Be honest.** If a "stalled" project is actually done or no longer relevant, say so and suggest archiving it.
- **One next move per project.** Don't give 5 options. Pick the one most likely to unstick it.
- **Don't blame the user.** "You haven't touched this in 30 days" is fine. "You've been neglecting this" is not.
- **Short suggestions.** "Send Sarah a one-line check-in" beats a 200-word coaching paragraph.

## Edge cases

- **Project with no clear last-touched date:** Treat as stalled. Diagnosis: "no last-touched date logged, may not have been updated since creation."
- **Dashboard has a separate Stalled section already populated:** Refresh it with current state. Don't preserve old stalled entries that have since had activity.
- **All projects are stalled:** Be honest. "Every project on your dashboard has gone quiet. Either you're between cycles or this dashboard hasn't been updated. Want to run /process-meeting on recent meetings?"
- **No active projects at all:** Tell the user the dashboard is empty under Active Projects.

## Quality bar

The user runs this once a week, gets a clean list of 3 to 6 stalled items, and chases one or two of them that day. If the list is so long they ignore it, the skill is failing. If the diagnoses feel wrong, the skill is failing. Be specific, be brief.

## What this skill does NOT do

- Does not update or move projects to "completed." That's a manual decision.
- Does not write the chase emails by default. Only on request.
- Does not generate the full weekly rollup. That's `/weekly-rollup`.
