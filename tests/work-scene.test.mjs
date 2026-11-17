import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { FIXTURES, buildWith, main, serve } from "./work-site.mjs";

let read;
let site;
before(async () => {
  read = buildWith({
    ...FIXTURES,
    "with-scene": { ...FIXTURES["with-source"], scene: "network" },
  });
  site = await serve(read.dir);
});

after(() => site?.stop());

const runningAnimations = async (reducedMotion) => {
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ reducedMotion });
    await tab.goto(`${site.origin}/work/with-scene`);
    return await tab.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
    );
  } finally {
    await browser.close();
  }
};

test("the scene moves, and stands still under reduced motion (R-WORK-4, R-WEB-4)", async () => {
  assert.ok((await runningAnimations("no-preference")) > 0);
  assert.equal(await runningAnimations("reduce"), 0);
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
