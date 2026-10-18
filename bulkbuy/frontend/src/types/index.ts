export type UserRole = 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt?: string;
}

export interface Address {
  id: string;
  userId?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Supplier {
  id: string;
  userId: string;
  businessName: string;
  gstin: string;
  fssaiLicense: string;
  bankAccount: string;
  ifscCode: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface Product {
  id: string;
  supplierId: string;
  category: string;
  title: string;
  slug: string;
  description: string;
  unitSize: string;
  mrpInr: number;
  imageUrl: string;
  isApproved: boolean;
  shelfLifeDays?: number;
  originState?: string;
}

export interface CampaignPriceTier {
  id: string;
  campaignId: string;
  minQuantity: number;
  priceInr: number;
}

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'TARGET_REACHED'
  | 'CONFIRMED'
  | 'FULFILLING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface CampaignPricing {
  currentUnitPrice: number;
  unlockedTier: CampaignPriceTier | null;
  nextTier: CampaignPriceTier | null;
  unitsToNextTier: number;
  savingsInr: number;
  savingsPercent: number;
  progressPercent: number;
}

export interface Campaign {
  id: string;
  productId: string;
  supplierId: string;
  title: string;
  minTargetQty: number;
  maxTargetQty: number;
  committedQty: number;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
  deliveryWindow: string;
  region: string;
  product?: Product;
  supplier?: Supplier;
  tiers?: CampaignPriceTier[];
  pricing?: CampaignPricing;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  campaignId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'FULFILLING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  shippingAddress: Address;
  createdAt: string;
  campaign?: Campaign;
  payment?: {
    id: string;
    gateway: string;
    gatewayOrderId: string;
    amountInr: number;
    status: string;
    createdAt: string;
  };
}

export interface PlatformMetrics {
  totalGmv: number;
  totalSavingsInr: number;
  totalCommittedUnits: number;
  activeCampaignsCount: number;
  verifiedSuppliersCount: number;
  totalOrders: number;
}
