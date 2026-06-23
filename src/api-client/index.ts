import type {
  CIRunResponse,
  CIStatusResponse,
  ProjectSummary,
  ToolResponse,
  VisualQClientConfig,
} from './types.js'

const DEFAULT_POLL_INTERVAL_MS = 5_000
const DEFAULT_MAX_POLL_MS = 300_000

export class VisualQApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'VisualQApiError'
  }
}

export class VisualQClient {
  constructor(private readonly config: VisualQClientConfig) {}

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
    }
  }

  private url(path: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}${path}`
  }

  applyToolDefaults(args: Record<string, unknown>): Record<string, unknown> {
    if (this.config.defaultProject && args.project === undefined) {
      return { ...args, project: this.config.defaultProject }
    }
    return args
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const res = await fetch(this.url('/api/ci/projects'), { headers: this.headers() })
    if (!res.ok) throw new VisualQApiError(await res.text(), res.status)
    const data = await res.json() as { projects: ProjectSummary[] }
    return data.projects
  }

  async triggerRun(body: Record<string, unknown>): Promise<CIRunResponse> {
    const res = await fetch(this.url('/api/ci/run'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new VisualQApiError(await res.text(), res.status)
    return res.json() as Promise<CIRunResponse>
  }

  async getRunStatus(runId: string): Promise<CIStatusResponse> {
    const res = await fetch(this.url(`/api/ci/status/${runId}`), { headers: this.headers() })
    if (!res.ok) throw new VisualQApiError(await res.text(), res.status)
    return res.json() as Promise<CIStatusResponse>
  }

  async waitForRun(
    runId: string,
    options?: { intervalMs?: number; maxMs?: number },
  ): Promise<CIStatusResponse> {
    const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const maxMs = options?.maxMs ?? DEFAULT_MAX_POLL_MS
    const start = Date.now()

    while (Date.now() - start < maxMs) {
      await sleep(intervalMs)
      const status = await this.getRunStatus(runId)
      if (status.status !== 'running') return status
    }

    throw new VisualQApiError(`Run ${runId} did not complete within ${maxMs}ms`)
  }

  async invokeTool(tool: string, args: Record<string, unknown> = {}): Promise<ToolResponse> {
    const res = await fetch(this.url('/api/mcp/v1/invoke'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ tool, args }),
    })
    const payload = await res.json() as ToolResponse
    if (!res.ok && !payload.error) {
      throw new VisualQApiError(`invoke ${tool} failed: ${res.status}`, res.status)
    }
    return payload
  }
}

export function createClientFromEnv(): VisualQClient {
  const apiKey = process.env.VISUALQ_API_KEY
  const baseUrl = process.env.VISUALQ_BASE_URL || 'https://visualq.ai'
  const defaultProject = process.env.VISUALQ_DEFAULT_PROJECT?.trim() || undefined
  if (!apiKey) {
    throw new Error('VISUALQ_API_KEY is required')
  }
  return new VisualQClient({ apiKey, baseUrl, defaultProject })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export type { VisualQClientConfig, ToolResponse, CIRunResponse, CIStatusResponse, ProjectSummary }
