import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
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
  const build = spawnSync("npx", ["astro", "build"], {
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
  for (const path of ["/", "/work", "/journal", "/about"]) {
    const { html } = await page(path);
    assert.doesNotMatch(html, /<script/);
    assert.doesNotMatch(html, /(src|href)="https?:\/\/(?!github\.com\/wrych")/);
  }
});
