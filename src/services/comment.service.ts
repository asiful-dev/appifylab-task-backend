import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { comments, posts, users } from '../db/schema/schema.js';
import { ForbiddenError, NotFoundError } from '../utils/errorTypes.js';
import {
  CommentItem,
  CommentsPageResponse,
  CreateCommentInput,
  ListQueryInput,
} from '../types/comment.types.js';

const ensurePostVisibleToUser = async (requesterId: string, postId: string) => {
  const rows = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      visibility: posts.visibility,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  const post = rows[0];
  if (!post) {
    throw new NotFoundError('Post');
  }

  if (post.visibility === 'private' && post.authorId !== requesterId) {
    throw new NotFoundError('Post');
  }

  return post;
};

const toCommentItem = (row: {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}): CommentItem => ({
  id: row.id,
  postId: row.postId,
  authorId: row.authorId,
  parentId: row.parentId,
  content: row.content,
  likeCount: row.likeCount,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  author: {
    id: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    profileImageUrl: row.profileImageUrl,
  },
});

const fetchCommentPage = async (whereClause: ReturnType<typeof and>, limit: number) => {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      parentId: comments.parentId,
      content: comments.content,
      likeCount: comments.likeCount,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(whereClause)
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const selectedRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (selectedRows[selectedRows.length - 1]?.id ?? null) : null;

  return {
    comments: selectedRows.map(toCommentItem),
    nextCursor,
    hasMore,
  } satisfies CommentsPageResponse;
};

export const commentService = {
  async listPostComments(requesterId: string, postId: string, query: ListQueryInput) {
    await ensurePostVisibleToUser(requesterId, postId);

    const limit = query.limit ?? 10;
    let cursorCondition;

    if (query.cursor) {
      const cursorRows = await db
        .select({ id: comments.id, createdAt: comments.createdAt })
        .from(comments)
        .where(eq(comments.id, query.cursor))
        .limit(1);

      const cursor = cursorRows[0];
      if (cursor) {
        cursorCondition = sql`(${comments.createdAt}, ${comments.id}) < (${cursor.createdAt}, ${cursor.id})`;
      }
    }

    const baseWhere = and(eq(comments.postId, postId), isNull(comments.parentId));
    const whereClause = cursorCondition ? and(baseWhere!, cursorCondition) : baseWhere;

    return fetchCommentPage(whereClause!, limit);
  },

  async createComment(requesterId: string, postId: string, input: CreateCommentInput) {
    await ensurePostVisibleToUser(requesterId, postId);

    const insertedRows = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(comments)
        .values({
          postId,
          authorId: requesterId,
          content: input.content,
        })
        .returning({ id: comments.id });

      await tx
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} + 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      return inserted;
    });

    const inserted = insertedRows[0];
    if (!inserted) {
      throw new NotFoundError('Comment');
    }

    return this.getCommentById(inserted.id);
  },

  async createReply(requesterId: string, commentId: string, input: CreateCommentInput) {
    const parentRows = await db
      .select({
        id: comments.id,
        postId: comments.postId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    const parent = parentRows[0];
    if (!parent) {
      throw new NotFoundError('Comment');
    }

    await ensurePostVisibleToUser(requesterId, parent.postId);

    const insertedRows = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(comments)
        .values({
          postId: parent.postId,
          authorId: requesterId,
          parentId: commentId,
          content: input.content,
        })
        .returning({ id: comments.id });

      await tx
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} + 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, parent.postId));

      return inserted;
    });

    const inserted = insertedRows[0];
    if (!inserted) {
      throw new NotFoundError('Comment');
    }

    return this.getCommentById(inserted.id);
  },

  async listReplies(requesterId: string, commentId: string, query: ListQueryInput) {
    const parentRows = await db
      .select({
        id: comments.id,
        postId: comments.postId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    const parent = parentRows[0];
    if (!parent) {
      throw new NotFoundError('Comment');
    }

    await ensurePostVisibleToUser(requesterId, parent.postId);

    const limit = query.limit ?? 10;
    let cursorCondition;

    if (query.cursor) {
      const cursorRows = await db
        .select({ id: comments.id, createdAt: comments.createdAt })
        .from(comments)
        .where(eq(comments.id, query.cursor))
        .limit(1);

      const cursor = cursorRows[0];
      if (cursor) {
        cursorCondition = sql`(${comments.createdAt}, ${comments.id}) < (${cursor.createdAt}, ${cursor.id})`;
      }
    }

    const baseWhere = and(eq(comments.parentId, commentId), eq(comments.postId, parent.postId));
    const whereClause = cursorCondition ? and(baseWhere!, cursorCondition) : baseWhere;

    return fetchCommentPage(whereClause!, limit);
  },

  async deleteComment(requesterId: string, commentId: string) {
    const rows = await db
      .select({
        id: comments.id,
        authorId: comments.authorId,
        postId: comments.postId,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    const existing = rows[0];
    if (!existing) {
      throw new NotFoundError('Comment');
    }

    if (existing.authorId !== requesterId) {
      throw new ForbiddenError('You can only delete your own comment');
    }

    await db.transaction(async (tx) => {
      await tx.delete(comments).where(eq(comments.id, commentId));
      await tx
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, existing.postId));
    });
  },

  async getCommentById(commentId: string) {
    const rows = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        parentId: comments.parentId,
        content: comments.content,
        likeCount: comments.likeCount,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new NotFoundError('Comment');
    }

    return toCommentItem(row);
  },
};
