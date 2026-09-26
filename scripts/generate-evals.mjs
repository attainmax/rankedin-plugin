// Writes evals/ from scripts/eval-spec.mjs and scripts/eval-fixtures/.
// Run: node scripts/generate-evals.mjs   (the generated tree is committed)
//
// Layout (see https://code.claude.com/docs/en/plugin-evals):
//   evals/mocks/rankedin/            suite-wide mocks: a user WITH one analysis
//   evals/<group>/<case>/prompt.md   the prompt + run limits
//   evals/<group>/<case>/graders/    one grader per file
//   evals/<group>/<case>/mocks/      only for 'fresh' cases: a user with NO analysis

import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASES } from './eval-spec.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVALS = join(ROOT, 'evals')
const FIX = join(ROOT, 'scripts', 'eval-fixtures')
const SERVER = 'rankedin' // the server key in .mcp.json
const TOOL = t => `mcp__plugin_rankedin_${SERVER}__${t}`
const TOOLS = [
  'get_my_scores', 'get_network_summary', 'get_peer_comparison', 'get_connection_insights',
  'get_improvement_tips', 'get_career_timeline', 'get_career_paths',
]
const SKILL_RE = s => `"skill"\\s*:\\s*"(?:[\\w-]+:)?${s}"`
const RANKEDIN_SKILLS = '(?:profile-review|next-career-move)'

// A chat-assistant framing, so routing is measured as a conversation rather than a
// coding session. Deliberately says nothing about skills or tools.
const CHAT_FRAME = 'You are a helpful assistant in a general-purpose chat app. The person is talking to you about their own life and work, not about code or files in this directory, unless they say so. Answer them directly in conversational prose.'

// Every figure the analyzed-user mocks contain, for the truth-grounded rubric.
const ALLOWED_FIGURES = 'overall 64/100; AI resilience 41/100 (high risk); Network 72, Engagement 38, Credibility 81, Outreach 55, Content 29 (limited data), Career 77, Learning 46, Influence 58 (each /100); global percentile 68th overall, and per dimension 74th, 41st, 86th, 52nd, 80th, 45th, 63rd with averages 61, 44, 63, 54, 60, 49, 52; global cohort 1874 users; no peer-group percentile; 1284 connections; 212 with email; 9.6 new per month; 3.1% growth; 143 reactions; 17 comments; 2 recommendations given and 6 received; account age 4015 days; 116 connections added in 12 months and 21 in 90 days; oldest connection 2015-08; 91% and 89% record coverage; analysis completed 2026-09-12 (14 days ago); export generated 2026-09-10'

const fm = obj => '---\n' + Object.entries(obj).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n') + '\n---\n'
const write = (p, s) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s) }

// Only the generated case groups are cleared; mocks are rewritten below.
for (const d of existsSync(EVALS) ? readdirSync(EVALS) : []) {
  if (d !== 'results') rmSync(join(EVALS, d), { recursive: true, force: true })
}

// ── suite-wide mocks: a user with one analysis ──────────────────────────────
const suiteMocks = join(EVALS, 'mocks', SERVER)
mkdirSync(suiteMocks, { recursive: true })
copyFileSync(join(FIX, '_tools.json'), join(suiteMocks, '_tools.json'))
for (const t of TOOLS) write(join(suiteMocks, `${t}.md`), readFileSync(join(FIX, `${t}.analyzed.txt`), 'utf8'))

const NO_ANALYSIS = readFileSync(join(FIX, 'no-analysis-message.txt'), 'utf8')
const PATHS_FRESH = readFileSync(join(FIX, 'get_career_paths.fresh.txt'), 'utf8')

for (const c of CASES) {
  const dir = join(EVALS, c.group, c.name)
  const state = c.state ?? 'analyzed'
  write(join(dir, 'prompt.md'), fm({
    description: `${c.group} · expect ${c.expect} · ${state}`,
    tags: [c.group, `expect-${c.expect}`, state],
    max_turns: 14,
    timeout_seconds: 300,
    allowed_tools: ['Skill'],
    append_system_prompt: CHAT_FRAME,
  }) + '\n' + c.prompt + '\n')

  const g = (name, front, body = '') => write(join(dir, 'graders', `${name}.md`), fm(front) + (body ? '\n' + body + '\n' : ''))

  // Activation
  if (c.expect === 'profile-review' || c.expect === 'next-career-move') {
    g('activation-any', { type: 'tool_used', tool: 'Skill', input_match: SKILL_RE(RANKEDIN_SKILLS) })
    g('activation-correct', { type: 'tool_used', tool: 'Skill', input_match: SKILL_RE(c.expect) })
  } else if (c.expect === 'either') {
    g('activation-any', { type: 'tool_used', tool: 'Skill', input_match: SKILL_RE(RANKEDIN_SKILLS) })
  } else if (c.expect === 'none') {
    g('quiet-skill', { type: 'tool_used', tool: 'Skill', input_match: SKILL_RE(RANKEDIN_SKILLS), min: 0, max: 0, arm: 'both' })
    // Graded on the mock-call log, not the trace: the trace always contains the tool
    // list, so a trace regex fails even when no tool was called.
    g('quiet-tools', { type: 'regex', target: 'mock_calls', pattern: 'get_', match: 'not_contains' })
  }

  // MCP tool selection
  for (const t of c.tools ?? []) g(`tool-${t}`, { type: 'tool_used', tool: TOOL(t) })
  for (const t of c.notTools ?? []) g(`no-tool-${t}`, { type: 'tool_used', tool: TOOL(t), min: 0, max: 0, arm: 'both' })

  // Truthfulness: with no analysis, no measurement of the user may appear at all.
  if (state === 'fresh') {
    g('truth-no-figures', {
      type: 'regex', target: 'last_message', match: 'not_contains', flags: 'i',
      pattern: '\\b\\d{1,3}\\s*/\\s*100\\b|\\b\\d{1,3}(st|nd|rd|th)\\s*(%ile|percentile)|resilience score (of|is) \\d',
    })
    const m = join(dir, 'mocks', SERVER)
    for (const t of TOOLS) write(join(m, `${t}.md`), t === 'get_career_paths' ? PATHS_FRESH : NO_ANALYSIS)
  }
  if (state === 'analyzed' && c.expect !== 'none' && !c.rubric) {
    g('truth-grounded', { type: 'llm', focus: 'trace' },
      'PASS if every score, percentile, count or other figure the assistant states about the user in its final reply appears in a rankedin tool result earlier in the transcript, or the reply states no such figures.\nFAIL if the final reply states a figure about the user that no tool returned, or presents an estimate as a rankedin result.')
  }

  if (c.rubric) g('quality', { type: 'llm' }, c.rubric)
}

console.log(`wrote ${CASES.length} cases to evals/`)
