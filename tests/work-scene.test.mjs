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
    "scene-in-text": {
      ...FIXTURES["with-source"],
      scene: "network",
      sceneAfter: "how-it-works",
      body: "## Why\n\nWhy text.\n\n## How it works\n\nHow text.\n\n## After\n\nAfter text.",
    },
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

test("a project with a scene still opens with its product, the scene after the text (R-WORK-4, R-WORK-5)", () => {
  const html = main(read("work/with-scene"));
  const image = html.search(/<img[^>]*alt="A test image"/);
  const text =
    html.indexOf("The project’s own words.") >= 0
      ? html.indexOf("The project’s own words.")
      : html.indexOf("The project's own words.");
  const scene = html.search(
    /<svg[^>]*role="img"[^>]*aria-label="An illustration of a network/,
  );
  assert.ok(image >= 0 && text > image && scene > text);
});

test("a scene goes at the end of the section the project names (R-WORK-4)", () => {
  const html = main(read("work/scene-in-text"));
  const at = (pattern) => html.search(pattern);
  const how = at(/How text\./);
  const scene = at(
    /<svg[^>]*role="img"[^>]*aria-label="An illustration of a network/,
  );
  const after = at(/<h2 id="after"/);
  assert.ok(at(/<img[^>]*alt="A test image"/) < at(/Why text\./));
  assert.ok(how > 0 && scene > how && after > scene);
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

test("sceneAfter without a scene fails the build, naming the field (R-WORK-4, R-CONT-2)", () => {
  assert.throws(
    () =>
      buildWith({
        "no-scene": { ...FIXTURES["with-source"], sceneAfter: "why" },
      }),
    /sceneAfter needs a scene \(R-WORK-4\)/,
  );
});

test("a scene cannot yet be placed in a text with its own images (R-WORK-4)", () => {
  assert.throws(
    () =>
      buildWith({
        "with-images": {
          ...FIXTURES["with-source"],
          scene: "network",
          sceneAfter: "why",
          body: "## Why\n\n![An image](./cover.png)",
        },
      }),
    /with-images: sceneAfter cannot yet place a scene in a text with images/,
  );
});
