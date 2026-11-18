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

/** The network beside Home's opening statement (R-HOME-6): people scattered
 * over a disc, each joined to those near them, every few a golden hub.
 * Seeded like the project scene, so every build draws the same picture. */
export const HERO_SIZE = 400;
export const HERO_SEED = 7;
const HERO_NODES = 46;
const HERO_RADIUS = 170;
const HERO_LINK_DISTANCE = 62;
const HERO_HUB_EVERY = 6;
const HERO_HUB_RADIUS = 3.4;
const HERO_MEMBER_RADIUS = 1.8;

export interface HeroScene {
  size: number;
  nodes: SceneNode[];
  links: SceneLine[];
}

export function heroScene(seed = HERO_SEED): HeroScene {
  const random = seeded(seed);
  const centre = HERO_SIZE / 2;
  const nodes: SceneNode[] = [];
  for (let index = 0; index < HERO_NODES; index += 1) {
    const angle = random() * 2 * Math.PI;
    const distance = Math.sqrt(random()) * HERO_RADIUS;
    const hub = index % HERO_HUB_EVERY === 0;
    nodes.push({
      x: round(centre + Math.cos(angle) * distance),
      y: round(centre + Math.sin(angle) * distance),
      r: hub ? HERO_HUB_RADIUS : HERO_MEMBER_RADIUS,
      hub,
      cluster: 0,
      delay: round(-random() * BREATH_SECONDS),
    });
  }
  const links: SceneLine[] = [];
  nodes.forEach((a, i) => {
    for (const b of nodes.slice(i + 1)) {
      if (Math.hypot(a.x - b.x, a.y - b.y) < HERO_LINK_DISTANCE) {
        links.push(line(a, b));
      }
    }
  });
  return { size: HERO_SIZE, nodes, links };
}
