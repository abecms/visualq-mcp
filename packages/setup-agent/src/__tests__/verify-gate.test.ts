import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JS hook shipped as an asset
import { decide } from '../../assets/visualq-verify-gate.mjs'
import { addStopHook, upsertSnippet, VERIFY_SNIPPET } from '../verify-gate.js'

const edit = (file: string) => ({ message: { content: [{ type: 'tool_use', id: `e${file}`, name: 'Edit', input: { file_path: file } }] } })
const verify = (id: string, status: string) => [
  { message: { content: [{ type: 'tool_use', id, name: 'mcp__visualq__verify_change', input: {} }] } },
  { message: { content: [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text: `{"status": "${status}"}` }] }] } },
]

describe('verify gate decision (E1)', () => {
  it('lets sessions without UI edits stop', () => {
    expect(decide([edit('src/server/db.ts')]).block).toBe(false)
  })
  it('refuses to stop after a UI edit without a verdict, or on failed', () => {
    expect(decide([edit('src/Cart.tsx')]).block).toBe(true)
    expect(decide([edit('src/Cart.tsx'), ...verify('v1', 'failed')]).block).toBe(true)
  })
  it('allows passed, uncertain and blocked verdicts on the latest edit', () => {
    for (const s of ['passed', 'uncertain', 'blocked']) expect(decide([edit('a.css'), ...verify('v', s)]).block).toBe(false)
  })
  it('requires a new verdict after a later UI edit', () => {
    expect(decide([edit('a.css'), ...verify('v1', 'passed'), edit('b.tsx')]).block).toBe(true)
  })
  it('never traps an agent forever', () => {
    expect(decide([edit('a.css')], { blocksSoFar: 3 }).block).toBe(false)
  })
})

describe('installer', () => {
  it('upserts the CLAUDE.md block once and keeps other content', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'vq-')), 'CLAUDE.md')
    writeFileSync(f, '# Project\n')
    expect(upsertSnippet(f)).toBe('updated')
    expect(upsertSnippet(f)).toBe('unchanged')
    expect(readFileSync(f, 'utf8')).toBe(`# Project\n\n${VERIFY_SNIPPET}`)
  })
  it('adds the Stop hook without duplicating it or dropping other hooks', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'vq-')), 'settings.json')
    writeFileSync(f, JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'other' }] }] }, model: 'x' }))
    expect(addStopHook(f)).toBe(true)
    expect(addStopHook(f)).toBe(false)
    const s = JSON.parse(readFileSync(f, 'utf8'))
    expect(s.model).toBe('x')
    expect(s.hooks.Stop).toHaveLength(2)
  })
})
