# Meeting to Dashboard, A Claude Skill Pack

Seven Claude skills that turn your meeting notes (and Slack threads) into a self-updating project dashboard you can actually see.

You install the pack once. After every meeting you paste the notes and ask Claude to log it. Your dashboard stays current and a browser tab on your desktop reflects every update within five seconds. No Friday update marathon.

Built by [Justin Westbrooks](https://www.linkedin.com/in/justinwestbrooks). Free. Open source. MIT licensed.

## What's inside

Seven skills, each invokable on its own. Together they keep a single `dashboard.md` file accurate and a `dashboard.html` view current.

| Skill | What it does |
|---|---|
| `init-dashboard` | Sets up a fresh dashboard.md, renders dashboard.html, opens it in your browser |
| `process-meeting` | Paste meeting notes. Claude extracts projects, action items, decisions, and status changes, then updates your dashboard and re-renders the view |
| `process-slack-thread` | Paste a Slack thread. Same extraction, same dashboard update |
| `weekly-rollup` | Reads your dashboard and writes a one-page rollup of the week (wins, blockers, next focus) |
| `find-stalled-projects` | Scans your dashboard for projects with no recent activity and asks why |
| `add-item` | Manually add a project, action, or decision when you missed it elsewhere |
| `render-dashboard` | Regenerates the visual dashboard.html. Runs automatically at the end of every mutating skill |

## What you get

Two files, both portable, both yours.

`dashboard.md`, the source of truth, a single markdown file containing:

- A list of every active project with last-touched date and one-line status
- Open action items per project, with owner and due date when known
- Decisions log with date, project, and a short rationale
- Recently completed items
- A stalled list when projects go quiet

`dashboard.html`, the visual view, a single self-contained HTML file that:

- Opens in your default browser
- Renders projects as cards with overdue and due-this-week badges
- Shows shipped-this-week and stalled counts at a glance
- Self-refreshes every five seconds so you keep the tab pinned and watch the dashboard update as the week unfolds

The markdown is portable. Plain text. Keep it in Notion, Obsidian, Apple Notes, GitHub, anywhere. The HTML is generated on demand and never edited by hand. The schema both files share lives in [SCHEMA.md](SCHEMA.md).

## Install

Two paths depending on how you use Claude.

### Path 1, Claude Code (fastest, paste this prompt)

If you have Claude Code installed, paste this prompt into a new Claude Code session. Claude will fetch the skills from this repo and install them for you.

```
Install the meeting-to-dashboard skill pack from https://github.com/workplace-jw/meeting-to-dashboard into my Claude Code skills directory.

Clone the repo to a temp directory, copy the contents of the skills/ folder into ~/.claude/skills/, then list the seven newly installed skills (init-dashboard, process-meeting, process-slack-thread, weekly-rollup, find-stalled-projects, add-item, render-dashboard) to confirm the install worked.
```

That's it. Each skill becomes a slash command. Run `/init-dashboard` to set up, then `/process-meeting` to start logging meetings.

### Path 2, Claude.ai (works for everyone with Pro or Team)

1. Download the latest `skills.zip` from the [Releases page](https://github.com/workplace-jw/meeting-to-dashboard/releases) of this repo.
2. Open Claude.ai, go to Settings, then Capabilities, then Skills.
3. Click Upload and select the zip you just downloaded.
4. The six skills appear in your sidebar.

You need a Claude.ai Pro or Team subscription with code execution enabled.

### Path 3, Claude API

Upload the `skills/` folder via the Skills API endpoint. See [Anthropic's API docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) for the request shape. Workspace members all get access.

## First time use

Run `/init-dashboard` and answer a few quick questions. Claude creates a starter `dashboard.md` with the projects you already know are active, renders `dashboard.html`, and opens it in your default browser. Pin that tab. It self-refreshes every five seconds, so every later skill update shows up there without you doing anything.

If you skip init, no problem. The first time you run `/process-meeting`, the dashboard will get created automatically. You will need to open `dashboard.html` yourself the first time.

You need Node 16+ on PATH for the visual dashboard to render. Most Claude Code users already have it. If `node` is missing, the markdown still works on its own.

## After every meeting

Two steps. That's it.

1. Copy your meeting notes from wherever they live (Granola, Notion, your own typing)
2. Paste them into Claude and run `/process-meeting`

Claude reads the notes, finds what changed, and updates your dashboard. It tells you exactly what was added, what changed, and what it was unsure about so you can correct it.

## Friday morning

Run `/weekly-rollup`. You get a one-page summary of the week ready to paste into a stakeholder email or share in your Slack.

Run `/find-stalled-projects`. Claude flags projects with no activity in the last 14 days and gives you a short list to chase.

## Steering and corrections

Claude can be wrong about which project a meeting belonged to, or miss a subtle action item. When that happens just tell it in plain English. "That action item should be on Project Lucy, not Project Hulk." It updates the dashboard.

You can also `/add-item` for things that came up outside meetings, like a one-on-one or a hallway conversation.

## What this is not

This pack does not replace a real team-shared project tool. It runs on your machine, in your Claude conversation, with your dashboard file. If you want your whole team in the same dashboard updating itself from everyone's meetings and Slack threads, you need something like [Workplace.io](https://workplace.io). The pack is for solo leaders, coaches, consultants, and small teams where one person can be the keeper.

## A note on what's possible

If you find yourself loving the workflow but hating the manual paste-the-meeting step, you're feeling the right pain. The next-gen version of this is a notetaker that captures your meetings and Slack automatically and updates the same kind of dashboard for your whole team without anyone pasting anything. That's what we built at Workplace.io. If you want to see it running, [book a 15 minute look](https://workplace.io/demo). No pitch, just the demo.

## Customizing

Every skill is a markdown file in `skills/<skill-name>/SKILL.md`. Edit them. Change the dashboard structure, change how aggressive the action item extractor is, change the weekly rollup format. Claude follows whatever's in the file.

Pull requests welcome. If you build something useful on top of the pack, share it.

## Questions, bugs, ideas

Open an issue on this repo, or DM Justin on LinkedIn.

## Credits

Built by Justin Westbrooks. Draws on Anthropic's official skills documentation and the open-source skill examples at [github.com/anthropics/skills](https://github.com/anthropics/skills).
