---
name: weekly-rollup
description: Read the user's dashboard.md and produce a one-page weekly rollup they can paste into a stakeholder email, share in Slack, or use as their own week-in-review reflection. Use this whenever the user says "weekly rollup", "give me my week", "Friday review", "what got done this week", "summarize my week", "stakeholder update", or any request for a summary of recent project progress. Also trigger on Friday or Sunday evening if the user is asking for any kind of review or status summary.
---

# Weekly Project Rollup

Generate a one-page rollup of the past week's project activity from `dashboard.md`. The output is suitable for sending to a board, an exec sponsor, a co-founder, or a team Slack channel as the Friday update.

## What you're producing

A single, readable, one-page markdown document with the structure below. The document should be copy-paste ready for an email or chat. No internal jargon, no "ambiguous" flags, no questions back to the user. It is a finished artifact.

## Workflow

### Step 1, find and read the dashboard

Look for `dashboard.md` in the current working directory. If it doesn't exist, tell the user there's nothing to roll up and suggest they run `/init-dashboard` or `/process-meeting` first.

Read the entire file. You need:

- All active projects, their statuses, last-touched dates
- Action items completed in the last 7 days (in Recently Completed)
- Decisions logged in the last 7 days (across all projects)
- Open action items per project (especially overdue or due this week)
- Anything in the Stalled section

### Step 2, define "this week"

Use the past 7 days, ending today. If the user gave a different range (last 14 days, last month, since Monday), use that. Otherwise default to 7 days.

### Step 3, identify the wins

Wins are completed action items, shipped work, or projects that progressed visibly.

For each project active in the past 7 days, find the most meaningful win. Not every completed checkbox is a win, just the ones a stakeholder would care about. A skill demo getting approved is a win, a Slack message getting answered is not.

### Step 4, identify the blockers

Blockers are projects flagged as blocked, action items overdue with no progress, or anything in the Stalled section that affects active work.

Be specific. "Waiting on legal" is better than "blocked." If you can identify who needs to do what to unblock, say so.

### Step 5, identify the focus for next week

Pull from open action items due in the next 7 days, or projects with imminent milestones. Pick the 3 to 5 most important. Not a complete list, just the headline focus.

### Step 6, write the rollup

Use this exact structure. Plain language. No jargon. Imagine a busy executive reading it on their phone.

```markdown
# Weekly Rollup, [date range]

## What moved this week

**[Project Name]:** One sentence on what got done. ([Owner] led the work.)

**[Project Name]:** One sentence on what got done.

**[Project Name]:** One sentence on what got done.

## Where we got blocked

**[Project Name]:** One sentence on what's stuck and what would unblock it.

**[Project Name]:** Same.

## Decisions made this week

- 2026-05-06, [Project], [decision in one line]
- 2026-05-04, [Project], [decision in one line]

## What's getting our focus next week

1. [Most important focus, with owner]
2. [Next most important, with owner]
3. [Third most important]
4. [Fourth, optional]
5. [Fifth, optional]

## Stalled projects worth a look

- **[Project Name]:** Last activity [N] days ago. [Why it might have stalled.]

(Skip this section if nothing is stalled.)
```

### Step 7, hand it to the user

Output the rollup as a finished markdown document in the chat. Then tell the user briefly:

- "Here's your rollup, copy and paste anywhere."
- If you noticed any projects that didn't move at all this week, mention them as a quick sidebar (do not add them to the rollup itself, but flag them so the user knows).
- Offer to save the rollup as `rollups/YYYY-MM-DD-weekly-rollup.md` if they want a file copy.

## Output rules

- **One page.** If your rollup is more than 400 words, cut it.
- **Plain language.** No "synergy", "drive alignment", "stakeholder cadence." Just say what happened.
- **No questions to the user inside the rollup.** Save those for the chat after the rollup.
- **No "I noticed" or "the dashboard says".** Write in the user's voice as if they wrote it themselves.
- **Bold the project names** in each section so the reader can scan.
- **Include the date range** in the title.

## Edge cases

- **No activity in the past 7 days:** Tell the user honestly. "Nothing in your dashboard moved in the past 7 days. Either nothing happened or you haven't been logging meetings. Want to run /process-meeting on anything before I generate this?"
- **Dashboard is sparse (only 1 project):** Generate a rollup for the one project. Don't pad.
- **User wants a different audience (board vs. team vs. self):** Ask once: "Who's reading this?" Adjust tone (board=more strategic, team=more tactical, self=more candid). If they don't answer, default to "team" tone.
- **Some entries don't have dates:** Use your best estimate. Flag in a footer if you had to guess.

## Quality bar

The user reads the rollup and thinks "yes, that's exactly the week I had." A stakeholder reads it and thinks "useful, I'm caught up." If the user has to edit more than 2 sentences before sending, the skill is failing.

## What this skill does NOT do

- Does not update the dashboard. Read-only.
- Does not flag stalled projects in detail. That's `/find-stalled-projects`.
- Does not produce a monthly or quarterly review. The skill is week-shaped on purpose.
