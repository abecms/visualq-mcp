import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClientFromEnv, VisualQClient } from './api-client/index.js'
import { manifestTools } from './manifest.js'
import { registerPrompts } from './prompts.js'
import { registerResources } from './resources.js'
import { registerTools } from './tools.js'

export function createMcpServer(client: VisualQClient): McpServer {
  const server = new McpServer({
    name: 'visualq',
    version: '0.1.0',
  })

  registerTools(server, client, manifestTools())
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
