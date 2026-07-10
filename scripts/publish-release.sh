#!/usr/bin/env bash
# Publish VisualQ MCP packages to npm. Run ./scripts/prepare-release.sh first.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! npm whoami >/dev/null 2>&1; then
  echo "Error: not logged in to npm. Run: npm login"
  exit 1
fi

SKILLS_VERSION="$(node -p "require('$ROOT/packages/agent-skills/package.json').version")"
MCP_VERSION="$(node -p "require('$ROOT/package.json').version")"

echo "==> Publishing @visualq/agent-skills@${SKILLS_VERSION}"
(cd "$ROOT/packages/agent-skills" && npm publish --access public)

echo "==> Publishing @visualq/mcp@${MCP_VERSION}"
(cd "$ROOT" && npm publish --access public)

echo ""
echo "Done. Verify:"
echo "  npm view @visualq/mcp version"
echo "  npm view @visualq/agent-skills version"
echo ""
echo "Restart Cursor MCP server after updating mcp.json to @visualq/mcp@${MCP_VERSION}"
