/** The made-up network a project page may open with (R-WORK-4): clusters of people, the
 * lines between them, and the matches that light up. Seeded, so every build
 * draws the same picture. */

export const SCENE_WIDTH = 1200;
export const SCENE_HEIGHT = 600;
export const SCENE_SEED = 8112026;

const CLUSTERS = 8;
const ROWS = 2;
const ROW_HEIGHTS = [0.3, 0.7];
const COLUMN_STAGGER = 30;
const HUB_JITTER_X = 60;
const HUB_JITTER_Y = 40;
const HUB_RADIUS = 7;
const MEMBERS_PER_CLUSTER = 6;
const CLUSTER_RADIUS = 78;
const MEMBER_DISTANCE_MIN = 0.55;
const MEMBER_DISTANCE_SPREAD = 0.5;
const MEMBER_ANGLE_JITTER = 0.6;
const MEMBER_RADIUS_MIN = 2.5;
const MEMBER_RADIUS_SPREAD = 2;
const NEIGHBOUR_LINKS = 2;
const MATCH_COUNT = 9;
const MATCH_INTERVAL_SECONDS = 0.8;
export const MATCH_CYCLE_SECONDS = MATCH_COUNT * MATCH_INTERVAL_SECONDS;
export const BREATH_SECONDS = 5;
export const SPARK_RADIUS = 14;
const MARGIN = 110;

export interface SceneNode {
  x: number;
  y: number;
  r: number;
  hub: boolean;
  cluster: number;
  delay: number;
}

export interface SceneLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SceneMatch extends SceneLine {
  delay: number;
}

export interface Scene {
  width: number;
  height: number;
  nodes: SceneNode[];
  links: SceneLine[];
  matches: SceneMatch[];
}

/** A small seeded random number generator (mulberry32), in [0, 1). */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

const line = (a: SceneNode, b: SceneNode): SceneLine => ({
  x1: a.x,
  y1: a.y,
  x2: b.x,
  y2: b.y,
});

/** The scene: CLUSTERS hubs, each with its members, linked within a cluster
 * and to the nearest clusters, and MATCH_COUNT matches across clusters. */
export function networkScene(seed = SCENE_SEED): Scene {
  const random = seeded(seed);
  const columns = CLUSTERS / ROWS;
  const cellWidth = (SCENE_WIDTH - 2 * MARGIN) / (columns - 1);
  const nodes: SceneNode[] = [];
  const hubs: SceneNode[] = [];

  for (let cluster = 0; cluster < CLUSTERS; cluster += 1) {
    const column = cluster % columns;
    const row = Math.floor(cluster / columns);
    const hub: SceneNode = {
      x: round(MARGIN + column * cellWidth + (random() - 0.5) * HUB_JITTER_X),
      y: round(
        ROW_HEIGHTS[row] * SCENE_HEIGHT +
          (column % 2 === 0 ? -1 : 1) * COLUMN_STAGGER +
          (random() - 0.5) * HUB_JITTER_Y,
      ),
      r: HUB_RADIUS,
      hub: true,
      cluster,
      delay: 0,
    };
    hubs.push(hub);
    nodes.push(hub);
    for (let member = 0; member < MEMBERS_PER_CLUSTER; member += 1) {
      const angle =
        (member / MEMBERS_PER_CLUSTER) * 2 * Math.PI +
        random() * MEMBER_ANGLE_JITTER;
      const distance =
        CLUSTER_RADIUS *
        (MEMBER_DISTANCE_MIN + random() * MEMBER_DISTANCE_SPREAD);
      nodes.push({
        x: round(hub.x + Math.cos(angle) * distance),
        y: round(hub.y + Math.sin(angle) * distance),
        r: round(MEMBER_RADIUS_MIN + random() * MEMBER_RADIUS_SPREAD),
        hub: false,
        cluster,
        delay: round(-random() * BREATH_SECONDS),
      });
    }
  }

  const links: SceneLine[] = [];
  const members = nodes.filter((node) => !node.hub);
  for (const member of members) {
    links.push(line(hubs[member.cluster], member));
  }
  for (const hub of hubs) {
    const nearest = hubs
      .filter((other) => other.cluster > hub.cluster)
      .sort(
        (a, b) =>
          Math.hypot(a.x - hub.x, a.y - hub.y) -
          Math.hypot(b.x - hub.x, b.y - hub.y),
      )
      .slice(0, NEIGHBOUR_LINKS);
    for (const other of nearest) links.push(line(hub, other));
  }

  const matches: SceneMatch[] = [];
  const pick = (from: SceneNode[]) => from[Math.floor(random() * from.length)];
  for (let index = 0; index < MATCH_COUNT; index += 1) {
    const cluster = index % CLUSTERS;
    const from = pick(members.filter((node) => node.cluster === cluster));
    const to = pick(members.filter((node) => node.cluster !== cluster));
    matches.push({
      ...line(from, to),
      delay: round(index * MATCH_INTERVAL_SECONDS),
    });
  }

  return { width: SCENE_WIDTH, height: SCENE_HEIGHT, nodes, links, matches };
}

export const HERO_SIZE = 400;
export const HERO_SEED = 7;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const HERO_MEMBER_JITTER = 0.18;
const HERO_MEMBER_RADIUS_MIN = 1.8;
const HERO_MEMBER_RADIUS_SPREAD = 2;
/** The most centrality a member at a community's edge can draw at random,
 * so a few of them are larger than their place alone would make them. */
const HERO_EDGE_CENTRALITY_MAX = 0.5;
const HERO_NEIGHBOURS = 3;
const HERO_BRIDGE_RADIUS = 4.2;
const HERO_BRIDGE_REACH = 2;
/** How far a community's soft ground reaches past its outermost people. */
const HERO_GROUND_MARGIN = 16;
/** A bridge's halo, as a multiple of its radius. */
const HERO_HALO_SCALE = 4;
const HERO_PULSES = 8;
const HERO_PULSE_INTERVAL_SECONDS = 1.4;
export const HERO_PULSE_CYCLE_SECONDS =
  HERO_PULSES * HERO_PULSE_INTERVAL_SECONDS;

/** The communities: where each sits, how wide it is, how many people it
 * holds, and how near it is (1 is nearest: larger, brighter). Placed by
 * hand, so the picture is balanced. */
const HERO_COMMUNITIES = [
  { x: 98, y: 104, radius: 50, people: 17, depth: 1 },
  { x: 292, y: 72, radius: 36, people: 10, depth: 0.65 },
  { x: 314, y: 250, radius: 56, people: 19, depth: 1 },
  { x: 176, y: 336, radius: 40, people: 12, depth: 0.85 },
  { x: 58, y: 262, radius: 30, people: 8, depth: 0.6 },
] as const;

/** The people who bring people together: where each sits, and which
 * communities they join. */
const HERO_BRIDGES = [
  { x: 196, y: 82, joins: [0, 1] },
  { x: 320, y: 150, joins: [1, 2] },
  { x: 92, y: 326, joins: [3, 4] },
  { x: 196, y: 214, joins: [0, 2, 3] },
] as const;

/** A line between two nodes; `cluster` is the community it lies in, or -1
 * for a line from a bridge. */
export interface HeroLink extends SceneLine {
  cluster: number;
}

export interface HeroCommunity {
  x: number;
  y: number;
  /** The radius of the community's soft ground. */
  ground: number;
  depth: number;
  /** The indices of its people in `nodes`. */
  members: number[];
}

export interface HeroBridge {
  /** Its index in `nodes`. */
  node: number;
  /** The radius of the bridge's halo. */
  halo: number;
  joins: number[];
}

export interface HeroScene {
  size: number;
  /** Every person: the communities' members first, then the bridges. */
  nodes: SceneNode[];
  links: HeroLink[];
  /** For each node, the indices of the nodes it is joined to. */
  neighbours: number[][];
  /** The lines the idle pulses travel along, each with its start in the cycle. */
  pulses: SceneMatch[];
  communities: HeroCommunity[];
  bridges: HeroBridge[];
}

const distance = (a: SceneNode, b: SceneNode) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** The `count` indices among `among` whose nodes are nearest to `to`. */
const nearest = (
  nodes: SceneNode[],
  to: number,
  among: number[],
  count: number,
) =>
  among
    .filter((index) => index !== to)
    .sort(
      (a, b) => distance(nodes[to], nodes[a]) - distance(nodes[to], nodes[b]),
    )
    .slice(0, count);

/** The picture beside Home's opening statement (R-HOME-6): a few
 * communities, each a cluster of people joined to those nearest them, and a
 * few golden people bridging them. The idle pulses run out from the bridges.
 * Seeded like the project scene, so every build draws the same picture. */
export function heroScene(seed = HERO_SEED): HeroScene {
  const random = seeded(seed);
  const nodes: SceneNode[] = [];
  const pairs: { a: number; b: number; cluster: number }[] = [];
  const joined = (a: number, b: number) =>
    pairs.some(
      (pair) =>
        (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a),
    );

  const communities = HERO_COMMUNITIES.map((place, cluster) => {
    const turn = random() * 2 * Math.PI;
    const members: number[] = [];
    for (let index = 0; index < place.people; index += 1) {
      const angle = turn + index * GOLDEN_ANGLE;
      const reach =
        place.radius *
        Math.sqrt((index + 0.5) / place.people) *
        (1 + (random() - 0.5) * HERO_MEMBER_JITTER);
      const centrality = 1 - reach / place.radius;
      members.push(nodes.length);
      nodes.push({
        x: round(place.x + Math.cos(angle) * reach),
        y: round(place.y + Math.sin(angle) * reach),
        r: round(
          place.depth *
            (HERO_MEMBER_RADIUS_MIN +
              HERO_MEMBER_RADIUS_SPREAD *
                Math.max(centrality, random() * HERO_EDGE_CENTRALITY_MAX)),
        ),
        hub: false,
        cluster,
        delay: round(-random() * BREATH_SECONDS),
      });
    }
    for (const member of members) {
      for (const other of nearest(nodes, member, members, HERO_NEIGHBOURS)) {
        if (!joined(member, other))
          pairs.push({ a: member, b: other, cluster });
      }
    }
    return {
      x: place.x,
      y: place.y,
      ground: place.radius + HERO_GROUND_MARGIN,
      depth: place.depth,
      members,
    };
  });

  const bridges = HERO_BRIDGES.map((place, index) => {
    const node = nodes.length;
    nodes.push({
      x: place.x,
      y: place.y,
      r: HERO_BRIDGE_RADIUS,
      hub: true,
      cluster: -1,
      delay: round((index * BREATH_SECONDS) / HERO_BRIDGES.length),
    });
    for (const cluster of place.joins) {
      const members = communities[cluster].members;
      for (const member of nearest(nodes, node, members, HERO_BRIDGE_REACH)) {
        pairs.push({ a: node, b: member, cluster: -1 });
      }
    }
    return {
      node,
      halo: HERO_BRIDGE_RADIUS * HERO_HALO_SCALE,
      joins: [...place.joins],
    };
  });

  const neighbours: number[][] = nodes.map(() => []);
  for (const { a, b } of pairs) {
    neighbours[a].push(b);
    neighbours[b].push(a);
  }
  const links = pairs.map(({ a, b, cluster }) => ({
    ...line(nodes[a], nodes[b]),
    cluster,
  }));

  const pulses: SceneMatch[] = [];
  for (let index = 0; index < HERO_PULSES; index += 1) {
    const from = bridges[index % bridges.length].node;
    const to = neighbours[from][Math.floor(random() * neighbours[from].length)];
    pulses.push({
      ...line(nodes[from], nodes[to]),
      delay: round(index * HERO_PULSE_INTERVAL_SECONDS),
    });
  }

  return {
    size: HERO_SIZE,
    nodes,
    links,
    neighbours,
    pulses,
    communities,
    bridges,
  };
}
