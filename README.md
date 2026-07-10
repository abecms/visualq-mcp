# @visualq/mcp

MCP server for [VisualQ](https://visualq.ai) — the **Quality OS** agent interface. **`@visualq/mcp`** exposes **43 tools** (qa profile): multi-pillar audit, VRT/FRT, tracking plan + JIRA proof, rolling health. For Cursor, Claude Desktop, or any MCP client.

## Production setup (recommended)

1. Sign in to **https://visualq.ai**
2. Go to **Settings → Agent API Keys** (org admin)
3. Create a key with scope **`mcp_full`**
4. Optionally set a **default project** slug if you mostly work on one client
5. Copy the **Cursor MCP config** snippet
6. Paste into `~/.cursor/mcp.json` (or project `.cursor/mcp.json`) and restart Cursor

**Or one command:**

```bash
npx @visualq/setup-agent cursor --key vq_org_live_… --project my-site
```

**Or install the [Cursor plugin](https://github.com/abecms/visualq-cursor-plugin)** (skills + rules bundled).

```json
{
  "mcpServers": {
    "visualq": {
      "command": "npx",
      "args": ["-y", "@visualq/mcp"],
      "env": {
        "VISUALQ_API_KEY": "vq_org_live_…",
        "VISUALQ_BASE_URL": "https://visualq.ai",
        "VISUALQ_TOOL_PROFILE": "qa"
      }
    }
  }
}
```

### Single-project shortcut

If your org key has a default project (or you set it only in MCP env):

```json
"VISUALQ_DEFAULT_PROJECT": "afp-com"
```

Then tools can omit `project` when the key has `defaultProject` on the server **or** this env var is set in the MCP config.

### Multi-project orgs

Pass `project` on every tool call (slug or id), e.g. `"project": "afp-com"`.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VISUALQ_API_KEY` | yes | — | Org agent key `vq_org_live_…` or legacy project key `vq_live_…` |
| `VISUALQ_BASE_URL` | no | `https://visualq.ai` | VisualQ instance (use your origin for self-hosted) |
| `VISUALQ_DEFAULT_PROJECT` | no | — | Default project slug injected into tool args |
| `VISUALQ_TOOL_PROFILE` | no | `qa` | `qa` (recommended), `full`, or legacy aliases `vrt-qa` / `frt-qa` / `tracking-qa` → `qa` |
| `VISUALQ_MCP_HTTP` | no | — | Set `1` to run local Streamable HTTP on `127.0.0.1:3847` |
| `VISUALQ_MCP_PORT` | no | `3847` | HTTP mode port |

## API key scopes

| Scope | MCP read | MCP write (`confirm: true`) | CI `/api/ci/*` |
|-------|----------|-----------------------------|----------------|
| `mcp_read` | yes | no | no |
| `mcp_full` | yes | yes | no |
| `ci` (project key) | no | no | yes |

Org agent keys support **`mcp_read`** and **`mcp_full`** only.

## Typical agent workflows

**Quality MCP PR gate:** `gate_pr_quality` → fix with `explain_vrt_failure` / `frt_heal_step_def` → `run_vrt` or `run_full_audit`

**Onboard a site:** `create_project` → `crawl_site` → `create_scenario` → `run_baseline` → `create_frt_scenario` → `run_frt_feature`

**Full QA:** `run_full_audit` (optional `pillars[]`) → `wait_for_run` → `gate_pr_quality` → `get_site_health`

**Pillar-only audit:** `run_full_audit` with `pillars: ["a11y"]`, `["tracking"]`, etc.

**Pre-merge VRT:** `list_scenarios` → `run_vrt` → `get_run_failures` → `explain_vrt_failure`

**FRT in CI:** GitHub Action `type: frt` or `visualq frt --api-key …`

**Jira tracking proof:** read ticket → `tracking_prove_jira_ticket` with `confirm: true` → paste `jiraMarkdown` into JIRA. Or `tracking_get_audit_event_proof` on an existing audit.

**Jira-driven QA:** read ticket → `create_scenario` / `create_frt_scenario` with ticket id in name → run tests

Mutating tools require **`confirm: true`** in arguments.

## Legacy project CI key

For GitHub Actions / Jenkins, use a **project-scoped** key (`vq_live_…`) with scope `ci` — not the org agent key.

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

Create in **Project → Settings → API keys**.

## Hosted REST gateway (advanced)

VisualQ also exposes JSON invoke (not stdio MCP wire protocol):

- `GET https://visualq.ai/api/mcp` — tool catalog (public)
- `POST https://visualq.ai/api/mcp/v1/invoke` — `X-API-Key` + `{ "tool", "args" }`

The `@visualq/mcp` npm package is the supported IDE integration path.

## Local development

```bash
npm install
npm run build
VISUALQ_API_KEY=vq_org_live_… VISUALQ_BASE_URL=http://localhost:3000 node dist/index.js
```

Sync tool manifest from the `visualq` backend (sibling repo):

```bash
cd ../visualq && npm run mcp:export-manifest
cd ../visualq-mcp && npm run sync-manifest
```

Before publishing to npm:

```bash
cd ../visualq && npm run mcp:export-manifest
cd ../visualq-mcp && npm test && npm run build && npm run sync-manifest
npm publish --access public
# Optional: publish agent skills if skills/ changed
cd packages/agent-skills && npm publish --access public
```

## Repository

- Package: [abecms/visualq-mcp](https://github.com/abecms/visualq-mcp)
- Backend: [abecms/visualq](https://github.com/abecms/visualq) (`/api/mcp/v1/invoke`)
