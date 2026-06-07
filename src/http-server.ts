import { createServer } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createClientFromEnv, type VisualQClient } from './api-client/index.js'
import { createMcpServer } from './server.js'

export async function runHttpServer(client?: VisualQClient): Promise<void> {
  const resolvedClient = client ?? createClientFromEnv()
  const port = Number(process.env.VISUALQ_MCP_PORT || 3847)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  const server = createMcpServer(resolvedClient)
  await server.connect(transport)

  const httpServer = createServer(async (req, res) => {
    if (!req.url?.startsWith('/mcp')) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(chunk as Buffer)
    }
    const rawBody = Buffer.concat(chunks).toString('utf8')
    const body = rawBody ? JSON.parse(rawBody) : undefined

    await transport.handleRequest(req, res, body)
  })

  await new Promise<void>(resolve => {
    httpServer.listen(port, () => {
      console.error(`[visualq-mcp] Streamable HTTP listening on http://127.0.0.1:${port}/mcp`)
      resolve()
    })
  })
}
