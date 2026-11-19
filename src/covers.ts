import { seeded } from "./scene.ts";
import type { Topic } from "./journal.ts";

/** The two frames a cover is drawn for: wide (16:9) where a cover leads,
 * card (4:3) where it sits beside a title in a list. `scale` thickens dots and
 * lines for the smaller frame; `density` thins out how many there are. */
export const COVER_SHAPES = {
  wide: { width: 800, height: 450, scale: 1, density: 1 },
  card: { width: 400, height: 300, scale: 1.45, density: 0.55 },
} as const;

export type CoverShape = keyof typeof COVER_SHAPES;

/** The site's tokens (src/styles/global.css), fixed here so a cover is a
 * picture on its own; a test keeps the two the same. */
export const COVER_PALETTE = {
  ground: "#0e0e0f",
  surface: "#161618",
  text: "#edebe6",
  accent: "#e6c79c",
} as const;

const { ground, surface, text, accent } = COVER_PALETTE;

const PLACEMENT_TRIES = 400;
const FEWEST = 2;
const MEMBER_RADIUS = 2.2;
const HUB_RADIUS = 3.6;
const HALO_RADIUS = 28;
const LINE_WIDTH = 0.8;
const GOLD_LINE_WIDTH = 1.1;
const DASH = { dot: 2, gap: 5 };
const PERSON = { size: [0.7, 1.15], opacity: [0.45, 0.8] };
const LIT = { size: 1.15, opacity: 0.85 };
const FAINT = { size: [0.6, 0.95], opacity: [0.15, 0.35] };
const GOLD = { size: 1, small: 0.75 };
const FOCUS = { size: 1.6, halo: 2.4 };
const DUST = { count: 60, radius: [0.5, 1.1], opacity: [0.04, 0.12] };
const GLOW = { reach: 0.62, centre: 0.2, middle: 0.07, middleAt: 0.35 };
const HALO = { centre: 0.45, middle: 0.12, middleAt: 0.4 };
const SHADE = { reach: 0.75, from: 0.55, opacity: 0.75 };

const DECISIONS = {
  offset: [0.1, 0.16],
  height: [0.44, 0.56],
  sources: 30,
  reach: 0.6,
  distance: [0.28, 1],
  flatten: 0.62,
  margin: 14,
  bend: 0.22,
  goldEvery: 7,
  opacity: [0.1, 0.24],
  goldOpacity: 0.5,
  width: 0.7,
  goldWidth: 1,
  rings: [
    { radius: 16, opacity: 0.35 },
    { radius: 30, opacity: 0.14 },
  ],
};

const SELF_ORGANIZATION = {
  clusters: { wide: [3, 4], card: [3, 3] },
  radius: { wide: 0.22, card: 0.2 },
  left: 0.18,
  spread: 0.64,
  stagger: 0.13,
  jitter: { x: 0.03, y: 0.05 },
  largest: 1.15,
  smaller: [0.8, 1],
  members: { largest: 12, other: 9 },
  distance: [0.12, 1],
  apart: 16,
  neighbours: 2,
  spoke: 0.6,
  halo: 0.8,
  bridgeOpacity: 0.16,
  lineOpacity: 0.22,
  spokeOpacity: 0.32,
};

const CHANGE = {
  streams: { wide: 5, card: 4 },
  movers: { wide: 3, card: 2 },
  frequency: [0.7, 1.1],
  amplitude: [0.07, 0.1],
  rise: 0.16,
  top: 0.24,
  span: 0.52,
  lean: 0.35,
  leaderAt: 0.72,
  moversFrom: 0.14,
  moversSpan: 0.78,
  moverJitter: [0.15, 0.85],
  samples: 40,
  trailSamples: 12,
  trail: [60, 120],
  leaderTrail: 150,
  ghosts: 4,
  ghostGap: 9,
  ghost: 0.3,
  leaderGhost: 0.45,
  goldEvery: 4,
  streamOpacity: 0.09,
  trailOpacity: 0.24,
  leaderOpacity: 0.5,
};

const TRUST = {
  pairs: 15,
  offset: 0.08,
  height: [0.44, 0.56],
  area: { x: [0.07, 0.93], y: [0.12, 0.88] },
  clear: 0.2,
  apart: 0.12,
  half: [12, 20],
  centreHalf: 44,
  tilt: 0.35,
  bow: 17,
  arcs: [
    { reach: 1, opacity: 0.55 },
    { reach: 2.1, opacity: 0.18 },
  ],
  bondOpacity: 0.5,
  tieOpacity: 0.1,
  tieGap: 6,
  centreLineOpacity: 0.3,
  pair: { size: 1.35, halo: 1.4 },
};

const SOFTWARE = {
  grid: {
    wide: { columns: 19, rows: 10, routes: 5 },
    card: { columns: 11, rows: 8, routes: 3 },
  },
  fromCentre: 2,
  home: { columns: [0.36, 0.64], rows: [0.3, 0.7] },
  steps: [3, 6],
  longest: 4,
  ringRadius: 13,
  routeOpacity: 0.3,
  goldOpacity: 0.6,
  routeWidth: 0.9,
  quietSize: 0.5,
  quietOpacity: 0.24,
};

const EVENTS = {
  offset: 0.05,
  radius: 0.3,
  circle: 16,
  crowd: 34,
  jitter: { angle: 0.08, radius: 0.07 },
  innerRing: 0.45,
  crowdReach: [1.35, 2.3],
  crowdStretch: 1.25,
  goldEvery: 5,
  ringOpacity: 0.08,
  innerOpacity: 0.16,
  circleOpacity: 0.3,
  spokeOpacity: 0.07,
};

const NEWS = {
  offset: [0.08, 0.16],
  height: [0.42, 0.58],
  gap: 0.13,
  ripples: 7,
  rippleOpacity: 0.42,
  people: 44,
  reached: 7,
  reachedRipples: 4,
  clear: 0.7,
  closeTo: 0.12,
  goldEvery: 3,
  core: 2,
  dash: { dot: 1.5, gap: 4 },
};

/** A 32-bit FNV-1a hash: the seed a slug gives its cover. */
export function hash(value: string): number {
  let state = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    state ^= value.charCodeAt(index);
    state = Math.imul(state, 0x01000193);
  }
  return state >>> 0;
}

const n = (value: number) => String(Math.round(value * 10) / 10);
const percent = (value: number) => `${n(value * 100)}%`;

interface Point {
  x: number;
  y: number;
}

interface Canvas {
  shape: CoverShape;
  w: number;
  h: number;
  scale: number;
  density: number;
  id: string;
  random: () => number;
  lines: string[];
  dots: string[];
  focus: Point;
}

const between = (c: Canvas, [min, max]: readonly number[]) =>
  min + c.random() * (max - min);
const around = (c: Canvas, spread: number) => between(c, [-spread, spread]);
const either = (c: Canvas) => (c.random() < 0.5 ? -1 : 1);
const turn = (c: Canvas) => c.random() * 2 * Math.PI;
const count = (c: Canvas, wide: number) =>
  Math.max(FEWEST, Math.round(wide * c.density));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const toward = (from: Point, angle: number, far: number, stretch = 1) => ({
  x: from.x + Math.cos(angle) * far * stretch,
  y: from.y + Math.sin(angle) * far,
});
const dashes = (c: Canvas, dash = DASH) =>
  `${n(dash.dot * c.scale)} ${n(dash.gap * c.scale)}`;
const polyline = (points: Point[]) =>
  points
    .map((p, index) => `${index === 0 ? "M" : "L"}${n(p.x)} ${n(p.y)}`)
    .join("");

function line(c: Canvas, a: Point, b: Point, opacity: number, gold = false) {
  const width = gold ? GOLD_LINE_WIDTH : LINE_WIDTH;
  c.lines.push(
    `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${gold ? accent : text}" stroke-opacity="${percent(opacity)}" stroke-width="${n(c.scale * width)}"/>`,
  );
}

function path(
  c: Canvas,
  d: string,
  opacity: number,
  { gold = false, width = LINE_WIDTH, dash = "" } = {},
) {
  const dashed = dash ? ` stroke-dasharray="${dash}"` : "";
  c.lines.push(
    `<path d="${d}" fill="none" stroke="${gold ? accent : text}" stroke-opacity="${percent(opacity)}" stroke-width="${n(c.scale * width)}" stroke-linecap="round"${dashed}/>`,
  );
}

function ring(c: Canvas, at: Point, r: number, opacity: number, dash = "") {
  const dashed = dash ? ` stroke-dasharray="${dash}"` : "";
  c.lines.push(
    `<circle cx="${n(at.x)}" cy="${n(at.y)}" r="${n(r)}" fill="none" stroke="${accent}" stroke-opacity="${percent(opacity)}" stroke-width="${n(c.scale * LINE_WIDTH)}"${dashed}/>`,
  );
}

function dot(c: Canvas, at: Point, r: number, colour: string, opacity = 1) {
  c.dots.push(
    `<circle cx="${n(at.x)}" cy="${n(at.y)}" r="${n(r)}" fill="${colour}" fill-opacity="${percent(opacity)}"/>`,
  );
}

function member(c: Canvas, at: Point, size: number, opacity: number) {
  dot(c, at, MEMBER_RADIUS * c.scale * size, text, opacity);
}

const person = (c: Canvas, at: Point) =>
  member(c, at, between(c, PERSON.size), between(c, PERSON.opacity));
const lit = (c: Canvas, at: Point) => member(c, at, LIT.size, LIT.opacity);
const faint = (c: Canvas, at: Point) =>
  member(c, at, between(c, FAINT.size), between(c, FAINT.opacity));

function hub(c: Canvas, at: Point, size = GOLD.size, halo = 0) {
  if (halo > 0) {
    c.dots.push(
      `<circle cx="${n(at.x)}" cy="${n(at.y)}" r="${n(HALO_RADIUS * c.scale * halo)}" fill="url(#${c.id}-halo)"/>`,
    );
  }
  dot(c, at, HUB_RADIUS * c.scale * size, accent);
}

const focal = (c: Canvas, at: Point) => hub(c, at, FOCUS.size, FOCUS.halo);

function decisions(c: Canvas) {
  const focus = {
    x: c.w * (0.5 + either(c) * between(c, DECISIONS.offset)),
    y: c.h * between(c, DECISIONS.height),
  };
  c.focus = focus;
  const sources = count(c, DECISIONS.sources);
  const reach = Math.hypot(c.w, c.h) * DECISIONS.reach;
  const margin = DECISIONS.margin * c.scale;
  let drawn = 0;
  for (let tries = 0; drawn < sources && tries < PLACEMENT_TRIES; tries += 1) {
    const angle = turn(c);
    const far = between(c, DECISIONS.distance) * reach;
    const source = {
      x: focus.x + Math.cos(angle) * far,
      y: focus.y + Math.sin(angle) * far * DECISIONS.flatten,
    };
    if (
      source.x < margin ||
      source.x > c.w - margin ||
      source.y < margin ||
      source.y > c.h - margin
    ) {
      continue;
    }
    const gold = drawn % DECISIONS.goldEvery === DECISIONS.goldEvery >> 1;
    drawn += 1;
    const bend = around(c, DECISIONS.bend) * distance(source, focus);
    const mid = {
      x: (source.x + focus.x) / 2 - Math.sin(angle) * bend,
      y: (source.y + focus.y) / 2 + Math.cos(angle) * bend,
    };
    path(
      c,
      `M${n(source.x)} ${n(source.y)}Q${n(mid.x)} ${n(mid.y)} ${n(focus.x)} ${n(focus.y)}`,
      gold ? DECISIONS.goldOpacity : between(c, DECISIONS.opacity),
      { gold, width: gold ? DECISIONS.goldWidth : DECISIONS.width },
    );
    if (gold) hub(c, source, GOLD.small);
    else person(c, source);
  }
  for (const { radius, opacity } of DECISIONS.rings) {
    ring(c, focus, radius * c.scale, opacity);
  }
  focal(c, focus);
}

function selfOrganization(c: Canvas) {
  const [fewest, most] = SELF_ORGANIZATION.clusters[c.shape];
  const clusters = fewest + Math.floor(c.random() * (most - fewest + 1));
  const radius = Math.min(c.w, c.h) * SELF_ORGANIZATION.radius[c.shape];
  const { jitter } = SELF_ORGANIZATION;
  const hubs: Point[] = [];
  const lift = either(c);
  for (let index = 0; index < clusters; index += 1) {
    const stagger = (index % 2 === 0 ? -1 : 1) * lift;
    hubs.push({
      x:
        c.w * SELF_ORGANIZATION.left +
        (c.w * SELF_ORGANIZATION.spread * index) / (clusters - 1) +
        around(c, jitter.x) * c.w,
      y:
        c.h * (0.5 + stagger * SELF_ORGANIZATION.stagger) +
        around(c, jitter.y) * c.h,
    });
  }
  const largest = Math.floor(c.random() * clusters);
  hubs.forEach((centre, index) => {
    const next = hubs[index + 1];
    if (next) {
      path(c, polyline([centre, next]), SELF_ORGANIZATION.bridgeOpacity, {
        dash: dashes(c),
      });
    }
    const isLargest = index === largest;
    const size =
      radius *
      (isLargest
        ? SELF_ORGANIZATION.largest
        : between(c, SELF_ORGANIZATION.smaller));
    const members: Point[] = [];
    const { members: sizes } = SELF_ORGANIZATION;
    const wanted = count(c, isLargest ? sizes.largest : sizes.other);
    const apart = SELF_ORGANIZATION.apart * c.scale;
    for (
      let tries = 0;
      members.length < wanted && tries < PLACEMENT_TRIES;
      tries += 1
    ) {
      const angle = turn(c);
      const far = Math.sqrt(between(c, SELF_ORGANIZATION.distance)) * size;
      const at = toward(centre, angle, far);
      if (members.every((other) => distance(other, at) > apart)) {
        members.push(at);
      }
    }
    for (const at of members) {
      const nearest = [...members, centre]
        .filter((other) => other !== at)
        .sort((a, b) => distance(a, at) - distance(b, at))
        .slice(0, SELF_ORGANIZATION.neighbours);
      for (const other of nearest) {
        line(c, at, other, SELF_ORGANIZATION.lineOpacity);
      }
      if (distance(at, centre) < size * SELF_ORGANIZATION.spoke) {
        line(c, at, centre, SELF_ORGANIZATION.spokeOpacity, true);
      }
      person(c, at);
    }
    if (isLargest) focal(c, centre);
    else hub(c, centre, GOLD.size, SELF_ORGANIZATION.halo);
  });
  c.focus = hubs[largest];
}

function change(c: Canvas) {
  const streams = CHANGE.streams[c.shape];
  const movers = CHANGE.movers[c.shape];
  const frequency = between(c, CHANGE.frequency);
  const phase = turn(c);
  const amplitude = c.h * between(c, CHANGE.amplitude);
  const at = (lane: number, x: number) => ({
    x,
    y:
      c.h * (CHANGE.top + (lane * CHANGE.span) / (streams - 1)) +
      amplitude *
        Math.sin(
          (x / c.w) * 2 * Math.PI * frequency + phase + lane * CHANGE.lean,
        ) -
      c.h * CHANGE.rise * (x / c.w - 0.5),
  });
  const along = (lane: number, from: number, to: number, samples: number) =>
    Array.from({ length: samples + 1 }, (_, step) =>
      at(lane, from + ((to - from) * step) / samples),
    );
  const leader = Math.floor(streams / 2);
  for (let lane = 0; lane < streams; lane += 1) {
    path(
      c,
      polyline(along(lane, 0, c.w, CHANGE.samples)),
      CHANGE.streamOpacity,
    );
    for (let index = 0; index < movers; index += 1) {
      const isLeader = lane === leader && index === movers - 1;
      const x =
        c.w *
        (CHANGE.moversFrom +
          ((index + between(c, CHANGE.moverJitter)) * CHANGE.moversSpan) /
            movers);
      const head = at(lane, isLeader ? c.w * CHANGE.leaderAt : x);
      const length =
        (isLeader ? CHANGE.leaderTrail : between(c, CHANGE.trail)) * c.scale;
      path(
        c,
        polyline(along(lane, head.x, head.x - length, CHANGE.trailSamples)),
        isLeader ? CHANGE.leaderOpacity : CHANGE.trailOpacity,
        { gold: isLeader, width: isLeader ? GOLD_LINE_WIDTH : LINE_WIDTH },
      );
      for (let ghost = 1; ghost <= CHANGE.ghosts; ghost += 1) {
        const fade = 1 - ghost / (CHANGE.ghosts + 1);
        dot(
          c,
          at(lane, head.x - ghost * CHANGE.ghostGap * c.scale),
          MEMBER_RADIUS * c.scale * (isLeader ? FOCUS.size : 1) * fade,
          isLeader ? accent : text,
          fade * (isLeader ? CHANGE.leaderGhost : CHANGE.ghost),
        );
      }
      if (isLeader) {
        c.focus = head;
        focal(c, head);
      } else if ((lane + index) % CHANGE.goldEvery === 1) hub(c, head);
      else lit(c, head);
    }
  }
}

function trust(c: Canvas) {
  const pairs: Point[] = [];
  const centre = {
    x: c.w * (0.5 + around(c, TRUST.offset)),
    y: c.h * between(c, TRUST.height),
  };
  const wanted = count(c, TRUST.pairs);
  for (
    let tries = 0;
    pairs.length < wanted && tries < PLACEMENT_TRIES;
    tries += 1
  ) {
    const at = {
      x: between(c, TRUST.area.x) * c.w,
      y: between(c, TRUST.area.y) * c.h,
    };
    if (
      distance(at, centre) > TRUST.clear * c.w &&
      pairs.every((other) => distance(other, at) > TRUST.apart * c.w)
    ) {
      pairs.push(at);
    }
  }
  const ends = (middle: Point, angle: number, half: number) => [
    toward(middle, angle + Math.PI, half),
    toward(middle, angle, half),
  ];
  for (const at of pairs) {
    const nearest = pairs
      .filter((other) => other !== at)
      .sort((a, b) => distance(a, at) - distance(b, at))[0];
    if (nearest) {
      path(c, polyline([at, nearest]), TRUST.tieOpacity, {
        dash: dashes(c, { dot: DASH.dot, gap: TRUST.tieGap }),
      });
    }
    const [a, b] = ends(
      at,
      c.random() * Math.PI,
      between(c, TRUST.half) * c.scale,
    );
    line(c, a, b, TRUST.bondOpacity);
    const tone = between(c, PERSON.opacity);
    member(c, a, LIT.size, tone);
    member(c, b, LIT.size, tone);
  }
  const angle = around(c, TRUST.tilt);
  const [a, b] = ends(centre, angle, TRUST.centreHalf * c.scale);
  for (const { reach, opacity } of TRUST.arcs) {
    for (const sign of [-1, 1]) {
      const bend = TRUST.bow * c.scale * reach * sign;
      path(
        c,
        `M${n(a.x)} ${n(a.y)}Q${n(centre.x + Math.sin(angle) * bend)} ${n(centre.y - Math.cos(angle) * bend)} ${n(b.x)} ${n(b.y)}`,
        opacity,
        { gold: true, width: GOLD_LINE_WIDTH },
      );
    }
  }
  line(c, a, b, TRUST.centreLineOpacity, true);
  hub(c, a, TRUST.pair.size, TRUST.pair.halo);
  hub(c, b, TRUST.pair.size, TRUST.pair.halo);
  c.focus = centre;
}

function software(c: Canvas) {
  const { columns, rows, routes } = SOFTWARE.grid[c.shape];
  const gap = Math.min(c.w / (columns + 1), c.h / (rows + 1));
  const left = (c.w - gap * (columns - 1)) / 2;
  const top = (c.h - gap * (rows - 1)) / 2;
  const cell = (col: number, row: number) => ({
    x: left + col * gap,
    y: top + row * gap,
  });
  const routed = new Set<string>();
  const home = {
    col: Math.floor(columns * between(c, SOFTWARE.home.columns)),
    row: Math.floor(rows * between(c, SOFTWARE.home.rows)),
  };
  const focus = cell(home.col, home.row);
  let end: Point | undefined;
  for (let route = 0; route < routes; route += 1) {
    const fromHome = route < SOFTWARE.fromCentre;
    let col = fromHome ? home.col : Math.floor(c.random() * columns);
    let row = fromHome ? home.row : Math.floor(c.random() * rows);
    const [fewest, most] = SOFTWARE.steps;
    const steps = fewest + Math.floor(c.random() * (most - fewest + 1));
    const points = [cell(col, row)];
    routed.add(`${col},${row}`);
    let horizontal = c.random() < 0.5;
    for (let step = 0; step < steps; step += 1) {
      const length = 1 + Math.floor(c.random() * SOFTWARE.longest);
      let direction = either(c);
      const [now, limit] = horizontal ? [col, columns] : [row, rows];
      if (now + direction * length < 0 || now + direction * length >= limit) {
        direction = -direction;
      }
      const next = Math.min(limit - 1, Math.max(0, now + direction * length));
      if (horizontal) col = next;
      else row = next;
      horizontal = !horizontal;
      points.push(cell(col, row));
      routed.add(`${col},${row}`);
    }
    const gold = route === 0;
    path(
      c,
      polyline(points),
      gold ? SOFTWARE.goldOpacity : SOFTWARE.routeOpacity,
      { gold, width: gold ? GOLD_LINE_WIDTH : SOFTWARE.routeWidth },
    );
    if (gold) end = points[points.length - 1];
  }
  const same = (a: Point, b?: Point) => b && a.x === b.x && a.y === b.y;
  for (let col = 0; col < columns; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      const p = cell(col, row);
      if (same(p, focus) || same(p, end)) continue;
      if (routed.has(`${col},${row}`)) lit(c, p);
      else member(c, p, SOFTWARE.quietSize, SOFTWARE.quietOpacity);
    }
  }
  if (end && !same(end, focus)) hub(c, end, GOLD.small);
  ring(c, focus, SOFTWARE.ringRadius * c.scale, SOFTWARE.routeOpacity);
  focal(c, focus);
  c.focus = focus;
}

function events(c: Canvas) {
  const centre = { x: c.w * (0.5 + around(c, EVENTS.offset)), y: c.h * 0.5 };
  const radius = c.h * EVENTS.radius;
  const inner = count(c, EVENTS.circle);
  const offset = turn(c);
  const circle: Point[] = [];
  for (let index = 0; index < inner; index += 1) {
    const angle =
      offset + (index / inner) * 2 * Math.PI + around(c, EVENTS.jitter.angle);
    circle.push(
      toward(centre, angle, radius * (1 + around(c, EVENTS.jitter.radius))),
    );
  }
  ring(c, centre, radius, EVENTS.ringOpacity);
  ring(c, centre, radius * EVENTS.innerRing, EVENTS.innerOpacity, dashes(c));
  circle.forEach((at, index) => {
    line(c, at, circle[(index + 1) % inner], EVENTS.circleOpacity);
    if (index % 2 === 0) line(c, at, centre, EVENTS.spokeOpacity, true);
  });
  const crowd = count(c, EVENTS.crowd);
  for (let index = 0; index < crowd; index += 1) {
    const angle = turn(c);
    const far = radius * between(c, EVENTS.crowdReach);
    faint(c, toward(centre, angle, far, EVENTS.crowdStretch));
  }
  circle.forEach((at, index) => {
    if (index % EVENTS.goldEvery === EVENTS.goldEvery >> 1) hub(c, at);
    else lit(c, at);
  });
  focal(c, centre);
  c.focus = centre;
}

function news(c: Canvas) {
  const source = {
    x: c.w * (0.5 + either(c) * between(c, NEWS.offset)),
    y: c.h * between(c, NEWS.height),
  };
  const gap = c.h * NEWS.gap;
  for (let index = 1; index <= NEWS.ripples; index += 1) {
    ring(
      c,
      source,
      gap * index,
      NEWS.rippleOpacity * (1 - index / (NEWS.ripples + 1)),
      index % 2 === 0 ? dashes(c, NEWS.dash) : "",
    );
  }
  const people = count(c, NEWS.people);
  for (let index = 0; index < people; index += 1) {
    const at = { x: c.random() * c.w, y: c.random() * c.h };
    const far = distance(at, source);
    if (far < gap * NEWS.clear) continue;
    const nearest = Math.round(far / gap);
    const onRipple =
      nearest <= NEWS.ripples &&
      Math.abs(far - nearest * gap) < gap * NEWS.closeTo;
    if (onRipple) lit(c, at);
    else faint(c, at);
  }
  const reached = count(c, NEWS.reached);
  for (let index = 0; index < reached; index += 1) {
    const angle = turn(c);
    const far = gap * (1 + Math.floor(c.random() * NEWS.reachedRipples));
    const at = toward(source, angle, far);
    if (index % NEWS.goldEvery === 0) hub(c, at, GOLD.small);
    else lit(c, at);
  }
  focal(c, source);
  dot(c, source, NEWS.core * c.scale, text);
  c.focus = source;
}

/** One composition per topic (R-JOUR-6), each a picture of what the topic is
 * about, drawn in the same dots, lines, gold and light. */
export const COMPOSITIONS: Record<Topic, (canvas: Canvas) => void> = {
  news,
  events,
  "self-organization": selfOrganization,
  decisions,
  change,
  trust,
  software,
};

/** The cover for a post, as an SVG element: its slug seeds it, its topic
 * shapes it. Decorative, so hidden from assistive technology — the title
 * stands beside it. */
export function coverSvg(
  slug: string,
  topic: Topic,
  shape: CoverShape = "wide",
): string {
  const { width: w, height: h, scale, density } = COVER_SHAPES[shape];
  const seed = hash(`${topic}:${slug}`);
  const id = `cover-${seed.toString(36)}-${shape}`;
  const c: Canvas = {
    shape,
    w,
    h,
    scale,
    density,
    id,
    random: seeded(seed),
    lines: [],
    dots: [],
    focus: { x: w / 2, y: h / 2 },
  };
  for (let index = 0; index < count(c, DUST.count); index += 1) {
    const at = { x: c.random() * w, y: c.random() * h };
    dot(c, at, between(c, DUST.radius) * scale, text, between(c, DUST.opacity));
  }
  const dust = c.dots.splice(0);
  COMPOSITIONS[topic](c);
  const { x, y } = c.focus;
  const stop = (offset: number, colour: string, opacity: number) =>
    `<stop offset="${offset}" stop-color="${colour}" stop-opacity="${opacity}"/>`;
  return [
    `<svg class="cover-art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-topic="${topic}">`,
    "<defs>",
    `<linearGradient id="${id}-ground" x1="0" y1="0" x2="1" y2="1">${stop(0, surface, 1)}${stop(1, ground, 1)}</linearGradient>`,
    `<radialGradient id="${id}-glow" gradientUnits="userSpaceOnUse" cx="${n(x)}" cy="${n(y)}" r="${n(w * GLOW.reach)}">${stop(0, accent, GLOW.centre)}${stop(GLOW.middleAt, accent, GLOW.middle)}${stop(1, accent, 0)}</radialGradient>`,
    `<radialGradient id="${id}-halo">${stop(0, accent, HALO.centre)}${stop(HALO.middleAt, accent, HALO.middle)}${stop(1, accent, 0)}</radialGradient>`,
    `<radialGradient id="${id}-shade" cx="0.5" cy="0.5" r="${SHADE.reach}">${stop(SHADE.from, ground, 0)}${stop(1, ground, SHADE.opacity)}</radialGradient>`,
    "</defs>",
    `<rect width="${w}" height="${h}" fill="url(#${id}-ground)"/>`,
    `<rect width="${w}" height="${h}" fill="url(#${id}-glow)"/>`,
    ...dust,
    ...c.lines,
    ...c.dots,
    `<rect width="${w}" height="${h}" fill="url(#${id}-shade)"/>`,
    "</svg>",
  ].join("");
}
