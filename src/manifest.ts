import manifest from '../tools-manifest.json' with { type: 'json' }
import { toolsForProfile } from './profiles.js'

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
  const profile = process.env.VISUALQ_TOOL_PROFILE
  return toolsForProfile(profile, TOOLS_MANIFEST.tools)
}
