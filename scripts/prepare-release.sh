#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VISUALQ="${VISUALQ_ROOT:-$ROOT/../visualq}"

echo "==> Export manifest from visualq"
(cd "$VISUALQ" && npm run mcp:export-manifest)

echo "==> visualq-mcp: sync, test, build"
cd "$ROOT"
npm run sync-manifest
npm test
npm run build

echo "==> Ready to publish @visualq/mcp@$(node -p "require('./package.json').version")"
echo "    npm publish --access public"
echo "    cd packages/agent-skills && npm publish --access public  # if skills changed"
