import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { readdirSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let origin;

function freePort() {
  return new Promise((resolve) => {
    const probe = createServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`${url} did not answer`);
}

function region(html, tag) {
  const start = html.indexOf(`<${tag}`);
  const end = html.indexOf(`</${tag}>`, start);
  assert.ok(start >= 0 && end > start, `no <${tag}> in the page`);
  return html.slice(start, end);
}

async function page(path) {
  const response = await fetch(`${origin}${path}`);
  return { status: response.status, html: await response.text() };
}

before(async () => {
  const build = spawnSync("npm", ["run", "build", "--silent"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  server = spawn("node", ["dist/server/entry.mjs"], {
    cwd: root,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "ignore",
  });
  await waitFor(origin);
});

after(() => server?.kill());

for (const path of ["/", "/work", "/journal", "/about"]) {
  test(`${path} links the wordmark home and every page (R-NAV-2)`, async () => {
    const { status, html } = await page(path);
    assert.equal(status, 200);
    const header = region(html, "header");
    for (const href of ["/", "/work", "/journal", "/about", "/#contact"]) {
      assert.match(header, new RegExp(`href="${href}"`));
    }
  });

  test(`${path} ends with the footer's links and license line (R-NAV-3)`, async () => {
    const { html } = await page(path);
    const footer = region(html, "footer");
    for (const href of ["/", "/work", "/journal", "/about", "/#contact"]) {
      assert.match(footer, new RegExp(`href="${href}"`));
    }
    assert.match(footer, /href="https:\/\/github\.com\/wrych"/);
    assert.match(footer, /Code MIT · Content CC BY 4\.0 · Logo © xigo/);
  });
}

for (const path of ["/", "/work", "/journal", "/about"]) {
  test(`${path} marks itself, and only itself, as current (R-NAV-2)`, async () => {
    const { html } = await page(path);
    const header = region(html, "header");
    const current = [...header.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
    assert.equal(current.length, 1);
    assert.match(current[0][0], new RegExp(`href="${path}"`));
  });
}

test("an unknown path answers 404 with a link home (R-NAV-4)", async () => {
  const { status, html } = await page("/no-such-page");
  assert.equal(status, 404);
  assert.match(region(html, "main"), /href="\/"/);
});

test("the contact section mails info@xigo.ch (R-HOME-5)", async () => {
  const { html } = await page("/");
  assert.match(html, /id="contact"[\s\S]*href="mailto:info@xigo\.ch"/);
});

test("pages ship no script and load nothing from another host (R-WEB-1, R-WEB-6)", async () => {
  for (const path of [
    "/",
    "/work",
    "/journal",
    "/about",
    "/journal/topic/software",
    "/journal/minesweeping-agile",
    "/about/ivo",
    "/work/rebel-match",
    "/about/andy",
  ]) {
    const { html } = await page(path);
    assert.doesNotMatch(html, /<script/);
    assert.doesNotMatch(html, /\ssrc="https?:\/\//);
    assert.doesNotMatch(html, /<link\b[^>]*href="https?:\/\//);
  }
});

const POSTS = readdirSync(new URL("../content/journal", import.meta.url));

const OLD_SLUGS = [
  "consent-decisions-simple-not-easy",
  "navigating-change-finding-your-voice-in-a-complex-world",
  "the-tensions-of-power-and-autonomy-in-self-organization-my-perspective",
  "why-i-love-self-managing-organizations-it-starts-with-you",
  "neuroscience-of-trust",
  "minesweeping-agile",
  "passionate-about-software",
];

const postLinks = (html) =>
  [...region(html, "main").matchAll(/href="\/journal\/([a-z0-9-]+)"/g)]
    .map((match) => match[1])
    .filter((slug) => slug !== "topic");

test("the journal leads with the featured post, then all others newest first (R-JOUR-1)", async () => {
  const { status, html } = await page("/journal");
  assert.equal(status, 200);
  const slugs = postLinks(html);
  assert.equal(slugs[0], "consent-decisions-simple-not-easy");
  assert.deepEqual([...new Set(slugs)].sort(), [...POSTS].sort());
  const dates = [
    ...region(html, "main").matchAll(/<time datetime="([0-9-]+)"/g),
  ].map((match) => match[1]);
  assert.deepEqual(dates.slice(1), [...dates.slice(1)].sort().reverse());
});

test("the lead post is called featured only when it is (R-JOUR-1)", async () => {
  const { html } = await page("/journal");
  assert.match(region(html, "main"), /<span class="dot"[^>]*>Featured<\/span>/);
});

test("a topic page lists only that topic, and marks its filter (R-JOUR-2)", async () => {
  const { status, html } = await page("/journal/topic/software");
  assert.equal(status, 200);
  assert.deepEqual(postLinks(html).sort(), [
    "minesweeping-agile",
    "passionate-about-software",
  ]);
  assert.match(
    html,
    /<a href="\/journal\/topic\/software" aria-current="page"/,
  );
});

test("a post shows its title, author, date, reading time and first publication (R-JOUR-3)", async () => {
  const { status, html } = await page("/journal/minesweeping-agile");
  assert.equal(status, 200);
  const main = region(html, "main");
  assert.match(main, /<h1[^>]*>Minesweeping Agile<\/h1>/);
  assert.match(main, /Andy Moesch · <time datetime="2024-11-15"/);
  assert.match(main, /\d+ min read/);
  assert.match(
    main,
    /First published on <a href="https:\/\/www\.linkedin\.com\/pulse\/minesweeping-agile-andy-moesch\/"[^>]*>LinkedIn<\/a>, 3 Feb 2021/,
  );
});

test("images that are not ours are links to their source, not copies (R-JOUR-5)", async () => {
  const { html } = await page("/journal/minesweeping-agile");
  const main = region(html, "main");
  assert.doesNotMatch(main, /wp-content/);
  assert.equal([...main.matchAll(/see it at its source/g)].length, 4);
});

test("covers come resized, as webp with a jpeg fallback, with alt text and size (R-CONT-4, R-CONT-5)", async () => {
  const { html } = await page(
    "/journal/navigating-change-finding-your-voice-in-a-complex-world",
  );
  const picture = /<picture\b[\s\S]*?<\/picture>/.exec(region(html, "main"))[0];
  const source = /<source[^>]*>/.exec(picture)[0];
  assert.match(source, /type="image\/webp"/);
  assert.match(source, /srcset="[^"]*480w[^"]*960w/);
  const img = /<img[^>]*>/.exec(picture)[0];
  assert.match(img, /src="\/_astro\/[^"]+\.jpg"/);
  assert.match(img, /alt="voice in a complex world"/);
  assert.match(img, /width="\d+" height="\d+"/);
});

test("the feed lists every post with its address on xigo.ch and its author (R-JOUR-4)", async () => {
  const { status, html } = await page("/feed.xml");
  assert.equal(status, 200);
  assert.equal([...html.matchAll(/<item>/g)].length, POSTS.length);
  for (const slug of POSTS) {
    assert.match(
      html,
      new RegExp(`<link>https://xigo\\.ch/journal/${slug}</link>`),
    );
  }
  assert.doesNotMatch(html, /<author>/);
  assert.match(html, /xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/);
  assert.match(html, /<dc:creator>Andy Moesch<\/dc:creator>/);
  assert.match(html, /<dc:creator>Ivo Pejakovic<\/dc:creator>/);
});

test("every page links the feed in its head (R-JOUR-4)", async () => {
  const { html } = await page("/about");
  assert.match(
    region(html, "head"),
    /rel="alternate" type="application\/rss\+xml"[^>]*href="\/feed\.xml"/,
  );
});

for (const slug of OLD_SLUGS) {
  test(`the old address of ${slug} moves permanently to the journal (R-JOUR-5)`, async () => {
    let location = `/post/${slug}/`;
    const hops = [];
    while (hops.length < 3) {
      const response = await fetch(`${origin}${location}`, {
        redirect: "manual",
      });
      if (response.status !== 301) break;
      location = new URL(response.headers.get("location"), origin).pathname;
      hops.push(location);
    }
    assert.equal(location, `/journal/${slug}`);
    assert.equal((await page(location)).status, 200);
  });
}

test("an old address that never existed answers 404 with a link home", async () => {
  const { status, html } = await page("/post/no-such-post");
  assert.equal(status, 404);
  assert.match(region(html, "main"), /href="\/"/);
});

test("the home page lists the three newest posts (R-HOME-4)", async () => {
  const { html } = await page("/");
  assert.deepEqual(postLinks(html), [
    "consent-decisions-simple-not-easy",
    "navigating-change-finding-your-voice-in-a-complex-world",
    "the-tensions-of-power-and-autonomy-in-self-organization-my-perspective",
  ]);
});

test("the contact heading keeps the space between its two sentences (R-HOME-5)", async () => {
  const { html } = await page("/");
  assert.match(html, /foundation\? <span/);
});

const PEOPLE = readdirSync(new URL("../content/people", import.meta.url));

test("About links every founder's profile (R-ABOUT-4)", async () => {
  const { html } = await page("/about");
  const main = region(html, "main");
  for (const slug of PEOPLE) {
    assert.match(main, new RegExp(`href="/about/${slug}"`));
  }
});

for (const [slug, name] of [
  ["ivo", "Ivo Pejakovic"],
  ["andy", "Andy Moesch"],
]) {
  test(`${name}'s profile shows name, role and its sections, under About (R-ABOUT-4, R-NAV-2)`, async () => {
    const { status, html } = await page(`/about/${slug}`);
    assert.equal(status, 200);
    const main = region(html, "main");
    assert.match(main, new RegExp(`<h1[^>]*>${name}</h1>`));
    assert.match(main, /Co-founder of xigo/);
    const headings = [...main.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(
      (match) => match[1],
    );
    assert.deepEqual(headings, [
      "Short bio",
      "What I can help with",
      "Experience",
      "Methods and qualifications",
      "Tools and technology",
      "Languages",
    ]);
    assert.match(
      region(html, "header"),
      /<a href="\/about" aria-current="page"/,
    );
    assert.match(
      region(html, "head"),
      new RegExp(`<title>${name} — xigo</title>`),
    );
  });
}

test("a profile without a LinkedIn address shows no LinkedIn link (R-ABOUT-4)", async () => {
  const { html } = await page("/about/ivo");
  assert.doesNotMatch(region(html, "main"), /linkedin/i);
});

const PROJECTS = readdirSync(new URL("../content/work", import.meta.url));

test("Work lists every project, the featured one first (R-WORK-1)", async () => {
  const { html } = await page("/work");
  const main = region(html, "main");
  const slugs = [...main.matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual([...slugs].sort(), [...PROJECTS].sort());
  assert.equal(slugs[0], "rebel-match");
  assert.match(main, /Featured/);
  assert.match(main, /<img[^>]*alt="An illustration of a network/);
});

test("a project page shows its text, its source code and its license (R-WORK-3)", async () => {
  const { status, html } = await page("/work/rebel-match");
  assert.equal(status, 200);
  const main = region(html, "main");
  assert.match(main, /<h1[^>]*>Rebel Match<\/h1>/);
  assert.match(main, /href="https:\/\/github\.com\/wrych\/rebel-match"/);
  assert.match(main, /MIT license/);
  assert.match(region(html, "header"), /<a href="\/work" aria-current="page"/);
});

test("the Rebel Match page links Pascal's homepage", async () => {
  const { html } = await page("/work/rebel-match");
  assert.match(
    region(html, "main"),
    /<a href="https:\/\/transformation-architects\.ch\/"[^>]*>Transformation Architects<\/a>/,
  );
});

test("the network scene is labelled, and says it is an illustration (R-WORK-4)", async () => {
  const { html } = await page("/work/rebel-match");
  const main = region(html, "main");
  assert.match(
    main,
    /<svg[^>]*role="img"[^>]*aria-label="An illustration of a network/,
  );
  assert.match(main, /An illustration, not real members or data\./);
});

test("the Rebel Match page shows the app's screens, marked as sample data (R-CONT-4, R-CONT-5)", async () => {
  const { html } = await page("/work/rebel-match");
  const main = region(html, "main");
  assert.match(main, /<img[^>]*alt="Three phone screens from Rebel Match/);
  assert.match(main, /made-up sample members/);
});

test("the network scene stands still under reduced motion (R-WEB-4)", async () => {
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ reducedMotion: "reduce" });
    await tab.goto(`${origin}/work/rebel-match`);
    const running = await tab.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    );
    assert.equal(running, 0);
  } finally {
    await browser.close();
  }
});

test("a profile with a LinkedIn address links it (R-ABOUT-4)", async () => {
  const { html } = await page("/about/andy");
  assert.match(
    region(html, "main"),
    /<a class="link" href="https:\/\/www\.linkedin\.com\/in\/andymoesch"/,
  );
});

const PHONE = { width: 360, height: 740 };

test("no page scrolls sideways at phone width, covers included (R-WEB-3)", async () => {
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ viewport: PHONE });
    for (const path of [
      "/",
      "/work",
      "/journal",
      "/about",
      "/journal/topic/software",
      "/journal/navigating-change-finding-your-voice-in-a-complex-world",
      "/about/ivo",
      "/work/rebel-match",
      "/about/andy",
      "/no-such-page",
    ]) {
      await tab.goto(`${origin}${path}`);
      const widths = await tab.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        widest: Math.max(
          0,
          ...[...document.images].map(
            (img) => img.getBoundingClientRect().right,
          ),
        ),
      }));
      assert.ok(widths.page <= PHONE.width, `${path} is ${widths.page}px wide`);
      assert.ok(
        widths.widest <= PHONE.width,
        `${path} has an image reaching ${widths.widest}px`,
      );
    }
  } finally {
    await browser.close();
  }
});

test("every page names the site's icon, and the server serves it (R-WEB-7)", async () => {
  const head = region((await page("/journal")).html, "head");
  const icons = {
    "/favicon.svg": "image/svg+xml",
    "/favicon.ico": "image/",
    "/apple-touch-icon.png": "image/png",
  };
  for (const [href, type] of Object.entries(icons)) {
    assert.match(
      head,
      new RegExp(`rel="(icon|apple-touch-icon)"[^>]*href="${href}"`),
    );
    const response = await fetch(`${origin}${href}`);
    assert.equal(response.status, 200, href);
    assert.ok(response.headers.get("content-type").startsWith(type), href);
  }
  const svg = await (await fetch(`${origin}/favicon.svg`)).text();
  assert.match(svg, /fill="#e6c79c"/, "the dot is the accent gold");
});
