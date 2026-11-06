import { getCollection, type CollectionEntry } from "astro:content";
import type { Topic } from "./journal";

/** A journal entry with the fields the ordering helpers in journal.ts read. */
export type Post = CollectionEntry<"journal"> & {
  date: Date;
  topic: Topic;
  featured: boolean;
};

/** Every post in content/journal. */
export async function allPosts(): Promise<Post[]> {
  const entries = await getCollection("journal");
  return entries.map((entry) => ({
    ...entry,
    date: entry.data.date,
    topic: entry.data.topic,
    featured: entry.data.featured,
  }));
}
