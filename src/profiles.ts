import type { ManifestTool } from './manifest.js'

export type ToolProfileName = 'vrt-qa' | 'frt-qa' | 'tracking-qa' | 'full'

/** Subset of tools per agent persona — filters manifest at MCP startup only. */
export const TOOL_PROFILES: Record<ToolProfileName, readonly string[] | null> = {
  'vrt-qa': [
    'list_projects',
    'list_scenarios',
    'list_environments',
    'get_project',
    'run_vrt',
    'run_baseline',
    'get_run_status',
    'wait_for_run',
    'get_run_failures',
    'get_diff_stats',
    'explain_vrt_failure',
    'get_run_history',
    'get_scenario_details',
    'compare_runs',
    'check_setup_health',
    'get_site_health',
    'get_quality_score',
    'gate_pr_quality',
    'approve_vrt_results',
    'create_comparison_rule',
    'create_content_rule',
    'post_pr_comment',
  ],
  'frt-qa': [
    'list_projects',
    'get_project',
    'get_job_status',
    'check_setup_health',
    'frt_search_step_library',
    'frt_get_step_def',
    'frt_get_feature_groups',
    'frt_propose_journey',
    'frt_save_feature_draft',
    'frt_compile_feature',
    'run_frt_feature',
    'frt_explain_failure',
    'frt_heal_step_def',
    'frt_create_step_def',
    'frt_update_step_def',
    'frt_validate_step_def',
    'frt_inspect_page',
    'gate_pr_quality',
  ],
  'tracking-qa': [
    'list_projects',
    'get_project',
    'get_run_status',
    'wait_for_run',
    'run_tracking',
    'tracking_get_plan',
    'tracking_list_events',
    'tracking_get_event',
    'tracking_list_pages',
    'tracking_get_page',
    'tracking_get_audit_report',
    'tracking_export_audit_report',
    'tracking_link_event_frt',
    'tracking_link_page_scenario',
    'get_site_health',
    'gate_pr_quality',
  ],
  full: null,
}

export function resolveProfileName(raw: string | undefined): ToolProfileName | undefined {
  if (!raw || raw === 'full') return raw === 'full' ? 'full' : undefined
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
