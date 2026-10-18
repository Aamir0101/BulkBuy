import { Request, Response } from 'express';
import { db } from '../repositories/db.js';
import {
  registerSchema,
  loginSchema,
  addressSchema,
  updateProfileSchema,
  updateAddressSchema,
} from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Address } from '../models/types.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/security.js';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
        return;
      }

      const { email, password, fullName, phone, role } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      // Guard: Admin role cannot be created via public registration
      if ((role as string) === 'ADMIN') {
        res.status(400).json({ error: 'Privileged accounts cannot be registered via public signup.' });
        return;
      }

      const existing = db.findUserByEmail(normalizedEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }

      // Secure cryptographic password hash using bcrypt
      const passwordHash = await hashPassword(password);

      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role,
        createdAt: new Date().toISOString(),
      };

      db.addUser(newUser);

      // Safe audit log without passwords or secrets
      db.addAuditLog({
        id: `aud_${Date.now()}`,
        actorUserId: newUser.id,
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: newUser.id,
        metadata: { role, email: normalizedEmail },
        timestamp: new Date().toISOString(),
      });

      // Cryptographically signed JWT token with explicit claims
      const token = generateToken({
        userId: newUser.id,
        role: newUser.role,
        email: newUser.email,
      });

      res.status(201).json({
        message: 'Account registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          role: newUser.role,
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid login payload', details: parsed.error.format() });
        return;
      }

      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
      const user = db.findUserByEmail(normalizedEmail);

      // Constant-time-safe verification: verifyPassword handles hashing safely
      const isPasswordValid = user ? await verifyPassword(password, user.passwordHash) : false;

      if (!user || !isPasswordValid) {
        // Generic error message to prevent account enumeration
        db.addAuditLog({
          id: `aud_${Date.now()}`,
          actorUserId: user ? user.id : 'anonymous',
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: normalizedEmail,
          timestamp: new Date().toISOString(),
        });

        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Successful login audit log
      db.addAuditLog({
        id: `aud_${Date.now()}`,
        actorUserId: user.id,
        action: 'USER_LOGGED_IN',
        entityType: 'AUTH',
        entityId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Issue signed JWT token
      const token = generateToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      db.addAuditLog({
        id: `aud_${Date.now()}`,
        actorUserId: req.user.id,
        action: 'USER_LOGGED_OUT',
        entityType: 'AUTH',
        entityId: req.user.id,
        timestamp: new Date().toISOString(),
      });
    }
    res.json({ message: 'Session logged out successfully' });
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const addresses = db.getAddressesByUserId(req.user.id);
    let supplierDetails = null;
    if (req.user.role === 'SUPPLIER') {
      supplierDetails = db.findSupplierByUserId(req.user.id);
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
      addresses,
      supplierDetails,
    });
  }

  public static async addAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid address', details: parsed.error.format() });
      return;
    }

    const newAddress: Address = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.id,
      ...parsed.data,
    };

    db.addAddress(newAddress);
    res.status(201).json({ address: newAddress });
  }

  public static async listAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const addresses = db.getAddressesByUserId(req.user.id);
    res.json({ addresses });
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const updated = db.updateUser(req.user.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        phone: updated.phone,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });
  }

  public static async updateAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const existing = db.findAddressById(id);
    if (!existing) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    if (existing.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: you can only update your own addresses' });
      return;
    }

    const parsed = updateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid address updates', details: parsed.error.format() });
      return;
    }

    const updated = db.updateAddress(req.user.id, id, parsed.data);
    res.json({ message: 'Address updated successfully', address: updated });
  }

  public static async deleteAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const existing = db.findAddressById(id);
    if (!existing) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    if (existing.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: you can only delete your own addresses' });
      return;
    }

    const deleted = db.deleteAddress(req.user.id, id);
    if (!deleted) {
      res.status(500).json({ error: 'Failed to delete address' });
      return;
    }

    res.json({ message: 'Address deleted successfully' });
  }

  public static async setDefaultAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const existing = db.findAddressById(id);
    if (!existing) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    if (existing.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: you can only modify your own addresses' });
      return;
    }

    const updated = db.setDefaultAddress(req.user.id, id);
    res.json({ message: 'Default address updated successfully', address: updated });
  }
}
