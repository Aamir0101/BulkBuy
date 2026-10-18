import { Request, Response, NextFunction } from 'express';
import { db } from '../repositories/db.js';
import { User } from '../models/types.js';
import { verifyToken } from '../utils/security.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Strict authentication middleware.
 * Verifies JWT signature, algorithm (HS256), issuer, audience, and expiration.
 * Resolves user identity exclusively from trusted server-side repository.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: 'Invalid authorization format. Bearer token required.' });
      return;
    }
    token = match[1].trim();
  } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    res.status(401).json({ error: 'Authorization header or token query parameter required' });
    return;
  }

  try {
    const claims = verifyToken(token);
    const user = db.findUserById(claims.userId);

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }

    // Role is strictly populated from server-side database record, never trusted from client
    req.user = user;
    next();
  } catch (err: unknown) {
    // Return generic error message to avoid information disclosure
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

/**
 * Optional authentication middleware.
 * Populates req.user if a valid token is present; proceeds unauthenticated otherwise.
 */
export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      token = match[1].trim();
    }
  } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    return next();
  }

  try {
    const claims = verifyToken(token);
    const user = db.findUserById(claims.userId);
    if (user) {
      req.user = user;
    }
  } catch {
    // Proceed unauthenticated without error for optional routes
  }
  next();
}
