import { Router } from 'express';
import { requireAuth, optionalAuth, requireVerified, requireBrand, requireAdmin } from '../middleware/auth.middleware';
import * as brandController from '../controllers/brand.controller';

const router = Router();

// Brand Application Routes
// POST /brand-applications - Create a new brand application (public)
router.post('/applications', brandController.createBrandApplicationController);

// GET /brand-applications - Get all brand applications (admin only)
router.get('/applications', requireAuth, requireAdmin, brandController.getAllBrandApplicationsController);

// GET /brand-applications/:id - Get brand application by ID (admin only)
router.get('/applications/:id', requireAuth, requireAdmin, brandController.getBrandApplicationByIdController);

// PUT /brand-applications/:id/approve - Approve brand application (admin only)
router.put('/applications/:id/approve', requireAuth, requireAdmin, brandController.approveBrandApplicationController);

// PUT /brand-applications/:id/reject - Reject brand application (admin only)
router.put('/applications/:id/reject', requireAuth, requireAdmin, brandController.rejectBrandApplicationController);

// Brand Routes
// POST /brands - Create a new brand
router.post('/', requireAuth, requireVerified, brandController.createBrandController);

// GET /brands - Get all brands with pagination and filters
router.get('/', optionalAuth, brandController.getAllBrandsController);

// GET /brands/me - Get current user's brand
router.get('/me', requireAuth, requireBrand, brandController.getMyBrandController);

// GET /brands/:id - Get brand by ID
router.get('/:id', optionalAuth, brandController.getBrandByIdController);

// GET /brands/user/:userId - Get brand by user ID
router.get('/user/:userId', optionalAuth, brandController.getBrandByUserIdController);

// PUT /brands/:id - Update brand
router.put('/:id', requireAuth, requireBrand, brandController.updateBrandController);

// DELETE /brands/:id - Delete brand
router.delete('/:id', requireAuth, requireBrand, brandController.deleteBrandController);

// GET /brands/:id/stats - Get brand statistics
router.get('/:id/stats', optionalAuth, brandController.getBrandStatsController);

export default router;
