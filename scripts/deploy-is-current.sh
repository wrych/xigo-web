#!/usr/bin/env bash
# Whether a staging deploy's commit is still main's head, written as
# `current=true|false` to GITHUB_OUTPUT. CI runs finish out of order and
# re-runs come late, so without this an older commit could replace a newer
# one on staging (as in Rebel Match, ADR 0025).
#
# Reads: REPO (owner/name), SHA (the commit built); gh reads GH_TOKEN.
set -euo pipefail

: "${REPO:?}" "${SHA:?}" "${GITHUB_OUTPUT:?}"

head="$(gh api "repos/$REPO/git/ref/heads/main" --jq .object.sha)"
if [[ "$head" == "$SHA" ]]; then
  echo "current=true" >>"$GITHUB_OUTPUT"
else
  echo "current=false" >>"$GITHUB_OUTPUT"
  echo "::notice::Not deploying $SHA: main is at $head."
fi
