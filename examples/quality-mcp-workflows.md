# VisualQ Quality MCP — Agent Workflows

Canonical workflows for coding agents using `@visualq/mcp`. Use the matching MCP **prompt** in Cursor/Claude for guided execution.

## Install

```bash
npx -y @visualq/mcp
```

See [README](./README.md) for `VISUALQ_API_KEY` setup.

## Prompts

| Prompt | Use when |
|--------|----------|
| `setup-health-review` | New project or stale setup — blockers, missing baselines |
| `pr-quality-gate` | Before merge — VRT + FRT + rolling health verdict |
| `frt-journey-from-goal` | Plain-language user flow → Gherkin feature |
| `onboard-new-site` | Full bootstrap: project + crawl + VRT + FRT |
| `jira-qa` | Ticket-driven VRT/FRT coverage |

## Resources (read-only)

| URI | Content |
|-----|---------|
| `visualq://site-health` | Rolling health + coverage |
| `visualq://quality-score` | Composite quality score |
| `visualq://latest-failures` | Latest VRT failures |
| `visualq://frt-step-library` | Step definition library |
| `visualq://frt-feature-groups` | FRT folder organization |
| `visualq://pr-quality-gate` | Current merge verdict |

## Key tools

- **Gate**: `gate_pr_quality`
- **VRT**: `run_vrt`, `get_run_failures`, `explain_vrt_failure`
- **FRT**: `frt_save_feature_draft`, `frt_compile_feature`, `run_frt_feature`, `frt_explain_failure`
- **Health**: `get_site_health`, `identify_blockers_for_release`

Mutations require `"confirm": true`.

## Playwright MCP complement

Use Playwright MCP for local browser exploration. Persist results in VisualQ (baselines, FRT features, rolling health) via VisualQ MCP.
