import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    // If true, the post is still generated and reachable by direct URL, but omitted from the blog index page.
    unlisted: z.boolean().optional(),
  }),
});

export const collections = { blog };


