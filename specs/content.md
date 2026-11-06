# Content

The shape of the files that make the site's content (ADR 0003, R-CONT-1).

## Where it lives

```
content/
  journal/<slug>/index.md     a post, and the images it uses beside it
  work/<slug>/index.md        a project, and its images
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
cover: ./cover.png # optional, beside the post
coverAlt: "voice in a complex world" # required with a cover
featured: false # at most one post is featured
draft: false # R-CONT-3, not yet supported: until it is, a post with it fails the build
original: # optional: where it was first published
  site: LinkedIn
  date: 2024-11-26
  url: https://www.linkedin.com/pulse/…
---
```

The excerpt is a sentence from the post itself, not a new one.

## A project

```yaml
---
title: Rebel Match
year: 2026
summary: "Peer matching for the Corporate Rebels network: bring an organizational challenge, get matched in a conference break."
topics: [events, communities, open-source] # from: events, communities, organisations, open-source
image: cover.jpg
imageAlt: "…"
source: https://github.com/wrych/rebel-match # optional
license: MIT # optional
featured: true # at most one project is featured
draft: false
---
```

## The copy

The page copy is in the design canvas. Facts on the site come from these
sources only (constitution §A):

| Fact                                        | Source                                                |
| ------------------------------------------- | ----------------------------------------------------- |
| Founders, bios, LinkedIn profiles           | xigo.ch "about xigo", November 2026                   |
| Contact address `info@xigo.ch`              | xigo.ch "services"                                    |
| Values                                      | xigo.ch home page                                     |
| The seven articles, their dates and authors | xigo.ch "articles", and the authors WordPress records |
| Rebel Match                                 | its repository's README and license                   |
| Living agreements, consent workshops        | xigo.ch "services"                                    |
