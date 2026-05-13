#!/usr/bin/env node
/*
 * render-dashboard
 *
 * Parses a `dashboard.md` file written to the skill pack schema and writes
 * a static `dashboard.html` next to it. The HTML self-refreshes every 5s so
 * an open browser tab tracks live edits.
 *
 * Usage:
 *   node render.js [path/to/dashboard.md]
 *
 * Defaults to ./dashboard.md.
 *
 * Zero external dependencies. Node 16+.
 */

const fs = require('fs');
const path = require('path');

const REFRESH_SECONDS = 5;

function main() {
  const input = path.resolve(process.argv[2] || 'dashboard.md');
  if (!fs.existsSync(input)) {
    console.error(`render-dashboard: no file at ${input}`);
    process.exit(1);
  }
  const md = fs.readFileSync(input, 'utf8');
  const data = parseDashboard(md);
  const html = renderHtml(data);
  const out = path.join(path.dirname(input), 'dashboard.html');
  fs.writeFileSync(out, html);
  console.log(`rendered → ${out}`);
}

// ---------- parsing ----------

function parseDashboard(md) {
  const { frontmatter, body } = splitFrontmatter(md);
  const sections = splitSections(body);
  return {
    frontmatter,
    activeProjects: parseActiveProjects(sections['Active Projects'] || ''),
    recentlyCompleted: parseCompletedList(sections['Recently Completed'] || ''),
    stalled: parseStalled(sections['Stalled'] || ''),
    notes: parseNotes(sections['Notes and Open Threads'] || ''),
  };
}

function splitFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: md };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { frontmatter: fm, body: md.slice(match[0].length) };
}

function splitSections(body) {
  // Split top-level `## ` sections. Ignore the `# Project Dashboard` line.
  const out = {};
  const lines = body.split('\n');
  let current = null;
  let buf = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m && !line.startsWith('### ')) {
      if (current) out[current] = buf.join('\n');
      current = m[1].trim();
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) out[current] = buf.join('\n');
  return out;
}

function parseActiveProjects(section) {
  // Split by `### `
  const blocks = section.split(/^###\s+/m).slice(1);
  return blocks.map(parseProjectBlock).filter(Boolean);
}

function parseProjectBlock(block) {
  const lines = block.split('\n');
  const name = (lines.shift() || '').trim();
  if (!name) return null;
  const project = {
    name,
    owner: '',
    status: '',
    lastTouched: '',
    openActionItems: [],
    completedActionItems: [],
    decisions: [],
  };
  let mode = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const labelMatch = line.match(/^-\s+\*\*([^:]+):\*\*\s*(.*)$/);
    if (labelMatch) {
      const label = labelMatch[1].toLowerCase();
      const value = labelMatch[2].trim();
      if (label === 'owner') { project.owner = value; mode = null; }
      else if (label === 'status') { project.status = value; mode = null; }
      else if (label === 'last touched') { project.lastTouched = value; mode = null; }
      else if (label === 'open action items') { mode = 'actions'; }
      else if (label === 'recent decisions') { mode = 'decisions'; }
      else { mode = null; }
      continue;
    }
    if (mode === 'actions') {
      const a = parseActionItem(line);
      if (a) (a.done ? project.completedActionItems : project.openActionItems).push(a);
    } else if (mode === 'decisions') {
      const d = parseDecisionLine(line);
      if (d) project.decisions.push(d);
    }
  }
  return project;
}

function parseActionItem(line) {
  const m = line.match(/^\s*-\s+\[( |x|X)\]\s+(.+?)\s*$/);
  if (!m) return null;
  const done = m[1].toLowerCase() === 'x';
  let text = m[2];
  let owner = 'me';
  let due = '';
  const paren = text.match(/\(([^)]+)\)\s*$/);
  if (paren) {
    text = text.slice(0, paren.index).trim();
    const parts = paren[1].split(',').map(s => s.trim());
    for (const p of parts) {
      const om = p.match(/^owner:\s*(.+)$/i);
      const dm = p.match(/^due:\s*(.+)$/i);
      if (om) owner = om[1];
      else if (dm) due = dm[1];
    }
  }
  return { text, owner, due, done };
}

function parseDecisionLine(line) {
  const m = line.match(/^\s*-\s+(\d{4}-\d{2}-\d{2}),\s*(.+?)\s*$/);
  if (!m) return null;
  let rest = m[2];
  let reason = '';
  const rm = rest.match(/,\s*reason:\s*(.+)$/i);
  if (rm) {
    reason = rm[1];
    rest = rest.slice(0, rm.index).trim();
  }
  return { date: m[1], text: rest, reason };
}

function parseCompletedList(section) {
  const items = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*-\s+(\d{4}-\d{2}-\d{2}),\s*([^,]+),\s*(.+?)\s*$/);
    if (m) items.push({ date: m[1], project: m[2].trim(), text: m[3].trim() });
  }
  return items;
}

function parseStalled(section) {
  const items = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*-\s+\*\*([^:]+):\*\*\s*(.+?)\s*$/);
    if (!m) continue;
    const name = m[1].trim();
    const rest = m[2];
    const last = rest.match(/Last activity\s+(\d{4}-\d{2}-\d{2}),\s+(\d+)\s+days ago/i);
    const cause = rest.match(/Likely cause:\s*([^.]+)\./i);
    const next = rest.match(/Suggested next move:\s*(.+?)\.?\s*$/i);
    items.push({
      name,
      lastActivity: last ? last[1] : '',
      daysAgo: last ? Number(last[2]) : null,
      cause: cause ? cause[1].trim() : '',
      nextMove: next ? next[1].trim() : '',
    });
  }
  return items;
}

function parseNotes(section) {
  const items = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\s*-\s+(.+?)\s*$/);
    if (m) items.push(m[1]);
  }
  return items;
}

// ---------- date helpers ----------

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return null;
  const a = new Date(aIso + 'T00:00:00Z');
  const b = new Date(bIso + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

function relativeDate(iso) {
  if (!iso) return '';
  const d = daysBetween(iso, today());
  if (d === null) return iso;
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d > 0) return `${d}d ago`;
  if (d === -1) return 'tomorrow';
  return `in ${-d}d`;
}

function dueStatus(dueIso) {
  if (!dueIso) return { label: '', tone: 'none' };
  const d = daysBetween(today(), dueIso);
  if (d === null) return { label: dueIso, tone: 'none' };
  if (d < 0) return { label: `overdue ${-d}d`, tone: 'overdue' };
  if (d === 0) return { label: 'due today', tone: 'soon' };
  if (d <= 7) return { label: `due in ${d}d`, tone: 'soon' };
  return { label: `due ${dueIso}`, tone: 'later' };
}

// ---------- summary stats ----------

function computeStats(data) {
  let openActions = 0;
  let overdue = 0;
  let dueThisWeek = 0;
  for (const p of data.activeProjects) {
    for (const a of p.openActionItems) {
      openActions += 1;
      const s = dueStatus(a.due);
      if (s.tone === 'overdue') overdue += 1;
      else if (s.tone === 'soon') dueThisWeek += 1;
    }
  }
  return {
    activeProjects: data.activeProjects.length,
    openActions,
    overdue,
    dueThisWeek,
    stalled: data.stalled.length,
    completedThisWeek: data.recentlyCompleted.filter(c => {
      const d = daysBetween(c.date, today());
      return d !== null && d <= 7 && d >= 0;
    }).length,
  };
}

// ---------- rendering ----------

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(data) {
  const stats = computeStats(data);
  const fm = data.frontmatter || {};
  const title = 'Project Dashboard';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="refresh" content="${REFRESH_SECONDS}" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${STYLES}</style>
</head>
<body>
<main class="wrap">
  ${renderHeader(fm, stats)}
  ${renderStats(stats)}
  ${renderProjects(data.activeProjects)}
  ${renderTwoCol(data)}
  ${renderNotes(data.notes)}
  <footer class="footer">
    Auto-refreshes every ${REFRESH_SECONDS}s. Source of truth lives in <code>dashboard.md</code>.
  </footer>
</main>
</body>
</html>`;
}

function renderHeader(fm, stats) {
  const updated = fm['last-updated'] || today();
  return `
  <header class="hd">
    <div class="hd-left">
      <p class="eyebrow">Project Dashboard</p>
      <h1 class="title">What's moving, what's stuck.</h1>
      <p class="sub">Last updated <strong>${escapeHtml(relativeDate(updated))}</strong> · ${escapeHtml(updated)}</p>
    </div>
  </header>`;
}

function renderStats(stats) {
  const cell = (n, label, tone) => `
    <div class="stat ${tone || ''}">
      <div class="stat-n">${n}</div>
      <div class="stat-l">${escapeHtml(label)}</div>
    </div>`;
  return `
  <section class="stats">
    ${cell(stats.activeProjects, 'active projects')}
    ${cell(stats.openActions, 'open actions')}
    ${cell(stats.overdue, 'overdue', stats.overdue > 0 ? 'danger' : '')}
    ${cell(stats.dueThisWeek, 'due this week', stats.dueThisWeek > 0 ? 'soon' : '')}
    ${cell(stats.completedThisWeek, 'shipped this week', stats.completedThisWeek > 0 ? 'good' : '')}
    ${cell(stats.stalled, 'stalled', stats.stalled > 0 ? 'warn' : '')}
  </section>`;
}

function renderProjects(projects) {
  if (!projects.length) {
    return `
    <section class="section">
      <h2 class="section-h">Active projects</h2>
      <div class="empty">No active projects yet. Run <code>/process-meeting</code> with notes from your next meeting and they will appear here.</div>
    </section>`;
  }
  const sorted = [...projects].sort((a, b) => (b.lastTouched || '').localeCompare(a.lastTouched || ''));
  return `
  <section class="section">
    <h2 class="section-h">Active projects <span class="count">${sorted.length}</span></h2>
    <div class="grid">
      ${sorted.map(renderProjectCard).join('')}
    </div>
  </section>`;
}

function renderProjectCard(p) {
  const openItems = p.openActionItems.map(renderActionItem).join('');
  const decisions = p.decisions.slice(0, 3).map(renderDecision).join('');
  const ownerPill = p.owner ? `<span class="pill owner">${escapeHtml(p.owner)}</span>` : '';
  const touched = p.lastTouched
    ? `<span class="touched">touched ${escapeHtml(relativeDate(p.lastTouched))}</span>`
    : '';
  return `
    <article class="card">
      <header class="card-h">
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <div class="card-meta">${ownerPill}${touched}</div>
      </header>
      ${p.status ? `<p class="status">${escapeHtml(p.status)}</p>` : ''}
      ${openItems ? `
      <div class="block">
        <p class="block-h">Open</p>
        <ul class="actions">${openItems}</ul>
      </div>` : `
      <div class="block">
        <p class="block-h">Open</p>
        <p class="empty-mini">No open actions.</p>
      </div>`}
      ${decisions ? `
      <div class="block">
        <p class="block-h">Recent decisions</p>
        <ul class="decisions">${decisions}</ul>
      </div>` : ''}
    </article>`;
}

function renderActionItem(a) {
  const s = dueStatus(a.due);
  const tone = s.tone === 'overdue' ? 'is-overdue' : s.tone === 'soon' ? 'is-soon' : '';
  const owner = a.owner ? `<span class="owner-tag">${escapeHtml(a.owner)}</span>` : '';
  const due = s.label ? `<span class="due ${tone}">${escapeHtml(s.label)}</span>` : '';
  return `<li class="action ${tone}">
    <span class="check" aria-hidden="true"></span>
    <span class="action-text">${escapeHtml(a.text)}</span>
    <span class="action-meta">${owner}${due}</span>
  </li>`;
}

function renderDecision(d) {
  return `<li class="decision">
    <span class="d-date">${escapeHtml(d.date)}</span>
    <span class="d-text">${escapeHtml(d.text)}${d.reason ? ` <span class="d-reason">(${escapeHtml(d.reason)})</span>` : ''}</span>
  </li>`;
}

function renderTwoCol(data) {
  return `
  <section class="two-col">
    ${renderCompleted(data.recentlyCompleted)}
    ${renderStalled(data.stalled)}
  </section>`;
}

function renderCompleted(items) {
  const recent = items.slice(0, 12);
  if (!recent.length) {
    return `
    <div class="panel">
      <h2 class="section-h">Recently completed</h2>
      <p class="empty-mini">Nothing logged as complete yet.</p>
    </div>`;
  }
  return `
    <div class="panel">
      <h2 class="section-h">Recently completed <span class="count">${items.length}</span></h2>
      <ul class="timeline">
        ${recent.map(c => `<li>
          <span class="t-date">${escapeHtml(c.date)}</span>
          <span class="t-body"><strong>${escapeHtml(c.project)}</strong> · ${escapeHtml(c.text)}</span>
        </li>`).join('')}
      </ul>
    </div>`;
}

function renderStalled(items) {
  if (!items.length) {
    return `
    <div class="panel">
      <h2 class="section-h">Stalled</h2>
      <p class="empty-mini">Nothing stalled. Run <code>/find-stalled-projects</code> to refresh this.</p>
    </div>`;
  }
  return `
    <div class="panel">
      <h2 class="section-h">Stalled <span class="count">${items.length}</span></h2>
      <ul class="stalled-list">
        ${items.map(s => `<li class="stall">
          <div class="stall-h"><strong>${escapeHtml(s.name)}</strong>${s.daysAgo != null ? ` <span class="muted">${s.daysAgo}d quiet</span>` : ''}</div>
          ${s.cause ? `<div class="stall-cause">${escapeHtml(s.cause)}</div>` : ''}
          ${s.nextMove ? `<div class="stall-next"><span class="muted">Next move,</span> ${escapeHtml(s.nextMove)}</div>` : ''}
        </li>`).join('')}
      </ul>
    </div>`;
}

function renderNotes(notes) {
  if (!notes.length) return '';
  return `
  <section class="section">
    <h2 class="section-h">Notes and open threads</h2>
    <ul class="notes">
      ${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
    </ul>
  </section>`;
}

// ---------- styles ----------

const STYLES = `
:root {
  --bg: #ffffff;
  --ink: #0f172a;
  --ink-2: #475569;
  --ink-3: #94a3b8;
  --line: rgba(15, 23, 42, 0.08);
  --line-soft: rgba(15, 23, 42, 0.06);
  --card: #f8fafc;
  --accent: #0086FC;
  --accent-soft: rgba(0, 134, 252, 0.1);
  --danger: #dc2626;
  --danger-soft: rgba(220, 38, 38, 0.1);
  --warn: #d97706;
  --warn-soft: rgba(217, 119, 6, 0.1);
  --good: #059669;
  --good-soft: rgba(5, 150, 105, 0.1);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); }
body {
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv11', 'ss01';
}
code { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85em; background: var(--accent-soft); color: var(--ink); padding: 0.1em 0.4em; border-radius: 5px; }
.wrap { max-width: 1240px; margin: 0 auto; padding: 3rem 1.5rem 6rem; }

.hd { margin-bottom: 2.25rem; }
.eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-3); margin: 0 0 0.5rem 0;
}
.title {
  font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05;
  letter-spacing: -0.035em; font-weight: 600; margin: 0 0 0.5rem 0;
  text-wrap: balance;
}
.sub { font-size: 0.95rem; color: var(--ink-2); margin: 0; }
.sub strong { color: var(--ink); font-weight: 600; }

.stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}
.stat {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 1.25rem 1rem;
}
.stat-n { font-size: 2rem; font-weight: 600; letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.5rem; }
.stat-l { font-size: 0.75rem; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
.stat.danger .stat-n { color: var(--danger); }
.stat.warn .stat-n { color: var(--warn); }
.stat.soon .stat-n { color: var(--accent); }
.stat.good .stat-n { color: var(--good); }

.section { margin-bottom: 2.5rem; }
.section-h {
  font-size: 0.95rem; font-weight: 600; letter-spacing: 0.01em;
  margin: 0 0 1rem 0; color: var(--ink);
  display: flex; align-items: center; gap: 0.5rem;
}
.count {
  display: inline-flex; align-items: center; justify-content: center;
  height: 20px; padding: 0 7px; min-width: 20px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11px; font-weight: 600; border-radius: 999px;
}
.empty {
  background: var(--card); border: 1px dashed var(--line);
  border-radius: 14px; padding: 1.5rem; color: var(--ink-2); font-size: 0.95rem;
}
.empty-mini { color: var(--ink-3); font-size: 0.875rem; margin: 0; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}
.card {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex; flex-direction: column;
  box-shadow: 0 1px 2px rgba(15,23,42,0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,23,42,0.06); }
.card-h { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.card-title { font-size: 1.0625rem; font-weight: 600; letter-spacing: -0.015em; margin: 0; line-height: 1.25; }
.card-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.pill {
  display: inline-flex; align-items: center; height: 22px;
  padding: 0 9px; border-radius: 999px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
}
.pill.owner { background: var(--accent-soft); color: var(--accent); }
.touched { font-size: 11px; color: var(--ink-3); font-weight: 500; }
.status { font-size: 0.9375rem; color: var(--ink-2); margin: 0 0 1rem 0; line-height: 1.45; }

.block { margin-top: 0.875rem; padding-top: 0.875rem; border-top: 1px solid var(--line-soft); }
.block:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }
.block-h {
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-3); margin: 0 0 0.5rem 0;
}

.actions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.action { display: grid; grid-template-columns: 16px 1fr auto; gap: 0.625rem; align-items: start; font-size: 0.875rem; line-height: 1.4; }
.check {
  width: 14px; height: 14px; border: 1.5px solid var(--ink-3); border-radius: 4px;
  display: inline-block; margin-top: 3px;
}
.action.is-overdue .check { border-color: var(--danger); }
.action.is-soon .check { border-color: var(--accent); }
.action-text { color: var(--ink); word-break: break-word; }
.action-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }
.owner-tag {
  font-size: 11px; color: var(--ink-2); font-weight: 500;
  background: rgba(15,23,42,0.04); padding: 2px 7px; border-radius: 6px;
}
.due {
  font-size: 11px; font-weight: 500;
  padding: 2px 7px; border-radius: 6px;
}
.due.is-overdue { color: var(--danger); background: var(--danger-soft); font-weight: 600; }
.due.is-soon { color: var(--accent); background: var(--accent-soft); }

.decisions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.decision { display: grid; grid-template-columns: 84px 1fr; gap: 0.625rem; font-size: 0.8125rem; line-height: 1.45; }
.d-date { color: var(--ink-3); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; padding-top: 1px; }
.d-text { color: var(--ink-2); }
.d-reason { color: var(--ink-3); }

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}
.panel {
  background: var(--card);
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  padding: 1.5rem;
}
.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
.timeline li { display: grid; grid-template-columns: 84px 1fr; gap: 0.625rem; font-size: 0.875rem; line-height: 1.45; }
.t-date { color: var(--ink-3); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; padding-top: 2px; }
.t-body { color: var(--ink-2); }
.t-body strong { color: var(--ink); font-weight: 600; }

.stalled-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.875rem; }
.stall {
  background: var(--warn-soft); border: 1px solid rgba(217,119,6,0.15);
  border-radius: 10px; padding: 0.875rem 1rem;
  font-size: 0.875rem; line-height: 1.45;
}
.stall-h { font-weight: 600; margin-bottom: 0.25rem; color: var(--ink); }
.stall-cause { color: var(--ink-2); margin-bottom: 0.25rem; }
.stall-next { color: var(--ink-2); }
.muted { color: var(--ink-3); font-weight: 500; }

.notes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.notes li {
  padding: 0.75rem 1rem; background: var(--card);
  border: 1px solid var(--line-soft); border-radius: 10px;
  font-size: 0.9375rem; line-height: 1.5; color: var(--ink-2);
}

.footer {
  margin-top: 3rem; padding-top: 1.5rem;
  border-top: 1px solid var(--line-soft);
  font-size: 0.8125rem; color: var(--ink-3); text-align: center;
}

@media (max-width: 960px) {
  .stats { grid-template-columns: repeat(3, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .wrap { padding: 2rem 1rem 4rem; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .stat { padding: 1rem 0.875rem; }
  .stat-n { font-size: 1.5rem; }
  .grid { grid-template-columns: 1fr; }
  .action { grid-template-columns: 16px 1fr; }
  .action-meta { grid-column: 2; justify-content: flex-start; }
  .decision { grid-template-columns: 1fr; }
  .d-date { padding-top: 0; }
  .timeline li { grid-template-columns: 1fr; }
}
`;

main();
