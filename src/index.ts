#!/usr/bin/env node
import { runStdioServer } from './server.js'

runStdioServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[visualq-mcp] Fatal: ${message}`)
  process.exit(1)
})
