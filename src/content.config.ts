import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { TOPICS, type Topic } from "./journal";
import { PROJECT_TOPICS, type ProjectTopic } from "./work";

const AUTHORS = ["Ivo Pejakovic", "Andy Moesch"] as const;

const journal = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./content/journal",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        date: z.coerce.date(),
        author: z.enum(AUTHORS),
        topic: z.enum(Object.keys(TOPICS) as [Topic, ...Topic[]]),
        excerpt: z.string().min(1),
        cover: image().optional(),
        coverAlt: z.string().min(1).optional(),
        featured: z.boolean().default(false),
        original: z
          .object({
            site: z.string().min(1),
            date: z.coerce.date(),
            url: z.url(),
          })
          .optional(),
      })
      .strict()
      .refine(
        (post) => (post.cover === undefined) === (post.coverAlt === undefined),
        {
          message: "cover and coverAlt go together (R-CONT-5)",
          path: ["coverAlt"],
        },
      ),
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
        source: z.url().optional(),
        license: z.string().min(1).optional(),
        featured: z.boolean().default(false),
      })
      .strict(),
});

export const collections = { journal, people, work };
