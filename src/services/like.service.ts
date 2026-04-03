import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { comments, likes, posts, users } from '../db/schema/schema.js';
import { NotFoundError } from '../utils/errorTypes.js';
import { LikeUsersPageResponse, ToggleLikeResponse } from '../types/like.types.js';
import { ListQueryInput } from '../types/comment.types.js';

const ensurePostLikePermission = async (requesterId: string, postId: string) => {
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

const ensureCommentLikePermission = async (requesterId: string, commentId: string) => {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      postAuthorId: posts.authorId,
      postVisibility: posts.visibility,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(comments.id, commentId))
    .limit(1);

  const comment = rows[0];
  if (!comment) {
    throw new NotFoundError('Comment');
  }

  if (comment.postVisibility === 'private' && comment.postAuthorId !== requesterId) {
    throw new NotFoundError('Comment');
  }

  return comment;
};

const listLikeUsers = async (
  targetId: string,
  targetType: 'post' | 'comment',
  query: ListQueryInput,
) => {
  const limit = query.limit ?? 20;
  let cursorCondition;

  if (query.cursor) {
    const cursorRows = await db
      .select({ id: likes.id, createdAt: likes.createdAt })
      .from(likes)
      .where(eq(likes.id, query.cursor))
      .limit(1);

    const cursor = cursorRows[0];
    if (cursor) {
      cursorCondition = sql`(${likes.createdAt}, ${likes.id}) < (${cursor.createdAt}, ${cursor.id})`;
    }
  }

  const baseWhere = and(eq(likes.targetId, targetId), eq(likes.targetType, targetType));
  const whereClause = cursorCondition ? and(baseWhere!, cursorCondition) : baseWhere;

  const rows = await db
    .select({
      likeId: likes.id,
      likedAt: likes.createdAt,
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(likes)
    .innerJoin(users, eq(likes.userId, users.id))
    .where(whereClause!)
    .orderBy(desc(likes.createdAt), desc(likes.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const selectedRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (selectedRows[selectedRows.length - 1]?.likeId ?? null) : null;

  return {
    users: selectedRows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
      likedAt: row.likedAt,
    })),
    nextCursor,
    hasMore,
  } satisfies LikeUsersPageResponse;
};

export const likeService = {
  async togglePostLike(requesterId: string, postId: string): Promise<ToggleLikeResponse> {
    await ensurePostLikePermission(requesterId, postId);

    const existingRows = await db
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.userId, requesterId),
          eq(likes.targetId, postId),
          eq(likes.targetType, 'post'),
        ),
      )
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      const updatedRows = await db.transaction(async (tx) => {
        await tx.delete(likes).where(eq(likes.id, existing.id));
        return tx
          .update(posts)
          .set({
            likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, postId))
          .returning({ likeCount: posts.likeCount });
      });

      return {
        liked: false,
        likeCount: updatedRows[0]?.likeCount ?? 0,
      };
    }

    const updatedRows = await db.transaction(async (tx) => {
      await tx.insert(likes).values({
        userId: requesterId,
        targetId: postId,
        targetType: 'post',
      });

      return tx
        .update(posts)
        .set({
          likeCount: sql`GREATEST(${posts.likeCount} + 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning({ likeCount: posts.likeCount });
    });

    return {
      liked: true,
      likeCount: updatedRows[0]?.likeCount ?? 0,
    };
  },

  async toggleCommentLike(requesterId: string, commentId: string): Promise<ToggleLikeResponse> {
    await ensureCommentLikePermission(requesterId, commentId);

    const existingRows = await db
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.userId, requesterId),
          eq(likes.targetId, commentId),
          eq(likes.targetType, 'comment'),
        ),
      )
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      const updatedRows = await db.transaction(async (tx) => {
        await tx.delete(likes).where(eq(likes.id, existing.id));
        return tx
          .update(comments)
          .set({
            likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(comments.id, commentId))
          .returning({ likeCount: comments.likeCount });
      });

      return {
        liked: false,
        likeCount: updatedRows[0]?.likeCount ?? 0,
      };
    }

    const updatedRows = await db.transaction(async (tx) => {
      await tx.insert(likes).values({
        userId: requesterId,
        targetId: commentId,
        targetType: 'comment',
      });

      return tx
        .update(comments)
        .set({
          likeCount: sql`GREATEST(${comments.likeCount} + 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId))
        .returning({ likeCount: comments.likeCount });
    });

    return {
      liked: true,
      likeCount: updatedRows[0]?.likeCount ?? 0,
    };
  },

  async listPostLikes(requesterId: string, postId: string, query: ListQueryInput) {
    await ensurePostLikePermission(requesterId, postId);
    return listLikeUsers(postId, 'post', query);
  },

  async listCommentLikes(requesterId: string, commentId: string, query: ListQueryInput) {
    await ensureCommentLikePermission(requesterId, commentId);
    return listLikeUsers(commentId, 'comment', query);
  },
};
