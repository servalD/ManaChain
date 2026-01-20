import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import { Brand, BrandApplication } from '../types/database.types';
import {
  CreateBrandRequest,
  UpdateBrandRequest,
  GetBrandsRequest,
  DeleteBrandRequest,
  CreateBrandApplicationRequest,
  GetBrandApplicationsRequest,
  ApproveBrandApplicationRequest,
  RejectBrandApplicationRequest,
} from '../interfaces/brand.interface';
import { SecurityUtils } from '../utils/crypto';
import { sendBrandApplicationNotificationEmail, sendBrandApplicationApprovedEmail, sendBrandApplicationRejectedEmail, sendBrandApplicationVerificationEmail } from './email.service';
import crypto from 'crypto';

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

/**
 * Create a new brand application
 */
export const createBrandApplication = async (
  request: CreateBrandApplicationRequest
): Promise<ServiceResponse<BrandApplication>> => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.contact_email)) {
      return failure('Invalid email format');
    }

    // Validate interest_ids (1-2 required)
    if (!request.interest_ids || !Array.isArray(request.interest_ids)) {
      return failure('Interest IDs must be an array');
    }
    if (request.interest_ids.length < 1) {
      return failure('At least 1 interest is required');
    }
    if (request.interest_ids.length > 2) {
      return failure('Maximum 2 interests allowed');
    }

    // Validate that all interest_ids exist
    const { data: existingInterests, error: interestsError } = await supabase
      .from('interest')
      .select('id')
      .in('id', request.interest_ids);

    if (interestsError || !existingInterests || existingInterests.length !== request.interest_ids.length) {
      return failure('One or more invalid interest IDs');
    }

    const { data: existingRegistration } = await supabase
      .from('brand_application')
      .select('id')
      .eq('business_registration_number', request.business_registration_number)
      .single();

    if (existingRegistration) {
      return failure('This business registration number is already registered');
    }

    const { data: existingBrandApp } = await supabase
      .from('brand_application')
      .select('id')
      .eq('brand_name', request.brand_name)
      .in('status', ['pending', 'approved', 'needs_review'])
      .single();

    if (existingBrandApp) {
      return failure('This brand name is already in use or pending approval');
    }

    const { data: existingBrand } = await supabase
      .from('brand')
      .select('id')
      .eq('name', request.brand_name)
      .single();

    if (existingBrand) {
      return failure('This brand name is already in use');
    }

    // Destructure interest_ids from request to handle separately
    const { interest_ids, ...applicationData } = request;

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const { data, error } = await supabase
      .from('brand_application')
      .insert({
        ...applicationData,
        status: 'pending',
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
        email_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Brand application creation error:', error);
      return failure('Error creating brand application');
    }

    // Insert interests into brand_application_interest table
    const interestInserts = interest_ids.map(interest_id => ({
      brand_application_id: data.id,
      interest_id,
    }));

    const { error: interestError } = await supabase
      .from('brand_application_interest')
      .insert(interestInserts);

    if (interestError) {
      console.error('Brand application interest creation error:', interestError);
      // Rollback: delete the application
      await supabase.from('brand_application').delete().eq('id', data.id);
      return failure('Error linking interests to brand application');
    }

    // Send verification email to brand contact
    try {
      await sendBrandApplicationVerificationEmail(
        data.contact_email,
        verificationToken,
        data.contact_first_name,
        data.brand_name
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the application creation if email fails
    }

    // Send notification email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendBrandApplicationNotificationEmail(adminEmail, data);
      } else {
        // Fallback: get all admin users and send to them
        const { data: admins } = await supabase
          .from('user')
          .select('email')
          .eq('role', 'ADMIN');
        
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await sendBrandApplicationNotificationEmail(admin.email, data);
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the application creation if email fails
    }

    return success(data);
  } catch (error) {
    console.error('createBrandApplication error:', error);
    return failure('Server error creating brand application');
  }
};

/**
 * Get all brand applications with pagination and filters
 */
export const getAllBrandApplications = async (
  request: GetBrandApplicationsRequest
): Promise<ServiceResponse<{ applications: BrandApplication[]; total: number }>> => {
  try {
    const { limit, offset, filters } = request;
    let query = supabase.from('brand_application').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`contact_email.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%`);
    }

    // Pagination and sorting
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getAllBrandApplications error:', error);
      return failure('Error retrieving brand applications');
    }

    return success({
      applications: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getAllBrandApplications error:', error);
    return failure('Server error retrieving brand applications');
  }
};

/**
 * Get brand application by ID
 */
export const getBrandApplicationById = async (
  applicationId: string
): Promise<ServiceResponse<BrandApplication>> => {
  try {
    const { data, error } = await supabase
      .from('brand_application')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !data) {
      return failure('Brand application not found');
    }

    return success(data);
  } catch (error) {
    console.error('getBrandApplicationById error:', error);
    return failure('Server error retrieving brand application');
  }
};

/**
 * Approve a brand application
 * This creates a user account and brand, then marks the application as approved
 */
export const approveBrandApplication = async (
  request: ApproveBrandApplicationRequest
): Promise<ServiceResponse<{ userId: string; brandId: string }>> => {
  try {
    // Get the application
    const { data: application, error: appError } = await supabase
      .from('brand_application')
      .select('*')
      .eq('id', request.applicationId)
      .single();

    if (appError || !application) {
      return failure('Brand application not found');
    }

    // Check status
    if (application.status !== 'pending' && application.status !== 'needs_review') {
      return failure('Only pending or needs_review applications can be approved');
    }

    // Check if email is verified
    if (!application.email_verified) {
      return failure('Email must be verified before the application can be approved');
    }

    // Generate secure password and username
    const generatedPassword = SecurityUtils.generateSecurePassword();
    const passwordHash = await SecurityUtils.hashPassword(generatedPassword);
    let username = SecurityUtils.generateUsernameFromBrandName(application.brand_name);

    // Ensure username is unique
    let usernameAttempt = username;
    let counter = 1;
    while (true) {
      const { data: existingUser } = await supabase
        .from('user')
        .select('id')
        .eq('username', usernameAttempt)
        .single();

      if (!existingUser) {
        username = usernameAttempt;
        break;
      }

      usernameAttempt = `${username}${counter}`;
      counter++;
    }

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('user')
      .insert({
        email: application.contact_email,
        username,
        first_name: application.contact_first_name,
        last_name: application.contact_last_name,
        password_hash: passwordHash,
        age_range: '18-24', // Default, can be updated by brand later
        is_brand: true,
        role: 'BRANDUSER',
        verified: true, // Pre-verified
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('User creation error:', userError);
      return failure('Error creating user account');
    }

    // Retrieve interests from brand_application_interest
    const { data: applicationInterests, error: interestsError } = await supabase
      .from('brand_application_interest')
      .select('interest_id')
      .eq('brand_application_id', request.applicationId);

    if (interestsError) {
      console.error('Error retrieving application interests:', interestsError);
      return failure('Error retrieving application interests');
    }

    const interestIds = applicationInterests?.map(ai => ai.interest_id) || [];

    // Create brand
    const { data: newBrand, error: brandError } = await supabase
      .from('brand')
      .insert({
        user_id: newUser.id,
        name: application.brand_name,
        description: application.description,
        logo_url: application.logo_url,
        website_url: application.website_url,
        business_registration_number: application.business_registration_number,
        country: application.country,
        headquarters_street: application.headquarters_street,
        headquarters_city: application.headquarters_city,
        headquarters_zip_code: application.headquarters_zip_code,
        headquarters_address_complement: application.headquarters_address_complement,
        social_medias: application.social_media_links,
      })
      .select()
      .single();

    if (brandError || !newBrand) {
      console.error('Brand creation error:', brandError);
      // Rollback: delete the user
      await supabase.from('user').delete().eq('id', newUser.id);
      return failure('Error creating brand');
    }

    // Insert interests into brand_interest table
    if (interestIds.length > 0) {
      const brandInterestInserts = interestIds.map(interest_id => ({
        brand_id: newBrand.id,
        interest_id,
      }));

      const { error: brandInterestError } = await supabase
        .from('brand_interest')
        .insert(brandInterestInserts);

      if (brandInterestError) {
        console.error('Brand interest creation error:', brandInterestError);
        // Rollback: delete brand and user
        await supabase.from('brand').delete().eq('id', newBrand.id);
        await supabase.from('user').delete().eq('id', newUser.id);
        return failure('Error linking interests to brand');
      }
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('brand_application')
      .update({
        status: 'approved',
        reviewed_by: request.adminUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.applicationId);

    if (updateError) {
      console.error('Application update error:', updateError);
      // Rollback: delete brand and user
      await supabase.from('brand').delete().eq('id', newBrand.id);
      await supabase.from('user').delete().eq('id', newUser.id);
      return failure('Error updating application status');
    }

    // Send approval email with credentials
    try {
      await sendBrandApplicationApprovedEmail(
        application.contact_email,
        {
          username,
          password: generatedPassword,
        },
        application.brand_name
      );
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't rollback if email fails
    }

    return success({
      userId: newUser.id,
      brandId: newBrand.id,
    });
  } catch (error) {
    console.error('approveBrandApplication error:', error);
    return failure('Server error approving brand application');
  }
};

/**
 * Verify email for a brand application
 */
export const verifyBrandApplicationEmail = async (
  token: string
): Promise<ServiceResponse<BrandApplication>> => {
  try {
    // Get application with this verification token
    const { data: application, error } = await supabase
      .from('brand_application')
      .select('*')
      .eq('email_verification_token', token)
      .single();

    if (error || !application) {
      return failure('Invalid verification token');
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(application.email_verification_expires || 0);

    if (now > expiresAt) {
      return failure('Verification token has expired');
    }

    // Check if already verified
    if (application.email_verified) {
      return success(application);
    }

    // Mark email as verified
    const { data: updatedApplication, error: updateError } = await supabase
      .from('brand_application')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', application.id)
      .select()
      .single();

    if (updateError || !updatedApplication) {
      console.error('Application update error:', updateError);
      return failure('Error verifying email');
    }

    return success(updatedApplication);
  } catch (error) {
    console.error('Email verification error:', error);
    return failure('Server error during email verification');
  }
};

/**
 * Reject a brand application
 */
export const rejectBrandApplication = async (
  request: RejectBrandApplicationRequest
): Promise<ServiceResponse<void>> => {
  try {
    // Get the application
    const { data: application, error: appError } = await supabase
      .from('brand_application')
      .select('*')
      .eq('id', request.applicationId)
      .single();

    if (appError || !application) {
      return failure('Brand application not found');
    }

    // Check status
    if (application.status !== 'pending' && application.status !== 'needs_review') {
      return failure('Only pending or needs_review applications can be rejected');
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('brand_application')
      .update({
        status: 'rejected',
        rejection_reason: request.rejection_reason,
        reviewed_by: request.adminUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.applicationId);

    if (updateError) {
      console.error('Application update error:', updateError);
      return failure('Error updating application status');
    }

    // Send rejection email
    try {
      await sendBrandApplicationRejectedEmail(
        application.contact_email,
        request.rejection_reason,
        application.brand_name
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail if email fails
    }

    return success(undefined);
  } catch (error) {
    console.error('rejectBrandApplication error:', error);
    return failure('Server error rejecting brand application');
  }
};
