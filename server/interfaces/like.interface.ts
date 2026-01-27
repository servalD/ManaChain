/**
 * Like Interface
 * Defines types for like-related operations
 */

import { BrandLike, Brand, User } from '../types/database.types';

// ============================================
// REQUEST TYPES
// ============================================

/**
 * Request to create a like
 */
export interface CreateLikeRequest {
  userId: string;
  brandId: string;
}

/**
 * Request to get user's likes
 */
export interface GetUserLikesRequest {
  userId: string;
}

/**
 * Request to get brand's likes
 */
export interface GetBrandLikesRequest {
  brandId: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Like with brand details
 */
export interface LikeWithBrand extends BrandLike {
  brand: Brand;
}

/**
 * Like with user details
 */
export interface LikeWithUser extends BrandLike {
  user: Omit<User, 'password_hash' | 'email_verification_token'>;
}
