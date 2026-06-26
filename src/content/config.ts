import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['Deploy', 'Ops', 'Automation', 'Design', 'AI']),
    tags: z.array(z.string()),
    readTime: z.string(),
    signal: z.string(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
