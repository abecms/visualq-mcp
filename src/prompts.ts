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
            '3. Optionally inspect_page_dom on the scenario URL.',
            '4. Summarize likely causes and suggest next steps.',
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
            '4. get_site_health for rolling quality context.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'setup-health-review',
    'Review project setup health and recommend fixes',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Review VisualQ setup health for this project.',
            '1. check_setup_health with includeEnvironments and includeIntegrations.',
            '2. get_site_health for rolling coverage.',
            '3. list_scenarios — flag missing baselines.',
            '4. Summarize blockers and next actions.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'diagnose-tracking-audit',
    'Review tracking plan links and latest audit gaps',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Review VisualQ tracking coverage for this project.',
            '1. tracking_list_events — find uncovered events.',
            '2. tracking_get_event — inspect attributes and FRT links for one event.',
            '3. tracking_list_event_attributes — review event-variable matrix.',
            '4. tracking_get_audit_report — check failures; match eventResults by frt.featureId + stepIndex.',
            '5. tracking_link_event_frt (confirm: true) for uncovered events, then run_tracking.',
          ].join('\n'),
        },
      }],
    }),
  )
}
