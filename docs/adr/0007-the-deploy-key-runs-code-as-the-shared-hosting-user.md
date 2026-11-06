# 0007. Accept that what the deploy key deploys runs as the shared hosting user

- **Status:** Accepted
- **Date:** 2026-11-06
- **Deciders:** Andy Moesch

## Context

Constitution §D said the deploy key "never reaches the other sites on the same
server". xigo-web shares a Plesk subscription with xigo's other websites: one
system user owns them all. ADR 0004 restricts the key to one script — no
shell, no file copy — but deploying means running new code, and that code runs
as that user. The script cannot tell a real build from a forged one. So a
leaked key can change the other sites, and the rule cannot hold.

Two changes would make it hold: xigo-web in its own subscription, with its own
user, or releases signed by CI and checked on the server. The first depends on
the hosting plan. The second only helps when the deploy key leaks without the
signing key, since both would live in GitHub.

## Decision

**We accept the risk, and guard the key like the hosting user's password.**

- The key lives only in GitHub's `staging` and `production` environments,
  which only `main` may deploy from, and on no laptop once set up.
- `main` takes changes only through pull requests with CI green; production
  changes only through a maintainer's approval (ADR 0004).
- Constitution §D says what the key can and cannot do, without the claim that
  it never reaches the other sites.

## Alternatives considered

- **Its own Plesk subscription** — the stronger fix; revisit if the hosting
  plan allows it at no extra cost.
- **Signed releases** — protects only against a key leaked without the signing
  key; more moving parts on a server with no `node` in its shell.

## Consequences

- Someone who gets the key, or can merge to `main`, can change every site in
  the subscription. A leaked key is rotated at once: a new key pair, the old
  line removed from `authorized_keys`, the GitHub secrets replaced.
- Moving xigo-web to its own subscription later needs no code change, only a
  new app path in the deploy script.

## References

ADR 0004. Constitution §D.
