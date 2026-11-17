import { test } from "node:test";
import assert from "node:assert/strict";
import { showcase, workOrder } from "../src/work.ts";
import {
  MATCH_CYCLE_SECONDS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  networkScene,
  seeded,
} from "../src/scene.ts";

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

test("the seeded generator repeats itself and stays in [0, 1)", () => {
  const a = seeded(1);
  const b = seeded(1);
  for (let i = 0; i < 100; i += 1) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
});

test("the network scene is the same on every build", () => {
  assert.deepEqual(networkScene(), networkScene());
});

test("every match in the scene joins two different clusters", () => {
  const { nodes, matches } = networkScene();
  const at = (x, y) => nodes.find((node) => node.x === x && node.y === y);
  assert.ok(matches.length > 0);
  for (const match of matches) {
    assert.notEqual(
      at(match.x1, match.y1).cluster,
      at(match.x2, match.y2).cluster,
    );
  }
});

test("the scene's hubs stay inside its frame", () => {
  for (const node of networkScene().nodes.filter((n) => n.hub)) {
    assert.ok(node.x > 0 && node.x < SCENE_WIDTH);
    assert.ok(node.y > 0 && node.y < SCENE_HEIGHT);
  }
});

test("one loop of the matches holds every match", () => {
  const { matches } = networkScene();
  const last = Math.max(...matches.map((match) => match.delay));
  assert.ok(last < MATCH_CYCLE_SECONDS);
});

test("Home shows the featured project and the next two of Work's order (R-HOME-3)", () => {
  const { lead, more } = showcase([
    project("old", 2020),
    project("new", 2026),
    project("lead", 2023, true),
    project("mid", 2024),
  ]);
  assert.equal(lead.id, "lead");
  assert.deepEqual(
    more.map((p) => p.id),
    ["new", "mid"],
  );
});

test("Home shows nothing when there is no project (R-HOME-3)", () => {
  assert.deepEqual(showcase([]), { lead: undefined, more: [] });
});
