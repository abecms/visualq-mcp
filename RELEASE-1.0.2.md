# Release @visualq/mcp 1.0.2

**Date:** 2026-07-10  
**Backend:** visualq on Vercel (invoke handlers for tracking proof — already pushed)

## Packages

| Package | Version | npm today | Action |
|---------|---------|-----------|--------|
| `@visualq/mcp` | **1.0.2** | 1.0.1 | **publish** |
| `@visualq/agent-skills` | **1.0.1** | 1.0.0 | **publish** |
| `@visualq/setup-agent` | 1.0.0 | 1.0.0 | optional (no code change) |

## Highlights

- `tracking_get_audit_event_proof` — audit → report link + variable table + `jiraMarkdown`
- `tracking_prove_jira_ticket` — JIRA repro → exact FRT → link plan → run tracking → same proof
- QA profile **43 tools** (`profiles.ts` synced with backend `MCP_QA_ALLOWLIST`)

## Publish

```bash
cd visualq-mcp
./scripts/prepare-release.sh
./scripts/publish-release.sh
```

Or manually:

```bash
cd packages/agent-skills && npm publish --access public
cd ../.. && npm publish --access public
```

## Git tags (optional)

```bash
git tag -a v1.0.2 -m "@visualq/mcp 1.0.2 — JIRA tracking proof tools"
git tag -a agent-skills-v1.0.1 -m "@visualq/agent-skills 1.0.1 — tracking-qa JIRA proof"
git push origin v1.0.2 agent-skills-v1.0.1
```

## After publish

1. Update Cursor `mcp.json`: `"args": ["-y", "@visualq/mcp@1.0.2"]`
2. Restart MCP server in Cursor
3. Test on BN project:

```json
{
  "tool": "tracking_get_audit_event_proof",
  "args": {
    "project": "bibliotheque-numerique-tv5monde",
    "auditId": "kMjqsx1KwzXH4YR9ZJzX-2026-07-08_10-12-00-541-brcl6w",
    "featureId": "SaVogZ6B5FYmgIUSuGAx",
    "eventColumnKey": "click.navigation::5"
  }
}
```
