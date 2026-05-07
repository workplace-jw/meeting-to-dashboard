---
name: add-item
description: Manually add a project, action item, decision, or note to the user's dashboard.md when something came up outside a meeting or Slack thread. Use this whenever the user says "add a project", "add an action item", "log a decision", "add this to my dashboard", "I just thought of something", "track this", or wants to capture something they didn't get from a meeting or chat. Also trigger when the user is brain-dumping ideas, to-dos, or context that should be persisted but didn't come from a structured source.
---

# Add Item Manually

Capture a project, action item, decision, or note the user wants to add to their dashboard outside of meetings and chat threads.

## What you're producing

An updated `dashboard.md` with the new item added in the right section, plus a one-line confirmation back to the user.

## Workflow

### Step 1, find the dashboard

Look for `dashboard.md`. If missing, ask the user if they want to run `/init-dashboard` first or just create it on the fly.

### Step 2, figure out what kind of item the user is adding

Ask one question if it's not obvious from their input:

"Is this a project, an action item, a decision, or a note?"

If they already told you ("add a project called X", "log this decision"), skip the question.

### Step 3, gather the missing details

Depending on the type, ask for the minimum required info:

**For a project:**
- Project name
- One-sentence status
- Owner (default: me)

**For an action item:**
- The action
- Which project it belongs to (offer to list current projects if they're not sure)
- Owner (default: me)
- Due date (optional, leave blank if unknown)

**For a decision:**
- The decision in one line
- Which project it relates to (or "cross-project" if applicable)
- Short rationale (1 sentence)
- Date (default: today)

**For a note:**
- The note text
- Which project it relates to, or "general"

Ask only what's missing. If the user gave you everything in their initial message, just confirm and add. Do not interrogate.

### Step 4, add to the dashboard

Insert the new item under the correct section, in the right format, matching the dashboard template structure.

- Projects go under Active Projects
- Action items go under the relevant project's Open action items
- Decisions go under the relevant project's Recent decisions
- Notes go under Notes and Open Threads (or under the relevant project as a sub-bullet if project-specific)

Update the dashboard's `last-updated` field.

### Step 5, confirm

Tell the user exactly what you added and where. One line:

"Added to Project Lucy as a new action item: 'review Letty's feedback by 2026-05-08'."

If anything was ambiguous and you made a default choice, mention it: "I assumed this belongs to Project Lucy since you mentioned it most recently. Let me know if it should go elsewhere."

## Output rules

- **No unnecessary questions.** Get just enough info, then add. Do not build a form.
- **Default sensibly.** Owner defaults to "me." Date defaults to today. Project defaults to "general" or whichever project context makes sense.
- **Preserve everything else in the dashboard.** Add only.
- **One item per invocation by default.** If the user wants to add multiple items in a single message, process them all but list each addition separately in the confirmation.

## Edge cases

- **Adding a project that already exists by a similar name:** Ask the user if they meant the existing one. Do not silently create duplicates.
- **Adding an action item to a project that doesn't exist:** Offer to create the project first, or add to "general" notes.
- **Adding something that's actually a decision but was framed as an action item (or vice versa):** Reframe it for the user once. "This sounds like a decision, not an action item. Should I log it as a decision?" If they confirm, do it. If they don't, follow their original framing.

## Quality bar

The user should be able to dump a quick thought ("oh I need to remember to ask Bronson about the pricing thing") and have it captured cleanly in seconds. If the skill creates friction, the user will go back to writing things on sticky notes that get lost. Be fast, be quiet, be accurate.

## What this skill does NOT do

- Does not process meeting notes. That's `/process-meeting`.
- Does not process Slack threads. That's `/process-slack-thread`.
- Does not delete or modify existing items. The user does that by editing `dashboard.md` directly.
- Does not generate any kind of report. The skill is one-item-at-a-time capture.
