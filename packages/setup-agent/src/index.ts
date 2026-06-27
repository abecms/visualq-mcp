#!/usr/bin/env node
import { installForClaude, installForCursor, installManual } from './install.js'
import { buildCursorDeeplink, type SetupOptions } from './mcp-config.js'

function printHelp(): void {
  console.log(`Usage: visualq-setup-agent <cursor|claude|manual> [options]

Install VisualQ MCP config, skills, and rules.

Options:
  --key <vq_org_live_…>     Org agent API key (required for install)
  --project <slug>          Default project slug
  --profile <name>          Tool profile: qa (default), full
  --base-url <url>          VisualQ base URL (default: https://visualq.ai)
  --deeplink                Print Cursor deeplink only (no file writes)
  --help                    Show this help
`)
}

function parseArgs(argv: string[]) {
  const target = argv[0]
  if (!target || target === '--help' || target === '-h') {
    printHelp()
    process.exit(target ? 0 : 1)
  }

  let apiKey = process.env.VISUALQ_API_KEY ?? ''
  let defaultProject: string | undefined
  let toolProfile = 'qa'
  let baseUrl = process.env.VISUALQ_BASE_URL ?? 'https://visualq.ai'
  let deeplinkOnly = false

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--key') apiKey = argv[++i] ?? ''
    else if (arg === '--project') defaultProject = argv[++i]
    else if (arg === '--profile') toolProfile = argv[++i] ?? 'qa'
    else if (arg === '--base-url') baseUrl = argv[++i] ?? baseUrl
    else if (arg === '--deeplink') deeplinkOnly = true
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  const options: SetupOptions = {
    apiKey,
    baseUrl,
    defaultProject,
    toolProfile,
  }

  return { target, options, deeplinkOnly }
}

async function main(): Promise<void> {
  const { target, options, deeplinkOnly } = parseArgs(process.argv.slice(2))

  if (deeplinkOnly) {
    console.log(buildCursorDeeplink(options))
    return
  }

  if (!options.apiKey || !options.apiKey.startsWith('vq_org_live_')) {
    console.error('Error: --key vq_org_live_… is required (org agent key from Settings → Agent API Keys).')
    process.exit(1)
  }

  if (!['cursor', 'claude', 'manual'].includes(target)) {
    console.error(`Unknown target: ${target}`)
    printHelp()
    process.exit(1)
  }

  if (target === 'cursor') {
    const paths = installForCursor(options)
    console.log('VisualQ agent installed for Cursor:')
    console.log(`  MCP:    ${paths.mcpPath}`)
    console.log(`  Skills: ${paths.skillsPath}`)
    console.log(`  Rules:  ${paths.rulesPath}`)
  } else if (target === 'claude') {
    const paths = installForClaude(options)
    console.log('VisualQ agent installed for Claude Code:')
    console.log(`  MCP: ${paths.mcpPath}`)
  } else {
    const paths = installManual(options, process.cwd())
    console.log('VisualQ agent installed in current project:')
    console.log(`  MCP:    ${paths.mcpPath}`)
    console.log(`  Skills: ${paths.skillsPath}`)
    console.log(`  Rules:  ${paths.rulesPath}`)
  }

  console.log('\nRestart your IDE, then try: "Run prompt pr-quality-gate for my project".')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
