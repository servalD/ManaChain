import { Router } from 'express';
import { requireAuth, optionalAuth, requireVerified, requireBrand, requireAdmin } from '../middleware/auth.middleware';
import * as brandController from '../controllers/brand.controller';

const router = Router();

// =============================================================
//                     BRAND APPLICATION ROUTES
// =============================================================

// POST /brand-applications - Create a new brand application (public)
router.post('/applications', brandController.createBrandApplicationController);

// POST /brand-applications/verify-email - Verify email for brand application (public)
router.post('/applications/verify-email', brandController.verifyBrandApplicationEmailController);

// GET /brand-applications - Get all brand applications (admin only)
router.get('/applications', requireAuth, requireAdmin, brandController.getAllBrandApplicationsController);

// GET /brand-applications/:id - Get brand application by ID (admin only)
router.get('/applications/:id', requireAuth, requireAdmin, brandController.getBrandApplicationByIdController);

// PUT /brand-applications/:id/approve - Approve brand application (admin only)
router.put('/applications/:id/approve', requireAuth, requireAdmin, brandController.approveBrandApplicationController);

// PUT /brand-applications/:id/reject - Reject brand application (admin only)
router.put('/applications/:id/reject', requireAuth, requireAdmin, brandController.rejectBrandApplicationController);


// =============================================================
//                         BRAND ROUTES
// =============================================================

// POST /brands - Create a new brand
router.post('/', requireAuth, requireVerified, brandController.createBrandController);

// GET /brands - Get all brands with pagination and filters
router.get('/', optionalAuth, brandController.getAllBrandsController);

// GET /brands/admin/active - Get all active brands (admin only) - MUST be before /:id route
router.get('/admin/active', requireAuth, requireAdmin, brandController.getAllActiveBrandsController);

// GET /brands/me - Get current user's brand - MUST be before /:id route
router.get('/me', requireAuth, requireBrand, brandController.getMyBrandController);

// GET /brands/user/:userId - Get brand by user ID - MUST be before /:id route
router.get('/user/:userId', optionalAuth, brandController.getBrandByUserIdController);

// GET /brands/:id/stats - Get brand statistics - MUST be before /:id route
router.get('/:id/stats', optionalAuth, brandController.getBrandStatsController);

// GET /brands/:id/media - Get all media for a brand - MUST be before /:id route
router.get('/:id/media', optionalAuth, brandController.getBrandMediaController);

// POST /brands/:id/media/confirm - Confirm and save media - MUST be before /:id route
router.post('/:id/media/confirm', requireAuth, requireBrand, brandController.confirmBrandMediaController);

// DELETE /brands/:id/media/:mediaId - Delete media - MUST be before /:id route
router.delete('/:id/media/:mediaId', requireAuth, requireBrand, brandController.deleteBrandMediaController);

// GET /brands/:id - Get brand by ID
router.get('/:id', optionalAuth, brandController.getBrandByIdController);

// PUT /brands/:id - Update brand
router.put('/:id', requireAuth, requireBrand, brandController.updateBrandController);

// DELETE /brands/:id - Delete brand
router.delete('/:id', requireAuth, requireBrand, brandController.deleteBrandController);

export default router;
