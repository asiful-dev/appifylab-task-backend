import { z } from 'zod';

export const listQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type ListQuerySchemaType = z.infer<typeof listQuerySchema>;
export type CreateCommentSchemaType = z.infer<typeof createCommentSchema>;
