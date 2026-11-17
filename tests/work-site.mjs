import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const IMAGE = join(
  repo,
  "content/journal/navigating-change-finding-your-voice-in-a-complex-world/cover.png",
);

const frontMatter = (fields) =>
  `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n---\n\nThe project's own words.\n`;

const base = {
  summary: '"What it is for."',
  topics: "[events]",
  image: "./cover.png",
  imageAlt: '"A test image"',
};

/** Fixture projects, built once into a copy of the site (R-WORK-*). */
export const FIXTURES = {
  "with-source": {
    ...base,
    title: '"With source"',
    year: 2024,
    source: "https://example.org/code",
    license: "MIT",
  },
  "license-only": {
    ...base,
    title: '"License only"',
    year: 2026,
    license: "MIT",
  },
  featured: { ...base, title: '"Featured"', year: 2020, featured: true },
};

/** Builds the site with `fixtures` as its projects; returns a reader of the
 * built pages by address. */
export function buildWith(fixtures = FIXTURES) {
  const dir = mkdtempSync(join(tmpdir(), "xigo-work-"));
  for (const path of [
    "src",
    "astro.config.mjs",
    "package.json",
    "tsconfig.json",
    "scripts",
    "content/journal",
    "content/people",
  ]) {
    cpSync(join(repo, path), join(dir, path), { recursive: true });
  }
  symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"));
  for (const [slug, fields] of Object.entries(fixtures)) {
    const folder = join(dir, "content/work", slug);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, "index.md"), frontMatter(fields));
    cpSync(IMAGE, join(folder, "cover.png"));
  }
  const result = spawnSync("npm", ["run", "build", "--silent"], {
    cwd: dir,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return (path) =>
    readFileSync(join(dir, "dist/client", path, "index.html"), "utf8");
}

/** The part of `html` inside its <main>. */
export function main(html) {
  return html.slice(html.indexOf("<main"), html.indexOf("</main>"));
}
