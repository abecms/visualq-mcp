import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClientFromEnv, VisualQClient } from './api-client/index.js'
import { MCP_SERVER_INSTRUCTIONS } from './instructions.js'
import { manifestTools } from './manifest.js'
import { registerPrompts } from './prompts.js'
import { registerResources } from './resources.js'
import { registerTools } from './tools.js'

const PACKAGE_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string }

export function createMcpServer(client: VisualQClient, profile?: string): McpServer {
  const server = new McpServer(
    {
      name: 'visualq',
      version: PACKAGE_VERSION.version,
    },
    { instructions: MCP_SERVER_INSTRUCTIONS },
  )

  registerTools(server, client, manifestTools(profile ?? process.env.VISUALQ_TOOL_PROFILE))
  registerResources(server, client)
  registerPrompts(server)

  return server
}

export async function runStdioServer(): Promise<void> {
  const client = createClientFromEnv()
  const server = createMcpServer(client)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
