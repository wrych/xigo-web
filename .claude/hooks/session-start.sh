#!/bin/bash
# A cloud session starts from a fresh clone; installing runs `prepare`, which
# sets up the git hooks, so the xigOS review gate runs on every push.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund >&2
