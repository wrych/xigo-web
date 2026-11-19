# Requirements

Each requirement has an id that changes cite. "The site" is the xigo website at
xigo.ch, as served to a visitor.

## Pages and navigation (R-NAV)

- **R-NAV-1** The site has five pages: Home (`/`), Work (`/work`), Journal
  (`/journal`), About (`/about`) and Contact (`/contact`). Each post has its
  own page (`/journal/<slug>`), so does each project (`/work/<slug>`), and so
  does each founder's profile (`/about/<slug>`).
- **R-NAV-2** Every page shows the wordmark, linking to Home, and links to Work,
  Journal, About and Contact. The current page is marked with
  `aria-current="page"`.
- **R-NAV-3** Every page ends with a footer: the wordmark, the links of R-NAV-2, a
  link to xigo's code on GitHub, and the line "Code MIT · Content CC BY 4.0 ·
  Logo © xigo" (ADR 0005).
- **R-NAV-4** An unknown path answers 404 with a page that links Home.

## Home (R-HOME)

- **R-HOME-1** Home opens with the statement that xigo builds tools and shares
  practices for events, communities, non-profits and foundations, free of
  charge and in the open, and links to Work and About.
- **R-HOME-2** Home names three focus areas: events and communities;
  organisations and foundations; free and open.
- **R-HOME-3** Home shows the featured project large and two more projects,
  each linking to its page.
- **R-HOME-4** Home shows the three newest posts, each linking to its page:
  the newest large, with its cover and excerpt, and the next two beside it,
  with their covers. Each shows date, title, topic, author and reading time. A
  post without a cover shows a line of its excerpt in the cover's place.
- **R-HOME-5** Home ends with a contact section whose address is
  `info@xigo.ch`, as a `mailto:` link, and which links to Contact.
- **R-HOME-6** Home's opening statement stands beside an illustration of a
  network, drawn in SVG and CSS at build time, so it needs no JavaScript. It is
  decorative: hidden from assistive technology, left out at phone width, and
  still under reduced motion (R-WEB-4).

## Work (R-WORK)

- **R-WORK-1** Work lists every published project, featured first, then newest
  first, each with title, year, summary, topics and image.
- **R-WORK-2** Work can be filtered by topic. Each filter is a link to its own
  page (`/work/topic/<topic>`) with the filtered list (ADR 0008).
- **R-WORK-3** A project page shows the project's text and, where it has one,
  a link to its source code and its license.
- **R-WORK-4** A project page may open with an animated scene in place of its
  image. The scene is drawn in SVG and CSS, so it needs no JavaScript; it has a
  text label, says that it is an illustration and not real data, and stands
  still under reduced motion (R-WEB-4). Its image stays the still used on Work.

## Journal (R-JOUR)

- **R-JOUR-1** Journal shows the featured post large, then every other post,
  newest first, with date, title, excerpt and topic.
- **R-JOUR-2** Journal can be filtered by topic, in the same way as R-WORK-2
  (`/journal/topic/<topic>`).
- **R-JOUR-3** A post page shows title, date, author, reading time and the
  post. A post first published elsewhere says where and when.
- **R-JOUR-4** The site publishes an RSS feed of all posts at `/feed.xml`,
  linked from every page's head and from Journal.
- **R-JOUR-5** The seven articles on the current xigo.ch move over with their
  original dates and authors, and their old addresses (`/post/<slug>/`)
  redirect to the new ones permanently. Images in them that are not ours are
  replaced by a link to their source until we have permission, and covers that
  are not ours are left out (constitution §A).

## About (R-ABOUT)

- **R-ABOUT-1** About says why xigo exists — to give back — and what it does,
  pro bono.
- **R-ABOUT-2** About shows xigo's working principles: free and for good;
  purpose and autonomy; simple and transparent.
- **R-ABOUT-3** About shows the two founders, Ivo Pejakovic and Andy Moesch,
  each with photo, role, a short bio and a link to their LinkedIn profile.
- **R-ABOUT-4** Each founder may have a profile page (`/about/<slug>`),
  linked from About: role, short bio, what they can help with, experience,
  methods and qualifications, tools and languages. A profile names no
  employer, client, organisation or colleague; it describes them in general
  terms. It shows a photo and a LinkedIn link only once there is one.

## Contact (R-CONTACT)

- **R-CONTACT-1** Contact is a form asking for name, email, organisation
  (optional) and message, beside the address `info@xigo.ch` as a `mailto:`
  link. It says that what is sent goes to `info@xigo.ch` and is kept nowhere
  else (ADR 0009).
- **R-CONTACT-2** Sending the form mails its contents to `info@xigo.ch`, with
  the visitor's address as Reply-To, and then shows a page thanking them
  (`/contact/sent`).
- **R-CONTACT-3** A form with a missing or invalid field is not sent: the page
  answers with what the visitor typed kept, a summary of the problems linking
  to each field, and each problem named beside its field.
- **R-CONTACT-4** Spam is held back without a CAPTCHA or third-party script: a
  form with the hidden trap field filled is answered as sent and mails
  nothing, and no more than a configured number of mails leave per hour.
- **R-CONTACT-5** Nothing a visitor typed is stored or logged. When a mail
  cannot be sent, the page says so, keeps their text and offers the `mailto:`
  link.

## Content (R-CONT)

- **R-CONT-1** Every post and project is a Markdown file with front matter
  (`specs/content.md`); adding one adds it everywhere it is listed, without a
  code change.
- **R-CONT-2** A file whose front matter is missing a required field, or has
  one of the wrong type, fails the build and names the file and the field.
- **R-CONT-3** A post or project with `draft: true` is shown on staging and
  never on production.
- **R-CONT-4** Images are served resized to the size they are shown at, in a
  modern format with a fallback, and with their width and height set.
- **R-CONT-5** Every image has alt text from its front matter or its Markdown;
  a missing one fails the build.

## The web page (R-WEB)

- **R-WEB-1** Every page and every listed requirement above works without
  JavaScript.
- **R-WEB-2** The site meets WCAG 2.2 AA. Text contrast is at least 4.5:1.
- **R-WEB-3** No page scrolls horizontally at 360 px wide; navigation wraps.
- **R-WEB-4** Every animation stops under `prefers-reduced-motion: reduce`.
- **R-WEB-5** Every page has its own title and description, and an Open Graph
  image for sharing.
- **R-WEB-6** The site sets no cookie, loads no third-party script, and
  collects no personal data except what a visitor sends with the contact form
  (constitution §C, ADR 0009). Fonts are served by the site.
- **R-WEB-7** Every page names the site's icon: the wordmark's x and its gold
  dot, as SVG, with `/favicon.ico` and an Apple touch icon for browsers that
  do not take SVG.

## 3D (R-3D)

- **R-3D-1** A 3D scene enhances a page that is complete without it: a still
  image stands in place until the scene is ready, and stays when WebGL is
  missing, JavaScript is off, or reduced motion is set.
- **R-3D-2** A 3D scene loads only once it is near the viewport, and does not
  delay the page's text from showing.

## Running and deploying (R-RUN)

- **R-RUN-1** One command starts the site locally in a container, with content
  reloading on change (ADR 0002).
- **R-RUN-2** The `webserver` build produces a package that starts under Plesk's
  Passenger with Node 26, configured only by environment variables (ADR 0002).
- **R-RUN-3** Configuration is validated on start; a missing or invalid value
  stops the start with a message naming it. The contact form's mail settings
  are validated when Contact first loads; a missing or invalid one is logged
  by name and the form is replaced by the `mailto:` link (ADR 0009).
- **R-RUN-4** A merge to `main` with green CI deploys to staging; production
  changes only by promoting the release staging runs (ADR 0004).
