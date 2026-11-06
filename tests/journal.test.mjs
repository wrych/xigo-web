import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOPICS,
  formatDate,
  journalOrder,
  onTopic,
  readingMinutes,
  usedTopics,
} from "../src/journal.ts";

const post = (date, topic = "change", featured = false) => ({
  date: new Date(date),
  topic,
  featured,
});

test("the featured post leads, the rest follow newest first (R-JOUR-1)", () => {
  const featured = post("2024-01-01", "trust", true);
  const posts = [post("2025-01-01"), featured, post("2026-01-01")];
  const { lead, rest } = journalOrder(posts);
  assert.equal(lead, featured);
  assert.deepEqual(
    rest.map((p) => p.date.getUTCFullYear()),
    [2026, 2025],
  );
});

test("without a featured post the newest leads", () => {
  const { lead, rest } = journalOrder([post("2025-01-01"), post("2026-01-01")]);
  assert.equal(lead.date.getUTCFullYear(), 2026);
  assert.equal(rest.length, 1);
});

test("two featured posts fail the build, naming both and the field (R-CONT-2)", () => {
  const first = { ...post("2025-01-01", "change", true), id: "first-post" };
  const second = { ...post("2026-01-01", "change", true), id: "second-post" };
  assert.throws(
    () => journalOrder([first, second, post("2024-01-01")]),
    /featured: true is set on first-post, second-post; at most one post may be featured/,
  );
});

test("an empty journal has no lead", () => {
  assert.deepEqual(journalOrder([]), { lead: undefined, rest: [] });
});

test("a topic shows only its posts, newest first (R-JOUR-2)", () => {
  const posts = [
    post("2024-01-01", "software"),
    post("2025-01-01", "trust"),
    post("2026-01-01", "software"),
  ];
  assert.deepEqual(
    onTopic(posts, "software").map((p) => p.date.getUTCFullYear()),
    [2026, 2024],
  );
});

test("only topics with posts get a filter, in the listed order", () => {
  const posts = [
    post("2024-01-01", "software"),
    post("2025-01-01", "change"),
    post("2026-01-01", "software"),
  ];
  assert.deepEqual(usedTopics(posts), ["change", "software"]);
  assert.ok(
    Object.keys(TOPICS).indexOf("change") <
      Object.keys(TOPICS).indexOf("software"),
  );
});

test("reading time is whole minutes at 200 words, never zero (R-JOUR-3)", () => {
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes("word ".repeat(450)), 2);
  assert.equal(readingMinutes("word ".repeat(1700)), 9);
});

test("dates read the same wherever the build runs", () => {
  assert.equal(formatDate(new Date("2026-03-03")), "3 Mar 2026");
});
