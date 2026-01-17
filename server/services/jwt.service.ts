import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// JWT configuration
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  isBrand: boolean;
  verified?: boolean;
}

export interface DecodedToken extends JwtPayload {
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload: JwtPayload): string => {
  if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('⚠️ JWT_SECRET not configured in .env! Use a secure key in production.');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Verify and decode a JWT token
 * Throws an error if the token is invalid or expired
 */
export const verifyToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Error verifying token');
    }
  }
};

/**
 * Decode a JWT token without verifying it (for debug only)
 * Do not use for authentication!
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header (format: "Bearer <token>")
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Check if a token is expired (without cryptographic verification)
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};
