#!/usr/bin/env node
import { runHttpServer } from './http-server.js'
import { runStdioServer } from './server.js'

const useHttp = process.argv.includes('--http') || process.env.VISUALQ_MCP_HTTP === '1'

const runner = useHttp ? runHttpServer() : runStdioServer()

runner.catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[visualq-mcp] Fatal: ${message}`)
  process.exit(1)
})
