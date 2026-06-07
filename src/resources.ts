import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { VisualQClient } from './api-client/index.js'

export function registerResources(server: McpServer, client: VisualQClient) {
  server.resource(
    'latest-failures',
    'visualq://latest-failures',
    { description: 'Failed scenarios from the latest VRT run (batch summary)' },
    async () => {
      const result = await client.invokeTool('get_run_failures', {})
      return {
        contents: [{
          uri: 'visualq://latest-failures',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )

  server.resource(
    'quality-score',
    'visualq://quality-score',
    { description: 'Composite quality score for the API-key project' },
    async () => {
      const result = await client.invokeTool('get_quality_score', {})
      return {
        contents: [{
          uri: 'visualq://quality-score',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )
}
