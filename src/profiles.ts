import type { ManifestTool } from './manifest.js'

export const TOOL_PROFILES = {
  'vrt-qa': [
    'list_projects',
    'list_scenarios',
    'run_vrt',
    'run_baseline',
    'get_run_status',
    'wait_for_run',
    'get_run_failures',
    'get_diff_stats',
    'get_quality_score',
    'get_run_history',
    'get_scenario_details',
    'explain_vrt_failure',
    'check_setup_health',
    'get_site_health',
    'get_page_health',
    'get_run_report',
    'approve_vrt_results',
    'create_comparison_rule',
    'create_scenario',
    'post_pr_comment',
    'get_project',
    'list_environments',
    'create_project',
  ],
  'frt-qa': [
    'list_projects',
    'get_project',
    'list_environments',
    'run_frt_feature',
    'frt_search_step_library',
    'frt_get_step_def',
    'frt_explain_failure',
    'frt_compile_feature',
    'frt_get_feature_groups',
    'frt_save_feature_draft',
    'frt_heal_step_def',
    'get_job_status',
    'check_setup_health',
  ],
  'tracking-qa': [
    'list_projects',
    'get_project',
    'tracking_get_plan',
    'tracking_get_audit_report',
    'tracking_list_pages',
    'tracking_list_events',
    'tracking_get_page',
    'tracking_get_event',
    'get_job_status',
  ],
  full: null,
} as const

export type ToolProfileName = keyof typeof TOOL_PROFILES

export function toolsForProfile(
  profile: string | undefined,
  all: ManifestTool[],
): ManifestTool[] {
  const phaseFiltered = all.filter(t => t.phase <= 3)
  if (!profile || profile === 'full') return phaseFiltered

  const names = TOOL_PROFILES[profile as ToolProfileName]
  if (!names) return phaseFiltered

  const allowed = new Set<string>(names)
  return phaseFiltered.filter(t => allowed.has(t.name))
}
