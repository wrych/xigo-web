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
