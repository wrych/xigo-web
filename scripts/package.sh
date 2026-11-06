#!/usr/bin/env bash
# The `webserver` target (ADR 0002): the built server with its production
# dependencies, as one archive the deploy script accepts (ADR 0004).
set -euo pipefail

archive="${1:?usage: scripts/package.sh <archive.tgz>}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

npm run build --silent
mkdir "$work/app"
cp -R dist package.json package-lock.json "$work/app/"
(cd "$work/app" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --silent)
find "$work/app/node_modules" -type d -name .bin -prune -exec rm -rf {} +

links="$(find "$work/app" -type l)"
if [ -n "$links" ]; then
  echo "package: the server refuses links, and these remain:" >&2
  echo "$links" >&2
  exit 1
fi

tar -czf "$archive" -C "$work/app" .
