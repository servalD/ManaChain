import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { Brand } from '../types/database.types';
import {
  CreateBrandRequest,
  UpdateBrandRequest,
  GetBrandsRequest,
  DeleteBrandRequest,
} from '../interfaces/brand.interface';

/**
 * Create a new brand for a user
 */
export const createBrand = async (
  request: CreateBrandRequest
): Promise<ServiceResponse<Brand>> => {
  try {
    const { userId, ...brandData } = request;

    // Check if user doesn't already have a brand
    const { data: existingBrand } = await supabase
      .from('brand')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingBrand) {
      return failure('This user already has a brand');
    }

    // Check if brand name is not already taken
    const { data: nameCheck } = await supabase
      .from('brand')
      .select('id')
      .eq('name', brandData.name)
      .single();

    if (nameCheck) {
      return failure('This brand name is already in use');
    }

    // Create brand
    const { data, error } = await supabase
      .from('brand')
      .insert({
        ...brandData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Brand creation error:', error);
      return failure('Error creating brand');
    }

    // Update user's is_brand flag
    await supabase
      .from('user')
      .update({ is_brand: true })
      .eq('id', userId);

    return success(data);
  } catch (error) {
    console.error('createBrand error:', error);
    return failure('Server error creating brand');
  }
};

/**
 * Get brand by ID
 */
export const getBrandById = async (brandId: string): Promise<ServiceResponse<Brand>> => {
  try {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !data) {
      return failure('Brand not found');
    }

    return success(data);
  } catch (error) {
    console.error('getBrandById error:', error);
    return failure('Server error retrieving brand');
  }
};

/**
 * Get brand by user ID
 */
export const getBrandByUserId = async (userId: string): Promise<ServiceResponse<Brand>> => {
  try {
    const { data, error } = await supabase
      .from('brand')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return failure('No brand found for this user');
    }

    return success(data);
  } catch (error) {
    console.error('getBrandByUserId error:', error);
    return failure('Server error retrieving brand');
  }
};

/**
 * Get all brands with pagination
 */
export const getAllBrands = async (
  request: GetBrandsRequest
): Promise<ServiceResponse<{ brands: Brand[]; total: number }>> => {
  try {
    const { limit, offset, filters } = request;
    let query = supabase.from('brand').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Pagination and sorting
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getAllBrands error:', error);
      return failure('Error retrieving brands');
    }

    return success({
      brands: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getAllBrands error:', error);
    return failure('Server error retrieving brands');
  }
};

/**
 * Update brand
 */
export const updateBrand = async (
  request: UpdateBrandRequest
): Promise<ServiceResponse<Brand>> => {
  try {
    const { brandId, userId, ...brandData } = request;

    // Check if brand belongs to user
    const { data: brand } = await supabase
      .from('brand')
      .select('user_id')
      .eq('id', brandId)
      .single();

    if (!brand || brand.user_id !== userId) {
      return failure('You do not have permission to modify this brand');
    }

    // If name is modified, check it's not already taken
    if (brandData.name) {
      const { data: nameCheck } = await supabase
        .from('brand')
        .select('id')
        .eq('name', brandData.name)
        .neq('id', brandId)
        .single();

      if (nameCheck) {
        return failure('This brand name is already in use');
      }
    }

    // Update brand
    const { data, error } = await supabase
      .from('brand')
      .update(brandData)
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      console.error('updateBrand error:', error);
      return failure('Error updating brand');
    }

    return success(data);
  } catch (error) {
    console.error('updateBrand error:', error);
    return failure('Server error updating brand');
  }
};

/**
 * Delete brand (and associated token)
 */
export const deleteBrand = async (
  request: DeleteBrandRequest
): Promise<ServiceResponse<void>> => {
  try {
    const { brandId, userId } = request;

    // Check if brand belongs to user
    const { data: brand } = await supabase
      .from('brand')
      .select('user_id')
      .eq('id', brandId)
      .single();

    if (!brand || brand.user_id !== userId) {
      return failure('You do not have permission to delete this brand');
    }

    // Delete brand (cascade deletes token and relationships)
    const { error } = await supabase
      .from('brand')
      .delete()
      .eq('id', brandId);

    if (error) {
      console.error('deleteBrand error:', error);
      return failure('Error deleting brand');
    }

    // Update user's is_brand flag
    await supabase
      .from('user')
      .update({ is_brand: false })
      .eq('id', userId);

    return success(undefined);
  } catch (error) {
    console.error('deleteBrand error:', error);
    return failure('Server error deleting brand');
  }
};

/**
 * Get brand statistics
 */
export const getBrandStats = async (
  brandId: string
): Promise<ServiceResponse<{
  tokenHolders: number;
  totalRaised: string;
  tokenSymbol: string | null;
  tokenPrice: string | null;
}>> => {
  try {
    // Get brand token
    const { data: token } = await supabase
      .from('brand_token')
      .select('id, symbol, current_price')
      .eq('brand_id', brandId)
      .single();

    if (!token) {
      return success({
        tokenHolders: 0,
        totalRaised: '0',
        tokenSymbol: null,
        tokenPrice: null,
      });
    }

    // Count holders
    const { count: holdersCount } = await supabase
      .from('token_holder')
      .select('*', { count: 'exact', head: true })
      .eq('token_id', token.id)
      .gt('balance', 0);

    // Calculate total raised (sum of purchases)
    const { data: transactions } = await supabase
      .from('token_transaction')
      .select('amount, price_per_token')
      .eq('token_id', token.id)
      .eq('transaction_type', 'purchase');

    let totalRaised = 0;
    if (transactions) {
      totalRaised = transactions.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount.toString());
        const price = parseFloat(tx.price_per_token || '0');
        return sum + (amount * price);
      }, 0);
    }

    return success({
      tokenHolders: holdersCount || 0,
      totalRaised: totalRaised.toFixed(2),
      tokenSymbol: token.symbol,
      tokenPrice: token.current_price,
    });
  } catch (error) {
    console.error('getBrandStats error:', error);
    return failure('Server error retrieving statistics');
  }
};
