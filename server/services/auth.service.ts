import { SecurityUtils } from '../utils/crypto';
import supabase from '../config/supabase.config';
import { ServiceResult, ServiceResponse, success, failure } from './service.result';
import { User } from '../types/database.types';
import { generateToken } from './jwt.service';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from './email.service';
import { getUserByEmail, getUserByUsername, createUser } from './user.service';
import crypto from 'crypto';
import { isValidEmail, isValidPassword } from '../utils/validation';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangePasswordRequest,
  AuthResponse,
  GoogleProfile,
} from '../interfaces/auth.interface';
import { CreateUserRequest } from '../interfaces/user.interface';

/**
 * Register a new user
 */
export const register = async (
  request: RegisterRequest
): Promise<ServiceResponse<AuthResponse>> => {
  try {
    // Validate email format
    if (!isValidEmail(request.email)) {
      return failure('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = isValidPassword(request.password);
    if (!passwordValidation.valid) {
      return failure(passwordValidation.error || 'Invalid password');
    }

    // Hash the password
    const passwordHash = await SecurityUtils.hashPassword(request.password);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create the user
    const createUserRequest: CreateUserRequest = {
      email: request.email,
      username: request.username,
      first_name: request.firstName,
      last_name: request.lastName,
      password_hash: passwordHash,
      age_range: request.age_range,
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires.toISOString(),
      verified: false,
      is_brand: false,
      interests: request.interests,
    };

    const userResult = await createUser(createUserRequest);

    if (!userResult.success || !userResult.data) {
      return failure(userResult.error || 'Error creating account');
    }

    const user = userResult.data;

    // Send verification email
    try {
      await sendVerificationEmail(request.email, verificationToken, request.username);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email cannot be sent
    }


    return success({ user, token: null });
  } catch (error) {
    console.error('Register error:', error);
    return failure('Server error during registration');
  }
};

/**
 * User login
 */
export const loginUser = async (
  request: LoginRequest
): Promise<ServiceResponse<AuthResponse>> => {
  try {
    // Get user by email
    const userResult = await getUserByEmail(request.email);
    if (!userResult.success || !userResult.data) {
      return failure('Incorrect email or password');
    }

    const user = userResult.data;

    // Check if account is verified
    if (!user.verified) {
      return failure('Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    // Verify password
    const isPasswordValid = await SecurityUtils.comparePassword(
      request.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      return failure('Incorrect email or password');
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isBrand: user.is_brand,
      verified: user.verified,
    });

    return success({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    return failure('Server error during login');
  }
};

/**
 * Login or create user from Google OAuth profile.
 * - If user exists with this email and password_hash === 'oauth:google': return { user, token }.
 * - If user exists but password_hash !== 'oauth:google': return failure('use_password').
 * - If user does not exist: create user with password_hash 'oauth:google', verified true, then return { user, token }.
 */
export const loginOrCreateFromGoogle = async (
  profile: GoogleProfile
): Promise<ServiceResponse<AuthResponse>> => {
  try {
    if (!profile.email) {
      return failure('Google profile missing email');
    }

    const userResult = await getUserByEmail(profile.email);

    if (userResult.success && userResult.data) {
      const user = userResult.data;
      if (user.password_hash !== 'oauth:google') {
        return failure('use_password');
      }
      const token = generateToken({
        userId: user.id,
        email: user.email,
        isBrand: user.is_brand,
        verified: user.verified,
      });
      return success({ user, token });
    }

    // User does not exist: create one
    const baseUsername = profile.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'user';
    const truncated = baseUsername.length > 30 ? baseUsername.substring(0, 30) : baseUsername;

    let username = truncated;
    for (let attempt = 0; attempt < 10; attempt++) {
      if (attempt > 0) {
        username = truncated + '_' + crypto.randomBytes(3).toString('hex');
      }
      const usernameCheck = await getUserByUsername(username);
      if (!usernameCheck.success) {
        break;
      }
    }

    const createUserRequest: CreateUserRequest = {
      email: profile.email,
      username,
      first_name: profile.given_name?.trim() || 'User',
      last_name: profile.family_name?.trim() || '',
      password_hash: 'oauth:google',
      age_range: '25-34',
      verified: true,
      is_brand: false,
    };

    const createResult = await createUser(createUserRequest);
    if (!createResult.success || !createResult.data) {
      return failure(createResult.error || 'Error creating user');
    }

    const user = createResult.data;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isBrand: user.is_brand,
      verified: user.verified,
    });
    return success({ user, token });
  } catch (error) {
    console.error('loginOrCreateFromGoogle error:', error);
    return failure('Server error during Google sign-in');
  }
};

/**
 * Verify user email
 */
export const verifyEmail = async (
  request: VerifyEmailRequest
): Promise<ServiceResponse<User>> => {
  try {
    // Get user with this verification token
    const { data: user, error } = await supabase
                .from('user')
                .select('*')
      .eq('email_verification_token', request.token)
                .single();

    if (error || !user) {
      return failure('Invalid verification token');
            }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.email_verification_expires || 0);

    if (now > expiresAt) {
      return failure('Verification token has expired');
    }

    // Mark user as verified
    const { data: updatedUser, error: updateError } = await supabase
      .from('user')
      .update({
        verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      console.error('User update error:', updateError);
      return failure('Error verifying email');
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(updatedUser.email, updatedUser.username);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
            }

    return success(updatedUser);
        } catch (error) {
    console.error('Email verification error:', error);
    return failure('Server error during email verification');
        }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (
  request: ResendVerificationRequest
): Promise<ServiceResponse<void>> => {
  try {
    // Get user
    const userResult = await getUserByEmail(request.email);
    if (!userResult.success || !userResult.data) {
      return failure('User not found');
    }

    const user = userResult.data;

    // Check if user is not already verified
    if (user.verified) {
      return failure('This email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Update user
    const { error: updateError } = await supabase
      .from('user')
      .update({
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('User update error:', updateError);
      return failure('Error updating token');
    }

    // Send verification email
    await sendVerificationEmail(request.email, verificationToken, user.username);

    return success(undefined);
  } catch (error) {
    console.error('Resend verification email error:', error);
    return failure('Server error sending email');
  }
};

/**
 * Change user password (authenticated user)
 */
export const changePassword = async (
  userId: string,
  newPassword: string
): Promise<ServiceResponse<void>> => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('id, email, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return failure('User not found');
    }

    const newPasswordHash = await SecurityUtils.hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('user')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return failure('Error changing password');
    }

    try {
      await sendPasswordChangedEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Password changed email error:', emailError);
    }

    return success(undefined);
  } catch (error) {
    console.error('Change password error:', error);
    return failure('Server error changing password');
  }
};

/**
 * Reset password with token (forgot password flow)
 */
export const resetPasswordWithToken = async (
  resetToken: string,
  newPassword: string
): Promise<ServiceResponse<void>> => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('id, email, username, password_reset_token, password_reset_expires')
      .eq('password_reset_token', resetToken)
      .single();

    if (error || !user) {
      return failure('Invalid or expired reset link');
    }

    const expiresAt = user.password_reset_expires ? new Date(user.password_reset_expires) : null;
    if (!expiresAt || expiresAt < new Date()) {
      return failure('Invalid or expired reset link');
    }

    const newPasswordHash = await SecurityUtils.hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('user')
      .update({
        password_hash: newPasswordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password reset update error:', updateError);
      return failure('Error resetting password');
    }

    try {
      await sendPasswordChangedEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Password changed email error:', emailError);
    }

    return success(undefined);
  } catch (error) {
    console.error('Reset password error:', error);
    return failure('Server error resetting password');
  }
};

/**
 * Request password reset (forgot password): generate token, save, send email
 */
export const requestPasswordReset = async (email: string): Promise<ServiceResponse<void>> => {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select('id, email, username')
      .eq('email', email)
      .single();

    if (error || !user) {
      return success(undefined);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('user')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password reset token update error:', updateError);
      return success(undefined);
    }

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username);
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
    }

    return success(undefined);
  } catch (error) {
    console.error('Request password reset error:', error);
    return success(undefined);
  }
};

/**
 * Check if email is available
 */
export const isEmailAvailable = async (email: string): Promise<ServiceResponse<boolean>> => {
  try {
    const { data } = await supabase
      .from('user')
      .select('id')
      .eq('email', email)
      .single();

    return success(!data);
  } catch (error) {
    console.error('Email availability check error:', error);
    return failure('Server error checking email availability');
  }
};

/**
 * Check if username is available
 */
export const isUsernameAvailable = async (username: string): Promise<ServiceResponse<boolean>> => {
  try {
    const { data } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    return success(!data);
        } catch (error) {
    console.error('Username availability check error:', error);
    return failure('Server error checking username availability');
  }
};

// Legacy class for compatibility
export class AuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{ sessionToken: string }> {
    const result = await loginUser({ email, password });
    if (!result.success || !result.data || !result.data.token) {
      throw new Error(result.error || 'Login failed');
    }
    return { sessionToken: result.data.token };
  }

  static async getSession(token: string): Promise<ServiceResult<any>> {
    // This method is obsolete with JWT
            return ServiceResult.failed();
    }
}

export default new AuthService();
