# 0010. Generate journal covers from the site's own visual language

- **Status:** Accepted
- **Date:** 2026-11-19
- **Deciders:** the maintainers, who asked for this art direction (design review, item 01)

## Context

The journal's covers came with the seven articles that moved over from the old
xigo.ch (R-JOUR-5). Four posts had one, three had none. The four are four
different visual worlds — a saturated illustration, ASCII art on black, beige
line art, a stock-like sunset with a headline baked into the picture — and
none shares the site's palette, type or framing. Since the home page shows the
newest posts with their covers (R-HOME-4), they are the loudest thing on the
site, and the posts without one need a stand-in.

The constitution (§A) publishes an image we did not make only with permission.
For several of these covers we cannot say where they come from.

The site already draws pictures of networks in SVG at build time, seeded so
every build draws the same one: the scene on a project page (R-WORK-4) and the
network beside Home's statement (R-HOME-6).

## Decision

**Every post's cover is generated at build time** from the site's own visual
language: dots for people, thin lines between them, gold for what matters, a
warm glow on the dark ground. The post's slug seeds it, so each cover is its
own and the same on every build; the post's topic chooses its composition, one
for each topic. It is inline SVG, so it needs no JavaScript and no request, and
it is decorative: the post's title stands beside it.

A post no longer names a cover in its front matter. The old cover files stay
in the repository, unused, until their authors decide whether to place them
inside their posts.

## Alternatives considered

- **Keep the supplied covers** — four styles that fight the site and each
  other, three posts without one, and open questions about permission.
- **One photographic treatment** (a duotone from ground to gold, one crop,
  one grain) — makes photos agree, but every post still needs a photo we may
  publish, and someone has to make each one.
- **No covers** — a calm list, but the home page loses the picture that leads
  it, and the journal looks unlike Work.

## Consequences

- One art direction for every post, now and for every post to come; adding a
  post adds its cover without anyone making an image.
- No image permission to clear for a cover, ever.
- A cover says what a post is about only through its topic; two posts on the
  same topic look related, by design.
- A post cannot have a cover of its own. An author who wants a picture puts it
  inside the post, where R-CONT-4 and R-CONT-5 apply.
- The compositions are code (`src/covers.ts`): changing one changes every
  cover on that topic.

## References

R-HOME-4, R-JOUR-1, R-JOUR-3, R-JOUR-6, R-WORK-4, R-HOME-6. Constitution §A.
