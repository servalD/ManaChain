/**
 * Like Types
 * TypeScript interfaces for like-related data
 */

export interface ILike {
  id: string;
  userId: string;
  brandId: string;
  createdAt: string;
}

export interface ILikeWithBrand {
  likeId: string;
  likedAt: string;
  brand: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    country: string;
    createdAt: string;
  };
}

export interface ILikeWithUser {
  likeId: string;
  likedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    ageRange: string;
    verified: boolean;
  };
}

export type CreateLikeResponse = ILike;
export type GetLikesResponse = ILikeWithBrand[];
export type GetBrandLikesResponse = ILikeWithUser[];
