import { describe, expect, it } from 'vitest'
import {
  buildCursorDeeplink,
  buildMcpJson,
  buildMcpJsonTemplate,
  buildSetupCommand,
} from '../mcp-config.js'

describe('mcp-config', () => {
  const opts = {
    apiKey: 'vq_org_live_test1234567890123456789012',
    baseUrl: 'https://visualq.ai',
    defaultProject: 'acme',
    toolProfile: 'vrt-qa',
  }

  it('buildMcpJson includes tool profile and default project', () => {
    const json = JSON.parse(buildMcpJson(opts)) as {
      mcpServers: { visualq: { env: Record<string, string> } }
    }
    expect(json.mcpServers.visualq.env.VISUALQ_API_KEY).toBe(opts.apiKey)
    expect(json.mcpServers.visualq.env.VISUALQ_DEFAULT_PROJECT).toBe('acme')
    expect(json.mcpServers.visualq.env.VISUALQ_TOOL_PROFILE).toBe('vrt-qa')
  })

  it('buildMcpJsonTemplate uses placeholder key', () => {
    const json = JSON.parse(buildMcpJsonTemplate({
      baseUrl: 'https://visualq.ai',
      toolProfile: 'vrt-qa',
    })) as { mcpServers: { visualq: { env: Record<string, string> } } }
    expect(json.mcpServers.visualq.env.VISUALQ_API_KEY).toBe('vq_org_live_YOUR_KEY_HERE')
  })

  it('buildCursorDeeplink is a cursor protocol URL', () => {
    const link = buildCursorDeeplink({ baseUrl: 'https://visualq.ai', toolProfile: 'vrt-qa' })
    expect(link.startsWith('cursor://anysphere.cursor-deeplink/mcp/install?name=visualq&config=')).toBe(true)
  })

  it('buildSetupCommand formats npx invocation', () => {
    const cmd = buildSetupCommand(opts, 'cursor')
    expect(cmd).toContain('npx @visualq/setup-agent cursor')
    expect(cmd).toContain('--key')
    expect(cmd).toContain('--project acme')
  })
})
