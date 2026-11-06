How to work in this repository. Read this first; it is short on purpose.

- **What this is** — xigo-web: the website of xigo at xigo.ch. A home page, a
  journal, our work, and who we are. xigo supports events, communities,
  non-profits and foundations, pro bono and in the open.
- **The rules** — the xigo base constitution, shipped by the
  [xigOS](https://github.com/wrych/xigOS) plugin, extended by
  [`docs/constitution.md`](docs/constitution.md). Where they differ, the
  stricter rule wins.
- **Why it is like this** — [`docs/adr/`](docs/adr/README.md).

## Repo map

```
specs/
  requirements.md   numbered requirements (R-*) every change cites
  content.md        the shape of a post and a project file
docs/
  constitution.md   what this project adds to the xigo base rules
  adr/              decisions about xigo-web
src/                the Astro site (ADR 0006)
  layouts/          the page frame: navigation and footer
  pages/            one file per address
  styles/           design tokens and base styles
tests/              node:test, against the built site and its server
deploy/server/      the deploy script a maintainer installs on the server (ADR 0004)
scripts/package.sh  the `webserver` target: one archive for the server
scripts/deploy-is-current.sh  whether a CI run's commit is still main's head
docs/deploy.md      how a commit reaches staging and production
```

## Commands

|                  |                                                                |
| ---------------- | -------------------------------------------------------------- |
| `npm run dev`    | the site with live reload on :4321                             |
| `npm run build`  | builds the standalone Node server into `dist/`                 |
| `npm start`      | runs the built server (`HOST`, `PORT`)                         |
| `npm test`       | builds, starts the server, checks it; 80% coverage floor       |
| `npm run format` | Prettier, including `.astro` files                             |
| `npm run review` | the xigOS reviewer on the branch, as the pre-push hook runs it |

## How a change happens

1. **Find what it serves** — a requirement, an issue, or an ADR. No requirement
   covers it? The spec changes first, in its own commit.
2. **Check for a decision.** Major and not yet decided? Write the ADR first.
3. **Branch**, one change per branch, named `type/short-topic` with the
   Conventional Commit type of the change. A branch handed to you under another
   name is renamed before it is pushed.
4. **Write the test with the change**, same commit.
5. **Open a PR** citing what it serves. Squash-merge.

A new post or project page is a change like any other: its own branch and pull
request, so it is previewed and reviewed before it is published.

### Before you push

`npm install` sets up the git hooks; in a cloud session the SessionStart hook
runs it. Commit messages are checked by commitlint and staged files are
formatted. The pre-push hook runs the format check, the tests, and then the
**xigOS review gate** (`npx xigos-review --pre-push`), pinned to a commit of
xigOS in `package.json`. A finding at the threshold blocks the push: fix it, or
— if the reviewer is wrong — say why in the PR. **Agents never use
`--no-verify`.**

The project settings enable the xigOS plugin, so every session starts with the
base rules in view and can call the reviewer as `xigos:reviewer`.

### Merging

| The change                                                     | Merged by                         |
| -------------------------------------------------------------- | --------------------------------- |
| Fix, refactor, test, CI or tooling, docs                       | the agent, by enabling auto-merge |
| A feature for a spec item the maintainers have discussed       | the agent, by enabling auto-merge |
| An ADR recording a decision the maintainers already made       | the agent, by enabling auto-merge |
| A post, a project page, or any text published under our name   | a maintainer                      |
| A decision not yet made: new requirement, ADR choosing options | a maintainer                      |
| Anything touching deployment secrets, or loosening a check     | a maintainer                      |
| A change to this rule                                          | a maintainer                      |

Production changes only by promoting what staging runs, approved by a
maintainer (ADR 0004). Maintainers: Ivo Pejakovic, Andy Moesch.

## Improving the harness

Anything any xigo project would want — a rule, a reviewer, a hook — is proposed
in xigOS, not only here. What only xigo-web needs stays here.

## Working with a stale assumption

If the code and `specs/` disagree, the spec wins and the code is the bug —
unless the spec is wrong, in which case fix the spec first and say so. Never
silently widen scope to resolve a contradiction; ask.
