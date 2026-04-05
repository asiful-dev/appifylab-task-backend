import { and, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { posts, users } from '../db/schema/schema.js';
import { withRetry } from '../utils/db-utils.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errorTypes.js';
import {
  CreatePostInput,
  FeedQueryInput,
  FeedResponse,
  PostItem,
  UpdatePostInput,
} from '../types/post.types.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const uploadPostImageToSupabase = async (userId: string, file: Express.Multer.File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ValidationError('Invalid post image type. Allowed: jpg, png, webp, gif');
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new ValidationError('Supabase storage is not configured');
  }

  const safeName = (file.originalname || 'post-image').toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const path = `${userId}/${Date.now()}-${safeName}`;

  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/posts/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': file.mimetype,
      'x-upsert': 'true',
    },
    body: file.buffer,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new ValidationError(`Post image upload failed: ${details || response.statusText}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/posts/${path}`;
};

const toPostItem = (row: {
  id: string;
  authorId: string;
  content: string | null;
  imageUrl: string | null;
  visibility: 'public' | 'private';
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorIdFromUser: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}): PostItem => ({
  id: row.id,
  authorId: row.authorId,
  content: row.content,
  imageUrl: row.imageUrl,
  visibility: row.visibility,
  likeCount: row.likeCount,
  commentCount: row.commentCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  author: {
    id: row.authorIdFromUser,
    firstName: row.firstName,
    lastName: row.lastName,
    profileImageUrl: row.profileImageUrl,
  },
});

const fetchPosts = async (whereClause: any, limit: number) => {
  return withRetry(async () => {
    const rows = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        visibility: posts.visibility,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorIdFromUser: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const selectedRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (selectedRows[selectedRows.length - 1]?.id ?? null) : null;

    return {
      posts: selectedRows.map(toPostItem),
      nextCursor,
      hasMore,
    } satisfies FeedResponse;
  });
};

export const postService = {
  async getFeed(requesterId: string, query: FeedQueryInput) {
    const limit = query.limit ?? 10;

    let cursorCondition;
    if (query.cursor) {
      const cursorPost = await withRetry(async () => {
        const cursorRow = await db
          .select({ id: posts.id, createdAt: posts.createdAt })
          .from(posts)
          .where(eq(posts.id, query.cursor!))
          .limit(1);

        return cursorRow[0];
      });

      if (cursorPost) {
        cursorCondition = sql`(${posts.createdAt}, ${posts.id}) < (${cursorPost.createdAt}, ${cursorPost.id})`;
      }
    }

    const visibilityCondition = or(
      eq(posts.visibility, 'public'),
      eq(posts.authorId, requesterId),
    )!;
    const whereClause = cursorCondition
      ? and(visibilityCondition, cursorCondition)!
      : visibilityCondition;

    return fetchPosts(whereClause, limit);
  },

  async createPost(requesterId: string, input: CreatePostInput, file?: Express.Multer.File) {
    if (!input.content && !file) {
      throw new ValidationError('Either content or image is required to create a post');
    }

    const imageUrl = file ? await uploadPostImageToSupabase(requesterId, file) : null;

    const inserted = await withRetry(async () => {
      const insertedRows = await db
        .insert(posts)
        .values({
          authorId: requesterId,
          content: input.content ?? null,
          imageUrl,
          visibility: input.visibility ?? 'public',
        })
        .returning({ id: posts.id });

      return insertedRows[0];
    });

    if (!inserted) {
      throw new ValidationError('Failed to create post');
    }

    return this.getPostById(requesterId, inserted.id);
  },

  async getPostById(requesterId: string, postId: string) {
    const post = await withRetry(async () => {
      const rows = await db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          content: posts.content,
          imageUrl: posts.imageUrl,
          visibility: posts.visibility,
          likeCount: posts.likeCount,
          commentCount: posts.commentCount,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          authorIdFromUser: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, postId))
        .limit(1);

      return rows[0];
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.visibility === 'private' && post.authorId !== requesterId) {
      throw new NotFoundError('Post');
    }

    return toPostItem(post);
  },

  async updatePost(
    requesterId: string,
    postId: string,
    input: UpdatePostInput,
    file?: Express.Multer.File,
  ) {
    const existing = await withRetry(async () => {
      const existingRows = await db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      return existingRows[0];
    });

    if (!existing) {
      throw new NotFoundError('Post');
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError('You can only update your own post');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility;
    }

    const imageUrl = file ? await uploadPostImageToSupabase(requesterId, file) : undefined;
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    } else if (input.removeImage === true) {
      updateData.imageUrl = null;
    }

    if (Object.keys(updateData).length === 1) {
      throw new ValidationError('At least one field is required for update');
    }

    await withRetry(() => db.update(posts).set(updateData).where(eq(posts.id, postId)));

    return this.getPostById(requesterId, postId);
  },

  async deletePost(requesterId: string, postId: string) {
    const existing = await withRetry(async () => {
      const existingRows = await db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      return existingRows[0];
    });

    if (!existing) {
      throw new NotFoundError('Post');
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError('You can only delete your own post');
    }

    await withRetry(() => db.delete(posts).where(eq(posts.id, postId)));
  },

  async getUserPosts(requesterId: string, targetUserId: string, query: FeedQueryInput) {
    const limit = query.limit ?? 10;

    let cursorCondition;
    if (query.cursor) {
      const cursorPost = await withRetry(async () => {
        const cursorRow = await db
          .select({ id: posts.id, createdAt: posts.createdAt })
          .from(posts)
          .where(eq(posts.id, query.cursor!))
          .limit(1);

        return cursorRow[0];
      });

      if (cursorPost) {
        cursorCondition = sql`(${posts.createdAt}, ${posts.id}) < (${cursorPost.createdAt}, ${cursorPost.id})`;
      }
    }

    const visibilityCondition =
      requesterId === targetUserId ? sql`TRUE` : eq(posts.visibility, 'public');

    const baseWhere = and(eq(posts.authorId, targetUserId), visibilityCondition)!;
    const whereClause = cursorCondition ? and(baseWhere, cursorCondition)! : baseWhere;

    return fetchPosts(whereClause, limit);
  },
};
