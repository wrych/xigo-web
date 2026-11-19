import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const PAGES = [
  "/",
  "/work",
  "/journal",
  "/about",
  "/work/rebel-match",
  "/about/andy",
];
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

const text = async (path) => (await fetch(`${origin}${path}`)).text();

function region(html, tag) {
  const start = html.indexOf(`<${tag}`);
  const end = html.indexOf(`</${tag}>`, start);
  assert.ok(start >= 0 && end > start, `no <${tag}> in the page`);
  return html.slice(start, end);
}

const attribute = (html, selector, name) =>
  html.match(new RegExp(`${selector}[^>]*\\s${name}="([^"]*)"`))?.[1];

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

for (const path of PAGES) {
  test(`${path} shows the drawn wordmark, named xigo, in header and footer (R-WEB-8, R-NAV-2, R-NAV-3)`, async () => {
    const html = await text(path);
    for (const tag of ["header", "footer"]) {
      const part = region(html, tag);
      assert.match(
        part,
        /<a\b[^>]*href="\/"[^>]*>\s*<svg\b[^>]*role="img"[^>]*aria-label="xigo"/,
        tag,
      );
      assert.match(part, /class="mark-x"/, tag);
      assert.match(part, /<circle\b[^>]*class="mark-node"/, tag);
      assert.doesNotMatch(part, />xigo</, `${tag} has no typed wordmark`);
    }
  });

  test(`${path} uses the node, never a ● glyph (R-WEB-8)`, async () => {
    assert.doesNotMatch(await text(path), /●/);
  });
}

test("the wordmark on Home is current (R-NAV-2)", async () => {
  const header = region(await text("/"), "header");
  assert.match(header, /<a\b[^>]*class="wordmark"[^>]*aria-current="page"/);
});

for (const path of ["/work", "/journal", "/about"]) {
  test(`${path}'s link carries the node beside its current state (R-WEB-8)`, async () => {
    const header = region(await text(path), "header");
    const current = header.match(
      /<a\b[^>]*aria-current="page"[^>]*>([\s\S]*?)<\/a>/,
    );
    assert.ok(current, "a link is current");
    assert.match(current[0], new RegExp(`href="${path}"`));
    assert.match(current[1], /class="node\b/);
    const others = header.match(/<nav[\s\S]*<\/nav>/)[0].split(current[0]);
    for (const rest of others) assert.doesNotMatch(rest, /class="node\b/);
  });
}

test("Home's eyebrow starts with the node (R-WEB-8)", async () => {
  assert.match(
    await text("/"),
    /class="label"[^>]*>\s*<span class="node"[^>]*aria-hidden="true"/,
  );
});

test("the featured marker is a node, not a gold word (R-WEB-8)", async () => {
  for (const path of ["/", "/work", "/journal"]) {
    const html = await text(path);
    assert.match(html, /<span class="node"[^>]*><\/span>\s*Featured/, path);
    assert.doesNotMatch(html, /class="dot"/, path);
  }
});

test("project and profile lists use the node as their bullet (R-WEB-8)", async () => {
  for (const path of ["/work/rebel-match", "/about/andy"]) {
    assert.match(await text(path), /class="body node-bullets/, path);
  }
});

test("the icon draws the wordmark's own x and node (R-WEB-7, R-WEB-8)", async () => {
  const header = region(await text("/"), "header");
  const icon = await text("/favicon.svg");
  assert.equal(
    attribute(icon, 'class="mark-x"', "d"),
    attribute(header, 'class="mark-x"', "d"),
  );
  for (const name of ["r", "cy"]) {
    assert.equal(
      attribute(icon, 'class="mark-node"', name),
      attribute(header, 'class="mark-node"', name),
      name,
    );
  }
});
