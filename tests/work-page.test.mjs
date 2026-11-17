import { before, test } from "node:test";
import assert from "node:assert/strict";
import { buildWith, main } from "./work-site.mjs";

let read;
before(() => {
  read = buildWith();
});

test("a project page shows its title, text and image (R-WORK-3)", () => {
  const html = main(read("work/with-source"));
  assert.match(html, /<h1[^>]*>With source<\/h1>/);
  assert.match(html, /The project’s own words\.|The project's own words\./);
  assert.match(html, /<img[^>]*alt="A test image"/);
});

test("a project page links its source code and names its license (R-WORK-3)", () => {
  const html = main(read("work/with-source"));
  assert.match(html, /href="https:\/\/example\.org\/code"/);
  assert.match(html, /Released under the MIT license\./);
});

test("a license is shown even without a source link (R-WORK-3)", () => {
  const html = main(read("work/license-only"));
  assert.match(html, /Released under the MIT license\./);
  assert.doesNotMatch(html, /Source code/);
});

test("a project without source or license shows neither (R-WORK-3)", () => {
  const html = main(read("work/featured"));
  assert.doesNotMatch(html, /Source code|license/);
});
