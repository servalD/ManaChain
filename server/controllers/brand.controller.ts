import { Request, Response } from 'express';
import {
  createBrand,
  getBrandById,
  getBrandByUserId,
  getAllBrands,
  updateBrand,
  deleteBrand,
  getBrandStats,
} from '../services/brand.service';
import {
  CreateBrandRequest,
  UpdateBrandRequest,
  GetBrandsRequest,
  DeleteBrandRequest,
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
    const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;
    const search = req.query.search as string | undefined;

    const request: GetBrandsRequest = {
      limit,
      offset,
      filters: {
        category,
        verified,
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
