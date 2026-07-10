# Release @visualq/mcp 1.0.3

**Date:** 2026-07-10  
**Backend:** visualq — deploy semantic intent resolver before production use

## Packages

| Package | Version | Action |
|---------|---------|--------|
| `@visualq/mcp` | **1.0.3** | publish after visualq deploy |
| `@visualq/agent-skills` | **1.0.2** | publish (tracking-qa intent workflow) |

## Highlights

- JIRA tracking proof routing in MCP `server.instructions` and `jira-tracking-proof` prompt
- Semantic intent workflow documented in `tracking-qa` skill
- Tool manifest/description aligned with backend `tracking_prove_jira_ticket` intent-first flow

## Publish

```bash
cd visualq-mcp
npm run build && npm test
./scripts/prepare-release.sh   # if scripts exist
npm publish --access public
cd packages/agent-skills && npm publish --access public
```
