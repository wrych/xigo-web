import { test } from "node:test";
import assert from "node:assert/strict";
import { showcase, workOrder } from "../src/work.ts";
import {
  MATCH_CYCLE_SECONDS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  HERO_PULSE_CYCLE_SECONDS,
  HERO_SIZE,
  heroScene,
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

test("the hero network is the same on every build (R-HOME-6)", () => {
  assert.deepEqual(heroScene(), heroScene());
});

test("the hero network stays inside its frame and has golden hubs (R-HOME-6)", () => {
  const { nodes, links } = heroScene();
  for (const node of nodes) {
    assert.ok(node.x - node.r > 0 && node.x + node.r < HERO_SIZE);
    assert.ok(node.y - node.r > 0 && node.y + node.r < HERO_SIZE);
  }
  assert.ok(nodes.some((node) => node.hub));
  assert.ok(links.length > 0);
});

test("each hero node knows the nodes it is joined to (R-HOME-6)", () => {
  const { nodes, links, neighbours } = heroScene();
  assert.equal(neighbours.length, nodes.length);
  assert.equal(neighbours.flat().length, 2 * links.length);
  neighbours.forEach((others, i) => {
    for (const j of others) assert.ok(neighbours[j].includes(i));
  });
});

test("the hero's idle pulses travel along its lines, within one cycle (R-HOME-6)", () => {
  const { links, pulses } = heroScene();
  const same = (a, b) =>
    (a.x1 === b.x1 && a.y1 === b.y1 && a.x2 === b.x2 && a.y2 === b.y2) ||
    (a.x1 === b.x2 && a.y1 === b.y2 && a.x2 === b.x1 && a.y2 === b.y1);
  assert.ok(pulses.length > 0);
  for (const pulse of pulses) {
    assert.ok(links.some((link) => same(link, pulse)));
    assert.ok(pulse.delay < HERO_PULSE_CYCLE_SECONDS);
  }
});
