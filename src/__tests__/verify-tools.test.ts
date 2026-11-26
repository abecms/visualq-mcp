/**
 * Intent: an MCP client sees the full schema (required, enums, nested objects)
 * and gets the verdict as structuredContent plus real image blocks — never a
 * flattened all-optional schema or base64 hidden inside the JSON text.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { VisualQClient } from '../api-client/index.js'
import { manifestTools } from '../manifest.js'
import { toolsForProfile } from '../profiles.js'
import { createMcpServer } from '../server.js'
import { toInputSchema } from '../tools.js'

const IMG = Buffer.from('fake-jpeg').toString('base64')

function verifyResponse() {
  return {
    ok: true,
    tool: 'verify_change',
    summary: 'FAILED: Step 2 "click \'Add to cart\'" failed',
    data: {
      ok: true,
      verificationId: 'ver_1',
      contractId: 'ctr_1',
      status: 'failed',
      summary: 'FAILED: Step 2 failed',
      url: 'https://pr-1.preview.app',
      criteria: [{ id: 'c1', criterion: 'Badge shows 1', origin: 'pr', verdict: 'unmet', basis: 'dom', reason: 'badge at 0', evidenceRefs: ['after_desktop_s2_t1000'] }],
      issues: [{ severity: 'blocker', kind: 'step_failed', message: 'Step 2 failed', step: 2 }],
      evidence: [],
      warnings: [],
      inlineImages: [{ ref: 'after_desktop_s2_t1000', mimeType: 'image/jpeg', data: IMG }],
    },
    warnings: [],
    nextActions: [{ label: 'Fix then re-run', tool: 'verify_change', args: { contractId: 'ctr_1', url: 'https://pr-1.preview.app' } }],
  }
}

async function connect(profile: string, invoke: (body: { tool: string; args: Record<string, unknown> }) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? '{}')
    return new Response(JSON.stringify(invoke(body)), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
  const server = createMcpServer(new VisualQClient({ apiKey: 'k', baseUrl: 'https://visualq.test' }), profile)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)
  const client = new Client({ name: 'test', version: '0.0.0' })
  await client.connect(clientTransport)
  return client
}

afterEach(() => vi.unstubAllGlobals())

describe('agent-verify profile', () => {
  it('exposes only the verification loop', () => {
    expect(toolsForProfile('agent-verify', manifestTools()).map(t => t.name).sort())
      .toEqual(['get_verification', 'list_projects', 'start_verification', 'verify_change'])
  })

  it('lists tools with their full JSON schema and output schema', async () => {
    const client = await connect('agent-verify', () => ({}))
    const { tools } = await client.listTools()
    const verify = tools.find(t => t.name === 'verify_change')!
    expect(verify.inputSchema.required).toEqual(['url'])
    const props = verify.inputSchema.properties as Record<string, Record<string, unknown>>
    expect(props.judge.enum).toEqual(['visualq', 'agent', 'off'])
    expect(((props.flow.properties as Record<string, Record<string, unknown>>).steps.items as Record<string, unknown>).required).toEqual(['do'])
    expect(verify.outputSchema?.properties).toHaveProperty('status')
    expect(verify.annotations?.readOnlyHint).toBe(true)
  })

  it('returns structuredContent, image blocks and no base64 in the text', async () => {
    let sent: { tool: string; args: Record<string, unknown> } | undefined
    const client = await connect('agent-verify', body => { sent = body; return verifyResponse() })
    const result = await client.callTool({ name: 'verify_change', arguments: { contractId: 'ctr_1', url: 'https://pr-1.preview.app' } })
    expect(sent).toEqual({ tool: 'verify_change', args: { contractId: 'ctr_1', url: 'https://pr-1.preview.app' } })
    const content = result.content as Array<{ type: string; text?: string; data?: string }>
    expect(content.filter(c => c.type === 'image').map(c => c.data)).toEqual([IMG])
    expect(content[0].text).not.toContain(IMG)
    expect(content[0].text).toContain('inlineImageRefs')
    expect((result.structuredContent as Record<string, unknown>).status).toBe('failed')
    expect((result.structuredContent as Record<string, unknown>).nextActions).toBeDefined()
    expect(result.isError).toBeFalsy()
  })

  it('flags invoke failures as isError without structuredContent', async () => {
    const client = await connect('agent-verify', () => ({
      ok: false, tool: 'verify_change', summary: 'url=http://localhost:3000 is on localhost', data: null, warnings: [], nextActions: [],
      error: { code: 'unsupported', message: 'localhost' },
    }))
    const result = await client.callTool({ name: 'verify_change', arguments: { url: 'http://localhost:3000' } })
    expect(result.isError).toBe(true)
    expect(result.structuredContent).toBeUndefined()
  })
})

describe('toInputSchema', () => {
  it('merges top-level required (e.g. confirm) into the schema', () => {
    const schema = toInputSchema({
      name: 't', description: '', source: 'invoke', phase: 1, mutating: true,
      parameters: { type: 'object', properties: { a: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['a'] },
      required: ['a', 'confirm'],
    })
    expect(schema.required).toEqual(['a', 'confirm'])
  })
})
