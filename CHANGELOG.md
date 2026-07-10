# Changelog

## 1.0.2 — 2026-07-10

### Added

- **`tracking_get_audit_event_proof`** — per-event tracking proof from an existing audit: `reportUrl`, FRT scenario, variable table (plan / Piano / expected / received / status), `jiraMarkdown`.
- **`tracking_prove_jira_ticket`** — JIRA ticket → exact FRT scenario (find or create), link plan event, run tracking audit, same proof shape.

### Changed

- QA catalog: **43 tools** (was 41 in 1.0.1 manifest; profile `qa` now includes `tracking_discover_from_pages` and both proof tools).
- `tracking-qa` agent skill documents JIRA proof workflow (BN-470 pattern).

### Requirements

- VisualQ backend must include the new invoke handlers (deploy `visualq` on Vercel before using these tools against production).

## 1.0.1 — 2026-07-08

- Robust MCP invoke response parsing.
- `frt_find_scenarios` in QA catalog.

## 1.0.0 — 2026-06-27

- Rationalized QA profile (~39 tools), `run_full_audit`, org agent keys.
