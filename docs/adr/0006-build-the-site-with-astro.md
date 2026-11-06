# 0006. Build the site with Astro

- **Status:** Accepted, amended by 0008
- **Date:** 2026-11-06
- **Deciders:** Andy Moesch

## Context

The site is mostly content: posts and projects as Markdown files (ADR 0003),
four pages, and 3D scenes that only enhance a page (R-3D-1). Pages must work
without JavaScript (R-WEB-1), images must be resized and converted (R-CONT-4),
a content file with a missing field must fail the build (R-CONT-2), and the
Work and Journal filters must work as links the server answers (R-WORK-2,
R-JOUR-2). It runs as a Node app under Plesk's Passenger (ADR 0002).

## Decision

The site is built with **Astro**, with the **`@astrojs/node` adapter in
standalone mode**.

- Pages are rendered to HTML on the server or at build time; they ship no
  JavaScript unless a component asks for it. A three.js scene is such a
  component, loaded only when it nears the viewport.
- Posts and projects are **content collections** with a schema; the schema is
  `specs/content.md` in code.
- Images go through Astro's image pipeline.
- Pages are prerendered by default. Only a page that needs a request — the
  filters — renders on the server.
- Fonts are self-hosted from the `@fontsource` packages (R-WEB-6).

## Alternatives considered

- **Express with our own Markdown rendering**, as Rebel Match's server — every
  piece above (schemas, images, partial hydration) would be code we write and
  maintain.
- **A fully static build** — cheapest to host, but the filters as links need a
  server, and the hosting runs Node anyway.
- **Next.js or Nuxt** — built around a client framework; heavier than a
  content site needs, and JavaScript by default.

## Consequences

- One framework decides routing, rendering and the build; upgrades follow its
  releases.
- The standalone server is what Passenger starts in the `webserver` target and
  what the container runs.
- Tests check the built site — its HTML and its server's answers — rather than
  components in isolation.

## References

R-WEB-1, R-CONT-2, R-CONT-4, R-WORK-2, R-3D-1. ADR 0002, 0003.
