import { before, test } from "node:test";
import assert from "node:assert/strict";
import { buildWith, main } from "./work-site.mjs";

let read;
before(() => {
  read = buildWith();
});

test("Work lists every project, featured first, then newest first (R-WORK-1)", () => {
  const html = main(read("work"));
  const slugs = [...html.matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(slugs, [
    "featured",
    "license-only",
    "with-source",
    "with-figure",
  ]);
});

test("each project on Work shows its year, summary, topics and image (R-WORK-1)", () => {
  const html = main(read("work"));
  assert.match(html, /2024 · Events/);
  assert.match(html, /What it is for\./);
  assert.match(html, /<img[^>]*alt="A test image"/);
});

test("Home shows the featured project large, then two more (R-HOME-3)", () => {
  const html = main(read(""));
  const work = html.slice(
    html.indexOf('aria-labelledby="work-heading"'),
    html.indexOf('aria-labelledby="journal-heading"'),
  );
  const slugs = [...work.matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(slugs, ["featured", "license-only", "with-source"]);
  assert.match(work, /class="project-lead[" ][^]*href="\/work\/featured"/);
  assert.match(work, /href="\/work"/);
});

test("each project on Work leads with its image, the featured one first (R-WORK-7)", () => {
  const html = main(read("work"));
  const items = html.split(/<li\b/).slice(1);
  assert.equal(items.length, 4);
  assert.match(items[0], /^[^>]*class="[^"]*\bfeatured\b/);
  for (const item of items.slice(1)) {
    assert.doesNotMatch(item, /^[^>]*class="[^"]*\bfeatured\b/);
  }
  for (const item of items) {
    assert.ok(
      item.indexOf("<img") >= 0 &&
        item.indexOf("<img") < item.indexOf('class="title'),
      "the image comes before the title",
    );
  }
});
