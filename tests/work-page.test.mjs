import { before, test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURES, buildWith, main } from "./work-site.mjs";

let read;
before(() => {
  read = buildWith({
    ...FIXTURES,
    "with-facts": {
      ...FIXTURES["with-source"],
      title: '"With facts"',
      launch: "\n  date: 2026-11-08\n  event: A summit\n  stage: beta",
      team: "\n  - name: A Person\n    organisation: An Org\n    part: Design\n  - name: B Person\n    part: Engineering",
      opening:
        '\n  image: ./cover.png\n  alt: "The product"\n  caption: "Its screens"',
    },
  });
});

const facts = (html) => /<dl class="facts[\s\S]*?<\/dl>/.exec(html)[0];
const labels = (html) =>
  [...facts(html).matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]);

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

test("a project's figures come resized, with a fallback, alt text and caption (R-CONT-4, R-CONT-5)", () => {
  const html = main(read("work/with-figure"));
  const figure = /<figure class="figure[\s\S]*?<\/figure>/.exec(html)[0];
  const source = /<source[^>]*>/.exec(figure)[0];
  assert.match(source, /type="image\/webp"/);
  assert.match(source, /srcset="[^"]*480w[^"]*960w/);
  assert.match(
    figure,
    /<img[^>]*src="\/_astro\/[^"]+\.jpg"[^>]*alt="A figure"/,
  );
  assert.match(figure, /<figcaption[^>]*>A caption<\/figcaption>/);
});

test("a project page opens with its product, before its text (R-WORK-5)", () => {
  const html = main(read("work/with-facts"));
  const opening = html.search(/<img[^>]*alt="The product"/);
  assert.ok(opening > html.indexOf("</h1>"));
  assert.ok(opening < html.search(/The project(’|')s own words/));
  assert.match(html, /<figcaption[^>]*>Its screens<\/figcaption>/);
  assert.doesNotMatch(html, /alt="A test image"/);
});

test("the facts strip shows the facts the project gives (R-WORK-5)", () => {
  const html = main(read("work/with-facts"));
  assert.deepEqual(labels(html), [
    "Year",
    "Beta launched",
    "License",
    "Made by",
  ]);
  const strip = facts(html);
  assert.match(strip, /8 Nov 2026/);
  assert.match(strip, /A summit/);
  assert.match(strip, /A Person, An Org/);
  assert.match(strip, /Design/);
  assert.match(strip, /B Person/);
});

test("the facts strip leaves out what a project does not give (R-WORK-5)", () => {
  assert.deepEqual(labels(main(read("work/featured"))), ["Year"]);
  assert.deepEqual(labels(main(read("work/license-only"))), [
    "Year",
    "License",
  ]);
});
