#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VISUALQ="${VISUALQ_ROOT:-$ROOT/../visualq}"

echo "==> Export manifest from visualq"
(cd "$VISUALQ" && npm run mcp:export-manifest)

echo "==> @visualq/mcp: sync, test, build"
cd "$ROOT"
npm run sync-manifest
npm test
npm run build

echo "==> @visualq/setup-agent: test, build"
(cd "$ROOT/packages/setup-agent" && npm test && npm run build)

MCP_VERSION="$(node -p "require('$ROOT/package.json').version")"
SKILLS_VERSION="$(node -p "require('$ROOT/packages/agent-skills/package.json').version")"
SETUP_VERSION="$(node -p "require('$ROOT/packages/setup-agent/package.json').version")"

echo ""
echo "==> Dry-run tarballs"
(cd "$ROOT" && npm pack --dry-run 2>&1 | tail -3)
(cd "$ROOT/packages/agent-skills" && npm pack --dry-run 2>&1 | tail -3)
(cd "$ROOT/packages/setup-agent" && npm pack --dry-run 2>&1 | tail -3)

echo ""
echo "=========================================="
echo " Ready to publish (requires npm login)"
echo "=========================================="
echo ""
echo "  @visualq/agent-skills@${SKILLS_VERSION}  (publish first)"
echo "  @visualq/mcp@${MCP_VERSION}"
echo "  @visualq/setup-agent@${SETUP_VERSION}     (optional — dep range already allows skills 1.0.1)"
echo ""
echo "  ./scripts/publish-release.sh"
echo ""
echo "After publish, pin Cursor mcp.json:"
echo '  "args": ["-y", "@visualq/mcp@'"${MCP_VERSION}"'"]'
echo ""
echo "Requires visualq backend on Vercel with tracking proof invoke handlers."
