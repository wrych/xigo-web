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
`restrict,command="/bin/bash /xigo-web/bin/deploy"`, which forces one script
and allows no shell, forwarding or file copy. The script is started through
`bash` because the hosting kills files started directly from the home folder. The script accepts exactly four requests —
`receive <sha>`, `promote <sha>`, `running <target>`, `releases` — checks that a
SHA is 40 hex characters, and writes only inside `/xigo-web`,
`/staging.xigo.ch` and `/xigo.ch`. An upload must be a gzipped tar under
the size limit (300 MB, or `max_bytes` in a maintainer's `deploy.conf` beside
the script) with no links in it and a server entry; anything else is refused and
staging stays as it was. A maintainer installs the script by hand; a deploy
never replaces it, so a leaked key cannot change the rules the script enforces.

**Layout.** Releases live outside every web root, in `/xigo-web/releases/<sha>`.
Each app folder holds a relative link `current` to its release and Passenger's
startup file `app.js`, which imports `current/dist/server/entry.mjs`. Switching
replaces the link in one rename and touches `tmp/restart.txt`. The last five
releases are kept, and never one a target runs. A
release the server already has is never replaced, only switched to. Receiving
and promoting take a lock (an atomic `mkdir`; the chroot has no `flock`). A
second run is refused rather than queued. A run that is cut off releases it; a
lock left behind anyway is removed by a maintainer, never taken over by a run.

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

- **A leaked key can still run any code as the hosting user**, which owns
  xigo's other sites: the script cannot tell a real build from a forged one.
  ADR 0007 accepts that risk and says how the key is guarded.
- The deploy script runs in a minimal chroot (no `cat`, `find`, `readlink`,
  `dirname` or `node`), so it uses only `bash` built-ins and the tools the
  chroot has, and its tests run it against a server tree built the same way.
- Promotion and rollback are instant, because nothing is copied over the
  network.
- Proposed until the script exists and has run once against staging.

## References

Rebel Match ADR 0025. ADR 0007. Constitution §D.
