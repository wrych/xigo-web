/** The topics a project can carry and how they are named (specs/content.md). */
export const PROJECT_TOPICS = {
  events: "Events",
  communities: "Communities",
  organisations: "Organisations",
  "open-source": "Open source",
} as const;

export type ProjectTopic = keyof typeof PROJECT_TOPICS;

/** The animated scenes a project page may open with instead of its image. */
export const SCENES = ["network"] as const;

interface Project {
  id?: string;
  year: number;
  featured?: boolean;
}

/** Work's order: the featured project, then the others newest first
 * (R-WORK-1). More than one featured project fails the build (R-CONT-2). */
export function workOrder<T extends Project>(projects: readonly T[]): T[] {
  const featured = projects.filter((project) => project.featured === true);
  if (featured.length > 1) {
    const names = featured.map((project) => project.id ?? "a project");
    throw new Error(
      `featured: true is set on ${names.join(", ")}; at most one project may be featured`,
    );
  }
  const rest = projects
    .filter((project) => project.featured !== true)
    .sort((a, b) => b.year - a.year);
  return [...featured, ...rest];
}

/** How many projects Home shows: the featured one and two more (R-HOME-3). */
export const HOME_PROJECT_COUNT = 3;

/** Home's projects: the first of Work's order shown large, then the next
 * ones (R-HOME-3). */
export function showcase<T extends Project>(
  projects: readonly T[],
  count = HOME_PROJECT_COUNT,
): { lead: T | undefined; more: T[] } {
  const [lead, ...more] = workOrder(projects).slice(0, count);
  return { lead, more };
}
