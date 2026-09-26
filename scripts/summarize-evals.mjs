// Turns a `claude plugin eval --json` result into the P0 acceptance metrics.
// Run: node scripts/summarize-evals.mjs <result.json> [--markdown]
//
// Every metric is computed per RUN (a case runs 3 times by default), from grader
// verdicts only. Nothing here calls a model.

import { readFileSync } from 'node:fs'
import { CASES } from './eval-spec.mjs'

const [file, flag] = process.argv.slice(2)
const result = JSON.parse(readFileSync(file, 'utf8'))
const spec = new Map(CASES.map(c => [c.name, c]))

// Cases whose rubric is chiefly a truthfulness or unsupported-capability check.
const UNSUPPORTED = new Set(['job-find-openings', 'wa-promotion-ready', 'wa-score-change', 'wa-who-changed-jobs', 'net-right-people'])

const runs = []
for (const c of result.cases) {
  const s = spec.get(c.name)
  if (!s) continue
  for (const r of c.arms.with) {
    const g = Object.fromEntries((r.graders ?? []).map(x => [x.name, x.passed]))
    runs.push({ name: c.name, group: s.group, expect: s.expect, state: s.state ?? 'analyzed', error: r.error, g, calls: r.mocks?.calls?.total ?? 0 })
  }
}

const rate = (xs, f) => { const n = xs.length; const k = xs.filter(f).length; return { k, n, pct: n ? (100 * k / n).toFixed(1) + '%' : 'n/a' } }
const fmt = r => `${r.pct} (${r.k}/${r.n})`
const has = (r, n) => n in r.g

// rankedin can contribute through a skill OR by the model calling a connector tool
// directly (tool descriptions are always loaded). Both count as rankedin surfacing.
const involved = r => r.g['activation-any'] === true || r.g['quiet-skill'] === false || r.calls > 0
const positive = runs.filter(r => ['profile-review', 'next-career-move', 'either'].includes(r.expect))
const specific = runs.filter(r => ['profile-review', 'next-career-move'].includes(r.expect))
const negative = runs.filter(r => r.expect === 'none')
const fired = positive.filter(r => r.g['activation-any'])
const fpRuns = negative.filter(involved)

const toolGraders = runs.flatMap(r => Object.entries(r.g).filter(([n]) => n.startsWith('tool-') || n.startsWith('no-tool-')).map(([, v]) => v))
const truth = runs.flatMap(r => Object.entries(r.g).filter(([n]) => n.startsWith('truth-')).map(([, v]) => v))
const unsupported = runs.filter(r => UNSUPPORTED.has(r.name) && has(r, 'quality'))

const metrics = [
  ['Discovery recall — rankedin involved (skill or tool call)', fmt(rate(positive, involved))],
  ['Discovery recall — via a rankedin skill specifically', fmt(rate(positive, r => r.g['activation-any']))],
  ['Activation precision (involved runs that were wanted)', (() => { const tp = positive.filter(involved).length, fp = fpRuns.length; return tp + fp ? `${(100 * tp / (tp + fp)).toFixed(1)}% (${tp}/${tp + fp})` : 'n/a' })()],
  ['Skill selection accuracy (right skill, given one fired)', fmt(rate(specific.filter(r => r.g['activation-any']), r => r.g['activation-correct']))],
  ['MCP tool-selection accuracy (tool-* and no-tool-* graders)', fmt(rate(toolGraders, v => v))],
  ['No-analysis usefulness (judge)', fmt(rate(runs.filter(r => r.group === 'no-analysis' && has(r, 'quality')), r => r.g.quality))],
  ['Analysis-present usefulness (judge)', fmt(rate(runs.filter(r => r.group === 'with-analysis' && has(r, 'quality')), r => r.g.quality))],
  ['Truthfulness graders passing (no invented figures)', fmt(rate(truth, v => v))],
  ['Unsupported-capability cases handled honestly (judge)', fmt(rate(unsupported, r => r.g.quality))],
  ['False-positive runs (rankedin fired on a quiet case)', `${fpRuns.length}/${negative.length}`],
  ['False-negative runs (rankedin fully silent on a wanted case)', `${positive.filter(r => !involved(r)).length}/${positive.length}`],
  ['Runs with an error', `${runs.filter(r => r.error).length}/${runs.length}`],
]

const perCase = [...new Set(runs.map(r => r.name))].map(name => {
  const rs = runs.filter(r => r.name === name)
  const s = spec.get(name)
  const cell = n => has(rs[0], n) ? `${rs.filter(r => r.g[n]).length}/${rs.length}` : '–'
  const skill = s.expect === 'none' ? cell('quiet-skill') : (['soft'].includes(s.expect) ? '–' : cell('activation-any'))
  const right = ['profile-review', 'next-career-move'].includes(s.expect) ? cell('activation-correct') : '–'
  const tools = Object.keys(rs[0].g).filter(n => n.startsWith('tool-') || n.startsWith('no-tool-'))
  const toolCell = tools.length ? `${rs.filter(r => tools.every(t => r.g[t])).length}/${rs.length}` : '–'
  const truthKeys = Object.keys(rs[0].g).filter(n => n.startsWith('truth-'))
  const truthCell = truthKeys.length ? `${rs.filter(r => truthKeys.every(t => r.g[t])).length}/${rs.length}` : '–'
  return [s.group, name, s.expect, skill, right, toolCell, truthCell, cell('quality')]
})

if (flag === '--markdown') {
  console.log('| Metric | Result |\n|---|---|')
  for (const [k, v] of metrics) console.log(`| ${k} | ${v} |`)
  console.log('\n| Group | Case | Expect | Fired / quiet | Right skill | Tools | Truth | Judge |\n|---|---|---|---|---|---|---|---|')
  for (const row of perCase) console.log(`| ${row.join(' | ')} |`)
} else {
  for (const [k, v] of metrics) console.log(`${k.padEnd(62)} ${v}`)
  console.log()
  for (const row of perCase) console.log(row.map((c, i) => String(c).padEnd([14, 28, 18, 8, 8, 8, 8, 6][i])).join(''))
}
console.log(`\ncost $${result.costUsd?.toFixed(2)} · ${result.durationSeconds}s · partial=${result.partial}${result.partialReason ? ' (' + result.partialReason + ')' : ''}`)
