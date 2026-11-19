/** The topics a project can carry and how they are named (specs/content.md). */
export const PROJECT_TOPICS = {
  events: "Events",
  communities: "Communities",
  organisations: "Organisations",
  "open-source": "Open source",
} as const;

export type ProjectTopic = keyof typeof PROJECT_TOPICS;

/** The animated scenes a project page may show in its text (R-WORK-4). */
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

/** Splits a project's rendered text where the section headed `id` ends: at
 * the next heading of the same or a higher level, or at the end of the text.
 * The scene goes in between (R-WORK-4). A heading that is not there is a
 * content error naming it (R-CONT-2). */
export function splitAfterSection(html: string, id: string): [string, string] {
  const literal = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = new RegExp(`<h([1-6])[^>]*\\sid="${literal}"`).exec(html);
  if (!heading) {
    throw new Error(
      `sceneAfter: "${id}" names no heading in the project's text`,
    );
  }
  const level = Number(heading[1]);
  const rest = html.slice(heading.index + heading[0].length);
  const next = new RegExp(`<h[1-${level}][\\s>]`).exec(rest);
  const at = next
    ? heading.index + heading[0].length + next.index
    : html.length;
  return [html.slice(0, at), html.slice(at)];
}

/** What the facts strip can say about a project (specs/content.md). */
export interface ProjectFactsSource {
  year: number;
  license?: string;
  launch?: { date: Date; event: string; stage?: string };
  team?: { name: string; organisation?: string; part: string }[];
}

export interface Fact {
  label: string;
  values: { text: string; note?: string }[];
}

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);

/** The facts strip: only the facts the front matter holds, in a fixed
 * order (R-WORK-5). Nothing is filled in that is not there. */
export function projectFacts(
  project: ProjectFactsSource,
  formatDate: (date: Date) => string,
): Fact[] {
  const facts: Fact[] = [
    { label: "Year", values: [{ text: String(project.year) }] },
  ];
  if (project.launch) {
    const { date, event, stage } = project.launch;
    facts.push({
      label: stage ? `${capitalise(stage)} launched` : "Launched",
      values: [{ text: formatDate(date), note: event }],
    });
  }
  if (project.license) {
    facts.push({ label: "License", values: [{ text: project.license }] });
  }
  if (project.team && project.team.length > 0) {
    facts.push({
      label: "Made by",
      values: project.team.map((person) => ({
        text: person.organisation
          ? `${person.name}, ${person.organisation}`
          : person.name,
        note: person.part,
      })),
    });
  }
  return facts;
}
