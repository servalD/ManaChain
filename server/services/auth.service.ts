import { SecurityUtils } from '../utils/crypto';
import supabase from '../config/supabase.config';
import { ServiceResult, ServiceResponse, success, failure } from './service.result';
import { User } from '../types/database.types';
import { generateToken } from './jwt.service';
import { sendVerificationEmail, sendWelcomeEmail } from './email.service';
import { getUserByEmail, createUser } from './user.service';
import crypto from 'crypto';
import { isValidEmail, isValidPassword } from '../utils/validation';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangePasswordRequest,
  AuthResponse,
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
 * Change user password
 */
export const changePassword = async (
  request: ChangePasswordRequest
): Promise<ServiceResponse<void>> => {
  try {
    // Get user
    const { data: user, error } = await supabase
      .from('user')
      .select('password_hash')
      .eq('id', request.userId)
                .single();

    if (error || !user) {
      return failure('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await SecurityUtils.comparePassword(
      request.oldPassword,
      user.password_hash
    );
    if (!isOldPasswordValid) {
      return failure('Incorrect old password');
    }

    // Hash new password
    const newPasswordHash = await SecurityUtils.hashPassword(request.newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('user')
      .update({ password_hash: newPasswordHash })
      .eq('id', request.userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return failure('Error changing password');
    }

    return success(undefined);
  } catch (error) {
    console.error('Change password error:', error);
    return failure('Server error changing password');
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
