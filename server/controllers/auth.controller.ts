import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangePasswordRequest,
} from '../interfaces/auth.interface';

/**
 * POST /auth/register - Register a new user
 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  const { email, username, first_name, last_name, password, interests } = req.body;

  if (!email || !username || !first_name || !last_name || !password) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['email', 'username', 'first_name', 'last_name', 'password'],
    });
    return;
  }

  const request: RegisterRequest = {
    email,
    username,
    firstName: first_name,
    lastName: last_name,
    password,
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
    token: result.data!.token,
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
  const { old_password, new_password } = req.body;

  if (!old_password || !new_password) {
    res.status(400).json({
      error: 'Old and new password required',
    });
    return;
  }

  const request: ChangePasswordRequest = {
    userId,
    oldPassword: old_password,
    newPassword: new_password,
  };

  const result = await authService.changePassword(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Password changed successfully' });
};
