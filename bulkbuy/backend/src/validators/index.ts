import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).trim(),
  phone: z.string().min(10).trim(),
  role: z.enum(['CUSTOMER', 'SUPPLIER']).default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters').trim(),
  phone: z.string().min(10, 'Phone must have at least 10 digits').trim(),
});

export const addressSchema = z.object({
  recipientName: z.string().min(2),
  phone: z.string().min(10),
  streetAddress: z.string().min(5),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
  isDefault: z.boolean().default(true),
});

export const updateAddressSchema = addressSchema.partial();

export const supplierOnboardingSchema = z.object({
  businessName: z.string().min(3),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid 15-character GSTIN format'),
  fssaiLicense: z.string().regex(/^[0-9]{14}$/, 'Invalid 14-digit FSSAI license number'),
  bankAccount: z.string().min(9),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid 11-character IFSC code'),
});

export const createProductSchema = z.object({
  category: z.string().min(2),
  title: z.string().min(5),
  description: z.string().min(10),
  unitSize: z.string().min(2),
  mrpInr: z.number().positive(),
  imageUrl: z.string().min(1),
  shelfLifeDays: z.number().positive().optional(),
  originState: z.string().optional(),
});

export const createCampaignSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(5),
  minTargetQty: z.number().int().positive(),
  maxTargetQty: z.number().int().positive(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime(),
  deliveryWindow: z.string().min(3),
  region: z.string().min(2),
  tiers: z
    .array(
      z.object({
        minQuantity: z.number().int().positive(),
        priceInr: z.number().positive(),
      })
    )
    .min(1),
});

export const reserveStockSchema = z.object({
  quantity: z.number().int().positive().max(50, 'Maximum commitment per single transaction is 50 units'),
});

export const createOrderSchema = z.object({
  campaignId: z.string().min(1),
  quantity: z.number().int().positive(),
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  reservationId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  gatewayOrderId: z.string().min(1),
  gatewayPaymentId: z.string().min(1),
  gatewaySignature: z.string().min(1),
  reservationId: z.string().optional(),
});

export const updateCampaignStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'SCHEDULED',
    'ACTIVE',
    'TARGET_REACHED',
    'CONFIRMED',
    'FULFILLING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  reason: z.string().optional(),
});
