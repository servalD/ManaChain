import { Request, Response } from 'express';
import {
  createBrand,
  getBrandById,
  getBrandByUserId,
  getAllBrands,
  getAllActiveBrands,
  updateBrand,
  deleteBrand,
  getBrandStats,
  createBrandApplication,
  getAllBrandApplications,
  getBrandApplicationById,
  approveBrandApplication,
  rejectBrandApplication,
  verifyBrandApplicationEmail,
} from '../services/brand.service';
import {
  confirmBrandMedia,
  getBrandMedia,
  deleteBrandMedia,
} from '../services/brand-media.service';
import {
  CreateBrandRequest,
  UpdateBrandRequest,
  GetBrandsRequest,
  DeleteBrandRequest,
  CreateBrandApplicationRequest,
  GetBrandApplicationsRequest,
  ApproveBrandApplicationRequest,
  RejectBrandApplicationRequest,
} from '../interfaces/brand.interface';

/**
 * POST /brands
 * Create a new brand for the authenticated user
 */
export const createBrandController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const {
      name,
      category,
      description,
      logo_url,
      website_url,
      siret,
      country,
      headquarters_street,
      headquarters_city,
      headquarters_zip_code,
      headquarters_address_complement,
    } = req.body;

    // Validation
    if (!name || !category || !country || !headquarters_street || !headquarters_city || !headquarters_zip_code) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'category', 'country', 'headquarters_street', 'headquarters_city', 'headquarters_zip_code'],
      });
      return;
    }

    const request: CreateBrandRequest = {
      userId,
      name,
      category,
      description,
      logo_url,
      website_url,
      siret,
      country,
      headquarters_street,
      headquarters_city,
      headquarters_zip_code,
      headquarters_address_complement,
    };

    const result = await createBrand(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Brand created successfully',
      brand: result.data,
    });
  } catch (error) {
    console.error('createBrandController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/:id
 * Get brand by ID
 */
export const getBrandByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getBrandById(id);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ brand: result.data });
  } catch (error) {
    console.error('getBrandByIdController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/user/:userId
 * Get brand by user ID
 */
export const getBrandByUserIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const result = await getBrandByUserId(userId);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ brand: result.data });
  } catch (error) {
    console.error('getBrandByUserIdController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/me
 * Get current user's brand
 */
export const getMyBrandController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const result = await getBrandByUserId(userId);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ brand: result.data });
  } catch (error) {
    console.error('getMyBrandController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands
 * Get all brands with pagination and filters
 */
export const getAllBrandsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const request: GetBrandsRequest = {
      limit,
      offset,
      filters: {
        category,
        search,
      },
    };

    const result = await getAllBrands(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      brands: result.data!.brands,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getAllBrandsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /brands/:id
 * Update brand
 */
export const updateBrandController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const {
      name,
      category,
      description,
      logo_url,
      website_url,
      siret,
      country,
      headquarters_street,
      headquarters_city,
      headquarters_zip_code,
      headquarters_address_complement,
    } = req.body;

    const request: UpdateBrandRequest = {
      brandId: id,
      userId,
      name,
      category,
      description,
      logo_url,
      website_url,
      siret,
      country,
      headquarters_street,
      headquarters_city,
      headquarters_zip_code,
      headquarters_address_complement,
    };

    const result = await updateBrand(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Brand updated successfully',
      brand: result.data,
    });
  } catch (error) {
    console.error('updateBrandController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * DELETE /brands/:id
 * Delete brand
 */
export const deleteBrandController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const request: DeleteBrandRequest = {
      brandId: id,
      userId,
    };

    const result = await deleteBrand(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('deleteBrandController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/:id/stats
 * Get brand statistics
 */
export const getBrandStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getBrandStats(id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ stats: result.data });
  } catch (error) {
    console.error('getBrandStatsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /brand-applications
 * Create a new brand application (public endpoint)
 */
export const createBrandApplicationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateBrandApplicationRequest = req.body;

    // Validate required fields
    const requiredFields = [
      'contact_email',
      'contact_first_name',
      'contact_last_name',
      'brand_name',
      'interest_ids',
      'business_registration_number',
      'country',
      'headquarters_street',
      'headquarters_city',
      'headquarters_zip_code',
    ];

    const missingFields = requiredFields.filter(field => !(field in req.body) || !req.body[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        required: missingFields,
      });
      return;
    }

    // Validate interest_ids is an array with 1-2 elements
    if (!Array.isArray(req.body.interest_ids)) {
      res.status(400).json({
        error: 'interest_ids must be an array',
      });
      return;
    }

    if (req.body.interest_ids.length < 1 || req.body.interest_ids.length > 2) {
      res.status(400).json({
        error: 'You must select between 1 and 2 interests',
      });
      return;
    }

    const result = await createBrandApplication(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Brand application submitted successfully',
      application: result.data,
    });
  } catch (error) {
    console.error('createBrandApplicationController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brand-applications
 * Get all brand applications with pagination and filters (admin only)
 */
export const getAllBrandApplicationsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'needs_review' | undefined;
    const search = req.query.search as string | undefined;

    const request: GetBrandApplicationsRequest = {
      limit,
      offset,
      filters: {
        status,
        search,
      },
    };

    const result = await getAllBrandApplications(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      applications: result.data!.applications,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getAllBrandApplicationsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brand-applications/:id
 * Get brand application by ID (admin only)
 */
export const getBrandApplicationByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getBrandApplicationById(id);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ application: result.data });
  } catch (error) {
    console.error('getBrandApplicationByIdController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /brand-applications/:id/approve
 * Approve a brand application (admin only)
 */
export const approveBrandApplicationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminUserId = (req as any).userId;

    const request: ApproveBrandApplicationRequest = {
      applicationId: id,
      adminUserId,
    };

    const result = await approveBrandApplication(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Brand application approved successfully',
      userId: result.data!.userId,
      brandId: result.data!.brandId,
    });
  } catch (error) {
    console.error('approveBrandApplicationController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /brands/applications/verify-email
 * Verify email for a brand application (public endpoint)
 */
export const verifyBrandApplicationEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    const result = await verifyBrandApplicationEmail(token);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Email verified successfully',
      application: result.data,
    });
  } catch (error) {
    console.error('verifyBrandApplicationEmailController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /brand-applications/:id/reject
 * Reject a brand application (admin only)
 */
export const rejectBrandApplicationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminUserId = (req as any).userId;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      res.status(400).json({
        error: 'Missing required field: rejection_reason',
      });
      return;
    }

    const request: RejectBrandApplicationRequest = {
      applicationId: id,
      adminUserId,
      rejection_reason,
    };

    const result = await rejectBrandApplication(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Brand application rejected successfully',
    });
  } catch (error) {
    console.error('rejectBrandApplicationController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/admin/active
 * Get all active brands with pagination and filters (admin only)
 */
export const getAllActiveBrandsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const request: GetBrandsRequest = {
      limit,
      offset,
      filters: {
        category,
        search,
      },
    };

    const result = await getAllActiveBrands(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      brands: result.data!.brands,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getAllActiveBrandsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /brands/:id/media/confirm
 * Confirm and save a brand media that was already uploaded to Pinata
 */
export const confirmBrandMediaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { ipfsHash, ipfsUrl } = req.body;

    if (!ipfsHash || !ipfsUrl) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['ipfsHash', 'ipfsUrl'],
      });
      return;
    }

    const result = await confirmBrandMedia(id, userId, ipfsHash, ipfsUrl);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Media confirmed and saved successfully',
      media: result.data,
    });
  } catch (error) {
    console.error('confirmBrandMediaController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /brands/:id/media
 * Get all media for a brand
 */
export const getBrandMediaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getBrandMedia(id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      media: result.data || [],
    });
  } catch (error) {
    console.error('getBrandMediaController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * DELETE /brands/:id/media/:mediaId
 * Delete a brand media (unpin is handled by frontend)
 */
export const deleteBrandMediaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id, mediaId } = req.params;

    const result = await deleteBrandMedia(mediaId, id, userId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('deleteBrandMediaController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
