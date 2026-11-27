#!/usr/bin/env node
/**
 * VisualQ verify gate — Claude Code `Stop` hook (plan-verify-improvements E1).
 *
 * The A/B bench showed that agents verifying alone still declare broken UI
 * "done" (7 to 13 false passes out of 140), even with a strict instruction they
 * can forget. This hook makes the rule mechanical: after editing UI files, the
 * session cannot end until verify_change has run on the latest edits and
 *   - passed            → stop allowed;
 *   - uncertain/blocked → stop allowed (the agent must hand over to the human);
 *   - failed or no run  → stop refused, with the reason.
 *
 * Disable for one session: VISUALQ_VERIFY_GATE=off.
 * Input: the Stop hook JSON on stdin ({ transcript_path, stop_hook_active }).
 */
import { readFileSync } from 'node:fs'

const UI_FILE = /\.(tsx|jsx|vue|svelte|astro|html?|css|scss|sass|less|styl|mdx|liquid|hbs|ejs|erb|twig|php)$/i
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const MAX_BLOCKS = 3

function textOf(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map(c => (typeof c === 'string' ? c : c?.text ?? '')).join('\n')
  return ''
}

function statusOf(text) {
  const m = text.match(/"status"\s*:\s*"(passed|failed|uncertain|blocked|error|running)"/) || text.match(/\b(PASSED|FAILED|UNCERTAIN|BLOCKED)\b/)
  return m ? m[1].toLowerCase() : undefined
}

/** Pure decision from the transcript entries (JSONL objects). */
export function decide(entries, { blocksSoFar = 0 } = {}) {
  let lastUiEdit = -1
  const verifyUses = new Map()
  const results = []
  entries.forEach((e, i) => {
    const content = e?.message?.content
    if (!Array.isArray(content)) return
    for (const part of content) {
      if (part?.type === 'tool_use') {
        const file = part.input?.file_path ?? part.input?.notebook_path ?? ''
        if (EDIT_TOOLS.has(part.name) && UI_FILE.test(file)) lastUiEdit = i
        if (/verify_change|get_verification/.test(part.name ?? '')) verifyUses.set(part.id, i)
      }
      if (part?.type === 'tool_result' && verifyUses.has(part.tool_use_id)) {
        results.push({ at: i, status: statusOf(textOf(part.content)) })
      }
    }
  })
  if (lastUiEdit < 0) return { block: false }
  if (blocksSoFar >= MAX_BLOCKS) return { block: false }
  const after = results.filter(r => r.at > lastUiEdit && r.status && r.status !== 'running')
  const last = after[after.length - 1]
  if (!last) {
    return { block: true, reason: 'VisualQ verify gate: UI files were edited but no VisualQ verdict covers the latest edits. Run verify_change (same contractId, public preview URL) and only declare the task done on passed. If it is uncertain or blocked, show the summary and images to the human.' }
  }
  if (last.status === 'failed' || last.status === 'error') {
    return { block: true, reason: `VisualQ verify gate: the last verify_change is ${last.status}. Read its issues and images, fix, and re-run verify_change with the SAME contractId. Never change the contract to make it pass.` }
  }
  return { block: false }
}

function main() {
  if ((process.env.VISUALQ_VERIFY_GATE ?? '').toLowerCase() === 'off') return
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch { return }
  if (!input.transcript_path) return
  let entries = []
  try {
    entries = readFileSync(input.transcript_path, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  } catch { return }
  // Count our own refusals in this session so a stuck agent is never trapped forever.
  const blocksSoFar = entries.filter(e => textOf(e?.message?.content).includes('VisualQ verify gate:')).length
  const d = decide(entries, { blocksSoFar })
  if (d.block) process.stdout.write(JSON.stringify({ decision: 'block', reason: d.reason }))
}

if (import.meta.url === `file://${process.argv[1]}`) main()
