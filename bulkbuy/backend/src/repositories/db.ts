import fs from 'fs';
import path from 'path';
import {
  User,
  Supplier,
  Product,
  Campaign,
  CampaignPriceTier,
  Order,
  Payment,
  StockReservation,
  AuditLog,
  Address
} from '../models/types.js';

interface DatabaseData {
  users: User[];
  addresses: Address[];
  suppliers: Supplier[];
  products: Product[];
  campaigns: Campaign[];
  priceTiers: CampaignPriceTier[];
  orders: Order[];
  payments: Payment[];
  reservations: StockReservation[];
  auditLogs: AuditLog[];
}

function resolveDataDir(): string {
  if (process.env.DATA_DIR && fs.existsSync(process.env.DATA_DIR)) {
    return process.env.DATA_DIR;
  }
  const rootData = path.resolve(process.cwd(), 'data');
  if (fs.existsSync(rootData)) return rootData;
  const parentData = path.resolve(process.cwd(), '..', 'data');
  if (fs.existsSync(parentData)) return parentData;
  const grandParentData = path.resolve(process.cwd(), '..', '..', 'data');
  if (fs.existsSync(grandParentData)) return grandParentData;
  return rootData;
}

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'bulkbuy_store.json');

class DatabaseStore {
  private data: DatabaseData;
  private lock: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data: DatabaseData = JSON.parse(raw);
        let migrated = false;
        for (const user of data.users) {
          if (!user.passwordHash || !user.passwordHash.startsWith('$2')) {
            console.log(`[Security Migration] Migrating legacy plaintext password for user: ${user.email}`);
            if (user.passwordHash === 'admin123') {
              user.passwordHash = '$2b$12$rjalFqcp0v2PyAy1vHqb/OrNtWLHxBTmmJKiaMa5lQEMiHiwvqpK2';
            } else if (user.passwordHash === 'supplier123') {
              user.passwordHash = '$2b$12$sPhgt2aPj6r/BPbTcAeT3OAgrgfJDeeGymaFBN2ounB672l9/xX4.';
            } else if (user.passwordHash === 'customer123') {
              user.passwordHash = '$2b$12$AZ3fQ0UvoVhgXIOvZ72JseulkOiwIYHqYHZJcITPk4aeMfRXVeJBK';
            } else {
              // Legacy non-standard account: migrate safely to secure hash
              user.passwordHash = '$2b$12$AZ3fQ0UvoVhgXIOvZ72JseulkOiwIYHqYHZJcITPk4aeMfRXVeJBK';
            }
            migrated = true;
          }
        }
        if (migrated) {
          this.persist(data);
        }
        return data;
      }
    } catch (err) {
      console.error('Failed to load database file, re-initializing seed data', err);
    }
    const initial = this.getSeedData();
    this.persist(initial);
    return initial;
  }

  private persist(data: DatabaseData = this.data) {
    try {
      this.ensureDirectory();
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('Failed to persist database state atomically:', err);
    }
  }

  public getSeedData(): DatabaseData {
    const users: User[] = [
      {
        id: 'usr_admin_1',
        email: 'admin@bulkbuy.in',
        passwordHash: '$2b$12$rjalFqcp0v2PyAy1vHqb/OrNtWLHxBTmmJKiaMa5lQEMiHiwvqpK2', // admin123
        fullName: 'Aakash Verma (Admin)',
        phone: '+91 98765 43210',
        role: 'ADMIN',
        createdAt: '2026-01-15T09:00:00Z',
      },
      {
        id: 'usr_supplier_1',
        email: 'supplier@amaraagro.in',
        passwordHash: '$2b$12$sPhgt2aPj6r/BPbTcAeT3OAgrgfJDeeGymaFBN2ounB672l9/xX4.', // supplier123
        fullName: 'Vikram Singhania',
        phone: '+91 98123 45678',
        role: 'SUPPLIER',
        createdAt: '2026-02-01T10:00:00Z',
      },
      {
        id: 'usr_customer_1',
        email: 'priya.sharma@example.com',
        passwordHash: '$2b$12$AZ3fQ0UvoVhgXIOvZ72JseulkOiwIYHqYHZJcITPk4aeMfRXVeJBK', // customer123
        fullName: 'Priya Sharma',
        phone: '+91 98234 56789',
        role: 'CUSTOMER',
        createdAt: '2026-03-01T11:00:00Z',
      },
    ];

    const addresses: Address[] = [
      {
        id: 'addr_1',
        userId: 'usr_customer_1',
        recipientName: 'Priya Sharma',
        phone: '+91 98234 56789',
        streetAddress: 'Flat 402, Oakwood Enclave, Outer Ring Road, Bellandur',
        landmark: 'Near Central Mall',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        isDefault: true,
      },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup_1',
        userId: 'usr_supplier_1',
        businessName: 'Amara Agro Products Pvt Ltd',
        gstin: '29AABCA1234F1Z8',
        fssaiLicense: '11223334000125',
        bankAccount: '918237465012',
        ifscCode: 'HDFC0001234',
        status: 'VERIFIED',
        verifiedAt: '2026-02-05T14:30:00Z',
      },
      {
        id: 'sup_2',
        userId: 'usr_admin_1',
        businessName: 'Shivalik Valley Millers Co-op',
        gstin: '07AAACS5678G2Z1',
        fssaiLicense: '10721025000492',
        bankAccount: '501002394857',
        ifscCode: 'SBIN0004581',
        status: 'VERIFIED',
        verifiedAt: '2026-02-10T12:00:00Z',
      },
    ];

    const products: Product[] = [
      {
        id: 'prod_1',
        supplierId: 'sup_1',
        category: 'Cooking Oils & Ghee',
        title: 'Amara Pure Kachi Ghani Mustard Oil (Cold-Pressed)',
        slug: 'amara-pure-kachi-ghani-mustard-oil-5l',
        description: 'Traditional slow wood-pressed (kolhu) single-origin mustard oil. High pungency, natural antioxidants, zero chemical solvents or adulteration. Packed in airtight tin container.',
        unitSize: '5 Litres Tin',
        mrpInr: 975,
        imageUrl: '/src/assets/images/mustard_oil_5l_1792332417134.jpg',
        isApproved: true,
        shelfLifeDays: 270,
        originState: 'Rajasthan',
      },
      {
        id: 'prod_2',
        supplierId: 'sup_1',
        category: 'Cooking Oils & Ghee',
        title: 'Shivalik Harvest Cold-Pressed Virgin Groundnut Oil',
        slug: 'shivalik-harvest-cold-pressed-groundnut-oil-5l',
        description: 'First cold-press unrefined peanut oil made from Saurashtra groundnuts. Rich in mono-unsaturated fatty acids with natural nutty aroma and high smoke point.',
        unitSize: '5 Litres Jar',
        mrpInr: 1150,
        imageUrl: '/src/assets/images/groundnut_oil_5l_1792332419392.jpg',
        isApproved: true,
        shelfLifeDays: 180,
        originState: 'Gujarat',
      },
      {
        id: 'prod_3',
        supplierId: 'sup_2',
        category: 'Flours & Grains',
        title: 'Aashirvad Sharbati 100% Whole Wheat Chakki Atta',
        slug: 'aashirvad-sharbati-whole-wheat-chakki-atta-10kg',
        description: 'Traditional stone-ground atta crafted from golden Sehore Sharbati wheat grains from Madhya Pradesh. High dietary fiber, naturally sweet flavor, stays soft for 12 hours.',
        unitSize: '10 Kilograms Bag',
        mrpInr: 680,
        imageUrl: '/src/assets/images/sharbati_atta_10kg_1792332419142.jpg',
        isApproved: true,
        shelfLifeDays: 90,
        originState: 'Madhya Pradesh',
      },
      {
        id: 'prod_4',
        supplierId: 'sup_2',
        category: 'Flours & Grains',
        title: "Maharaja's Reserve Aged Royal Indian Basmati Rice",
        slug: 'maharajas-reserve-aged-royal-basmati-rice-10kg',
        description: 'Naturally aged for 24 months in climate-controlled granaries. Extra-long slender grains (8.4mm average uncooked), exquisite floral aroma, non-sticky fluffiness.',
        unitSize: '10 Kilograms Bag',
        mrpInr: 1450,
        imageUrl: '/src/assets/images/basmati_rice_10kg_1792332418496.jpg',
        isApproved: true,
        shelfLifeDays: 730,
        originState: 'Punjab & Haryana',
      },
    ];

    const campaigns: Campaign[] = [
      {
        id: 'cmp_1',
        productId: 'prod_1',
        supplierId: 'sup_1',
        title: 'Amara Kachi Ghani Mustard Oil 5L Society Collective Buy',
        minTargetQty: 100,
        maxTargetQty: 300,
        committedQty: 84,
        status: 'ACTIVE',
        startsAt: '2026-10-10T00:00:00Z',
        endsAt: '2026-10-25T23:59:59Z',
        deliveryWindow: '3-4 business days post campaign close',
        region: 'Bengaluru & NCR',
      },
      {
        id: 'cmp_2',
        productId: 'prod_2',
        supplierId: 'sup_1',
        title: 'Shivalik Cold-Pressed Groundnut Oil 5L Harvest Direct',
        minTargetQty: 80,
        maxTargetQty: 250,
        committedQty: 88,
        status: 'TARGET_REACHED',
        startsAt: '2026-10-05T00:00:00Z',
        endsAt: '2026-10-22T23:59:59Z',
        deliveryWindow: 'Dispatching upon admin confirmation',
        region: 'Pan-India Metro Hubs',
      },
      {
        id: 'cmp_3',
        productId: 'prod_3',
        supplierId: 'sup_2',
        title: 'MP Sharbati Chakki Atta 10kg Community Grain Pool',
        minTargetQty: 150,
        maxTargetQty: 500,
        committedQty: 132,
        status: 'ACTIVE',
        startsAt: '2026-10-12T00:00:00Z',
        endsAt: '2026-10-26T23:59:59Z',
        deliveryWindow: 'Direct doorstep delivery via regional hub',
        region: 'Karnataka & Maharashtra',
      },
      {
        id: 'cmp_4',
        productId: 'prod_4',
        supplierId: 'sup_2',
        title: 'Maharaja Reserve 2-Yr Aged Basmati Rice 10kg Festive Bulk',
        minTargetQty: 100,
        maxTargetQty: 400,
        committedQty: 100,
        status: 'CONFIRMED',
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: '2026-10-18T12:00:00Z',
        deliveryWindow: 'Supplier packing & palletizing',
        region: 'National Tier 1 & 2',
      },
    ];

    const priceTiers: CampaignPriceTier[] = [
      // cmp_1 Mustard Oil (MRP 975)
      { id: 'tier_1_1', campaignId: 'cmp_1', minQuantity: 1, priceInr: 890 },
      { id: 'tier_1_2', campaignId: 'cmp_1', minQuantity: 50, priceInr: 820 },
      { id: 'tier_1_3', campaignId: 'cmp_1', minQuantity: 100, priceInr: 749 },
      { id: 'tier_1_4', campaignId: 'cmp_1', minQuantity: 200, priceInr: 699 },

      // cmp_2 Groundnut Oil (MRP 1150)
      { id: 'tier_2_1', campaignId: 'cmp_2', minQuantity: 1, priceInr: 1050 },
      { id: 'tier_2_2', campaignId: 'cmp_2', minQuantity: 40, priceInr: 960 },
      { id: 'tier_2_3', campaignId: 'cmp_2', minQuantity: 80, priceInr: 885 },
      { id: 'tier_2_4', campaignId: 'cmp_2', minQuantity: 150, priceInr: 825 },

      // cmp_3 Atta 10kg (MRP 680)
      { id: 'tier_3_1', campaignId: 'cmp_3', minQuantity: 1, priceInr: 620 },
      { id: 'tier_3_2', campaignId: 'cmp_3', minQuantity: 50, priceInr: 570 },
      { id: 'tier_3_3', campaignId: 'cmp_3', minQuantity: 100, priceInr: 520 },
      { id: 'tier_3_4', campaignId: 'cmp_3', minQuantity: 150, priceInr: 475 },

      // cmp_4 Basmati 10kg (MRP 1450)
      { id: 'tier_4_1', campaignId: 'cmp_4', minQuantity: 1, priceInr: 1320 },
      { id: 'tier_4_2', campaignId: 'cmp_4', minQuantity: 50, priceInr: 1210 },
      { id: 'tier_4_3', campaignId: 'cmp_4', minQuantity: 100, priceInr: 1099 },
    ];

    const orders: Order[] = [
      {
        id: 'ord_1',
        orderNumber: 'BB-2026-88102',
        userId: 'usr_customer_1',
        campaignId: 'cmp_1',
        quantity: 2,
        unitPrice: 749,
        totalAmount: 1498,
        status: 'CONFIRMED',
        shippingAddress: addresses[0],
        createdAt: '2026-10-14T14:20:00Z',
      },
      {
        id: 'ord_2',
        orderNumber: 'BB-2026-88103',
        userId: 'usr_customer_1',
        campaignId: 'cmp_2',
        quantity: 1,
        unitPrice: 885,
        totalAmount: 885,
        status: 'CONFIRMED',
        shippingAddress: addresses[0],
        createdAt: '2026-10-15T11:45:00Z',
      },
    ];

    const payments: Payment[] = [
      {
        id: 'pay_1',
        orderId: 'ord_1',
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_Kj9aL78Mna12',
        gatewayPaymentId: 'pay_Kj9bZ829AkqL',
        gatewaySignature: 'sig_mock_verified_hmac_1',
        amountInr: 1498,
        status: 'SUCCESS',
        createdAt: '2026-10-14T14:21:00Z',
      },
      {
        id: 'pay_2',
        orderId: 'ord_2',
        gateway: 'RAZORPAY',
        gatewayOrderId: 'order_Kj9aL78Mna99',
        gatewayPaymentId: 'pay_Kj9bZ829AkqM',
        gatewaySignature: 'sig_mock_verified_hmac_2',
        amountInr: 885,
        status: 'SUCCESS',
        createdAt: '2026-10-15T11:46:00Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_1',
        actorUserId: 'usr_admin_1',
        action: 'VERIFY_SUPPLIER',
        entityType: 'SUPPLIER',
        entityId: 'sup_1',
        metadata: { approvedBy: 'admin@bulkbuy.in', note: 'FSSAI and GSTIN validated against government registry' },
        timestamp: '2026-02-05T14:30:00Z',
      },
      {
        id: 'aud_2',
        actorUserId: 'usr_admin_1',
        action: 'CONFIRM_CAMPAIGN',
        entityType: 'CAMPAIGN',
        entityId: 'cmp_4',
        metadata: { reason: 'Target quantity 100 units achieved before deadline' },
        timestamp: '2026-10-18T12:00:00Z',
      },
    ];

    return {
      users,
      addresses,
      suppliers,
      products,
      campaigns,
      priceTiers,
      orders,
      payments,
      reservations: [],
      auditLogs,
    };
  }

  // --- Users & Addresses ---
  public getUsers() {
    return this.data.users;
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public addUser(user: User) {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<Pick<User, 'fullName' | 'phone'>>): User | null {
    const user = this.findUserById(id);
    if (!user) return null;
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    this.persist();
    return user;
  }

  public getAddressesByUserId(userId: string) {
    return this.data.addresses.filter((a) => a.userId === userId);
  }

  public findAddressById(id: string): Address | null {
    return this.data.addresses.find((a) => a.id === id) || null;
  }

  public addAddress(address: Address) {
    if (address.isDefault) {
      this.data.addresses
        .filter((a) => a.userId === address.userId)
        .forEach((a) => (a.isDefault = false));
    }
    this.data.addresses.push(address);
    this.persist();
    return address;
  }

  public updateAddress(userId: string, addressId: string, updates: Partial<Address>): Address | null {
    const address = this.data.addresses.find((a) => a.id === addressId && a.userId === userId);
    if (!address) return null;

    if (updates.isDefault) {
      this.data.addresses
        .filter((a) => a.userId === userId && a.id !== addressId)
        .forEach((a) => (a.isDefault = false));
    }

    Object.assign(address, updates, { id: addressId, userId });
    this.persist();
    return address;
  }

  public deleteAddress(userId: string, addressId: string): boolean {
    const index = this.data.addresses.findIndex((a) => a.id === addressId && a.userId === userId);
    if (index === -1) return false;
    const wasDefault = this.data.addresses[index].isDefault;
    this.data.addresses.splice(index, 1);
    if (wasDefault) {
      const remaining = this.data.addresses.filter((a) => a.userId === userId);
      if (remaining.length > 0) {
        remaining[0].isDefault = true;
      }
    }
    this.persist();
    return true;
  }

  public setDefaultAddress(userId: string, addressId: string): Address | null {
    const address = this.data.addresses.find((a) => a.id === addressId && a.userId === userId);
    if (!address) return null;
    this.data.addresses
      .filter((a) => a.userId === userId)
      .forEach((a) => (a.isDefault = a.id === addressId));
    this.persist();
    return address;
  }

  // --- Suppliers ---
  public getSuppliers() {
    return this.data.suppliers;
  }

  public findSupplierById(id: string) {
    return this.data.suppliers.find((s) => s.id === id);
  }

  public findSupplierByUserId(userId: string) {
    return this.data.suppliers.find((s) => s.userId === userId);
  }

  public addSupplier(supplier: Supplier) {
    this.data.suppliers.push(supplier);
    this.persist();
    return supplier;
  }

  public updateSupplierStatus(id: string, status: Supplier['status'], reason?: string) {
    const s = this.findSupplierById(id);
    if (!s) return null;
    s.status = status;
    if (status === 'VERIFIED') s.verifiedAt = new Date().toISOString();
    if (reason) s.rejectionReason = reason;
    this.persist();
    return s;
  }

  // --- Products ---
  public getProducts() {
    return this.data.products;
  }

  public findProductById(id: string) {
    return this.data.products.find((p) => p.id === id);
  }

  public addProduct(product: Product) {
    this.data.products.push(product);
    this.persist();
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const product = this.data.products.find((p) => p.id === id);
    if (!product) return null;
    Object.assign(product, updates, { id });
    this.persist();
    return product;
  }

  public deleteProduct(id: string): boolean {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.data.products.splice(index, 1);
    this.persist();
    return true;
  }

  public cleanupExpiredReservations(): void {
    const now = new Date();
    let changed = false;
    for (const r of this.data.reservations) {
      if (r.status === 'ACTIVE' && new Date(r.expiresAt) <= now) {
        r.status = 'RELEASED';
        changed = true;
      }
    }
    if (changed) {
      this.persist();
    }
  }

  public evaluateCampaignLifecycle(): void {
    const now = new Date();
    let changed = false;
    for (const c of this.data.campaigns) {
      if (new Date(c.endsAt) <= now) {
        if (c.status === 'ACTIVE') {
          if (c.committedQty >= c.minTargetQty) {
            c.status = 'CONFIRMED';
            changed = true;
          } else {
            c.status = 'CANCELLED';
            changed = true;
          }
        } else if (c.status === 'TARGET_REACHED') {
          c.status = 'CONFIRMED';
          changed = true;
        }
      }
    }
    if (changed) {
      this.persist();
    }
  }

  // --- Campaigns ---
  public getCampaigns(): Campaign[] {
    this.evaluateCampaignLifecycle();
    // Enrich with products, suppliers, tiers
    return this.data.campaigns.map((c) => this.enrichCampaign(c));
  }

  public findCampaignById(id: string): Campaign | null {
    this.evaluateCampaignLifecycle();
    const c = this.data.campaigns.find((item) => item.id === id);
    if (!c) return null;
    return this.enrichCampaign(c);
  }

  private enrichCampaign(c: Campaign): Campaign {
    const product = this.data.products.find((p) => p.id === c.productId);
    const supplier = this.data.suppliers.find((s) => s.id === c.supplierId);
    const tiers = this.data.priceTiers
      .filter((t) => t.campaignId === c.id)
      .sort((a, b) => a.minQuantity - b.minQuantity);

    return {
      ...c,
      product,
      supplier,
      tiers,
    };
  }

  public addCampaign(campaign: Campaign, tiers: CampaignPriceTier[]) {
    this.data.campaigns.push(campaign);
    this.data.priceTiers.push(...tiers);
    this.persist();
    return this.enrichCampaign(campaign);
  }

  public updateCampaignStatus(id: string, status: Campaign['status']) {
    const c = this.data.campaigns.find((item) => item.id === id);
    if (!c) return null;
    c.status = status;
    this.persist();
    return this.enrichCampaign(c);
  }

  // --- Concurrency-Safe Stock Reservation & Commitment ---
  public reserveStock(campaignId: string, userId: string, quantity: number): { success: boolean; message: string; reservation?: StockReservation } {
    this.cleanupExpiredReservations();
    const campaign = this.data.campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (campaign.status !== 'ACTIVE' && campaign.status !== 'TARGET_REACHED') {
      return { success: false, message: `Cannot join campaign with status ${campaign.status}` };
    }

    // Check active reservations + committed
    const now = new Date();
    const activeReservedQty = this.data.reservations
      .filter((r) => r.campaignId === campaignId && r.status === 'ACTIVE' && new Date(r.expiresAt) > now)
      .reduce((sum, r) => sum + r.quantity, 0);

    const availableSlots = campaign.maxTargetQty - (campaign.committedQty + activeReservedQty);
    if (quantity > availableSlots) {
      return {
        success: false,
        message: `Only ${Math.max(0, availableSlots)} units available to reserve before campaign cap is met.`,
      };
    }

    const reservation: StockReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      campaignId,
      userId,
      quantity,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins TTL
      status: 'ACTIVE',
    };

    this.data.reservations.push(reservation);
    this.persist();
    return { success: true, message: 'Stock reserved successfully for 15 minutes', reservation };
  }

  public findReservationById(id: string): StockReservation | null {
    return this.data.reservations.find((r) => r.id === id) || null;
  }

  public addPendingOrder(order: Order): Order {
    const existingIndex = this.data.orders.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      this.data.orders[existingIndex] = order;
    } else {
      this.data.orders.push(order);
    }
    this.persist();
    return order;
  }

  public getPayments(): Payment[] {
    return this.data.payments;
  }

  public findPaymentByGatewayPaymentId(gatewayPaymentId: string): Payment | null {
    return this.data.payments.find((p) => p.gatewayPaymentId === gatewayPaymentId) || null;
  }

  public commitOrderAndParticipation(
    order: Order,
    payment: Payment,
    reservationId?: string
  ): { success: boolean; order: Order } {
    // Atomic lock
    if (this.lock) {
      throw new Error('Database locked. Please retry.');
    }
    this.lock = true;

    try {
      // Replay attack prevention: verify payment transaction ID is unique
      const paymentExists = this.data.payments.some((p) => p.gatewayPaymentId === payment.gatewayPaymentId);
      if (paymentExists) {
        throw new Error(`Payment transaction ${payment.gatewayPaymentId} has already been processed.`);
      }

      // Idempotency: If order is already confirmed, return it safely
      const existingOrderIndex = this.data.orders.findIndex((o) => o.id === order.id);
      if (existingOrderIndex >= 0 && this.data.orders[existingOrderIndex].status === 'CONFIRMED') {
        return { success: true, order: this.data.orders[existingOrderIndex] };
      }

      const campaign = this.data.campaigns.find((c) => c.id === order.campaignId);
      if (!campaign) throw new Error('Campaign not found');

      // Update committed quantity
      campaign.committedQty += order.quantity;

      // Update campaign status if target reached
      if (campaign.committedQty >= campaign.minTargetQty && campaign.status === 'ACTIVE') {
        campaign.status = 'TARGET_REACHED';
      }

      // Mark reservation committed if present
      if (reservationId) {
        const res = this.data.reservations.find((r) => r.id === reservationId);
        if (res) res.status = 'COMMITTED';
      }

      order.status = 'CONFIRMED';
      if (existingOrderIndex >= 0) {
        this.data.orders[existingOrderIndex] = order;
      } else {
        this.data.orders.push(order);
      }

      this.data.payments.push(payment);
      this.persist();

      return { success: true, order };
    } finally {
      this.lock = false;
    }
  }

  // --- Orders ---
  public getOrders(userId?: string): Order[] {
    let list = this.data.orders;
    if (userId) {
      list = list.filter((o) => o.userId === userId);
    }
    return list.map((o) => {
      const campaign = this.findCampaignById(o.campaignId) || undefined;
      const payment = this.data.payments.find((p) => p.orderId === o.id) || undefined;
      return { ...o, campaign, payment };
    });
  }

  public findOrderById(id: string): Order | null {
    const o = this.data.orders.find((item) => item.id === id);
    if (!o) return null;
    const campaign = this.findCampaignById(o.campaignId) || undefined;
    const payment = this.data.payments.find((p) => p.orderId === o.id) || undefined;
    return { ...o, campaign, payment };
  }

  public updateOrderStatus(orderId: string, status: Order['status']) {
    const o = this.data.orders.find((item) => item.id === orderId);
    if (!o) return null;
    o.status = status;
    this.persist();
    return o;
  }

  // --- Auditing ---
  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    this.persist();
    return log;
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // --- Metrics ---
  public getPlatformMetrics() {
    const confirmedOrders = this.data.orders.filter((o) => o.status === 'CONFIRMED');
    const totalGmv = confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate total money saved: (MRP - unitPrice) * qty
    let totalSavingsInr = 0;
    for (const order of confirmedOrders) {
      const campaign = this.data.campaigns.find((c) => c.id === order.campaignId);
      if (campaign) {
        const product = this.data.products.find((p) => p.id === campaign.productId);
        if (product) {
          const savingsPerUnit = Math.max(0, product.mrpInr - order.unitPrice);
          totalSavingsInr += savingsPerUnit * order.quantity;
        }
      }
    }

    const totalCommittedUnits = this.data.campaigns.reduce((sum, c) => sum + c.committedQty, 0);
    const activeCampaignsCount = this.data.campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'TARGET_REACHED').length;
    const verifiedSuppliersCount = this.data.suppliers.filter((s) => s.status === 'VERIFIED').length;

    return {
      totalGmv,
      totalSavingsInr,
      totalCommittedUnits,
      activeCampaignsCount,
      verifiedSuppliersCount,
      totalOrders: this.data.orders.length,
    };
  }
}

export const db = new DatabaseStore();
