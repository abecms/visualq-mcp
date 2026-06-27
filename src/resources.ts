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
    { description: 'Composite quality score from rolling page health' },
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

  server.resource(
    'site-health',
    'visualq://site-health',
    { description: 'Rolling site health with coverage and pillar rollups' },
    async () => {
      const result = await client.invokeTool('get_site_health', {})
      return {
        contents: [{
          uri: 'visualq://site-health',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )

  server.resource(
    'scenarios',
    'visualq://scenarios',
    { description: 'VRT scenario list for the project' },
    async () => {
      const result = await client.invokeTool('list_scenarios', {})
      return {
        contents: [{
          uri: 'visualq://scenarios',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )

  server.resource(
    'frt-step-library',
    'visualq://frt-step-library',
    { description: 'Project FRT step definition library (search with empty query returns sample)' },
    async () => {
      const result = await client.invokeTool('frt_search_step_library', { query: '' })
      return {
        contents: [{
          uri: 'visualq://frt-step-library',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )

  server.resource(
    'frt-feature-groups',
    'visualq://frt-feature-groups',
    { description: 'FRT feature folders and ungrouped features' },
    async () => {
      const result = await client.invokeTool('frt_get_feature_groups', {})
      return {
        contents: [{
          uri: 'visualq://frt-feature-groups',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )

  server.resource(
    'pr-quality-gate',
    'visualq://pr-quality-gate',
    { description: 'Structured PR merge verdict (VRT + FRT + rolling health)' },
    async () => {
      const result = await client.invokeTool('gate_pr_quality', { threshold: 'balanced' })
      return {
        contents: [{
          uri: 'visualq://pr-quality-gate',
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        }],
      }
    },
  )
}
