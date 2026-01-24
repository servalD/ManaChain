import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { User, Interest } from '../types/database.types';
import { CreateUserRequest, UpdateUserRequest, UpdateUserInterestsRequest, GetUsersRequest } from '../interfaces/user.interface';

/**
 * Create a new user with interests
 */
export const createUser = async (
  request: CreateUserRequest
): Promise<ServiceResponse<User>> => {
  try {
    const { interests, ...userData } = request;

    // Check if email is already used
    const { data: emailCheck } = await supabase
      .from('user')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (emailCheck) {
      return failure('This email address is already in use');
    }

    // Check if username is already taken
    const { data: usernameCheck } = await supabase
      .from('user')
      .select('id')
      .eq('username', userData.username)
      .single();

    if (usernameCheck) {
      return failure('This username is already taken');
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('user')
      .insert(userData)
      .select()
      .single();

    if (userError || !user) {
      console.error('User creation error:', userError);
      return failure('Error creating user');
    }

    // Add interests if provided
    if (interests && interests.length > 0) {
      const userInterests = interests.map(interestId => ({
        user_id: user.id,
        interest_id: interestId,
      }));

      const { error: interestsError } = await supabase
        .from('user_interest')
        .insert(userInterests);

      if (interestsError) {
        console.error('Interests addition error:', interestsError);
        // Don't fail creation if interests cannot be added
      }
    }

    return success(user);
  } catch (error) {
    console.error('createUser error:', error);
    return failure('Server error creating user');
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<ServiceResponse<User>> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return failure('User not found');
    }

    return success(data);
  } catch (error) {
    console.error('getUserById error:', error);
    return failure('Server error retrieving user');
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<ServiceResponse<User>> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return failure('User not found');
    }

    return success(data);
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return failure('Server error retrieving user');
  }
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<ServiceResponse<User>> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return failure('User not found');
    }

    return success(data);
  } catch (error) {
    console.error('getUserByUsername error:', error);
    return failure('Server error retrieving user');
  }
};

/**
 * Update user
 */
export const updateUser = async (
  request: UpdateUserRequest
): Promise<ServiceResponse<User>> => {
  try {
    const { userId, ...userData } = request;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('user')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return failure('User not found');
    }

    // If username is modified, check it's not already taken
    if (userData.username) {
      const { data: usernameCheck } = await supabase
        .from('user')
        .select('id')
        .eq('username', userData.username)
        .neq('id', userId)
        .single();

      if (usernameCheck) {
        return failure('This username is already taken');
      }
    }

    // Update user
    const { data, error } = await supabase
      .from('user')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('updateUser error:', error);
      return failure('Error updating user');
    }

    return success(data);
  } catch (error) {
    console.error('updateUser error:', error);
    return failure('Server error updating user');
  }
};

/**
 * Update user blockchain address
 * Validates that the address is not already used by another user
 */
export const updateBlockchainAddress = async (
  userId: string,
  blockchainAddress: string
): Promise<ServiceResponse<User>> => {
  try {
    // Check if address is already used by another user
    const { data: existingUser } = await supabase
      .from('user')
      .select('id, username')
      .eq('blockchain_address', blockchainAddress)
      .single();

    if (existingUser && existingUser.id !== userId) {
      return failure('This wallet address is already connected to another account');
    }

    // Update user's blockchain address
    const { data, error } = await supabase
      .from('user')
      .update({ blockchain_address: blockchainAddress })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      console.error('Update blockchain address error:', error);
      return failure('Error updating blockchain address');
    }

    return success(data);
  } catch (error) {
    console.error('updateBlockchainAddress error:', error);
    return failure('Server error updating blockchain address');
  }
};

/**
 * Get user by blockchain address
 */
export const getUserByBlockchainAddress = async (
  blockchainAddress: string
): Promise<ServiceResponse<User>> => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('blockchain_address', blockchainAddress)
      .single();

    if (error || !data) {
      return failure('User not found');
    }

    return success(data);
  } catch (error) {
    console.error('getUserByBlockchainAddress error:', error);
    return failure('Server error');
  }
};

/**
 * Get user interests
 */
export const getUserInterests = async (userId: string): Promise<ServiceResponse<Interest[]>> => {
  try {
    const { data, error } = await supabase
      .from('user_interest')
      .select(`
        interest:interest_id (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('getUserInterests error:', error);
      return failure('Error retrieving interests');
    }

    const interests = data?.map(item => (item as any).interest).filter(Boolean) || [];
    return success(interests);
  } catch (error) {
    console.error('getUserInterests error:', error);
    return failure('Server error retrieving interests');
  }
};

/**
 * Add interest to user
 */
export const addUserInterest = async (
  userId: string,
  interestId: string
): Promise<ServiceResponse<void>> => {
  try {
    // Check if interest exists
    const { data: interest } = await supabase
      .from('interest')
      .select('id')
      .eq('id', interestId)
      .single();

    if (!interest) {
      return failure('Interest not found');
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('user_interest')
      .select('*')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .single();

    if (existing) {
      return failure('This interest is already added');
    }

    // Add relationship
    const { error } = await supabase
      .from('user_interest')
      .insert({
        user_id: userId,
        interest_id: interestId,
      });

    if (error) {
      console.error('addUserInterest error:', error);
      return failure('Error adding interest');
    }

    return success(undefined);
  } catch (error) {
    console.error('addUserInterest error:', error);
    return failure('Server error adding interest');
  }
};

/**
 * Remove interest from user
 */
export const removeUserInterest = async (
  userId: string,
  interestId: string
): Promise<ServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('user_interest')
      .delete()
      .eq('user_id', userId)
      .eq('interest_id', interestId);

    if (error) {
      console.error('removeUserInterest error:', error);
      return failure('Error removing interest');
    }

    return success(undefined);
  } catch (error) {
    console.error('removeUserInterest error:', error);
    return failure('Server error removing interest');
  }
};

/**
 * Update user interests (replace all)
 */
export const updateUserInterests = async (
  request: UpdateUserInterestsRequest
): Promise<ServiceResponse<void>> => {
  try {
    const { userId, interestIds } = request;

    // Delete all existing interests
    await supabase
      .from('user_interest')
      .delete()
      .eq('user_id', userId);

    // Add new interests
    if (interestIds.length > 0) {
      const userInterests = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId,
      }));

      const { error } = await supabase
        .from('user_interest')
        .insert(userInterests);

      if (error) {
        console.error('updateUserInterests error:', error);
        return failure('Error updating interests');
      }
    }

    return success(undefined);
  } catch (error) {
    console.error('updateUserInterests error:', error);
    return failure('Server error updating interests');
  }
};

/**
 * Get all available interests
 */
export const getAllInterests = async (): Promise<ServiceResponse<Interest[]>> => {
  try {
    const { data, error } = await supabase
      .from('interest')
      .select('*')
      .order('label');

    if (error) {
      console.error('getAllInterests error:', error);
      return failure('Error retrieving interests');
    }

    return success(data || []);
  } catch (error) {
    console.error('getAllInterests error:', error);
    return failure('Server error retrieving interests');
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<ServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('user')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('deleteUser error:', error);
      return failure('Error deleting user');
    }

    return success(undefined);
  } catch (error) {
    console.error('deleteUser error:', error);
    return failure('Server error deleting user');
  }
};

/**
 * Get complete user profile (with interests and brand if applicable)
 */
export const getUserProfile = async (userId: string): Promise<ServiceResponse<any>> => {
  try {
    // Get user
    const userResult = await getUserById(userId);
    if (!userResult.success || !userResult.data) {
      return userResult;
    }

    const user = userResult.data;

    // Get interests
    const interestsResult = await getUserInterests(userId);
    const interests = interestsResult.success ? interestsResult.data : [];

    // Get brand if user is a brand
    let brand = null;
    if (user.is_brand) {
      const { data: brandData } = await supabase
        .from('brand')
        .select('*')
        .eq('user_id', userId)
        .single();
      brand = brandData;
    }

    return success({
      ...user,
      interests,
      brand,
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return failure('Server error retrieving profile');
  }
};

// Legacy class for compatibility
export class UserService {
  static async getUserFromSession(token: string): Promise<ServiceResponse<any | undefined>> {
    // This method is obsolete with JWT
    return failure('Obsolete method - use JWT');
  }
}

/**
 * Get all users with pagination and filters (admin only)
 */
export const getAllUsers = async (
  request: GetUsersRequest
): Promise<ServiceResponse<{ users: User[]; total: number }>> => {
  try {
    const { limit, offset, filters } = request;
    let query = supabase
      .from('user')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`username.ilike.${searchTerm},email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},id.ilike.${searchTerm}`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('getAllUsers error:', error);
      return failure('Error retrieving users');
    }

    return success({
      users: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return failure('Server error retrieving users');
  }
};
