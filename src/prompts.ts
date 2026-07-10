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
            '3. Optionally frt_inspect_page on the scenario URL.',
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
            '1. tracking_get_plan — find uncovered events and FRT links.',
            '2. tracking_set_event_attribute / tracking_link_event_frt (confirm: true) as needed.',
            '3. tracking_get_audit_report — SITE-WIDE scores only; never use for JIRA ticket proof.',
            '4. run_full_audit with pillars: ["tracking"] then wait_for_run — site-wide only, not JIRA ticket proof.',
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
            '3. create_scenario for key URLs from crawl results.',
            '4. run_baseline on the new project (pass project slug on every tool).',
            '5. create_frt_scenario for checkout/login or primary flow (goal + confirm: true).',
            '6. check_setup_health — summarize blockers and next actions.',
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
            'Create an FRT feature from a user goal in plain language. Call create_frt_scenario with goal and confirm: true — do not output Gherkin for the user to copy.',
            '1. create_frt_scenario — primary tool for "make/create an FRT scenario" requests.',
            '2. Optional follow-up: run_frt_feature with confirm: true.',
            '3. frt_explain_failure on any failed steps.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'jira-tracking-proof',
    'Prove a JIRA tracking ticket with one VisualQ call',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Prove a JIRA tracking ticket fix in VisualQ.',
            '1. Read the ticket via JIRA MCP (summary + description).',
            '2. tracking_prove_jira_ticket(ticketId, reproGoal from ticket, confirm: true) — ONE call (async).',
            '3. Poll get_job_status until completed.',
            '4. If proofVerdict proven: paste result.jiraMarkdown into JIRA verbatim.',
            '5. If NOT proven: follow investigationLadder — frt_get_feature, analyze coverage, propose human_handoff manual recette.',
            'WRONG: "757/757" or "suite ACCOUNT 25/25" from run_full_audit as BN-448 proof.',
            'WRONG: "Le tracking est corrigé" without proofVerdict proven.',
            'Do NOT run run_full_audit or tracking_get_audit_report to conclude a JIRA ticket.',
            'After failed prove, frt_find_scenarios + frt_get_feature (read-only) are OK for investigation.',
            'Literal repro strings (rail name, book title) are examples — the tool matches tracking intent semantically.',
          ].join('\n'),
        },
      }],
    }),
  )

  server.prompt(
    'jira-tracking-proof-investigate',
    'Investigate failed JIRA tracking proof without global audit',
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'tracking_prove_jira_ticket failed or returned proofOutcome.proven false.',
            '1. Read investigationLadder from get_job_status result.',
            '2. frt_get_feature(featureId, ticketId, reproGoal) — analyze Gherkin + scenarioCoverageAnalysis.',
            '3. If gap remains: propose manual recette on live site (human_handoff steps) to the user.',
            'FORBIDDEN: run_full_audit, tracking_get_audit_report, gate_pr_quality, get_site_health as ticket proof.',
            'FORBIDDEN: jira comment "corrigé" or RECETTE transition without proofContract.mayClaimTicketFixed true.',
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
            '1. frt_find_scenarios(query=goal) and frt_get_feature_groups — check existing FRT coverage before create_frt_scenario.',
            '2. Create VRT scenario (create_scenario, confirm: true) with ticket id in label if visual scope.',
            '3. Create FRT feature (create_frt_scenario, confirm: true) with ticket id in name if functional scope.',
            '4. run_vrt and/or run_frt_feature with confirm: true.',
            '5. gate_pr_quality — attach structured verdict; mention ticket id in summary.',
          ].join('\n'),
        },
      }],
    }),
  )
}
