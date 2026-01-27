import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { BrandMedia } from '../types/database.types';

/**
 * Confirm and save a brand media that was already uploaded to Pinata
 */
export const confirmBrandMedia = async (
  brandId: string,
  userId: string,
  ipfsHash: string,
  ipfsUrl: string
): Promise<ServiceResponse<BrandMedia>> => {
  try {
    // Verify brand ownership
    const { data: brand } = await supabase
      .from('brand')
      .select('user_id')
      .eq('id', brandId)
      .single();

    if (!brand || brand.user_id !== userId) {
      return failure('You do not have permission to add media to this brand');
    }

    // Get the maximum display_order for this brand
    const { data: existingMedia } = await supabase
      .from('brand_media')
      .select('display_order')
      .eq('brand_id', brandId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = existingMedia ? existingMedia.display_order + 1 : 0;

    // Insert the media
    const { data, error } = await supabase
      .from('brand_media')
      .insert({
        brand_id: brandId,
        image_url: ipfsUrl,
        ipfs_hash: ipfsHash,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('confirmBrandMedia error:', error);
      return failure('Error saving media');
    }

    return success(data);
  } catch (error) {
    console.error('confirmBrandMedia error:', error);
    return failure('Server error saving media');
  }
};

/**
 * Get all media for a brand
 */
export const getBrandMedia = async (
  brandId: string
): Promise<ServiceResponse<BrandMedia[]>> => {
  try {
    const { data, error } = await supabase
      .from('brand_media')
      .select('*')
      .eq('brand_id', brandId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('getBrandMedia error:', error);
      return failure('Error retrieving media');
    }

    return success(data || []);
  } catch (error) {
    console.error('getBrandMedia error:', error);
    return failure('Server error retrieving media');
  }
};

/**
 * Delete brand media (remove from DB only - unpin is handled by frontend)
 */
export const deleteBrandMedia = async (
  mediaId: string,
  brandId: string,
  userId: string
): Promise<ServiceResponse<void>> => {
  try {
    // Verify brand ownership
    const { data: brand } = await supabase
      .from('brand')
      .select('user_id')
      .eq('id', brandId)
      .single();

    if (!brand || brand.user_id !== userId) {
      return failure('You do not have permission to delete media from this brand');
    }

    // Get the media to verify it belongs to the brand
    const { data: media, error: mediaError } = await supabase
      .from('brand_media')
      .select('brand_id')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      return failure('Media not found');
    }

    // Verify the media belongs to the brand
    if (media.brand_id !== brandId) {
      return failure('Media does not belong to this brand');
    }

    // Delete from DB (unpin is handled by frontend)
    const { error: deleteError } = await supabase
      .from('brand_media')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      console.error('deleteBrandMedia error:', deleteError);
      return failure('Error deleting media');
    }

    return success(undefined);
  } catch (error) {
    console.error('deleteBrandMedia error:', error);
    return failure('Server error deleting media');
  }
};
