import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));

function projectWith(post, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "xigo-content-"));
  for (const path of [
    "src",
    "astro.config.mjs",
    "package.json",
    "tsconfig.json",
    "scripts",
  ]) {
    cpSync(join(repo, path), join(dir, path), { recursive: true });
  }
  symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"));
  mkdirSync(join(dir, "content/journal/a-post"), { recursive: true });
  writeFileSync(join(dir, "content/journal/a-post/index.md"), post);
  for (const [name, source] of Object.entries(files)) {
    cpSync(source, join(dir, "content/journal/a-post", name));
  }
  return dir;
}

const build = (dir) =>
  spawnSync("npm", ["run", "build", "--silent"], {
    cwd: dir,
    encoding: "utf8",
  });

const sync = (dir) =>
  spawnSync("npx", ["astro", "sync"], { cwd: dir, encoding: "utf8" });

const frontMatter = (fields) =>
  `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n---\n\nText.\n`;

const valid = {
  title: '"A post"',
  date: "2026-01-01",
  author: "Andy Moesch",
  topic: "change",
  excerpt: '"Text."',
};

test("a valid post passes the schema", () => {
  const result = sync(projectWith(frontMatter(valid)));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

for (const [name, fields, field] of [
  ["a missing author", { ...valid, author: undefined }, "author"],
  ["an unknown topic", { ...valid, topic: "gossip" }, "topic"],
  ["an unknown author", { ...valid, author: "Someone Else" }, "author"],
  ["an unknown field", { ...valid, draft: "true" }, "draft"],
]) {
  test(`${name} fails the build, naming the file and the field (R-CONT-2)`, () => {
    const clean = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    const result = sync(projectWith(frontMatter(clean)));
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0);
    assert.match(output, /a-post/);
    assert.match(output, new RegExp(field));
  });
}

const aCover = {
  "cover.png": join(
    repo,
    "content/journal/navigating-change-finding-your-voice-in-a-complex-world/cover.png",
  ),
};

test("a cover with its alt text passes", () => {
  const post = frontMatter({
    ...valid,
    cover: "./cover.png",
    coverAlt: '"A cover"',
  });
  const result = sync(projectWith(post, aCover));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

for (const [name, fields] of [
  ["a cover without alt text", { ...valid, cover: "./cover.png" }],
  ["alt text without a cover", { ...valid, coverAlt: '"A cover"' }],
]) {
  test(`${name} fails the build (R-CONT-5)`, () => {
    const result = sync(projectWith(frontMatter(fields), aCover));
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0);
    assert.match(output, /a-post/);
    assert.match(output, /coverAlt/);
  });
}

test("an image in a post without alt text fails the build (R-CONT-5)", () => {
  const post = frontMatter(valid).replace(
    /Text\.\n$/,
    "![][picture]\n\n[picture]: ./cover.png\n",
  );
  const result = build(projectWith(post, aCover));
  const output = result.stdout + result.stderr;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    /journal\/a-post\/index\.html: images need alt text \(R-CONT-5\)/,
  );
});

test("an image in a post with alt text builds", () => {
  const post = frontMatter(valid).replace(
    /Text\.\n$/,
    "![A cover](./cover.png)\n",
  );
  const result = build(projectWith(post, aCover));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("no post loads an image from the old WordPress site (R-JOUR-5)", () => {
  for (const slug of readdirSync(join(repo, "content/journal"))) {
    const text = readFileSync(
      join(repo, "content/journal", slug, "index.md"),
      "utf8",
    );
    assert.doesNotMatch(text, /xigo\.ch\/wp-content/, slug);
  }
});
