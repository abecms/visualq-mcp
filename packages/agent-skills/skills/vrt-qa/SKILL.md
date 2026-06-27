---
name: vrt-qa
description: >-
  Visual regression testing with VisualQ — run VRT, diagnose diffs, approve
  baselines, gate PRs. Use when the user mentions VRT, visual regression,
  screenshot diffs, baselines, or pre-merge visual checks.
---

# VisualQ VRT QA

Set `VISUALQ_TOOL_PROFILE=vrt-qa` on the MCP server for a focused VRT toolset.

## Conventions

1. Always pass `project` (slug) and `environment` (e.g. staging).
2. Mutations need `confirm: true` (`run_vrt`, `run_baseline`, `approve_vrt_results`, rules).
3. After `run_vrt` → `wait_for_run` → `get_run_failures`.

## Core workflow

1. `run_vrt` with `confirm: true`
2. `wait_for_run`
3. `get_run_failures` — list failed scenarios + mismatch %
4. `explain_vrt_failure` on worst failure
5. `get_site_health` for rolling context (not latest run alone)

## PR gate

Use MCP prompt `pr-quality-gate` or call `gate_pr_quality` directly.

## Fix intentional changes

1. `get_diff_stats` for drill-down
2. `create_comparison_rule` or `create_content_rule` with `confirm: true`
3. Or `approve_vrt_results` with `confirm: true` after human review

## Prompts

- `pre-merge-check` — quick VRT-only gate
- `diagnose-vrt-failure` — structured diff diagnosis
