export interface VisualQClientConfig {
  apiKey: string
  baseUrl: string
}

export interface CIRunResponse {
  success: boolean
  runId: string
  projectId: string
  type: string
  environmentName?: string
  statusUrl: string
}

export interface CIStatusResponse {
  runId: string
  projectId: string
  status: string
  type: string
  duration?: number
  summary?: { total: number; passed: number; failed: number }
  error?: string
}

export interface ToolResponse {
  ok: boolean
  tool: string
  summary: string
  data: unknown
  warnings: string[]
  nextActions: Array<{ label: string; tool: string; args?: Record<string, unknown> }>
  error?: { code: string; message: string }
  recoverable?: boolean
}

export interface ProjectSummary {
  id: string
  name: string
  slug: string
  baseUrl: string
  scenarioCount: number
}
