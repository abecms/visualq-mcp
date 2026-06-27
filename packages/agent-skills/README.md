# @visualq/agent-skills

Official VisualQ agent skills and Cursor rules for QA workflows.

## Contents

| Skill | Purpose |
|-------|---------|
| `visualq-agent` | Full workflows — PR gate, onboarding, Jira QA |
| `vrt-qa` | Visual regression testing |
| `frt-qa` | Functional Gherkin journeys |
| `tracking-qa` | Analytics / tracking audits |

Plus rule `visualq-qa-agent.mdc` for MCP conventions.

## Install

```bash
# Copy skills to Cursor user directory
npx @visualq/setup-agent cursor --key vq_org_live_…

# Or sync skills only
npm install @visualq/agent-skills
node node_modules/@visualq/agent-skills/scripts/sync-skills.mjs
```

Requires `@visualq/mcp` configured separately (see [visualq.ai MCP setup](https://visualq.ai/docs/integrations/mcp)).
