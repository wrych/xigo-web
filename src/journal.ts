/** The journal's topics and how they are named on the site (specs/content.md). */
export const TOPICS = {
  news: "News",
  events: "Events",
  "self-organization": "Self-organization",
  decisions: "Decisions",
  change: "Change",
  trust: "Trust",
  software: "Software",
} as const;

export type Topic = keyof typeof TOPICS;

export const WORDS_PER_MINUTE = 200;

/** The widths a cover is made in, for every page that shows one (R-CONT-4). */
export const COVER_WIDTHS = [480, 960, 1440];

interface Dated {
  id?: string;
  date: Date;
  featured?: boolean;
  topic: string;
}

/** Posts ordered newest first: the one order every list of posts uses. */
export function newestFirst<T extends Dated>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** The journal page's order: the featured post, then the others newest
 * first. Without a featured post the newest leads. More than one featured
 * post is a content error and fails the build (R-CONT-2). */
export function journalOrder<T extends Dated>(
  posts: readonly T[],
): { lead: T | undefined; rest: T[] } {
  const featured = posts.filter((post) => post.featured === true);
  if (featured.length > 1) {
    const names = featured.map((post) => post.id ?? "a post").join(", ");
    throw new Error(
      `featured: true is set on ${names}; at most one post may be featured`,
    );
  }
  const ordered = newestFirst(posts);
  const lead = featured[0] ?? ordered[0];
  return { lead, rest: ordered.filter((post) => post !== lead) };
}

/** The posts on one topic, newest first (R-JOUR-2). */
export function onTopic<T extends Dated>(
  posts: readonly T[],
  topic: Topic,
): T[] {
  return newestFirst(posts.filter((post) => post.topic === topic));
}

/** The topics that have at least one post, in the order TOPICS lists them. */
export function usedTopics(posts: readonly Dated[]): Topic[] {
  const used = new Set(posts.map((post) => post.topic));
  return (Object.keys(TOPICS) as Topic[]).filter((topic) => used.has(topic));
}

/** Whole minutes to read `text` at WORDS_PER_MINUTE, never less than one. */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter((word) => word !== "").length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A date as the site shows it: "3 Mar 2026". */
export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}
