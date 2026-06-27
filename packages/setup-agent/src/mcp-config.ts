export interface McpEnvConfig {
  VISUALQ_API_KEY: string
  VISUALQ_BASE_URL: string
  VISUALQ_DEFAULT_PROJECT?: string
  VISUALQ_TOOL_PROFILE?: string
}

export interface SetupOptions {
  apiKey: string
  baseUrl: string
  defaultProject?: string
  toolProfile?: string
}

export function buildMcpServerConfig(options: SetupOptions) {
  const env: McpEnvConfig = {
    VISUALQ_API_KEY: options.apiKey,
    VISUALQ_BASE_URL: options.baseUrl,
  }
  if (options.defaultProject) {
    env.VISUALQ_DEFAULT_PROJECT = options.defaultProject
  }
  if (options.toolProfile) {
    env.VISUALQ_TOOL_PROFILE = options.toolProfile
  }

  return {
    command: 'npx',
    args: ['-y', '@visualq/mcp'],
    env,
  }
}

export function buildMcpJson(options: SetupOptions): string {
  return JSON.stringify(
    {
      mcpServers: {
        visualq: buildMcpServerConfig(options),
      },
    },
    null,
    2,
  )
}

/** MCP config template without secret — for existing keys. */
export function buildMcpJsonTemplate(options: Omit<SetupOptions, 'apiKey'>): string {
  return buildMcpJson({
    ...options,
    apiKey: 'vq_org_live_YOUR_KEY_HERE',
  })
}

export function buildCursorDeeplink(options: Omit<SetupOptions, 'apiKey'>): string {
  const config = buildMcpServerConfig({
    ...options,
    apiKey: 'PASTE_YOUR_AGENT_KEY',
  })
  const encoded = Buffer.from(JSON.stringify(config)).toString('base64')
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=visualq&config=${encoded}`
}

export function buildSetupCommand(options: SetupOptions, target: 'cursor' | 'claude' | 'manual'): string {
  const parts = ['npx', '@visualq/setup-agent', target]
  parts.push('--key', options.apiKey)
  if (options.defaultProject) parts.push('--project', options.defaultProject)
  if (options.toolProfile && options.toolProfile !== 'vrt-qa') {
    parts.push('--profile', options.toolProfile)
  }
  if (options.baseUrl !== 'https://visualq.ai') {
    parts.push('--base-url', options.baseUrl)
  }
  return parts.join(' ')
}
