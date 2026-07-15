#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# bun.lock pins every package to Lovable's private registry mirror
# (*-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache), which this
# environment's network policy blocks. Install without the lockfile so
# bun resolves against the public npm registry instead, then restore
# the original lockfile untouched so Lovable's own sandbox keeps using
# its pinned resolution.
lock_backup="$(mktemp)"
cp bun.lock "$lock_backup"
trap 'mv -f "$lock_backup" bun.lock' EXIT
rm -f bun.lock
bun install
