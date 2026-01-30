import { Request, Response } from 'express';
import * as likeService from '../services/like.service';

/**
 * POST /likes
 * Create a like for a brand
 */
export const createLikeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { brandId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!brandId) {
      res.status(400).json({
        success: false,
        message: 'Brand ID is required',
      });
      return;
    }

    const result = await likeService.createLike({
      userId,
      brandId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Brand liked successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error in createLikeController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /likes/me
 * Get current user's likes
 */
export const getUserLikesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const result = await likeService.getUserLikes({ userId });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getUserLikesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /likes/brand/:brandId
 * Get likes for a specific brand (brand owner only)
 */
export const getBrandLikesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { brandId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!brandId) {
      res.status(400).json({
        success: false,
        message: 'Brand ID is required',
      });
      return;
    }

    // Verify that the user owns this brand
    const { default: supabase } = await import('../config/supabase.config');
    const { data: brand, error: brandError } = await supabase
      .from('brand')
      .select('user_id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
      return;
    }

    // Check if user owns this brand or is admin
    if (brand.user_id !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view likes for this brand',
      });
      return;
    }

    const result = await likeService.getBrandLikes({ brandId });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error in getBrandLikesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * DELETE /likes/:likeId
 * Remove a like (user can only delete their own like)
 */
export const deleteLikeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { likeId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!likeId) {
      res.status(400).json({
        success: false,
        message: 'Like ID is required',
      });
      return;
    }

    const result = await likeService.deleteLike({
      userId,
      likeId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Like removed successfully',
    });
  } catch (error) {
    console.error('Error in deleteLikeController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
