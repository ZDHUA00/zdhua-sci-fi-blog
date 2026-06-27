import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    channel: z.string(),
    status: z.string().default('已发布'),
    intensity: z.number().min(0).max(100).default(64),
    accent: z.enum(['cyan', 'green', 'amber', 'magenta']).default('cyan'),
    readTime: z.string().default('4 min'),
  }),
});

export const collections = { blog };
