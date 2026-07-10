# VisualQ Quality MCP — Agent Workflows

Canonical workflows for coding agents using `@visualq/mcp`. Use the matching MCP **prompt** in Cursor/Claude for guided execution.

## Install

```bash
npx -y @visualq/mcp
```

Set `VISUALQ_TOOL_PROFILE=qa` (default in setup-agent).

See [README](./README.md) for `VISUALQ_API_KEY` setup.

## Prompts

| Prompt | Use when |
|--------|----------|
| `setup-health-review` | New project or stale setup — blockers, missing baselines |
| `pr-quality-gate` | Before merge — VRT + FRT + rolling health verdict |
| `frt-journey-from-goal` | Plain-language user flow → FRT feature |
| `onboard-new-site` | Full bootstrap: project + crawl + VRT + FRT |
| `jira-qa` | Ticket-driven VRT/FRT coverage |

## Key tools (43, qa profile)

- **Gate**: `gate_pr_quality`, `get_site_health`
- **Full QA**: `run_full_audit` (optional `pillars[]`) → `wait_for_run`
- **VRT**: `run_vrt`, `get_run_failures`, `explain_vrt_failure`
- **FRT**: `create_frt_scenario`, `run_frt_feature`, `frt_explain_failure`
- **Pillar reports**: `get_pillar_report`, `tracking_get_audit_report`
- **JIRA tracking proof**: `tracking_prove_jira_ticket`, `tracking_get_audit_event_proof`

Mutations require `"confirm": true`.

## Playwright MCP complement

Use Playwright MCP for local browser exploration. Persist results in VisualQ (baselines, FRT features, rolling health) via VisualQ MCP.
