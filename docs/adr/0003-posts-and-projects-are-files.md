# 0003. Posts and project pages are files in the repository

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Andy Moesch

## Context

The site has a journal and a portfolio. Their content could live in a database,
behind an admin interface, or as files in git. The people writing are the two
maintainers, often together with an agent. The site stores no personal data
(constitution §C).

## Decision

**Every post and project page is a Markdown file with front matter**, in the
repository, next to the images it uses. The app renders them.

- A new post is a pull request: previewed on staging, reviewed, merged by a
  maintainer, then promoted.
- Images are committed beside the post; the build makes resized and compressed
  versions.
- **Large media** — video, 3D models from Blender — stays out of git. Where it
  lives is decided when the first one exists.

## Alternatives considered

- **A database with an admin interface** — we would build, secure and back up a
  CMS, and posts would bypass review and history.
- **An agent writing into the production database** — no review, no preview,
  no history.
- **A git-based CMS** (Decap, TinaCMS) — a browser editor that commits to git.
  Not needed while both maintainers work through pull requests; can be added
  on top later without changing this decision.

## Consequences

- Publishing is a pull request; nothing appears on the site without review.
- The repository is the backup, and moving host means moving the repository.
- Content is open in the same place as the code, under CC BY (ADR 0005).
- Writing requires git or an agent; someone without either needs the CMS above.

## References

Constitution §A and §C.
