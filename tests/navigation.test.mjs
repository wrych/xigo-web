import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalPath, isCurrent } from "../src/navigation.ts";

test("a page's link is current on the page itself", () => {
  assert.equal(isCurrent("/work", "/work"), true);
});

test("a page's link is current on a project or post inside it", () => {
  assert.equal(isCurrent("/journal", "/journal/consent-decisions"), true);
});

test("a link is not current on a page that only shares its prefix", () => {
  assert.equal(isCurrent("/work", "/workshops"), false);
  assert.equal(isCurrent("/work", "/"), false);
});

test("a prerendered page's path is read as its address", () => {
  assert.equal(isCurrent("/journal", "/journal.html"), true);
  assert.equal(canonicalPath("/about/"), "/about");
  assert.equal(canonicalPath("/index.html"), "/");
  assert.equal(canonicalPath("/"), "/");
});

test("home is current only on the home page", () => {
  assert.equal(isCurrent("/", "/"), true);
  assert.equal(isCurrent("/", "/index.html"), true);
  assert.equal(isCurrent("/", "/work"), false);
});
