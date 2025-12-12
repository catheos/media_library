import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};