/** MCP server.instructions — built-in hints for IDE agents. */
export const MCP_SERVER_INSTRUCTIONS = [
  'VisualQ Quality MCP — persistent VRT/FRT baselines, rolling page health, multi-pillar audits.',
  'Always pass "project" (slug) on every tool unless VISUALQ_DEFAULT_PROJECT is set on the org agent key.',
  'Mutating tools require confirm: true (create_project, run_vrt, frt_save_feature_draft, approve_vrt_results, etc.).',
  'After run_vrt/run_baseline, call wait_for_run. After async tools (crawl_site, frt_propose_journey), poll get_job_status.',
  'Use get_site_health / gate_pr_quality for project KPIs — never treat a single latest run as the site score.',
  'Follow nextActions in tool responses when present.',
  'FRT: fix failures at source (prompts, binding, step catalog) — no silent selector swaps on system.* steps.',
  'Org agent keys (vq_org_live_) use MCP tools only. Project CI keys (vq_live_) are for GitHub Actions /api/ci/*.',
].join('\n')
