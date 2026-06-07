import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { VisualQClient } from './api-client/index.js'
import type { ManifestTool } from './manifest.js'

function jsonText(value: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  }
}

function baseArgsSchema(tool: ManifestTool) {
  const shape: Record<string, z.ZodTypeAny> = {}
  const props = (tool.parameters.properties ?? {}) as Record<string, Record<string, unknown>>

  for (const [key, spec] of Object.entries(props)) {
    if (spec.type === 'string') {
      shape[key] = z.string().optional()
    } else if (spec.type === 'array') {
      shape[key] = z.array(z.string()).optional()
    } else if (spec.type === 'number') {
      shape[key] = z.number().optional()
    }
  }

  return z.object(shape)
}

export function registerTools(server: McpServer, client: VisualQClient, tools: ManifestTool[]) {
  for (const tool of tools) {
    const schema = baseArgsSchema(tool)

    server.tool(tool.name, tool.description, schema.shape as z.ZodRawShape, async (args: Record<string, unknown>) => {
      try {
        switch (tool.source) {
          case 'ci':
            return await handleCiTool(client, tool.name, args)
          case 'client':
            return await handleClientTool(client, tool.name, args)
          case 'invoke': {
            const cleanArgs = Object.fromEntries(
              Object.entries(args).filter(([, v]) => v !== undefined),
            )
            const result = await client.invokeTool(tool.name, cleanArgs)
            return jsonText(result)
          }
          default:
            return jsonText({ ok: false, error: `Unknown tool source for ${tool.name}` })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return jsonText({ ok: false, error: message })
      }
    })
  }
}

async function handleCiTool(client: VisualQClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'list_projects': {
      const projects = await client.listProjects()
      return jsonText({ ok: true, data: projects })
    }
    case 'run_vrt':
      return jsonText({
        ok: true,
        data: await client.triggerRun({
          type: 'test',
          ...pickRunArgs(args),
        }),
      })
    case 'run_baseline':
      return jsonText({
        ok: true,
        data: await client.triggerRun({
          type: 'baseline',
          ...pickRunArgs(args),
        }),
      })
    case 'get_run_status': {
      const runId = String(args.runId || '')
      if (!runId) throw new Error('runId is required')
      return jsonText({ ok: true, data: await client.getRunStatus(runId) })
    }
    default:
      throw new Error(`Unhandled CI tool: ${name}`)
  }
}

async function handleClientTool(client: VisualQClient, name: string, args: Record<string, unknown>) {
  if (name !== 'wait_for_run') throw new Error(`Unhandled client tool: ${name}`)

  const runId = String(args.runId || '')
  if (!runId) throw new Error('runId is required')

  const maxWaitMs = typeof args.maxWaitMs === 'number' ? args.maxWaitMs : undefined
  const status = await client.waitForRun(runId, { maxMs: maxWaitMs })
  return jsonText({ ok: true, data: status })
}

function pickRunArgs(args: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  if (typeof args.project === 'string') out.project = args.project
  if (typeof args.environment === 'string') out.environment = args.environment
  if (Array.isArray(args.scenarios)) out.scenarios = args.scenarios
  if (Array.isArray(args.browsers)) out.browsers = args.browsers
  return out
}
