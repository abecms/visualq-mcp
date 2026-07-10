---
name: tracking-qa
description: >-
  Analytics and tracking QA with VisualQ — tracking plans, event coverage,
  audit reports, FRT links. Use when the user mentions tracking, analytics,
  GTM, data layer, or event coverage audits.
---

# VisualQ Tracking QA

Set `VISUALQ_TOOL_PROFILE=tracking-qa` on the MCP server for a focused tracking toolset.

## Conventions

1. Always pass `project` on every tool.
2. Link mutations need `confirm: true` (`tracking_link_event_frt`, `tracking_upsert_event`).
3. After `run_tracking` → `wait_for_run` → `tracking_get_audit_report`.

## JIRA proof (ticket → exact scenario → tableau)

For a bug ticket with a precise repro (e.g. BN-470 rail + content title):

1. Read the ticket via JIRA MCP and build an **action-only** `reproGoal` (no tracking verification clauses).
2. `tracking_prove_jira_ticket` with `confirm: true` — finds or creates the **exact** FRT scenario, links the plan event, runs tracking, returns `reportUrl`, `variableChecks`, and paste-ready `jiraMarkdown`.
3. Or, on an existing audit: `tracking_get_audit_event_proof` with `featureId` or `eventColumnKey`.

Do **not** use a generic linked scenario (e.g. "2nd book in row 2") to prove a ticket-specific repro unless `allowGenericFallback: true`.

## Review coverage

1. `tracking_get_plan` — overview
2. `tracking_list_events` — find uncovered events
3. `tracking_get_event` — attributes + FRT links
4. `tracking_get_audit_report` — failures by feature/step

## Link event to FRT step

1. `tracking_link_event_frt` with `confirm: true`
2. `run_tracking` with `confirm: true`
3. Re-check `tracking_get_audit_report`

## Prompt

Use MCP prompt `diagnose-tracking-audit` for guided workflow.

## PR context

Include tracking pillar in `gate_pr_quality` verdict when gating releases.
