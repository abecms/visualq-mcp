import { afterEach, describe, expect, it, vi } from 'vitest'
import { VisualQClient, isRunInProgress } from '../api-client/index.js'

describe('isRunInProgress', () => {
  it('treats pending, queued and running as unfinished', () => {
    for (const s of ['pending', 'queued', 'running', undefined, null]) {
      expect(isRunInProgress(s)).toBe(true)
    }
  })

  it('treats verdict statuses as finished', () => {
    for (const s of ['completed', 'failed', 'baseline', 'informational']) {
      expect(isRunInProgress(s)).toBe(false)
    }
  })
})

describe('waitForRun', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps polling while an FRT run is pending', async () => {
    const statuses = ['pending', 'running', 'completed']
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ runId: 'r1', status: statuses.shift() }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const client = new VisualQClient({ apiKey: 'k', baseUrl: 'https://example.test' })
    const result = await client.waitForRun('r1', { intervalMs: 1, maxMs: 5_000 })

    expect(result.status).toBe('completed')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
