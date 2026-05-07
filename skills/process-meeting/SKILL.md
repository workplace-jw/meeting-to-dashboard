---
name: process-meeting
description: Extract projects, action items, decisions, and status updates from meeting notes the user pasted, then update their dashboard.md file. Use this whenever the user pastes meeting notes, transcripts, or shares any meeting summary and asks you to log it, capture it, process it, or update their dashboard. Also trigger when the user says "I just had a meeting", "log this meeting", "process my notes", "update from this meeting", or pastes a transcript with no instruction. Always trigger if the input looks like meeting notes (attendees, dates, discussion points, action items) and the user has a dashboard.md in their workspace.
---

# Process Meeting Notes Into Dashboard

Take raw meeting notes (any format) and update the user's `dashboard.md` with what changed.

## What you're producing

Two outputs in this order:

1. An updated `dashboard.md` file with new projects, new action items, completed items checked off, decisions logged, and last-touched dates refreshed.
2. A short, plain-English changelog telling the user exactly what you changed and what you were unsure about.

## Workflow

### Step 1, find the dashboard

Look for `dashboard.md` in the current working directory.

If it exists, read the entire file. You need the existing project list, action items, and decisions so you can match new mentions against existing entries instead of duplicating.

If it doesn't exist, create it using the template from `init-dashboard`. Tell the user you created it from scratch and ask if they want to add projects they already know about.

### Step 2, read the meeting notes

The user pasted meeting notes into the conversation. Read them fully. Do not skim. Look for:

- **Date** of the meeting (today's date if not specified)
- **Attendees** if listed
- **Projects** referenced (by name, by topic, or by inference from context)
- **Action items**, who owns each, when each is due
- **Decisions** made, with the reasoning if available
- **Status updates** on things in flight (completed, blocked, in progress, delayed)
- **New work** that surfaced for the first time

Action items are not always labeled "action item." Watch for phrases like "I'll send that by Friday", "Sarah is going to follow up with the vendor", "we need to get this done before the launch." Those are action items.

Decisions are not always labeled "decision." Watch for phrases like "we agreed to", "let's go with option B", "we're not doing X anymore." Those are decisions.

### Step 3, match against the existing dashboard

For every project, action item, and decision you extracted, compare against what's already in the dashboard.

- **Project match:** If a project mentioned in the meeting closely matches an existing project (same name, similar name, or clearly the same thing by context), use the existing project. Do NOT create a duplicate.
- **Action item match:** If an action item in the meeting is the completion of an existing open action item, mark the existing one done. Do not add a new one.
- **Ambiguous match:** If you're not sure whether a meeting reference matches an existing project, flag it in the changelog and let the user decide. Bias toward asking, not assuming.

### Step 4, update the dashboard

Apply the changes. Specifically:

- **For each project mentioned:** Update its `Last touched` date to the meeting date. Update the one-line status if the meeting changed it. Append new action items. Append new decisions. Move completed items to the Recently Completed section.
- **For each NEW project mentioned:** Add it under Active Projects with the structure from the template. Owner is whoever was assigned, or "me" if unclear. Status is the one-sentence description from context.
- **For each completed item:** Move from open action items to Recently Completed. Include the date and project name.
- **For each new decision:** Add to the project's Recent decisions list with date, decision, and short rationale.

Update the file's `last-updated` field at the top.

Preserve everything in the dashboard you didn't explicitly change. Do not reformat or reorganize the file.

### Step 5, write the changelog

Tell the user, in plain English, what you changed. Use this structure:

```
## Meeting logged: [meeting title or topic], [date]

**Updated 3 projects:**
- Project Lucy: marked Endava demo prep as complete, added 2 new action items
- Project Hulk: status updated to "blocked on legal review"
- Marketing Hub: new project added (you didn't have it on your dashboard yet)

**5 new action items:**
- [list each, who owns, due date if known]

**2 decisions logged:**
- [list each, project, rationale]

**Things I wasn't sure about, please confirm:**
- "the new pricing thing" mentioned at minute 14, I assumed it belongs to Marketing Hub but couldn't tell. Should I move it?
- Sarah was assigned a follow-up but I couldn't tell which project. I added it to Project Lucy as my best guess.
```

The "wasn't sure about" section is critical. Always include it, even if it's empty (in which case say "Nothing ambiguous, all updates were clear").

## Output format constraints

- **Always** show the user the changelog. Never just silently update the dashboard.
- **Always** write to `dashboard.md` using the exact section headings already in the file. Do not invent new headings.
- **Always** preserve YAML frontmatter at the top of dashboard.md.
- **Never** delete content from the dashboard unless the user explicitly asked. If something doesn't fit anywhere, add it to "Notes and Open Threads."

## Edge cases

- **Meeting notes are very long (transcript with thousands of lines):** Process it all. Don't summarize lazily. The user pasted the whole thing for a reason.
- **Meeting notes are messy or stream-of-consciousness:** Do your best. Be transparent in the changelog about what you couldn't extract clearly.
- **Multiple meetings in one paste:** Process them as separate meetings. Update the dashboard once per meeting, with separate changelog entries.
- **Notes are in another language:** Process them. Output the dashboard updates in the language the dashboard was already in.
- **No project ownership clear:** Default owner to "me" (the user) and flag in changelog.
- **Dates are vague ("next Friday"):** Convert to absolute dates based on the meeting date. If meeting date is also unclear, use today's date and flag.

## Quality bar

After running this skill, the user's dashboard should reflect the meeting completely and accurately. They should be able to read the changelog in 30 seconds and trust that the dashboard now matches reality. If they have to go correct things by hand more than once or twice per meeting, the skill is failing. Be precise.

## What this skill does NOT do

- Does not process Slack threads. That is `/process-slack-thread`.
- Does not write a stakeholder rollup. That is `/weekly-rollup`.
- Does not flag stalled projects. That is `/find-stalled-projects`.
- Does not delete projects. The user does that explicitly via `/add-item` or by editing the file.

## Example

**User input:**
"Just got out of the Workplace standup. Here are my notes. Lucas finished the signal scoring fix. Connelly is still working on the Today tab design, should have something by Thursday. Bronson wants to add a new feature for project owner reassignment, calling it Project Reassign. We decided to push the Endava demo from May 10 to May 14 because Letty has a board meeting. New action item for me, write the demo prep doc by Tuesday."

**Your changelog:**
```
## Meeting logged: Workplace standup, 2026-05-06

**Updated 2 projects:**
- Workplace Project Lucy: marked "signal scoring fix" complete, added "Today tab design" with Connelly as owner due 2026-05-08
- Endava Demo Prep: status updated to "rescheduled May 14 due to Letty board conflict"

**Added 1 new project:**
- Project Reassign: owner Bronson, status "new feature for project owner reassignment, just defined"

**3 new action items:**
- Connelly: complete Today tab design (due 2026-05-08)
- Justin: write demo prep doc (due 2026-05-12)
- Bronson: scope Project Reassign

**1 decision logged:**
- 2026-05-06, Endava demo moved from May 10 to May 14, reason: Letty has board meeting

**Things I wasn't sure about, please confirm:**
- Nothing ambiguous, all updates were clear.
```
