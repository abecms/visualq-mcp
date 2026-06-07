import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerPrompts(server: McpServer) {
  server.prompt(
    'diagnose-vrt-failure',
    'Workflow to diagnose the latest VRT failures',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Diagnose the latest VisualQ VRT failures for this project.',
            '1. Call get_run_failures to list failed scenarios with mismatch %.',
            '2. For the worst failure, call get_diff_stats with scenarioLabel and viewport.',
            '3. Summarize likely causes (content rules, dynamic content, threshold) and suggest next steps.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'pre-merge-check',
    'Run VRT and summarize blockers before merge',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Run a pre-merge VisualQ check.',
            '1. run_vrt (use staging environment if the user mentioned it).',
            '2. wait_for_run until completed.',
            '3. get_run_failures — block merge if failed > 0.',
            '4. get_quality_score for extra context.',
          ].join('\n'),
        },
      }],
    }),
  )
}
