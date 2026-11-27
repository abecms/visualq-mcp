import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const HOOK_FILE = 'visualq-verify-gate.mjs'
const HOOK_COMMAND = `node "$CLAUDE_PROJECT_DIR/.claude/hooks/${HOOK_FILE}"`

/** Agent instructions (plan-verify-improvements E3), shared by CLAUDE.md and AGENTS.md. */
export const VERIFY_SNIPPET = `<!-- visualq-verify:start -->
## UI changes: VisualQ verification is mandatory

1. At the start of a UI task, call \`start_verification\` with the ticket, PR or spec as criteria sources (do not rephrase them), the reference URL and a flow with an expected result per step.
2. At the end, call \`verify_change(contractId, url)\` on the public preview.
3. Only \`passed\` means done. On \`failed\`, read the issues and images, fix, and re-run with the same contractId. Never change the contract to pass.
4. On \`uncertain\` or \`blocked\`, do not declare the task done: show the summary and images to the human.
5. If the task asks for information, pass your final answer in \`answer\`: it is checked against the evidence.
6. Attach the verificationId and evidence links to the PR or report.
<!-- visualq-verify:end -->
`

export function upsertSnippet(path: string): 'created' | 'updated' | 'unchanged' {
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const block = /<!-- visualq-verify:start -->[\s\S]*?<!-- visualq-verify:end -->\n?/
  const next = block.test(existing) ? existing.replace(block, VERIFY_SNIPPET) : `${existing}${existing && !existing.endsWith('\n\n') ? (existing.endsWith('\n') ? '\n' : '\n\n') : ''}${VERIFY_SNIPPET}`
  if (next === existing) return 'unchanged'
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, next, 'utf8')
  return existing ? 'updated' : 'created'
}

/** Adds the Stop hook to .claude/settings.json without touching other hooks. */
export function addStopHook(settingsPath: string): boolean {
  let settings: Record<string, unknown> = {}
  if (existsSync(settingsPath)) settings = JSON.parse(readFileSync(settingsPath, 'utf8')) as Record<string, unknown>
  const hooks = (settings.hooks ?? {}) as Record<string, Array<{ matcher?: string; hooks: Array<{ type: string; command: string }> }>>
  const stop = hooks.Stop ?? []
  if (stop.some(g => g.hooks?.some(h => h.command?.includes(HOOK_FILE)))) return false
  stop.push({ hooks: [{ type: 'command', command: HOOK_COMMAND }] })
  settings.hooks = { ...hooks, Stop: stop }
  mkdirSync(dirname(settingsPath), { recursive: true })
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  return true
}

export function installVerifyGate(cwd: string): { hookPath: string; settingsPath: string; claudeMd: string; agentsMd: string } {
  const hookPath = join(cwd, '.claude', 'hooks', HOOK_FILE)
  mkdirSync(dirname(hookPath), { recursive: true })
  copyFileSync(join(pkgRoot, 'assets', HOOK_FILE), hookPath)
  const settingsPath = join(cwd, '.claude', 'settings.json')
  addStopHook(settingsPath)
  const claudeMd = join(cwd, 'CLAUDE.md')
  const agentsMd = join(cwd, 'AGENTS.md')
  upsertSnippet(claudeMd)
  upsertSnippet(agentsMd)
  return { hookPath, settingsPath, claudeMd, agentsMd }
}
