// Static checks for the plugin's skills and manifest. No network, no dependencies.
// Run: node scripts/check-skills.mjs   (exit 1 on any failure)
//
// What it enforces, and why:
//   1. Portable frontmatter — only fields in the open Agent Skills spec
//      (agentskills.io/specification), so the same SKILL.md loads on claude.ai,
//      Claude Code and other platforms that adopted the spec.
//   2. Provider-neutral wording — no platform names in skill bodies, so the files can be
//      reused unchanged; platform packaging stays in thin adapters.
//   3. One truthfulness block, byte-identical in every skill.
//   4. Every tool a skill names is one the rankedin connector actually exposes
//      (checked against the saved tools/list; the live check is check-tool-contract.mjs).
//   5. Names never carry a third-party mark, and descriptions never advertise a
//      capability rankedin does not have.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = m => errors.push(m)

const SPEC_FIELDS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'])
const PLATFORM_WORDS = /\b(claude|anthropic|chatgpt|openai|gpt-\d|gemini|copilot)\b/i
const SHARED = /<!-- BEGIN shared-truthfulness[\s\S]*?<!-- END shared-truthfulness -->/
// Capabilities rankedin does not have. A description may mention them only in a
// sentence that says rankedin is not for them, so those sentences are removed first.
const UNSUPPORTED = [/\bwrit(e|es|ing) (your |a )?resumes?\b/i, /\bjob (listings|openings|board)\b/i, /\binterview (coach|coaching|practice|prep)\b/i, /\bpromotion readiness\b/i, /\bsalary\b/i]
const affirmative = text => (text ?? '')
  .split(/(?<=\.)\s+/)
  .filter(s => !/^(not for|rankedin (is not|does not))\b/i.test(s.trim()))
  .join(' ')

function frontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) { fail(`${file}: no YAML frontmatter`); return {} }
  const out = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z-]+):\s*(.*)$/)
    if (!kv) { fail(`${file}: unparsed frontmatter line: ${line}`); continue }
    out[kv[1]] = kv[2]
  }
  return out
}

const tools = new Set(JSON.parse(readFileSync(join(ROOT, 'scripts/eval-fixtures/_tools.json'), 'utf8')).tools.map(t => t.name))
const skillsDir = join(ROOT, 'skills')
const skills = readdirSync(skillsDir)
let sharedBlock = null

for (const dir of skills) {
  const file = `skills/${dir}/SKILL.md`
  const p = join(skillsDir, dir, 'SKILL.md')
  if (!existsSync(p)) { fail(`${file}: missing`); continue }
  const text = readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
  const f = frontmatter(text, file)

  for (const k of Object.keys(f)) if (!SPEC_FIELDS.has(k)) fail(`${file}: frontmatter field "${k}" is not in the Agent Skills spec`)
  if (f.name !== dir) fail(`${file}: name "${f.name}" must match its folder "${dir}"`)
  if (!/^[a-z0-9](?:[a-z0-9]|-(?!-))*[a-z0-9]$/.test(f.name ?? '') || f.name.length > 64) fail(`${file}: name is not a valid spec name`)
  if (/linkedin/i.test(f.name ?? '')) fail(`${file}: a skill name must not contain a third-party mark`)
  if (!f.description || f.description.length > 1024) fail(`${file}: description missing or over 1024 characters (${f.description?.length})`)
  for (const re of UNSUPPORTED) if (re.test(affirmative(f.description))) fail(`${file}: description advertises an unsupported capability (${re})`)

  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  const platform = body.match(PLATFORM_WORDS)
  if (platform) fail(`${file}: platform-specific word "${platform[0]}" — keep skills provider-neutral`)
  if (PLATFORM_WORDS.test(f.description ?? '')) fail(`${file}: platform-specific word in description`)

  const block = body.match(SHARED)?.[0]
  if (!block) fail(`${file}: shared truthfulness block missing`)
  else if (sharedBlock === null) sharedBlock = block
  else if (block !== sharedBlock) fail(`${file}: shared truthfulness block differs from the other skills`)

  for (const [, name] of body.matchAll(/`(get_[a-z_]+)`/g)) {
    if (!tools.has(name)) fail(`${file}: names tool "${name}", which the rankedin connector does not expose`)
  }
}

if (skills.length === 0) fail('no skills found')

const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'))
if (manifest.name !== 'rankedin') fail('plugin.json: name must stay "rankedin" (permanent)')
for (const k of ['name', 'displayName']) if (/linkedin/i.test(manifest[k] ?? '')) fail(`plugin.json: ${k} must not contain a third-party mark`)
for (const re of UNSUPPORTED) if (re.test(affirmative(manifest.description))) fail(`plugin.json: description advertises an unsupported capability (${re})`)

const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'))
const servers = Object.entries(mcp.mcpServers ?? {})
if (servers.length !== 1 || servers[0][1].url !== 'https://rankedin.app/api/mcp' || servers[0][1].type !== 'http')
  fail('.mcp.json: must reference exactly the existing rankedin connector at https://rankedin.app/api/mcp')

const words = readFileSync(join(ROOT, 'README.md'), 'utf8').replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length
if (words < 40) fail(`README.md: ${words} words; the directory requires at least 40 outside code blocks`)

if (errors.length) {
  console.error(errors.map(e => `✖ ${e}`).join('\n'))
  process.exit(1)
}
console.log(`✔ ${skills.length} skills, manifest and .mcp.json pass (${tools.size} connector tools known)`)
