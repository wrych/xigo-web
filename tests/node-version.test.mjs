import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("package.json allows only the pinned Node version (ADR 0002)", () => {
  const pinned = read(".nvmrc").trim();
  const { engines } = JSON.parse(read("package.json"));
  assert.equal(engines.node, `${pinned}.x`);
});
