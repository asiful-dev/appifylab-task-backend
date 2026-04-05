import { z } from 'zod';

const booleanStringSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return value;
}, z.boolean());

export const feedQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createPostSchema = z
  .object({
    content: z.string().trim().max(5000).optional(),
    visibility: z.enum(['public', 'private']).default('public'),
  })
  .transform((value) => ({
    ...value,
    content: value.content && value.content.length > 0 ? value.content : undefined,
  }));

export const updatePostSchema = z
  .object({
    content: z.string().trim().max(5000).optional(),
    visibility: z.enum(['public', 'private']).optional(),
    removeImage: booleanStringSchema.optional(),
  })
  .transform((value) => ({
    ...value,
    content: value.content && value.content.length > 0 ? value.content : undefined,
  }))
  .refine(
    (value) =>
      value.content !== undefined ||
      value.visibility !== undefined ||
      value.removeImage !== undefined,
    {
      message: 'At least one field is required for update',
    },
  );

export type FeedQuerySchemaType = z.infer<typeof feedQuerySchema>;
export type CreatePostSchemaType = z.infer<typeof createPostSchema>;
export type UpdatePostSchemaType = z.infer<typeof updatePostSchema>;
