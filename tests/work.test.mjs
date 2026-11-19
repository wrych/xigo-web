import { test } from "node:test";
import assert from "node:assert/strict";
import { showcase, splitAfterSection, workOrder } from "../src/work.ts";
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

test("the hero network is communities bridged by a few golden people (R-HOME-6)", () => {
  const { nodes, links, neighbours, communities, bridges } = heroScene();
  assert.ok(communities.length >= 3, "several communities");
  assert.ok(bridges.length >= 3 && bridges.length <= 5, "a few bridges");
  for (const [cluster, community] of communities.entries()) {
    assert.ok(community.members.length > 4);
    assert.ok(community.members.every((i) => nodes[i].cluster === cluster));
    assert.ok(community.members.every((i) => !nodes[i].hub));
    assert.ok(links.some((link) => link.cluster === cluster));
    assert.ok(community.depth > 0 && community.depth <= 1);
  }
  const bridged = new Set();
  for (const bridge of bridges) {
    assert.ok(nodes[bridge.node].hub);
    assert.ok(bridge.joins.length >= 2, "a bridge joins two communities");
    for (const joined of bridge.joins) {
      bridged.add(joined);
      assert.ok(
        neighbours[bridge.node].some((i) => nodes[i].cluster === joined),
        "a bridge's signals reach each community it joins",
      );
    }
  }
  assert.equal(bridged.size, communities.length, "no community is left alone");
  assert.equal(
    nodes.filter((node) => node.hub).length,
    bridges.length,
    "only the bridges are golden",
  );
});

test("the hero network, its grounds and halos stay inside its frame (R-HOME-6)", () => {
  const { nodes, communities, bridges } = heroScene();
  const discs = [
    ...nodes,
    ...communities.map((community) => ({ ...community, r: community.ground })),
    ...bridges.map((bridge) => ({ ...nodes[bridge.node], r: bridge.halo })),
  ];
  for (const disc of discs) {
    assert.ok(disc.x - disc.r >= 0 && disc.x + disc.r <= HERO_SIZE);
    assert.ok(disc.y - disc.r >= 0 && disc.y + disc.r <= HERO_SIZE);
  }
});

test("the hero's idle pulses run out from the bridges (R-HOME-6)", () => {
  const { nodes, pulses, bridges } = heroScene();
  const starts = new Set(
    bridges.map((bridge) => `${nodes[bridge.node].x},${nodes[bridge.node].y}`),
  );
  for (const pulse of pulses) assert.ok(starts.has(`${pulse.x1},${pulse.y1}`));
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

const TEXT =
  '<h2 id="one">One</h2><p>a</p><h3 id="deep">Deep</h3><p>b</p><h2 id="two">Two</h2><p>c</p>';

test("a scene goes where the named section ends (R-WORK-4)", () => {
  assert.deepEqual(splitAfterSection(TEXT, "one"), [
    '<h2 id="one">One</h2><p>a</p><h3 id="deep">Deep</h3><p>b</p>',
    '<h2 id="two">Two</h2><p>c</p>',
  ]);
  assert.deepEqual(splitAfterSection(TEXT, "deep"), [
    '<h2 id="one">One</h2><p>a</p><h3 id="deep">Deep</h3><p>b</p>',
    '<h2 id="two">Two</h2><p>c</p>',
  ]);
  assert.deepEqual(splitAfterSection(TEXT, "two"), [TEXT, ""]);
});

test("a scene after a heading that is not there is a content error naming it (R-CONT-2)", () => {
  assert.throws(
    () => splitAfterSection(TEXT, "missing"),
    /sceneAfter: "missing" names no heading/,
  );
  assert.throws(
    () => splitAfterSection(TEXT, "o.e"),
    /sceneAfter: "o\.e" names no heading/,
  );
  assert.throws(
    () => splitAfterSection(TEXT, "c++"),
    /sceneAfter: "c\+\+" names no heading/,
  );
});
