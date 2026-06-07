import manifest from '../tools-manifest.json' with { type: 'json' }

export interface ManifestTool {
  name: string
  description: string
  source: 'invoke' | 'ci' | 'client'
  phase: number
  mutating: boolean
  parameters: Record<string, unknown>
  required?: string[]
}

export interface ToolsManifest {
  version: number
  generatedAt: string
  tools: ManifestTool[]
}

export const TOOLS_MANIFEST = manifest as ToolsManifest

export function manifestTools(): ManifestTool[] {
  return TOOLS_MANIFEST.tools.filter(t => t.phase <= 3)
}
