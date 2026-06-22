import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '..')

const transport = new StdioClientTransport({
  command: 'node',
  args: [join(root, 'dist/index.js')],
  env: {
    ...process.env,
    VISUALQ_API_KEY: process.env.VISUALQ_API_KEY,
    VISUALQ_BASE_URL: process.env.VISUALQ_BASE_URL || 'http://localhost:3000',
  },
})

const client = new Client({ name: 'list-tools', version: '0' })
await client.connect(transport)
const { tools } = await client.listTools()
console.log(tools.map(t => t.name).sort().join('\n'))
console.log('count:', tools.length)
await client.close()
