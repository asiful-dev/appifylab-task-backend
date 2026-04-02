import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Enums for database constraints
 */
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);
export const targetTypeEnum = pgEnum("target_type", ["post", "comment"]);

/**
 * USERS table - Stores user account information
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * POSTS table - Stores user posts
 */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content"),
    imageUrl: varchar("image_url", { length: 500 }),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite index for feed pagination (most important)
    feedIdx: index("idx_posts_feed").on(table.createdAt, table.id),
    // Index for author queries
    authorIdx: index("idx_posts_author").on(table.authorId),
    // Composite index for visibility filtering
    visibilityIdx: index("idx_posts_visibility").on(
      table.visibility,
      table.authorId,
    ),
  }),
);

/**
 * COMMENTS table - Stores comments and replies (self-referential for replies)
 */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"), // NULL for top-level, otherwise parent comment ID for replies
    content: text("content").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index("idx_comments_post").on(table.postId),
    authorIdx: index("idx_comments_author").on(table.authorId),
    parentIdx: index("idx_comments_parent").on(table.parentId),
  }),
);

/**
 * LIKES table - Polymorphic likes for posts and comments
 */
export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetId: uuid("target_id").notNull(), // ID of post or comment
    targetType: targetTypeEnum("target_type").notNull(), // 'post' or 'comment'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Ensure each user can only like each target once
    uniqueLike: index("idx_likes_unique").on(
      table.userId,
      table.targetId,
      table.targetType,
    ),
    // Index for finding all likes on a target
    targetIdx: index("idx_likes_target").on(table.targetId, table.targetType),
  }),
);

/**
 * REFRESH_TOKENS table - Manages refresh token revocation and rotation
 */
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Relations - Define relationships between tables for type-safe queries
 */
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  refreshTokens: many(refreshTokens),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parentComment",
  }),
  replies: many(comments, {
    relationName: "parentComment",
  }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
