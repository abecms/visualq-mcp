import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult, type Tool } from '@modelcontextprotocol/sdk/types.js'
import type { VisualQClient } from './api-client/index.js'
import type { ManifestTool } from './manifest.js'

type ToolContent = CallToolResult['content']

function jsonText(value: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  }
}

/**
 * Full JSON Schema passed through unchanged (required, enums, descriptions,
 * nested objects, anyOf). The previous zod conversion made every argument an
 * optional string/array/record and dropped all of that.
 */
export function toInputSchema(tool: ManifestTool): Tool['inputSchema'] {
  const params = (tool.parameters ?? {}) as Record<string, unknown>
  const required = Array.from(new Set([
    ...(Array.isArray(params.required) ? params.required as string[] : []),
    ...(tool.required ?? []),
  ]))
  return {
    ...params,
    type: 'object',
    properties: (params.properties ?? {}) as Record<string, object>,
    ...(required.length ? { required } : {}),
  }
}

export function toMcpTool(tool: ManifestTool): Tool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: toInputSchema(tool),
    ...(tool.outputSchema ? { outputSchema: { ...tool.outputSchema, type: 'object' } as Tool['outputSchema'] } : {}),
    annotations: { readOnlyHint: !tool.mutating },
  }
}

interface InlineImage { ref: string; mimeType: string; data: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Invoke responses → MCP result. `data.inlineImages` become image blocks (not
 * base64 inside the JSON); tools with an outputSchema get `structuredContent`.
 */
export function toCallToolResult(tool: ManifestTool, response: unknown): CallToolResult {
  const res: Record<string, unknown> = isRecord(response) ? { ...response } : { ok: false, error: 'Invalid response' }
  const data = isRecord(res.data) ? { ...res.data } : res.data
  const images: InlineImage[] = isRecord(data) && Array.isArray(data.inlineImages)
    ? (data.inlineImages as unknown[]).filter((i): i is InlineImage =>
      isRecord(i) && typeof i.data === 'string' && typeof i.mimeType === 'string' && typeof i.ref === 'string')
    : []
  if (isRecord(data) && 'inlineImages' in data) {
    delete data.inlineImages
    data.inlineImageRefs = images.map(i => i.ref)
  }
  res.data = data

  const content: ToolContent = [{ type: 'text', text: JSON.stringify(res, null, 2) }]
  for (const img of images) {
    content.push({ type: 'text', text: `Evidence ${img.ref}:` })
    content.push({ type: 'image', data: img.data, mimeType: img.mimeType })
  }

  const ok = res.ok !== false
  const result: CallToolResult = { content, ...(ok ? {} : { isError: true }) }
  if (tool.outputSchema && ok && isRecord(data)) {
    result.structuredContent = {
      ...data,
      ...(Array.isArray(res.nextActions) ? { nextActions: res.nextActions } : {}),
    }
  }
  return result
}

export function registerTools(server: McpServer, client: VisualQClient, tools: ManifestTool[]) {
  const byName = new Map(tools.map(t => [t.name, t]))
  const low = server.server
  low.registerCapabilities({ tools: { listChanged: false } })

  low.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: tools.map(toMcpTool) }))

  low.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const tool = byName.get(request.params.name)
    if (!tool) {
      return { ...jsonText({ ok: false, error: `Unknown tool: ${request.params.name}` }), isError: true }
    }
    const args = (request.params.arguments ?? {}) as Record<string, unknown>
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
          return toCallToolResult(tool, result)
        }
        default:
          return { ...jsonText({ ok: false, error: `Unknown tool source for ${tool.name}` }), isError: true }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ...jsonText({ ok: false, error: message }), isError: true }
    }
  })
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
  const effectiveRunId = await resolveWaitRunId(client, runId)
  const status = await client.waitForRun(effectiveRunId, { maxMs: maxWaitMs })
  return jsonText({ ok: true, data: status })
}

/** When polling a full-suite parent, prefer the tracking child if it is the only pillar run. */
async function resolveWaitRunId(client: VisualQClient, runId: string): Promise<string> {
  try {
    const initial = await client.getRunStatus(runId)
    if (
      initial.type === 'full-suite-test'
      && typeof initial.trackingRunId === 'string'
      && initial.trackingRunId.length > 0
      && !initial.pageBatchRunId
      && !initial.frtBatchRunId
    ) {
      return initial.trackingRunId
    }
  } catch {
    // Keep original runId — caller may already pass a child run id.
  }
  return runId
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
