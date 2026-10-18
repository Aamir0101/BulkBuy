import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../models/types.js';

/**
 * Role-Based Access Control middleware.
 * Relies strictly on server-loaded user role from req.user,
 * ensuring no client-injected or unverified token role is ever trusted.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient permissions for this resource',
      });
      return;
    }

    next();
  };
}
