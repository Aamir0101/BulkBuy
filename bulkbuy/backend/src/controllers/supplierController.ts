import { Response } from 'express';
import { db } from '../repositories/db.js';
import { supplierOnboardingSchema, createProductSchema, createCampaignSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Supplier, Product, Campaign, CampaignPriceTier } from '../models/types.js';

export class SupplierController {
  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    res.json({ supplier });
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsed = supplierOnboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid supplier registration', details: parsed.error.format() });
      return;
    }

    let supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      supplier = {
        id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: req.user.id,
        ...parsed.data,
        status: 'PENDING',
      };
      db.addSupplier(supplier);
    } else {
      Object.assign(supplier, parsed.data);
      supplier.status = 'PENDING'; // re-verification needed
    }

    db.addAuditLog({
      id: `aud_${Date.now()}`,
      actorUserId: req.user.id,
      action: 'SUPPLIER_PROFILE_SUBMITTED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Supplier credentials submitted for admin review', supplier });
  }

  public static async listMyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found' });
      return;
    }

    const products = db.getProducts().filter((p) => p.supplierId === supplier.id);
    res.json({ products });
  }

  public static async addProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier || supplier.status !== 'VERIFIED') {
      res.status(403).json({ error: 'Only verified suppliers can add products to catalog' });
      return;
    }

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product specifications', details: parsed.error.format() });
      return;
    }

    const slug = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      supplierId: supplier.id,
      ...parsed.data,
      slug,
      isApproved: true,
    };

    db.addProduct(newProduct);
    res.status(201).json({ product: newProduct });
  }

  public static async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found' });
      return;
    }

    const { id } = req.params;
    const product = db.findProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.supplierId !== supplier.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized to modify this product' });
      return;
    }

    const parsed = createProductSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product specifications', details: parsed.error.format() });
      return;
    }

    const updated = db.updateProduct(id, parsed.data);
    res.json({ message: 'Product updated successfully', product: updated });
  }

  public static async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found' });
      return;
    }

    const { id } = req.params;
    const product = db.findProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.supplierId !== supplier.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized to delete this product' });
      return;
    }

    const activeCampaigns = db.getCampaigns().filter(
      (c) => c.productId === id && (c.status === 'ACTIVE' || c.status === 'TARGET_REACHED')
    );
    if (activeCampaigns.length > 0) {
      res.status(400).json({ error: 'Cannot delete product currently tied to active collective campaigns' });
      return;
    }

    db.deleteProduct(id);
    res.json({ message: 'Product deleted successfully' });
  }

  public static async listMyCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found' });
      return;
    }

    const campaigns = db.getCampaigns().filter((c) => c.supplierId === supplier.id);
    res.json({ campaigns });
  }

  public static async proposeCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier || supplier.status !== 'VERIFIED') {
      res.status(403).json({ error: 'Only verified suppliers can create campaigns' });
      return;
    }

    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid campaign request', details: parsed.error.format() });
      return;
    }

    const { productId, title, minTargetQty, maxTargetQty, endsAt, deliveryWindow, region, tiers } = parsed.data;

    // Strict resource ownership check: verify the product belongs to this authenticated supplier
    const product = db.findProductById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.supplierId !== supplier.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: you can only propose campaigns for your own products' });
      return;
    }

    const campaignId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCampaign: Campaign = {
      id: campaignId,
      productId,
      supplierId: supplier.id,
      title,
      minTargetQty,
      maxTargetQty,
      committedQty: 0,
      status: 'DRAFT', // Needs admin approval before going ACTIVE
      startsAt: new Date().toISOString(),
      endsAt,
      deliveryWindow,
      region,
    };

    const campaignTiers: CampaignPriceTier[] = tiers.map((t, idx) => ({
      id: `tier_${campaignId}_${idx + 1}`,
      campaignId,
      minQuantity: t.minQuantity,
      priceInr: t.priceInr,
    }));

    const created = db.addCampaign(newCampaign, campaignTiers);

    db.addAuditLog({
      id: `aud_${Date.now()}`,
      actorUserId: req.user.id,
      action: 'CAMPAIGN_PROPOSED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Campaign submitted for admin review and scheduling',
      campaign: created,
    });
  }

  public static async getAggregatedDispatches(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supplier = db.findSupplierByUserId(req.user.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found' });
      return;
    }

    const myCampaigns = db.getCampaigns().filter((c) => c.supplierId === supplier.id);
    const manifests = myCampaigns
      .filter((c) => ['TARGET_REACHED', 'CONFIRMED', 'FULFILLING', 'SHIPPED', 'DELIVERED'].includes(c.status))
      .map((c) => {
        const orders = db.getOrders().filter((o) => o.campaignId === c.id && o.status === 'CONFIRMED');
        const totalUnits = orders.reduce((sum, o) => sum + o.quantity, 0);
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

        return {
          campaignId: c.id,
          campaignTitle: c.title,
          productTitle: c.product?.title,
          status: c.status,
          deliveryWindow: c.deliveryWindow,
          region: c.region,
          totalUnitsToDispatch: totalUnits,
          totalSettlementInr: totalRevenue,
          orderCount: orders.length,
        };
      });

    res.json({ manifests });
  }
}
