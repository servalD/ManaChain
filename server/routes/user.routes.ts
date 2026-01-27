import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  getUserProfileController,
  updateUserController,
  updateBlockchainAddressController,
  getUserInterestsController,
  updateUserInterestsController,
  getAllInterestsController,
  getUserFromTokenController,
  getAllUsersController,
} from '../controllers/user.controller';

const router = Router();

// GET /users/me - Get current user profile
router.get('/me', requireAuth, getUserProfileController);

// PUT /users/me - Update current user profile
router.put('/me', requireAuth, updateUserController);

// PUT /users/me/blockchain-address - Update blockchain address
router.put('/me/blockchain-address', requireAuth, updateBlockchainAddressController);

// GET /users/me/interests - Get user interests
router.get('/me/interests', requireAuth, getUserInterestsController);

// PUT /users/me/interests - Update user interests
router.put('/me/interests', requireAuth, updateUserInterestsController);

// GET /interests - Get all available interests
router.get('/interests', getAllInterestsController);

// GET /users/from-token/:token - Get user from JWT token
router.get('/from-token/:token', getUserFromTokenController);

// GET /users - Get all users (admin only)
router.get('/', requireAuth, requireAdmin, getAllUsersController);

export default router;
