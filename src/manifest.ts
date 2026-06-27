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

import { toolsForProfile } from './profiles.js'

/** Full VisualQ tool catalog — same surface as the backend MCP manifest. */
export function manifestTools(profile?: string): ManifestTool[] {
  return toolsForProfile(profile ?? process.env.VISUALQ_TOOL_PROFILE, TOOLS_MANIFEST.tools)
}
