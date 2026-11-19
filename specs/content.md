# Content

The shape of the files that make the site's content (ADR 0003, R-CONT-1).

## Where it lives

```
content/
  journal/<slug>/index.md     a post, and the images it uses beside it
  work/<slug>/index.md        a project, and its images
  people/<slug>/index.md      a founder's profile (R-ABOUT-4)
```

The folder name is the slug and the address (`/journal/<slug>`).

## A post

```yaml
---
title: "Navigating Change: Finding your Voice in a Complex World"
date: 2024-12-03
author: Ivo Pejakovic # or Andy Moesch
topic: change # one of: news, events, self-organization, decisions, change, trust, software
excerpt: "In today’s ever-changing and complex world, adaptability and flexibility are crucial."
featured: false # at most one post is featured
draft: false # R-CONT-3, not yet supported: until it is, a post with it fails the build
original: # optional: where it was first published
  site: LinkedIn
  date: 2024-11-26
  url: https://www.linkedin.com/pulse/…
---
```

The excerpt is a sentence from the post itself, not a new one.

A post names no cover: its cover is drawn from its slug and topic (R-JOUR-6,
ADR 0010). An image the author wants to show goes inside the post.

## A project

```yaml
---
title: Rebel Match
year: 2026
summary: "Peer matching for the Corporate Rebels network: bring an organizational challenge, get matched in a conference break."
topics: [events, communities, open-source] # from: events, communities, organisations, open-source
image: ./cover.png # beside the project; the still for Work and Home: the product, not xigo's network (R-WORK-5)
imageAlt: "…"
opening: # optional: the image the page opens with, instead of the image (R-WORK-5)
  image: ./screens.png
  alt: "…"
  caption: "…" # optional
scene: network # optional: an animated scene within the text (R-WORK-4)
sceneAfter: what-it-leads-to # optional, with scene: the section (its heading's id) the scene ends; without it, the scene follows the text
figures: # optional: images shown after the text, beside the project
  - image: ./more.png
    alt: "…"
    caption: "…" # optional
launch: # optional: where and when it launched, for the facts strip (R-WORK-5)
  date: 2026-11-08
  event: Corporate Rebels summit
  stage: beta # optional
team: # optional: who made it and their part, for the facts strip (R-WORK-5)
  - name: Pascal Dulex
    organisation: Transformation Architects # optional
    part: Idea, design and community
source: https://github.com/wrych/rebel-match # optional
license: MIT # optional
featured: true # at most one project is featured
draft: false # R-CONT-3, not yet supported: until it is, a project with it fails the build
---
```

The scenes are listed in `src/work.ts`; `network` is the one there is. The facts
strip shows only what these fields hold; a fact the project's sources do not
give is left out, not guessed (constitution §A).

## A profile

```yaml
---
name: Ivo Pejakovic # or Andy Moesch
role: "Co-founder of xigo, responsible for networking and content, plus part of the hands-on work."
linkedin: https://www.linkedin.com/in/… # optional, once confirmed
---
```

The body is Markdown with these sections, in this order: Short bio, What I can
help with, Experience, Methods and qualifications, Tools and technology,
Languages. It names no employer, client, organisation or colleague.

## The copy

The page copy is in the design canvas. Facts on the site come from these
sources only (constitution §A):

| Fact                                         | Source                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Founders, bios, LinkedIn profiles            | xigo.ch "about xigo", November 2026                                                        |
| Contact address `info@xigo.ch`               | xigo.ch "services"                                                                         |
| Values                                       | xigo.ch home page                                                                          |
| The seven articles, their dates and authors  | xigo.ch "articles", and the authors WordPress records                                      |
| Rebel Match                                  | its repository's README and license                                                        |
| Rebel Match in production, Pascal's homepage | the maintainers, November 2026                                                             |
| Living agreements, consent workshops         | xigo.ch "services"                                                                         |
| Ivo's profile                                | his master file, exported and approved by him, Nov 2026                                    |
| Andy's profile                               | his CVs, letters and diplomas (Feb 2026); his own word on role and volunteering (Nov 2026) |
