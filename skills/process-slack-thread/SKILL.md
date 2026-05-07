---
name: process-slack-thread
description: Extract action items, decisions, and project updates from a Slack thread (or any chat thread) the user pasted, then update their dashboard.md file. Use this whenever the user pastes Slack messages, chat exports, Discord threads, Teams conversations, or any back-and-forth conversation and asks you to log it, capture it, or update their dashboard. Also trigger when the user says "logged a slack thread", "here's a slack convo", "process this thread", or pastes timestamped messages from multiple people. Always trigger if the input looks like chat messages (timestamps, multiple speakers, conversational tone) and there's a dashboard.md in the workspace.
---

# Process Slack Thread Into Dashboard

Take a pasted Slack thread (or any chat conversation) and update the user's `dashboard.md` with action items, decisions, and project updates that surfaced.

## What you're producing

Same outputs as `/process-meeting`:

1. An updated `dashboard.md` file
2. A short changelog telling the user what changed

The skill is similar to `/process-meeting` but tuned for chat-style input, where information is fragmented across many messages by multiple people, often with no formal structure.

## Workflow

### Step 1, find the dashboard

Look for `dashboard.md` in the current working directory.

If it doesn't exist, create it using the template from `init-dashboard`, then continue.

### Step 2, read the thread carefully

Chat threads are noisy. The signal-to-noise ratio is lower than meeting notes. Read every message but bias toward extracting only the action items, decisions, and status updates that actually matter. Ignore reactions, jokes, and idle banter.

For each message, ask:

- **Did someone commit to doing something?** That's an action item. Note who committed and any timeline mentioned.
- **Did the group reach a decision?** Look for "let's go with", "agreed", "fine, we'll do that", "approved" or similar. That's a decision.
- **Did someone announce a status change?** "Just shipped X", "blocked on Y", "moved Z to next week" are status updates.
- **Did a new project surface?** Watch for "new ask from [stakeholder]" or "we should build [thing]" that becomes a real commitment in the same thread.

Ignore:

- Greetings and pleasantries
- Reactions and emoji-only messages
- Questions that didn't get answered (unless the question itself is the action item, in which case capture it as "follow up on X")
- Tangents that don't lead anywhere

### Step 3, identify the project context

Slack threads often discuss one project. The thread title or channel name often tells you which one. If unclear, ask the user before processing, do not guess.

If the thread spans multiple projects, process action items and decisions per their respective projects. Be explicit in the changelog about which item went where.

### Step 4, match against the existing dashboard

Same matching rules as `/process-meeting`. Compare new mentions to existing projects and action items. Do not duplicate.

If an action item in the thread is someone marking an existing item complete ("just did X"), mark the existing item done.

### Step 5, update the dashboard

Apply changes using the same logic as `/process-meeting`. Update last-touched dates, append new items, move completed items, log decisions.

Use the date of the most recent message in the thread as the "meeting date" equivalent.

### Step 6, write the changelog

Same format as `/process-meeting`, but lead with the project context (since chat threads often span less than meetings):

```
## Slack thread logged: #project-lucy channel, 2026-05-06

**Project context:** Workplace Project Lucy

**Updated:**
- Marked "demo deck v2" as complete (Lucas confirmed in thread at 11:42)
- Status updated to "ready for Endava review on May 14"

**2 new action items:**
- Connelly: revise the slide 4 visual based on Lucas's feedback (due not specified)
- Justin: send Letty the demo invite (due tomorrow)

**1 decision logged:**
- 2026-05-06, demo will use the simpler sidebar UI not the chat panel, reason: faster to render in the demo environment

**Things I wasn't sure about:**
- Bronson asked "should we tell Steve?" and no one responded in the thread. I added it as an open question for you to decide.
```

## Special handling for Slack

- **Threaded replies vs. main channel:** If the user pastes a threaded reply chain, treat it as a single thread. If they paste main channel messages with replies, ask whether each thread should be processed separately.
- **Mentions and DMs:** @-mentions reference real owners. Use them to assign action items accurately.
- **Reactions as decisions:** A bunch of thumbs-up reactions on a proposal can be the decision signal. Capture it but flag in the changelog ("decision was implicit, marked by 5 thumbs-up reactions, please confirm").
- **Voice/huddle references:** "We hopped on a quick huddle and decided X" is a real decision even though no transcript was pasted. Capture it.

## Edge cases

- **Thread is huge (200+ messages):** Process it all. The user has a reason for pasting it.
- **Thread has bot messages mixed in (deploy bots, GitHub bots):** Surface notable ones (like a deploy completing) as status updates if they're project-relevant. Skip noise.
- **Thread is in a DM channel:** Process the same way. Note in the changelog that this was a DM (might affect ownership/visibility decisions later).
- **No clear action items or decisions:** Tell the user the thread didn't produce any logged items, and ask if they want anything captured anyway as a note.

## Quality bar

The user pastes a thread and gets back a clean update. They should NOT have to read your changelog and think "wait, that's not what we said." Be conservative when in doubt, flag, ask.

## What this skill does NOT do

- Does not process meeting transcripts. That is `/process-meeting`.
- Does not summarize the thread for sharing. The output is dashboard updates only, not a thread summary.
- Does not generate any rollup. That is `/weekly-rollup`.
