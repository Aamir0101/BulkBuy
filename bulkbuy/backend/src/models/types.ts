export type UserRole = 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export type SupplierStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Supplier {
  id: string;
  userId: string;
  businessName: string;
  gstin: string;
  fssaiLicense: string;
  bankAccount: string;
  ifscCode: string;
  status: SupplierStatus;
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

export interface CampaignPriceTier {
  id: string;
  campaignId: string;
  minQuantity: number;
  priceInr: number;
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
  tiers?: CampaignPriceTier[];
  product?: Product;
  supplier?: Supplier;
}

export interface StockReservation {
  id: string;
  campaignId: string;
  userId: string;
  quantity: number;
  expiresAt: string;
  status: 'ACTIVE' | 'COMMITTED' | 'RELEASED';
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'FULFILLING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  campaignId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  expiresAt?: string;
  reservationId?: string;
  gatewayOrderId?: string;
  campaign?: Campaign;
  payment?: Payment;
}

export interface Payment {
  id: string;
  orderId: string;
  gateway: 'RAZORPAY' | 'RAZORPAY_SANDBOX';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amountInr: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
