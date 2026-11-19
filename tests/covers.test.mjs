import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { TOPICS } from "../src/journal.ts";
import {
  COMPOSITIONS,
  COVER_PALETTE,
  COVER_SHAPES,
  coverSvg,
  hash,
} from "../src/covers.ts";

const SLUG = "consent-decisions-simple-not-easy";

test("the same slug draws the same cover on every build (R-JOUR-6)", () => {
  for (const shape of Object.keys(COVER_SHAPES)) {
    assert.equal(
      coverSvg(SLUG, "decisions", shape),
      coverSvg(SLUG, "decisions", shape),
    );
  }
});

test("each slug draws its own cover (R-JOUR-6)", () => {
  for (const topic of Object.keys(TOPICS)) {
    assert.notEqual(
      coverSvg("one-post", topic),
      coverSvg("another-post", topic),
      topic,
    );
  }
});

test("every topic has its own composition (R-JOUR-6)", () => {
  assert.deepEqual(
    Object.keys(COMPOSITIONS).sort(),
    Object.keys(TOPICS).sort(),
  );
  const drawn = Object.keys(TOPICS).map((topic) => {
    const svg = coverSvg(SLUG, topic);
    assert.match(svg, new RegExp(`data-topic="${topic}"`));
    assert.ok(svg.length > 2000, `${topic} draws next to nothing`);
    return svg
      .replace(/data-topic="[^"]+"/, "")
      .replace(/cover-[a-z0-9]+-/g, "");
  });
  assert.equal(new Set(drawn).size, drawn.length);
});

test("a cover is decorative SVG, framed for where it is shown (R-JOUR-6)", () => {
  for (const [shape, { width, height }] of Object.entries(COVER_SHAPES)) {
    const svg = coverSvg(SLUG, "trust", shape);
    assert.match(svg, /^<svg\b[^>]*aria-hidden="true"[^>]*focusable="false"/);
    assert.match(svg, new RegExp(`viewBox="0 0 ${width} ${height}"`));
    assert.match(svg, /preserveAspectRatio="xMidYMid slice"/);
    assert.doesNotMatch(svg, /<(image|script|text|a)\b/);
  }
  assert.equal(COVER_SHAPES.wide.width / COVER_SHAPES.wide.height, 16 / 9);
  assert.equal(COVER_SHAPES.card.width / COVER_SHAPES.card.height, 4 / 3);
});

test("every cover keeps to the site's palette (R-JOUR-6)", () => {
  const palette = new Set(Object.values(COVER_PALETTE));
  for (const topic of Object.keys(TOPICS)) {
    for (const shape of Object.keys(COVER_SHAPES)) {
      const colours = coverSvg(SLUG, topic, shape).match(/#[0-9a-f]{6}/gi);
      for (const colour of colours) assert.ok(palette.has(colour), colour);
    }
  }
});

test("the cover palette is the site's own tokens", () => {
  const css = readFileSync(
    new URL("../src/styles/global.css", import.meta.url),
    "utf8",
  );
  for (const [token, colour] of Object.entries(COVER_PALETTE)) {
    assert.match(css, new RegExp(`--${token}: ${colour};`));
  }
});

test("two covers on one page never share an id", () => {
  const ids = (svg) => [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const wide = ids(coverSvg(SLUG, "decisions", "wide"));
  const card = ids(coverSvg(SLUG, "decisions", "card"));
  const other = ids(coverSvg("minesweeping-agile", "decisions", "wide"));
  assert.equal(new Set([...wide, ...card, ...other]).size, wide.length * 3);
});

test("the seed is a stable 32-bit hash of the slug", () => {
  assert.equal(hash(""), 0x811c9dc5);
  assert.equal(hash("a"), 0xe40c292c);
  assert.notEqual(hash("ab"), hash("ba"));
});
