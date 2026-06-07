import { describe, expect, it, vi, beforeEach } from 'vitest'
import { VisualQClient } from '../index.js'

describe('VisualQClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('invokeTool posts to /api/mcp/v1/invoke', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      tool: 'get_run_failures',
      summary: 'ok',
      data: { failed: 0 },
      warnings: [],
      nextActions: [],
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const client = new VisualQClient({ apiKey: 'vq_live_test', baseUrl: 'https://visualq.ai' })
    const res = await client.invokeTool('get_run_failures', {})

    expect(fetchMock).toHaveBeenCalledWith(
      'https://visualq.ai/api/mcp/v1/invoke',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-API-Key': 'vq_live_test' }),
      }),
    )
    expect(res.ok).toBe(true)
  })
})
