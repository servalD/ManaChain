import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '../interfaces/auth.interface';
import { isValidEmail, isValidPassword } from '../utils/validation';

/**
 * POST /auth/register - Register a new user
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  const { email, username, first_name, last_name, password, age_range, interests } = req.body;

  if (!email || !username || !first_name || !last_name || !password || !age_range) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['email', 'username', 'first_name', 'last_name', 'password', 'age_range'],
    });
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    res.status(400).json({
      error: 'Invalid email format',
    });
    return;
  }

  // Validate password strength
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    res.status(400).json({
      error: passwordValidation.error || 'Invalid password',
    });
    return;
  }

  // Validate age_range
  const validAgeRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  if (!validAgeRanges.includes(age_range)) {
    res.status(400).json({
      error: 'Invalid age_range',
      valid_values: validAgeRanges,
    });
    return;
  }

  const request: RegisterRequest = {
    email,
    username,
    firstName: first_name,
    lastName: last_name,
    password,
    age_range,
    interests,
  };

  const result = await authService.register(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    user: result.data!.user,
  });
};

/**
 * POST /auth/login - User login
 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: 'Email and password required',
    });
    return;
  }

  const request: LoginRequest = { email, password };
  const result = await authService.loginUser(request);

  if (!result.success) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({
    message: 'Login successful',
    user: result.data!.user,
    token: result.data!.token,
  });
};

/**
 * POST /auth/verify-email - Verify email address
 */
export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  const request: VerifyEmailRequest = { token };
  const result = await authService.verifyEmail(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({
    message: 'Email verified successfully',
    user: result.data,
  });
};

/**
 * POST /auth/resend-verification - Resend verification email
 */
export const resendVerificationController = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  const request: ResendVerificationRequest = { email };
  const result = await authService.resendVerificationEmail(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Verification email sent' });
};

/**
 * POST /auth/change-password - Change password (authenticated)
 */
export const changePasswordController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { new_password } = req.body;

  if (!new_password) {
    res.status(400).json({
      error: 'New password required',
    });
    return;
  }

  const passwordValidation = isValidPassword(new_password);
  if (!passwordValidation.valid) {
    res.status(400).json({
      error: passwordValidation.error || 'Invalid password',
    });
    return;
  }

  const result = await authService.changePassword(userId, new_password);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Password changed successfully' });
};

/**
 * POST /auth/reset-password - Reset password with token (forgot password flow)
 */
export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    res.status(400).json({
      error: 'Token and new password required',
    });
    return;
  }

  const passwordValidation = isValidPassword(new_password);
  if (!passwordValidation.valid) {
    res.status(400).json({
      error: passwordValidation.error || 'Invalid password',
    });
    return;
  }

  const result = await authService.resetPasswordWithToken(token, new_password);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Password reset successfully' });
};

/**
 * POST /auth/forgot-password - Request password reset email
 */
export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      error: 'Email required',
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      error: 'Invalid email format',
    });
    return;
  }

  await authService.requestPasswordReset(email);

  res.json({
    message: 'If an account exists with this email, you will receive a password reset link.',
  });
};
