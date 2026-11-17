import { getCollection, type CollectionEntry } from "astro:content";
import { workOrder } from "./work";

/** A work entry with the fields the ordering helper in work.ts reads. */
export type Project = CollectionEntry<"work"> & {
  year: number;
  featured: boolean;
};

/** Every project in content/work, in Work's order (R-WORK-1). */
export async function allProjects(): Promise<Project[]> {
  const entries = await getCollection("work");
  return workOrder(
    entries.map((entry) => ({
      ...entry,
      year: entry.data.year,
      featured: entry.data.featured,
    })),
  );
}
