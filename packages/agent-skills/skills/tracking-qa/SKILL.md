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
3. Site-wide review: `tracking_get_audit_report` — **never** use its global score as JIRA ticket proof.

## JIRA proof (ticket → semantic intent → tableau)

For a bug ticket (e.g. BN-448 account tabs, BN-470 rail click):

1. Read the ticket via JIRA MCP and build an **action-only** `reproGoal`.
2. `tracking_prove_jira_ticket` with `confirm: true` — **one call** (async). Poll `get_job_status` until completed.
3. If `proofContract.mayClaimTicketFixed`:
   - `jira_add_comment` with `result.jiraMarkdown` **verbatim**
4. If **NOT** proven — **investigation ladder** (do **not** run `run_full_audit`):
   - Read `investigationLadder` from the tool response
   - `frt_get_feature(featureId, ticketId, reproGoal)` — analyze Gherkin + `scenarioCoverageAnalysis`
   - If still inconclusive: propose **manual recette on the live site** (`human_handoff` steps)

## Forbidden for JIRA proof

- `run_full_audit`, global scores (757/757), `gate_pr_quality`, `get_site_health` as ticket proof
- Initial chain: `frt_find_scenarios` → `run_frt_feature` → `run_full_audit`
- Reading app source to infer payloads
- JIRA comment « corrigé » or RECETTE without `proofVerdict: proven`

## Allowed after failed prove (read-only)

- `frt_find_scenarios`, `frt_get_feature`, `tracking_get_plan`, re-prove via `tracking_prove_jira_ticket`

## Post-call checklist

```
□ tracking_prove_jira_ticket called first
□ get_job_status polled until terminal state
□ If proven: jiraMarkdown verbatim + proofContract.mayClaimTicketFixed
□ If not: NON + investigationLadder + frt_get_feature analysis
□ No run_full_audit for JIRA conclusion
```

## Review site-wide coverage (not JIRA ticket proof)

1. `tracking_get_plan` — overview
2. `tracking_list_events` — find uncovered events
3. `tracking_get_audit_report` — SITE-WIDE scores only

## Prompts

- `jira-tracking-proof` — initial prove
- `jira-tracking-proof-investigate` — after failed prove
