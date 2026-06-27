# @visualq/setup-agent

One-command install for VisualQ agent integration (MCP + skills + rules).

## Usage

```bash
# Cursor (user-level ~/.cursor/)
npx @visualq/setup-agent cursor --key vq_org_live_… --project my-site

# Claude Code (~/.claude/)
npx @visualq/setup-agent claude --key vq_org_live_…

# Project-scoped (.cursor/ in repo)
npx @visualq/setup-agent manual --key vq_org_live_… --project my-site

# Cursor deeplink only (no file writes)
npx @visualq/setup-agent cursor --deeplink --profile vrt-qa
```

Get your org agent key at **https://visualq.ai → Settings → Agent API Keys** (`mcp_full` scope).

## Options

| Flag | Description |
|------|-------------|
| `--key` | Org agent key `vq_org_live_…` |
| `--project` | Default project slug |
| `--profile` | `vrt-qa` (default), `frt-qa`, `tracking-qa`, `full` |
| `--base-url` | Default `https://visualq.ai` |

Restart your IDE after install.
