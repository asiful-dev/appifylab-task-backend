export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface LikeUserItem {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  likedAt: Date;
}

export interface LikeUsersPageResponse {
  users: LikeUserItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
