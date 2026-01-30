import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { BrandLike } from '../types/database.types';
import {
  CreateLikeRequest,
  GetUserLikesRequest,
  GetBrandLikesRequest,
  DeleteLikeRequest,
  LikeWithBrand,
  LikeWithUser,
} from '../interfaces/like.interface';

/**
 * Create a like for a brand
 */
export const createLike = async (
  request: CreateLikeRequest
): Promise<ServiceResponse<BrandLike>> => {
  try {
    const { userId, brandId } = request;

    // Check if brand exists
    const { data: brandExists, error: brandError } = await supabase
      .from('brand')
      .select('id')
      .eq('id', brandId)
      .single();

    if (brandError || !brandExists) {
      return failure('Brand not found');
    }

    // Check if user already liked this brand
    const { data: existingLike } = await supabase
      .from('brand_like')
      .select('id')
      .eq('user_id', userId)
      .eq('brand_id', brandId)
      .single();

    if (existingLike) {
      return failure('You have already liked this brand');
    }

    // Create the like
    const { data, error } = await supabase
      .from('brand_like')
      .insert({
        user_id: userId,
        brand_id: brandId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating like:', error);
      return failure('Failed to create like');
    }

    return success(data);
  } catch (error) {
    console.error('Error in createLike service:', error);
    return failure('An unexpected error occurred');
  }
};

/**
 * Get all brands liked by a user
 */
export const getUserLikes = async (
  request: GetUserLikesRequest
): Promise<ServiceResponse<LikeWithBrand[]>> => {
  try {
    const { userId } = request;

    const { data, error } = await supabase
      .from('brand_like')
      .select(`
        id,
        user_id,
        brand_id,
        created_at,
        brand:brand_id (
          id,
          user_id,
          name,
          description,
          logo_url,
          website_url,
          business_registration_number,
          country,
          headquarters_street,
          headquarters_city,
          headquarters_zip_code,
          headquarters_address_complement,
          social_medias,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user likes:', error);
      return failure('Failed to fetch likes');
    }

    // Transform the data to match LikeWithBrand interface
    const likes = data.map((like: any) => ({
      id: like.id,
      user_id: like.user_id,
      brand_id: like.brand_id,
      created_at: like.created_at,
      brand: like.brand,
    })) as LikeWithBrand[];

    return success(likes);
  } catch (error) {
    console.error('Error in getUserLikes service:', error);
    return failure('An unexpected error occurred');
  }
};

/**
 * Get all users who liked a brand
 */
export const getBrandLikes = async (
  request: GetBrandLikesRequest
): Promise<ServiceResponse<LikeWithUser[]>> => {
  try {
    const { brandId } = request;

    // Check if brand exists
    const { data: brandExists, error: brandError } = await supabase
      .from('brand')
      .select('id')
      .eq('id', brandId)
      .single();

    if (brandError || !brandExists) {
      return failure('Brand not found');
    }

    const { data, error } = await supabase
      .from('brand_like')
      .select(`
        id,
        user_id,
        brand_id,
        created_at,
        user:user_id (
          id,
          email,
          username,
          first_name,
          last_name,
          avatar_url,
          age_range,
          blockchain_address,
          verified,
          is_brand,
          role,
          created_at,
          updated_at
        )
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brand likes:', error);
      return failure('Failed to fetch likes');
    }

    // Transform the data to match LikeWithUser interface
    const likes = data.map((like: any) => ({
      id: like.id,
      user_id: like.user_id,
      brand_id: like.brand_id,
      created_at: like.created_at,
      user: like.user,
    })) as LikeWithUser[];

    return success(likes);
  } catch (error) {
    console.error('Error in getBrandLikes service:', error);
    return failure('An unexpected error occurred');
  }
};

/**
 * Delete a like (user can only delete their own like)
 */
export const deleteLike = async (
  request: DeleteLikeRequest
): Promise<ServiceResponse<void>> => {
  try {
    const { userId, likeId } = request;

    const { data: likeRow, error: fetchError } = await supabase
      .from('brand_like')
      .select('id, user_id')
      .eq('id', likeId)
      .single();

    if (fetchError || !likeRow) {
      return failure('Like not found');
    }

    if (likeRow.user_id !== userId) {
      return failure('You can only remove your own like');
    }

    const { error: deleteError } = await supabase
      .from('brand_like')
      .delete()
      .eq('id', likeId);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return failure('Failed to remove like');
    }

    return success(undefined);
  } catch (error) {
    console.error('Error in deleteLike service:', error);
    return failure('An unexpected error occurred');
  }
};

/**
 * Check if a user has liked a brand
 */
export const checkLikeExists = async (
  userId: string,
  brandId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('brand_like')
      .select('id')
      .eq('user_id', userId)
      .eq('brand_id', brandId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking like existence:', error);
      return failure('Failed to check like status');
    }

    return success(!!data);
  } catch (error) {
    console.error('Error in checkLikeExists service:', error);
    return failure('An unexpected error occurred');
  }
};
