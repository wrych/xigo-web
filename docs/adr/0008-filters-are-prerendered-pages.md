# 0008. Filters are prerendered pages, not query strings

- **Status:** Accepted
- **Date:** 2026-11-06
- **Deciders:** Andy Moesch

## Context

ADR 0006 has the Work and Journal filters render on the server, answering
`?topic=<topic>`. Those pages show cover images. A server-rendered page that
shows an image needs Astro's image service at runtime, and with it the native
`sharp` library on the hosting — built on CI's Linux, run under Plesk's, and
untested there. Prerendered pages have their images made at build time.

Topics are a short, fixed list (`specs/content.md`), so every filtered list
is known at build time.

## Decision

Each filter is its **own prerendered page**: `/journal/topic/<topic>` and
`/work/topic/<topic>`. The filter links point there; they work without
JavaScript, like every page (R-WEB-1). This amends ADR 0006: no page renders
on the server for filtering. The server still answers requests that need it,
such as the permanent redirects from the old site (R-JOUR-5).

## Alternatives considered

- **Query strings on a server-rendered page** — needs `sharp` at runtime on
  the hosting, for no gain a visitor would notice.
- **Filtering in the browser** — fails R-WEB-1 without JavaScript.

## Consequences

- A filtered list has its own address that can be shared and cached.
- Adding a topic adds pages at the next build; nothing is computed per
  request.

## References

ADR 0006. R-WORK-2, R-JOUR-2, R-WEB-1, R-JOUR-5.
