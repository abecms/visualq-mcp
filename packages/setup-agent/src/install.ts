import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMcpJson, type SetupOptions } from './mcp-config.js'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const agentSkillsRoot = resolve(pkgRoot, '../agent-skills')

function mergeMcpJson(targetPath: string, fragment: string): void {
  let existing: Record<string, unknown> = {}
  if (existsSync(targetPath)) {
    try {
      existing = JSON.parse(readFileSync(targetPath, 'utf8')) as Record<string, unknown>
    } catch {
      existing = {}
    }
  }
  const incoming = JSON.parse(fragment) as { mcpServers: Record<string, unknown> }
  const merged = {
    ...existing,
    mcpServers: {
      ...((existing.mcpServers as Record<string, unknown>) ?? {}),
      ...incoming.mcpServers,
    },
  }
  mkdirSync(dirname(targetPath), { recursive: true })
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
}

function syncSkillsAndRules(skillsDir: string, rulesDir: string): void {
  const skillsSrc = join(agentSkillsRoot, 'skills')
  const rulesSrc = join(agentSkillsRoot, 'rules')

  mkdirSync(skillsDir, { recursive: true })
  mkdirSync(rulesDir, { recursive: true })

  for (const name of readdirSync(skillsSrc)) {
    const dest = join(skillsDir, name)
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
    cpSync(join(skillsSrc, name), dest, { recursive: true })
  }

  for (const name of readdirSync(rulesSrc)) {
    cpSync(join(rulesSrc, name), join(rulesDir, name))
  }
}

export function installForCursor(options: SetupOptions): { mcpPath: string; skillsPath: string; rulesPath: string } {
  const home = homedir()
  const mcpPath = join(home, '.cursor', 'mcp.json')
  const skillsPath = join(home, '.cursor', 'skills')
  const rulesPath = join(home, '.cursor', 'rules')

  mergeMcpJson(mcpPath, buildMcpJson(options))
  syncSkillsAndRules(skillsPath, rulesPath)

  return { mcpPath, skillsPath, rulesPath }
}

export function installForClaude(options: SetupOptions): { mcpPath: string } {
  const home = homedir()
  const claudeDir = join(home, '.claude')
  mkdirSync(claudeDir, { recursive: true })

  const mcpPath = join(claudeDir, 'mcp.json')
  mergeMcpJson(mcpPath, buildMcpJson(options))

  const skillsPath = join(claudeDir, 'skills')
  const rulesPath = join(claudeDir, 'rules')
  syncSkillsAndRules(skillsPath, rulesPath)

  return { mcpPath }
}

export function installManual(options: SetupOptions, cwd: string): { mcpPath: string; skillsPath: string; rulesPath: string } {
  const mcpPath = join(cwd, '.cursor', 'mcp.json')
  const skillsPath = join(cwd, '.cursor', 'skills')
  const rulesPath = join(cwd, '.cursor', 'rules')

  mergeMcpJson(mcpPath, buildMcpJson(options))
  syncSkillsAndRules(skillsPath, rulesPath)

  return { mcpPath, skillsPath, rulesPath }
}
