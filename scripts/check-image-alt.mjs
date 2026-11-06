#!/usr/bin/env node
// Runs after `astro build`: the rendered HTML is checked, not the Markdown,
// so every way of writing an image is covered (R-CONT-5).
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const IMG = /<img\b[^>]*>/gi;
const ALT = /\salt="([^"]*)"/;
const SRC = /\ssrc="([^"]*)"/;

/** The images in a page that have no alt text, by address. */
export function imagesWithoutAlt(html) {
  return [...html.matchAll(IMG)]
    .map(([tag]) => tag)
    .filter((tag) => (ALT.exec(tag)?.[1] ?? "").trim() === "")
    .map((tag) => SRC.exec(tag)?.[1] ?? "an <img> without src");
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

/** Every built page with an image that lacks alt text, as messages. */
export function checkSite(dir) {
  return htmlFiles(dir).flatMap((file) => {
    const missing = imagesWithoutAlt(readFileSync(file, "utf8"));
    return missing.length === 0
      ? []
      : [
          `${relative(dir, file)}: images need alt text (R-CONT-5): ${missing.join(", ")}`,
        ];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkSite(process.argv[2] ?? "dist/client");
  for (const problem of problems) console.error(problem);
  process.exitCode = problems.length === 0 ? 0 : 1;
}
