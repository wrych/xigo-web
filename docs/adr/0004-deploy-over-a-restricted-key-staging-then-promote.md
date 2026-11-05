# 0004. Deploy over a restricted SSH key: staging on merge, promote to production

- **Status:** Proposed
- **Date:** 2026-11-05
- **Deciders:** Andy Moesch

## Context

The hosting (ADR 0002) offers SSH on a non-standard port, with key login. SSH
access is chrooted per Plesk **subscription**, not per site: the same system
user and home folder hold xigo-web and xigo's other websites. A plain deploy
key would reach all of them. The chroot is minimal: `bash` built-ins, `tar`,
`rsync`, `scp`, `touch`, `ln`, but no `cat`.

Rebel Match deploys every merge to staging and promotes to production only
what staging ran, after a maintainer approves (Rebel Match ADR 0025). We keep
that.

## Decision

**Two sites on the server**: `staging.xigo.ch` and `xigo.ch`, each its own Node
app in Plesk.

**Build once.** CI builds the `webserver` package per commit, named by its git
SHA. Production never builds.

| Step       | Trigger                                   | What happens                                                                 |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| staging    | merge to `main`, CI green                 | the package is uploaded into a new release folder and staging switches to it |
| production | `promote` workflow, a maintainer approves | the server switches production to the release staging runs; nothing uploads  |
| rollback   | `promote` with an earlier SHA             | production switches back to a release still on the server                    |

**The key can only deploy.** Its line in `authorized_keys` carries
`restrict,command="…"`, which forces one script and allows no shell,
forwarding or file copy. The script accepts exactly three requests —
receive a staging release, promote a SHA, list releases — checks that a SHA is
40 hex characters, writes only inside xigo-web's folders, and keeps the last
few releases for rollback.

**GitHub**: environments `staging` (no approval) and `production` (a maintainer
approves) each hold `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` as secrets, and
`DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER` as variables.

## Alternatives considered

- **Plesk's Git extension, building on the server** — no key in GitHub, but the
  server builds, a failed install can take the site down, and there is no
  promote step.
- **A plain deploy key** — reaches the other websites in the subscription.
- **A separate Plesk subscription for xigo-web** — cleaner isolation; can be
  added later and does not change this flow.
- **Per-pull-request previews**, as in Rebel Match — awkward on Plesk; the
  container target serves that locally.

## Consequences

- A leaked key can at most deploy a version of xigo-web; it cannot read or
  change the other sites.
- The deploy script runs in a minimal chroot, so it uses only `bash` built-ins
  and the tools listed above, and is tested against that.
- Promotion and rollback are instant, because nothing is copied over the
  network.
- Proposed until the script exists and has run once against staging.

## References

Rebel Match ADR 0025. Constitution §D.
