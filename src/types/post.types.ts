export type PostVisibility = 'public' | 'private';

export interface FeedQueryInput {
  cursor?: string;
  limit?: number;
}

export interface CreatePostInput {
  content?: string;
  visibility?: PostVisibility;
}

export interface UpdatePostInput {
  content?: string;
  visibility?: PostVisibility;
  removeImage?: boolean;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

export interface PostItem {
  id: string;
  authorId: string;
  content: string | null;
  imageUrl: string | null;
  visibility: PostVisibility;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: PostAuthor;
}

export interface FeedResponse {
  posts: PostItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
