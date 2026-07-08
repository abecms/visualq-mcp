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
    } else if (spec.type === 'boolean') {
      shape[key] = z.boolean().optional()
    } else if (spec.type === 'object') {
      shape[key] = z.record(z.unknown()).optional()
    }
  }

  return z.object(shape)
}

export function registerTools(server: McpServer, client: VisualQClient, tools: ManifestTool[]) {
  for (const tool of tools) {
    const schema = baseArgsSchema(tool)

    server.tool(tool.name, tool.description, schema.shape as z.ZodRawShape, async (args: Record<string, unknown>) => {
      try {
        const resolvedArgs = client.applyToolDefaults(args)
        switch (tool.source) {
          case 'ci':
            return await handleCiTool(client, tool.name, resolvedArgs)
          case 'client':
            return await handleClientTool(client, tool.name, resolvedArgs)
          case 'invoke': {
            const cleanArgs = Object.fromEntries(
              Object.entries(resolvedArgs).filter(([, v]) => v !== undefined),
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
    case 'run_vrt': {
      const data = await client.triggerRun({
        type: 'test',
        ...pickRunArgs(args),
      })
      return jsonText({
        ok: true,
        summary: `VRT test started (${data.runId}).`,
        data,
        nextActions: [
          { label: 'Wait for completion', tool: 'wait_for_run', args: { runId: data.runId } },
          { label: 'Read failures when done', tool: 'get_run_failures', args: { runId: data.runId } },
        ],
      })
    }
    case 'run_baseline': {
      const data = await client.triggerRun({
        type: 'baseline',
        ...pickRunArgs(args),
      })
      return jsonText({
        ok: true,
        summary: `Baseline capture started (${data.runId}).`,
        data,
        nextActions: [
          { label: 'Wait for completion', tool: 'wait_for_run', args: { runId: data.runId } },
        ],
      })
    }
    case 'run_perf':
      return jsonText({
        ok: true,
        data: await client.triggerRun({ type: 'perf', ...pickRunArgs(args) }),
      })
    case 'run_seo':
      return jsonText({
        ok: true,
        data: await client.triggerRun({ type: 'seo', ...pickRunArgs(args) }),
      })
    case 'run_tracking':
      return jsonText({
        ok: true,
        data: await client.triggerRun({ type: 'tracking', ...pickRunArgs(args) }),
      })
    case 'run_a11y':
      return jsonText({
        ok: true,
        data: await client.triggerRun({ type: 'a11y', ...pickRunArgs(args) }),
      })
    case 'run_security':
      return jsonText({
        ok: true,
        data: await client.triggerRun({ type: 'security', ...pickRunArgs(args) }),
      })
    case 'run_full_audit': {
      const data = await client.triggerRun({
        type: 'full-audit',
        ...pickRunArgs(args),
        ...(Array.isArray(args.pillars) ? { pillars: args.pillars } : {}),
      })
      const nextActions: Array<{ label: string; tool: string; args: Record<string, unknown> }> = []
      const childRuns = [
        { label: 'Wait for page-batch audit', id: data.pageBatchRunId as string | undefined },
        { label: 'Wait for FRT batch', id: data.frtBatchRunId as string | undefined },
        { label: 'Wait for tracking audit', id: data.trackingRunId as string | undefined },
      ].filter((c): c is { label: string; id: string } => typeof c.id === 'string' && c.id.length > 0)

      if (childRuns.length === 1) {
        nextActions.push({
          label: childRuns[0].label,
          tool: 'wait_for_run',
          args: { runId: childRuns[0].id },
        })
      } else {
        for (const child of childRuns) {
          nextActions.push({
            label: child.label,
            tool: 'wait_for_run',
            args: { runId: child.id },
          })
        }
      }
      nextActions.push({ label: 'Check merge gate', tool: 'gate_pr_quality', args: {} })
      nextActions.push({ label: 'Read site health', tool: 'get_site_health', args: {} })

      const pillarList = Array.isArray(data.pillars) ? (data.pillars as string[]).join(', ') : 'all unlocked'
      return jsonText({
        ok: true,
        summary: `Full audit started (${pillarList}). Parent runId: ${data.runId}.`,
        data,
        nextActions,
      })
    }
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
  if (typeof args.commitSha === 'string') out.commitSha = args.commitSha
  if (typeof args.branch === 'string') out.branch = args.branch
  if (typeof args.prNumber === 'number') out.prNumber = args.prNumber
  if (typeof args.prUrl === 'string') out.prUrl = args.prUrl
  if (typeof args.ciProvider === 'string') out.ciProvider = args.ciProvider
  if (typeof args.jiraKey === 'string') out.jiraKey = args.jiraKey
  if (args.perfBudgets && typeof args.perfBudgets === 'object') out.perfBudgets = args.perfBudgets
  if (args.a11yBudgets && typeof args.a11yBudgets === 'object') out.a11yBudgets = args.a11yBudgets
  if (Array.isArray(args.pillars)) out.pillars = args.pillars
  return out
}
