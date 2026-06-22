# @visualq/mcp

MCP server for [VisualQ](https://visualq.ai) — run VRT, poll results, and read structured failure reports from Cursor, Claude Desktop, or any MCP client.

## Org agent key (recommended for Cursor)

Use a **org-scoped** key (`vq_org_live_…`) from VisualQ **Settings → Agent API Keys**. One MCP config covers all projects — pass `project` (slug) on each tool call.

```json
{
  "mcpServers": {
    "visualq": {
      "command": "npx",
      "args": ["-y", "@visualq/mcp"],
      "env": {
        "VISUALQ_API_KEY": "vq_org_live_…",
        "VISUALQ_BASE_URL": "https://visualq.ai"
      }
    }
  }
}
```

The server exposes the full VisualQ MCP tool catalog from `tools-manifest.json` (invoke + CI tools). Wire it to your own QA agent — no bundled agent persona required.

## Quick start (Cursor) — project CI key (legacy)

Add to `.cursor/mcp.json` or global MCP settings:

```json
{
  "mcpServers": {
    "visualq": {
      "command": "npx",
      "args": ["-y", "@visualq/mcp"],
      "env": {
        "VISUALQ_API_KEY": "vq_live_…",
        "VISUALQ_BASE_URL": "https://visualq.ai"
      }
    }
  }
}
```

Create an API key in VisualQ: **Project → Settings → API keys** (prefix `vq_live_`).

## Tools

**Phase 1:** `list_projects`, `list_scenarios`, `run_vrt`, `run_baseline`, `get_run_status`, `wait_for_run`, `get_run_failures`, `get_diff_stats`, `get_quality_score`

**Phase 2:** `get_run_history`, `get_scenario_details`, `compare_runs`, `check_setup_health`, `explain_vrt_failure`, `perf_get_latest_report`, `seo_get_report`, `a11y_get_report`, `tracking_get_plan`, `tracking_get_audit_report`, `tracking_export_audit_report`

### Tracking event ↔ FRT links

Each analytics event in the tracking plan links to an **FRT feature + Gherkin step**:

```json
{ "featureId": "…", "stepIndex": 0, "stepText": "When user clicks play" }
```

- **One FRT feature = one scenario** — use `featureId` only (no `scenarioName` in refs).
- **`stepIndex`** is mandatory (0-based, Background excluded).
- **`run_tracking`** audits network hits captured **during that step only**.
- Call **`tracking_get_plan`** first — response includes `eventFrtLinking` hints, `uncoveredEventIds`, and per-feature step counts.

**Phase 3 (write — `confirm: true` required):** `approve_vrt_results`, `create_scenario`, `create_comparison_rule`, `run_frt_feature`, `post_pr_comment`

## API key scopes

| Scope | MCP read | MCP write | CI runs |
|-------|----------|-----------|---------|
| `ci` | no | no | yes |
| `mcp_read` | yes | no | no |
| `mcp_full` | yes | yes | yes |

Existing keys without a scope default to `mcp_full`. Create scoped keys in **Project → Settings → API Keys** (optional `scope` field in API).

## Streamable HTTP (optional)

```bash
VISUALQ_API_KEY=vq_live_… npx -y @visualq/mcp --http
# → http://127.0.0.1:3847/mcp
```

## Development

```bash
npm install
npm run build
VISUALQ_API_KEY=vq_live_… node dist/index.js
```

Sync tool manifest from the `visualq` backend repo:

```bash
cd ../visualq && npm run mcp:export-manifest
```

## Repository

Published from `abecms/visualq-mcp`. Backend routes live in `abecms/visualq` (`/api/mcp/v1/invoke`).
