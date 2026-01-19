import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../services/jwt.service';
import { getUserById } from '../services/user.service';

/**
 * Middleware to verify JWT authentication
 * Adds req.user and req.userId to the request if token is valid
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Missing authentication token',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Verify and decode JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      res.status(401).json({
        error: error.message || 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Get complete user
    const userResult = await getUserById(decoded.userId);
    if (!userResult.success || !userResult.data) {
      res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Add user information to request
    (req as any).user = userResult.data;
    (req as any).userId = decoded.userId;
    (req as any).token = token;

    next();
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Middleware for optional authentication
 * Adds req.user and req.userId if a valid token is present, otherwise continues
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      next();
      return;
    }

    // Verify and decode JWT
    try {
      const decoded = verifyToken(token);

      // Get complete user
      const userResult = await getUserById(decoded.userId);
      if (userResult.success && userResult.data) {
        (req as any).user = userResult.data;
        (req as any).userId = decoded.userId;
        (req as any).token = token;
      }
    } catch (error) {
      // If token is invalid, continue without authentication
      console.log('Invalid token in optional mode:', error);
    }

    next();
  } catch (error) {
    console.error('Optional authentication verification error:', error);
    next();
  }
};

/**
 * Middleware to verify that user is verified (email confirmed)
 */
export const requireVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!user.verified) {
    res.status(403).json({
      error: 'Email not verified. Please verify your email before continuing.',
      code: 'EMAIL_NOT_VERIFIED',
    });
    return;
  }

  next();
};

/**
 * Middleware to verify that user is a brand
 */
export const requireBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!user.is_brand) {
    res.status(403).json({
      error: 'Access reserved for brands',
      code: 'BRAND_ONLY',
    });
    return;
  }

  next();
};

/**
 * Middleware to verify that user is not a brand
 */
export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (user.is_brand) {
    res.status(403).json({
      error: 'Access reserved for regular users',
      code: 'USER_ONLY',
    });
    return;
  }

  next();
};

/**
 * Middleware to verify that user is an admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Access reserved for administrators',
      code: 'ADMIN_ONLY',
    });
    return;
  }

  next();
};

// Legacy class for compatibility
export class AuthMiddleware {
  static async requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    return requireAuth(req, res, next);
  }

  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    return optionalAuth(req, res, next);
  }

  static async requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    return requireAdmin(req, res, next);
  }
}
