import { Request, Response } from 'express';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from '../interfaces/auth.interface';
import { isValidEmail, isValidPassword } from '../utils/validation';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const API_URL = process.env.API_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

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

/**
 * GET /auth/google - Redirect user to Google OAuth consent screen
 */
export const googleAuthController = async (req: Request, res: Response): Promise<void> => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    return;
  }

  const redirectUri = `${API_URL}/auth/google/callback`;
  const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
    prompt: 'consent',
  });

  res.redirect(302, authUrl);
};

/**
 * GET /auth/google/callback - Handle Google OAuth callback, exchange code, find/create user, redirect to front with token and role
 */
export const googleCallbackController = async (req: Request, res: Response): Promise<void> => {
  const { code, error: oauthError } = req.query;

  if (oauthError) {
    res.redirect(`${FRONTEND_URL}/login?error=access_denied`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    return;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    return;
  }

  const redirectUri = `${API_URL}/auth/google/callback`;
  const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token) {
      res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
      return;
    }

    const userinfoRes = await axios.get<{ email?: string; given_name?: string; family_name?: string }>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const userinfo = userinfoRes.data;

    if (!userinfo.email) {
      res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
      return;
    }

    const profile = {
      email: userinfo.email,
      given_name: userinfo.given_name ?? null,
      family_name: userinfo.family_name ?? null,
    };

    const result = await authService.loginOrCreateFromGoogle(profile);

    if (!result.success) {
      if (result.error === 'use_password') {
        res.redirect(`${FRONTEND_URL}/login?error=use_password`);
        return;
      }
      res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
      return;
    }

    const { user, token } = result.data!;
    const role = user.role ?? 'CLIENT';
    const tokenStr = typeof token === 'string' ? token : '';
    res.redirect(302, `${FRONTEND_URL}/login?token=${encodeURIComponent(tokenStr)}&role=${encodeURIComponent(role)}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
};
