export interface ListQueryInput {
  cursor?: string;
  limit?: number;
}

export interface CreateCommentInput {
  content: string;
}

export interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthor;
}

export interface CommentsPageResponse {
  comments: CommentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
