// Deterministic checks on the eval suite's fixtures and expectations. No model calls.
// Run: node scripts/check-routing-fixtures.mjs   (exit 1 on any failure)
//
// This does NOT measure routing. Only `claude plugin eval` does that. It proves that
// the suite measuring routing is itself sound:
//   1. every prompt the P0 brief requires is in the suite, with a valid expectation
//   2. every tool an expectation names exists on the connector
//   3. every generated case carries the graders its expectation needs
//   4. no-analysis cases answer every tool from no-analysis mocks, and those mocks
//      contain no measurement of the user
//   5. every figure a rubric checks for is present in the mocked tool output, so a
//      rubric can never reward a number the tools did not return
//   6. the career-paths fixtures carry the framework text verbatim for all four paths

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CASES } from './eval-spec.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EVALS = join(ROOT, 'evals')
const FIX = join(ROOT, 'scripts', 'eval-fixtures')
const errors = []
const fail = m => errors.push(m)
const read = p => readFileSync(p, 'utf8')

const TOOLS = new Set(JSON.parse(read(join(FIX, '_tools.json'))).tools.map(t => t.name))
const EXPECT = new Set(['profile-review', 'next-career-move', 'either', 'none', 'soft'])

// 1. The prompts the P0 brief listed, verbatim or with added context.
const REQUIRED = [
  'Analyze my LinkedIn.', 'How can I improve my LinkedIn profile?', 'Is my profile strong?',
  'What does my profile say about me?', 'What should I improve professionally?',
  'What should I emphasize on my resume?', 'What are my strongest qualities for my resume?',
  'understand my positioning before', 'Rewrite this resume bullet',
  'I need a job.', "My job search isn't working.", 'Where should I start?', 'What kind of roles should I consider?',
  'job-search strategy', 'Find current job openings',
  "I don't know what to do next in my career.", 'I feel stuck', 'Should I change careers?',
  'Should I stay in my field?', 'What should my next move be?', 'What career directions should I consider?',
  'Is AI going to affect my career?', 'Am I ready for AI?', 'AI is changing my job. What should I do?',
  'Which of my strengths will matter as AI changes my field?',
  'How do I build my professional reputation?', 'become more visible professionally', 'Is my network strong?',
  'Am I connected to the right kinds of people?', 'get more customers from my professional presence',
  'Where do I stand?', 'What should I improve?', 'What should I do next?', 'How am I doing?', 'Analyze me.',
  "I'm worried about AI.", 'I need a change.', 'My career has stalled.', 'I want to become more visible.',
]
const prompts = CASES.map(c => c.prompt)
for (const r of REQUIRED) if (!prompts.some(p => p.includes(r))) fail(`required prompt missing from the suite: "${r}"`)

const names = new Set()
for (const c of CASES) {
  if (names.has(c.name)) fail(`duplicate case name ${c.name}`)
  names.add(c.name)
  if (!EXPECT.has(c.expect)) fail(`${c.name}: invalid expect "${c.expect}"`)
  // 2.
  for (const t of [...(c.tools ?? []), ...(c.notTools ?? [])]) if (!TOOLS.has(t)) fail(`${c.name}: names unknown tool ${t}`)
  if (c.expect === 'none' && c.tools?.length) fail(`${c.name}: a quiet case cannot require a tool`)

  // 3.
  const dir = join(EVALS, c.group, c.name)
  if (!existsSync(join(dir, 'prompt.md'))) { fail(`${c.name}: not generated`); continue }
  const graders = new Set(readdirSync(join(dir, 'graders')).map(f => f.replace(/\.md$/, '')))
  const need = []
  if (c.expect === 'profile-review' || c.expect === 'next-career-move') need.push('activation-any', 'activation-correct')
  if (c.expect === 'either') need.push('activation-any')
  if (c.expect === 'none') need.push('quiet-skill', 'quiet-tools')
  for (const t of c.tools ?? []) need.push(`tool-${t}`)
  for (const t of c.notTools ?? []) need.push(`no-tool-${t}`)
  if (c.state === 'fresh') need.push('truth-no-figures')
  if (c.rubric) need.push('quality')
  for (const n of need) if (!graders.has(n)) fail(`${c.name}: missing grader ${n}`)

  // 4.
  if (c.state === 'fresh') {
    for (const t of TOOLS) {
      const m = join(dir, 'mocks', 'rankedin', `${t}.md`)
      if (!existsSync(m)) { fail(`${c.name}: no-analysis mock missing for ${t}`); continue }
      const body = read(m)
      if (/\b\d{1,3}\s*\/\s*100\b|percentile|%ile/i.test(body)) fail(`${c.name}: no-analysis mock for ${t} contains a measurement`)
      if (t === 'get_career_paths' && !body.includes('No RankedIn analysis was used')) fail(`${c.name}: fresh career-paths mock is not the no-analysis framework`)
      if (t !== 'get_career_paths' && !body.includes('rankedin.app/dashboard/upload')) fail(`${c.name}: ${t} mock is not the no-analysis message`)
    }
  }
}

// 5. Figures a rubric checks for must be in the analyzed mocks.
const analyzed = [...TOOLS].map(t => read(join(FIX, `${t}.analyzed.txt`))).join('\n')
for (const c of CASES.filter(c => c.rubric && (c.state ?? 'analyzed') === 'analyzed')) {
  for (const fig of c.rubric.match(/\b\d+(?:\/100|th|st|nd|rd)?\b/g) ?? []) {
    if (!analyzed.includes(fig)) fail(`${c.name}: rubric checks for "${fig}", which no mocked tool returns`)
  }
}

// 6. Both career-paths fixtures carry all four paths.
for (const f of ['get_career_paths.fresh.txt', 'get_career_paths.analyzed.txt']) {
  const t = read(join(FIX, f))
  for (const h of ['I want to find a job', 'I want to attract more customers', 'I want to build my reputation', 'I want to pivot my career'])
    if (!t.includes(h)) fail(`${f}: missing path "${h}"`)
}

const byGroup = CASES.reduce((a, c) => ((a[c.group] = (a[c.group] ?? 0) + 1), a), {})
if (errors.length) {
  console.error(errors.map(e => `✖ ${e}`).join('\n'))
  process.exit(1)
}
console.log(`✔ ${CASES.length} eval cases sound (${Object.entries(byGroup).map(([g, n]) => `${g} ${n}`).join(', ')}); ${REQUIRED.length} required prompts present; fixtures consistent`)
