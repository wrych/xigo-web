import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkSite, imagesWithoutAlt } from "../scripts/check-image-alt.mjs";

test("images with alt text pass", () => {
  assert.deepEqual(imagesWithoutAlt('<img src="a.png" alt="A chart">'), []);
});

test("an image with no, empty or blank alt is found", () => {
  const html = [
    '<img src="a.png">',
    '<img alt="" src="b.png">',
    '<img src="c.png" alt=" ">',
    '<img src="d.png" data-alt="looks like alt">',
    '<IMG SRC="ignored-case.png">',
    "<img>",
  ].join("");
  assert.deepEqual(imagesWithoutAlt(html), [
    "a.png",
    "b.png",
    "c.png",
    "d.png",
    "an <img> without src",
    "an <img> without src",
  ]);
});

test("the site check names each page and its images", () => {
  const dir = mkdtempSync(join(tmpdir(), "xigo-alt-"));
  mkdirSync(join(dir, "journal/a-post"), { recursive: true });
  writeFileSync(join(dir, "index.html"), '<img src="ok.png" alt="fine">');
  writeFileSync(join(dir, "journal/a-post/index.html"), '<img src="x.png">');
  writeFileSync(join(dir, "feed.xml"), '<img src="not-html.png">');
  assert.deepEqual(checkSite(dir), [
    "journal/a-post/index.html: images need alt text (R-CONT-5): x.png",
  ]);
});
