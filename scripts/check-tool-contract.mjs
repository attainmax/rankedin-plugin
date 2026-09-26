// Live contract check: every tool the skills name must exist on the rankedin server,
// with the read-only annotations the skills rely on. Uses only the unauthenticated
// `tools/list` method, so it needs no credentials and reads no user data.
//
// Run: node scripts/check-tool-contract.mjs [endpoint]
//   endpoint defaults to the URL in .mcp.json (https://rankedin.app/api/mcp).
//
// Also confirms the saved tools/list used by the eval mocks (scripts/eval-fixtures/
// _tools.json) matches what the server serves, so evals never test stale descriptions.

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8'))
const endpoint = process.argv[2] ?? Object.values(mcp.mcpServers)[0].url

const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
})
const text = await res.text()
const data = text.split('\n').find(l => l.startsWith('data: '))
const body = JSON.parse(data ? data.slice(6) : text)
const served = new Map((body.result?.tools ?? []).map(t => [t.name, t]))

const errors = []
for (const dir of readdirSync(join(ROOT, 'skills'))) {
  const skill = readFileSync(join(ROOT, 'skills', dir, 'SKILL.md'), 'utf8')
  for (const name of new Set([...skill.matchAll(/`(get_[a-z_]+)`/g)].map(m => m[1]))) {
    const t = served.get(name)
    if (!t) { errors.push(`skills/${dir}: "${name}" is not served by ${endpoint}`); continue }
    const a = t.annotations ?? {}
    if (a.readOnlyHint !== true || a.destructiveHint !== false) errors.push(`${name}: not annotated read-only on ${endpoint}`)
  }
}

const saved = JSON.parse(readFileSync(join(ROOT, 'scripts/eval-fixtures/_tools.json'), 'utf8')).tools
for (const t of saved) {
  const live = served.get(t.name)
  if (!live) errors.push(`eval fixture tool "${t.name}" is not served by ${endpoint}`)
  else if (live.description !== t.description) errors.push(`eval fixture description for "${t.name}" differs from ${endpoint} — regenerate the fixture`)
}

if (errors.length) {
  console.error(errors.map(e => `✖ ${e}`).join('\n'))
  process.exit(1)
}
console.log(`✔ ${served.size} tools served by ${endpoint}; every tool the skills name exists and is read-only; eval fixtures match`)
