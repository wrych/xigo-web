import { test } from "node:test";
import assert from "node:assert/strict";
import { workOrder } from "../src/work.ts";

const project = (id, year, featured = false) => ({ id, year, featured });

test("the featured project leads, the rest follow newest first (R-WORK-1)", () => {
  const order = workOrder([
    project("old", 2024),
    project("lead", 2023, true),
    project("new", 2026),
  ]);
  assert.deepEqual(
    order.map((p) => p.id),
    ["lead", "new", "old"],
  );
});

test("two featured projects are a content error naming both (R-CONT-2)", () => {
  assert.throws(
    () => workOrder([project("a", 2026, true), project("b", 2025, true)]),
    /a, b; at most one project may be featured/,
  );
});
