import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export function createRateLimiter(options: {
  name: string;
  maxRequests: number;
  windowMs: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();
  stores.set(options.name, store);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const windowStart = now - options.windowMs;

    let record = store.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      store.set(clientIp, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= options.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterSec = Math.ceil((oldestInWindow + options.windowMs - now) / 1000);

      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      res.status(429).json({
        error: options.message || 'Too many requests. Please try again later.',
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

/**
 * Pre-configured rate limiters for authentication endpoints
 */
export const loginRateLimiter = createRateLimiter({
  name: 'auth_login',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many login attempts. Please try again in 1 minute.',
});

export const registerRateLimiter = createRateLimiter({
  name: 'auth_register',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many registration attempts from this IP. Please try again later.',
});

/**
 * Utility to clear all rate limit stores for testing environments
 */
export function resetRateLimits(): void {
  for (const store of stores.values()) {
    store.clear();
  }
}
