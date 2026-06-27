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
            '1. run_vrt (pass project slug; use staging environment if mentioned).',
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

  server.prompt(
    'onboard-new-site',
    'Create a project and bootstrap VRT + FRT coverage',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Onboard a new site in VisualQ using the org agent key.',
            '1. create_project with name, baseUrl, confirm: true.',
            '2. crawl_site with baseUrl (async — poll get_job_status).',
            '3. generate_scenarios from discovered URLs.',
            '4. run_baseline on the new project (pass project slug on every tool).',
            '5. frt_propose_journey for checkout/login or primary flow (async — poll get_job_status).',
            '6. frt_save_feature_draft with confirm: true if journey looks good.',
            '7. check_setup_health — summarize blockers and next actions.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'pr-quality-gate',
    'Aggregate VRT, FRT, and rolling health into a merge verdict',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Run a PR quality gate for this VisualQ project.',
            '1. gate_pr_quality with threshold balanced (or strict for release branches).',
            '2. If blockMerge is true, list each blocker with pillar and suggested tool.',
            '3. For VRT failures: get_run_failures → explain_vrt_failure on worst scenario.',
            '4. For FRT failures: frt_explain_failure on failed run/step.',
            '5. Summarize: merge allowed yes/no, rolling health coverage, recommended fixes.',
            'Never treat a single latest run as the site score — use rolling health from gate_pr_quality.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'frt-journey-from-goal',
    'Propose and persist an FRT feature from a plain-language goal',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Create an FRT feature from a user goal in plain language.',
            '1. frt_search_step_library — reuse existing step defs when possible.',
            '2. frt_propose_journey with goal and startUrl (async — poll get_job_status).',
            '3. Review proposed Gherkin; prefer system step patterns over custom bodies.',
            '4. frt_save_feature_draft with confirm: true.',
            '5. frt_compile_feature — fix compile errors at source; fail loud on binding issues.',
            '6. run_frt_feature with confirm: true.',
            '7. frt_explain_failure on any failed steps.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'jira-qa',
    'Map a Jira ticket to VRT/FRT coverage and run quality checks',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Implement QA coverage for a Jira ticket in VisualQ.',
            'Ask for the ticket key and acceptance criteria if not provided.',
            '1. frt_get_feature_groups and list_scenarios — check existing coverage.',
            '2. Create VRT scenario (create_scenario, confirm: true) with ticket id in label if visual scope.',
            '3. Create FRT feature (frt_save_feature_draft, confirm: true) with ticket id in name/description if functional scope.',
            '4. run_vrt and/or run_frt_feature with confirm: true.',
            '5. gate_pr_quality — attach structured verdict; mention ticket id in summary.',
          ].join('\n'),
        },
      }],
    }),
  )
}
