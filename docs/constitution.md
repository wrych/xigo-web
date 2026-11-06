# xigo-web — Constitution

This file **extends** the xigo base constitution (`docs/constitution.md` in
[xigOS](https://github.com/wrych/xigOS)). Every rule there applies here. The
sections below add what only this website needs. Where the two differ, the
stricter rule wins.

**Changing this file requires an ADR.**

---

## A. Content

- **Posts and project pages are files in this repository** (ADR 0003). They
  are reviewed and merged like code.
- **Our own words and images are CC BY 4.0** (ADR 0005). Anything we did not
  make — a partner's logo, someone else's photo, a quote — is published only
  with permission, and marked as not covered by our license.
- **People in a photo have agreed to be shown.** A CC license covers copyright,
  not a person's right to their own image.
- **No invented facts.** A number, a client, a quote or a date on the site is
  true and can be traced to a source. Unknown is better than made up.

## B. The web page

- **Every page works without JavaScript**, except the 3D scenes, which enhance
  a page that is already complete. A 3D scene has a still fallback.
- **Accessible: WCAG 2.2 AA.** Real links and buttons, text contrast of at least
  4.5:1, and `prefers-reduced-motion` respected by every animation.
- **Works at phone width.** No horizontal scroll at 360 px.
- **Fast.** Images are served resized and compressed; nothing large loads
  before it is needed.

## C. Privacy

- **The site collects no personal data.** No accounts, no forms that store what
  people type, no third-party trackers, and no cookie that needs consent.
  Adding any of these needs an ADR first.

## D. Deployment

- **Production runs only what staging ran.** It is never built or deployed
  directly (ADR 0004).
- **The deploy key can do one thing:** deploy xigo-web. It never gives a shell,
  and it never reaches the other sites on the same server.

---

_Adopted 2026-11-05. Amendments require an ADR._
