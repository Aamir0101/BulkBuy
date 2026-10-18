import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface VerifiedClaims extends TokenPayload {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

const JWT_ISSUER = process.env.JWT_ISSUER || 'bulkbuy-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'bulkbuy-client';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Resolve JWT Secret. Fails safely in production if missing or insecure.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProduction) {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is required in production.');
    }
    // Secure fallback for local development / testing only
    return 'bulkbuy-development-test-jwt-secret-key-32chars!!';
  }

  if (isProduction && (secret.length < 32 || secret.includes('replace-in-production') || secret.includes('default'))) {
    throw new Error('FATAL SECURITY ERROR: Production JWT_SECRET must be at least 32 characters and cryptographically strong.');
  }

  return secret;
}

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid password provided for hashing');
  }
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * Safely rejects plaintext or invalid hashes without throwing.
 */
export async function verifyPassword(plaintext: string, storedHash: string): Promise<boolean> {
  if (!plaintext || !storedHash || typeof plaintext !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  // Strictly verify bcrypt hash format ($2a$, $2b$, or $2y$, 60 characters)
  const isBcrypt = /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/.test(storedHash);
  if (!isBcrypt) {
    console.warn('[Security Alert] Rejected authentication attempt with non-bcrypt or plaintext password hash.');
    return false;
  }

  try {
    return await bcrypt.compare(plaintext, storedHash);
  } catch (err) {
    console.error('[Security Error] Password comparison failed:', err);
    return false;
  }
}

/**
 * Issues a cryptographically signed JWT with strict claims and explicit algorithm.
 */
export function generateToken(payload: TokenPayload, customExpiresIn?: string | number): string {
  const secret = getJwtSecret();
  const tokenPayload = {
    userId: payload.userId,
    sub: payload.userId,
    role: payload.role,
    email: payload.email,
  };

  return jwt.sign(tokenPayload, secret, {
    algorithm: 'HS256',
    expiresIn: (customExpiresIn || JWT_EXPIRES_IN) as any,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

/**
 * Validates a JWT against explicit algorithm allowlist, issuer, audience, and signature.
 * Rejects malformed, expired, forged, or unverified tokens.
 */
export function verifyToken(token: string): VerifiedClaims {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format');
  }

  // Fast rejection of legacy Base64 JSON strings or raw IDs
  if (!token.includes('.') || token.startsWith('user_') || token.startsWith('{')) {
    throw new Error('Insecure token format rejected');
  }

  const secret = getJwtSecret();

  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'], // Explicit allowlist: only HS256 allowed! Reject 'none' or asymmetric confusion
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as any;

  const userId = decoded.userId || decoded.sub;
  if (!userId || typeof userId !== 'string') {
    throw new Error('Token is missing required subject claim');
  }

  return {
    userId,
    role: decoded.role,
    email: decoded.email,
    iss: decoded.iss,
    aud: decoded.aud,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}
