import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { UpdateUserRequest, UpdateUserInterestsRequest } from '../interfaces/user.interface';
import { verifyToken } from '../services/jwt.service';

/**
 * GET /users/me - Get current user profile
 */
export const getUserProfileController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;

  const result = await userService.getUserProfile(userId);

  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }

  res.json({ user: result.data });
};

/**
 * PUT /users/me - Update current user profile
 */
export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { username, first_name, last_name, avatar_url, age_range } = req.body;

  if (age_range) {
    const validAgeRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    if (!validAgeRanges.includes(age_range)) {
      res.status(400).json({
        error: 'Invalid age_range',
        valid_values: validAgeRanges,
      });
      return;
    }
  }

  const request: UpdateUserRequest = {
    userId,
    username,
    first_name,
    last_name,
    avatar_url,
    age_range,
  };

  const result = await userService.updateUser(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({
    message: 'Profile updated',
    user: result.data,
  });
};

/**
 * PUT /users/me/blockchain-address - Update blockchain address
 */
export const updateBlockchainAddressController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = (req as any).userId;
  const { blockchain_address } = req.body;

  if (!blockchain_address) {
    res.status(400).json({ error: 'Blockchain address is required' });
    return;
  }

  // Validate Ethereum address format (0x followed by 40 hex characters)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(blockchain_address)) {
    res.status(400).json({ error: 'Invalid blockchain address format' });
    return;
  }

  const result = await userService.updateBlockchainAddress(userId, blockchain_address);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ user: result.data });
};

/**
 * GET /users/me/interests - Get user interests
 */
export const getUserInterestsController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;

  const result = await userService.getUserInterests(userId);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ interests: result.data });
};

/**
 * PUT /users/me/interests - Update user interests
 */
export const updateUserInterestsController = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { interests } = req.body;

  if (!Array.isArray(interests)) {
    res.status(400).json({ error: 'The interests field must be an array' });
    return;
  }

  const request: UpdateUserInterestsRequest = {
    userId,
    interestIds: interests,
  };

  const result = await userService.updateUserInterests(request);

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Interests updated' });
};

/**
 * GET /interests - Get all available interests
 */
export const getAllInterestsController = async (req: Request, res: Response): Promise<void> => {
  const result = await userService.getAllInterests();

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ interests: result.data });
};

/**
 * GET /users/from-token/:token - Get user from JWT token
 */
export const getUserFromTokenController = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  try {
    // Verify and decode the token
    const decoded = verifyToken(token);
    
    // Get user by ID from token
    const result = await userService.getUserById(decoded.userId);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ user: result.data });
  } catch (error: any) {
    if (error.message === 'Token expired') {
      res.status(401).json({ error: 'Token expired' });
      return;
    } else if (error.message === 'Invalid token') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    console.error('Error getting user from token:', error);
    res.status(500).json({ error: 'Error fetching user from token' });
    }
};
