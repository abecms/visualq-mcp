import type { ManifestTool } from './manifest.js'

export type ToolProfileName = 'qa' | 'agent-verify' | 'vrt-qa' | 'frt-qa' | 'tracking-qa' | 'full'

/** VisualQ Verify loop (plan-verify-change §4). */
export const VERIFY_TOOLS = ['start_verification', 'verify_change', 'get_verification'] as const

/** Subset of tools per agent persona — filters manifest at MCP startup only.
 *  Keep in sync with visualq/src/lib/mcp/mcp-invoke-config.ts MCP_QA_ALLOWLIST */
export const TOOL_PROFILES: Record<ToolProfileName, readonly string[] | null> = {
  qa: [
    'list_projects',
    'create_project',
    'get_project',
    'update_project',
    'list_environments',
    'create_environment',
    'update_environment',
    'check_setup_health',
    'crawl_site',
    'get_job_status',
    'create_scenario',
    'list_scenarios',
    'run_baseline',
    'run_vrt',
    'create_frt_scenario',
    'frt_save_feature_draft',
    'frt_find_scenarios',
    'frt_get_feature',
    'run_frt_feature',
    'frt_get_feature_groups',
    'run_full_audit',
    'wait_for_run',
    'get_run_status',
    'gate_pr_quality',
    'get_site_health',
    'get_pillar_report',
    'get_run_failures',
    'get_diff_stats',
    'explain_vrt_failure',
    'frt_explain_failure',
    'approve_vrt_results',
    'create_comparison_rule',
    'create_content_rule',
    'frt_heal_step_def',
    'tracking_get_plan',
    'tracking_import_plan',
    'tracking_update_plan',
    'tracking_discover_from_pages',
    'tracking_upsert_page',
    'tracking_upsert_event',
    'tracking_set_page_attribute',
    'tracking_set_event_attribute',
    'tracking_link_page_scenario',
    'tracking_link_event_frt',
    'tracking_get_audit_report',
    'tracking_get_audit_event_proof',
    'tracking_prove_jira_ticket',
    'frt_inspect_page',
    'frt_search_step_library',
    'post_pr_comment',
    ...VERIFY_TOOLS,
  ],
  /** Last verification step for coding agents (Claude Code, Cursor, Hermes…).
   *  Keep in sync with visualq/src/lib/mcp/mcp-invoke-config.ts MCP_AGENT_VERIFY_ALLOWLIST */
  'agent-verify': ['list_projects', ...VERIFY_TOOLS],
  /** @deprecated use qa */
  'vrt-qa': null,
  /** @deprecated use qa */
  'frt-qa': null,
  /** @deprecated use qa */
  'tracking-qa': null,
  full: null,
}

export function resolveProfileName(raw: string | undefined): ToolProfileName | undefined {
  if (!raw || raw === 'full') return raw === 'full' ? 'full' : undefined
  if (raw === 'vrt-qa' || raw === 'frt-qa' || raw === 'tracking-qa') return 'qa'
  if (raw in TOOL_PROFILES) return raw as ToolProfileName
  return undefined
}

export function toolsForProfile(
  profile: string | undefined,
  all: ManifestTool[],
): ManifestTool[] {
  const resolved = resolveProfileName(profile)
  if (!resolved || resolved === 'full') {
    return all.filter((t) => t.phase <= 3)
  }

  const names = TOOL_PROFILES[resolved]
  if (!names) return all.filter((t) => t.phase <= 3)

  const set = new Set(names)
  return all.filter((t) => set.has(t.name))
}
