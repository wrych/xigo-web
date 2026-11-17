import { before, test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURES, buildWith, main } from "./work-site.mjs";

let read;
before(() => {
  read = buildWith({
    ...FIXTURES,
    "with-scene": { ...FIXTURES["with-source"], scene: "network" },
  });
});

test("a project with a scene opens with it instead of its image (R-WORK-4)", () => {
  const html = main(read("work/with-scene"));
  assert.match(
    html,
    /<svg[^>]*role="img"[^>]*aria-label="An illustration of a network/,
  );
  assert.doesNotMatch(html, /<img/);
});

test("the scene says it is an illustration, and needs no script (R-WORK-4)", () => {
  const html = read("work/with-scene");
  assert.match(html, /An illustration, not real members or data\./);
  assert.doesNotMatch(html, /<script/);
});

test("Work keeps the project's image as its still (R-WORK-4)", () => {
  const html = main(read("work"));
  assert.doesNotMatch(html, /<svg/);
  assert.match(html, /<img[^>]*alt="A test image"/);
});
