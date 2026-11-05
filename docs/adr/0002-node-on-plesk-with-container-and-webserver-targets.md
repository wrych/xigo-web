# 0002. Run on Node 26 under Plesk, with a container and a webserver target

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Andy Moesch

## Context

xigo works pro bono, so the website should cost as little as possible to run.
xigo already rents shared hosting at firestorm.ch (plan FireLarge) for other
sites. It runs Node.js 26.13 through Plesk, which starts Node apps with Phusion
Passenger, and offers SSH, MySQL and PostgreSQL. Docker is not available there.

Locally, and in CI, we want the reproducible setup Rebel Match has: one command
starts everything in a container.

## Decision

xigo-web is **one Node.js application** with **two build targets**:

| Target      | Used for         | What it produces                                                           |
| ----------- | ---------------- | -------------------------------------------------------------------------- |
| `container` | local, CI        | a container image, run with compose                                        |
| `webserver` | staging and prod | a compiled `dist/` with production dependencies and a Passenger start file |

- **The code is the same for both.** What differs — port, base URL, file
  locations — is configuration read at start, never a branch in the code (xigo
  base constitution §7).
- **Node 26.13 is pinned** in `.nvmrc`, `package.json` `engines`, the container
  base image and CI, so no environment runs a different version.
- **No database for now.** Content is files (ADR 0003). If a feature needs
  stored data, PostgreSQL is the choice, in its own ADR.

## Alternatives considered

- **A static site on free hosting** (GitHub Pages, Cloudflare Pages) — cheapest,
  but xigo already pays for the hosting, and a Node app leaves room for event
  and community features without moving later.
- **Containers in production** — not available on the hosting; a container
  platform would cost more each month.
- **Build on the server** — the server would need build tools, and a failed
  install could take the live site down. CI builds instead (ADR 0004).

## Consequences

- Local and production differ in how the app is started, so the `webserver`
  package is started in CI the way Passenger starts it, before it ships.
- The site shares a server with other xigo sites; deployment must not reach
  them (ADR 0004).
- Moving to another host means a new deploy step, not new code.

## References

xigOS constitution §7. firestorm.ch FireLarge plan.
