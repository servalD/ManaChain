import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as likeController from '../controllers/like.controller';

const router = Router();

// =============================================================
//                         LIKE ROUTES
// =============================================================

// POST /likes - Create a like (authenticated)
router.post('/', requireAuth, likeController.createLikeController);

// GET /likes/me - Get current user's likes (authenticated)
router.get('/me', requireAuth, likeController.getUserLikesController);

// GET /likes/brand/:brandId - Get likes for a brand (authenticated, brand owner only)
router.get('/brand/:brandId', requireAuth, likeController.getBrandLikesController);

// DELETE /likes/:likeId - Remove a like (authenticated, own like only)
router.delete('/:likeId', requireAuth, likeController.deleteLikeController);

export default router;
