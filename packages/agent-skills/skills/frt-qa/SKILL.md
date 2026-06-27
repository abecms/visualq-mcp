---
name: frt-qa
description: >-
  Functional regression tests (FRT) with VisualQ — Gherkin journeys, step
  library, compile and run features. Use when the user mentions FRT, Gherkin,
  user journeys, functional tests, or step definitions.
---

# VisualQ FRT QA

Set `VISUALQ_TOOL_PROFILE=frt-qa` on the MCP server for a focused FRT toolset.

## Conventions

1. Always pass `project` on every tool.
2. Mutations need `confirm: true` (`frt_save_feature_draft`, `run_frt_feature`, `frt_heal_step_def`).
3. Async tools (`frt_propose_journey`) → poll `get_job_status`.

## Create journey from goal

Use MCP prompt `frt-journey-from-goal` or:

1. `frt_search_step_library` — reuse steps
2. `frt_propose_journey` (async)
3. `frt_save_feature_draft` with `confirm: true`
4. `frt_compile_feature` — fix errors at source, fail loud
5. `run_frt_feature` with `confirm: true`
6. `frt_explain_failure` on red steps

## No repair at runtime

- Fix coach docs, binding, step catalog — not silent selector swaps
- `system.*` step defs are never auto-healed at runtime
- `frt_heal_step_def` requires explicit `confirm: true` to persist

## Debug failure

1. `frt_explain_failure` with runId / step index
2. `frt_get_step_def` — inspect persisted body
3. `frt_inspect_page` if DOM/selector issue
