import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { TOPICS, type Topic } from "./journal";
import { PROJECT_TOPICS, SCENES, type ProjectTopic } from "./work";

const AUTHORS = ["Ivo Pejakovic", "Andy Moesch"] as const;

const journal = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./content/journal",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z
    .object({
      title: z.string().min(1),
      date: z.coerce.date(),
      author: z.enum(AUTHORS),
      topic: z.enum(Object.keys(TOPICS) as [Topic, ...Topic[]]),
      excerpt: z.string().min(1),
      featured: z.boolean().default(false),
      original: z
        .object({
          site: z.string().min(1),
          date: z.coerce.date(),
          url: z.url(),
        })
        .optional(),
    })
    .strict(),
});

const people = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./content/people",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z
    .object({
      name: z.enum(AUTHORS),
      role: z.string().min(1),
      linkedin: z.url().optional(),
    })
    .strict(),
});

const work = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./content/work",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        year: z.number().int(),
        summary: z.string().min(1),
        topics: z
          .array(
            z.enum(
              Object.keys(PROJECT_TOPICS) as [ProjectTopic, ...ProjectTopic[]],
            ),
          )
          .min(1),
        image: image(),
        imageAlt: z.string().min(1),
        scene: z.enum(SCENES).optional(),
        sceneAfter: z.string().min(1).optional(),
        figures: z
          .array(
            z
              .object({
                image: image(),
                alt: z.string().min(1),
                caption: z.string().min(1).optional(),
              })
              .strict(),
          )
          .default([]),
        source: z.url().optional(),
        license: z.string().min(1).optional(),
        featured: z.boolean().default(false),
      })
      .strict()
      .refine(
        (project) =>
          project.sceneAfter === undefined || project.scene !== undefined,
        {
          message: "sceneAfter needs a scene (R-WORK-4)",
          path: ["sceneAfter"],
        },
      ),
});

export const collections = { journal, people, work };
