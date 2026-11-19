# 0009. A contact form that sends a mail and stores nothing

- **Status:** Accepted
- **Date:** 2026-11-19
- **Deciders:** Andy Moesch

## Context

The site's only way to reach us is a `mailto:` link to `info@xigo.ch`
(R-HOME-5). A link depends on the visitor having a mail program set up, which
many on a phone or a shared computer do not, and it gives them no prompt for
what to tell us. We want a contact page with a form.

The constitution forbids "forms that store what people type" and says the site
"collects no personal data" (§C). A form takes a name, an address and a message:
personal data, even if we keep none of it. So it needs this ADR.

The site is prerendered (ADR 0006), but it already runs as a Node server
(ADR 0002), so one page can answer a POST without a new host. The hosting
offers SMTP for xigo.ch.

## Decision

- **`/contact` is a form**: name, email, organisation (optional) and message.
  It is the one page rendered on request; every other page stays prerendered.
- **What a visitor sends is mailed to `info@xigo.ch`, and nothing else
  happens to it.** It is not written to disk, a database or a log. The mail is
  sent over SMTP with the visitor's address as Reply-To, so we answer from our
  own inbox.
- **It works without JavaScript.** A plain form POST; on a mistake the page
  answers with the visitor's text kept and each problem named beside its
  field; on success it redirects to `/contact/sent`.
- **Spam is kept out without tracking anyone**: a hidden field people never
  fill, and a site-wide limit on mails per hour, counted without addresses.
  No CAPTCHA and no third-party script (R-WEB-6).
- **The SMTP settings are environment variables** set on the server, never in
  the repository (`docs/deploy.md`). Without them the page still answers and
  offers the `mailto:` link, and the server logs which setting is missing.
- **Constitution §C is amended** to name this exception.

## Alternatives considered

- **Keep only the `mailto:` link** — collects nothing, but fails visitors
  without a mail program. The link stays on the page for those who prefer it.
- **A form service** (Formspree, Netlify Forms, …) — a third party sees every
  message and usually loads its script; against R-WEB-6.
- **Store messages in PostgreSQL** — we would hold personal data, with backups
  and deletion to look after, for no gain over an inbox.

## Consequences

- The site now handles personal data in transit. Every change to the contact
  code is reviewed against xigOS constitution §5: nothing a visitor typed may
  reach a log, an error message or a file.
- A maintainer sets the SMTP variables in Plesk for staging and production
  before this is deployed, or the page falls back to the `mailto:` link.
- Astro's standalone server has no start hook, so the mail settings are checked
  when the contact page first loads, not when the server starts (R-RUN-3).
- Staging sends real mails to `info@xigo.ch`; a test sent there says so.

## References

Constitution §C, R-WEB-6, R-HOME-5, R-CONTACT-\*. ADR 0002, ADR 0006.
