import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  registerController,
  loginController,
  verifyEmailController,
  resendVerificationController,
  changePasswordController,
} from '../controllers/auth.controller';

const router = Router();

// POST /auth/register - Register a new user
router.post('/register', registerController);

// POST /auth/login - User login
router.post('/login', loginController);

// POST /auth/verify-email - Verify email address
router.post('/verify-email', verifyEmailController);

// POST /auth/resend-verification - Resend verification email
router.post('/resend-verification', resendVerificationController);

// POST /auth/change-password - Change password (authenticated)
router.post('/change-password', requireAuth, changePasswordController);

export default router;
