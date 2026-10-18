import { Response } from 'express';
import { db } from '../repositories/db.js';
import { updateCampaignStatusSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AdminController {
  public static async getAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const metrics = db.getPlatformMetrics();
    const campaigns = db.getCampaigns();
    const orders = db.getOrders();
    const suppliers = db.getSuppliers();
    const users = db.getUsers();

    // Calculate status breakdown
    const campaignStatusCounts: Record<string, number> = {};
    for (const c of campaigns) {
      campaignStatusCounts[c.status] = (campaignStatusCounts[c.status] || 0) + 1;
    }

    res.json({
      metrics,
      breakdown: {
        totalUsers: users.length,
        totalCustomers: users.filter((u) => u.role === 'CUSTOMER').length,
        totalSuppliers: suppliers.length,
        pendingSuppliers: suppliers.filter((s) => s.status === 'PENDING').length,
        campaignStatusCounts,
        recentOrders: orders.slice(-5).reverse(),
      },
    });
  }

  public static async listSuppliers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const suppliers = db.getSuppliers();
    res.json({ suppliers });
  }

  public static async verifySupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Status must be VERIFIED or REJECTED' });
      return;
    }

    const updated = db.updateSupplierStatus(id, status, reason);
    if (!updated) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    db.addAuditLog({
      id: `aud_${Date.now()}`,
      actorUserId: req.user!.id,
      action: status === 'VERIFIED' ? 'SUPPLIER_VERIFIED' : 'SUPPLIER_REJECTED',
      entityType: 'SUPPLIER',
      entityId: id,
      metadata: { reason },
      timestamp: new Date().toISOString(),
    });

    res.json({ message: `Supplier successfully marked as ${status}`, supplier: updated });
  }

  public static async updateCampaignStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = updateCampaignStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid campaign status update', details: parsed.error.format() });
      return;
    }

    const { status, reason } = parsed.data;
    const updated = db.updateCampaignStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // If marked CANCELLED or REFUNDED, update orders to REFUNDED
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      const orders = db.getOrders().filter((o) => o.campaignId === id && o.status === 'CONFIRMED');
      for (const ord of orders) {
        db.updateOrderStatus(ord.id, 'REFUNDED');
      }
    }

    db.addAuditLog({
      id: `aud_${Date.now()}`,
      actorUserId: req.user!.id,
      action: `CAMPAIGN_STATUS_${status}`,
      entityType: 'CAMPAIGN',
      entityId: id,
      metadata: { reason },
      timestamp: new Date().toISOString(),
    });

    res.json({ message: `Campaign status updated to ${status}`, campaign: updated });
  }

  public static async triggerRefunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { campaignId, reason } = req.body;
    if (!campaignId) {
      res.status(400).json({ error: 'campaignId is required' });
      return;
    }

    const campaign = db.findCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const targetOrders = db.getOrders().filter((o) => o.campaignId === campaignId && o.status === 'CONFIRMED');
    for (const o of targetOrders) {
      db.updateOrderStatus(o.id, 'REFUNDED');
    }

    db.updateCampaignStatus(campaignId, 'REFUNDED');

    db.addAuditLog({
      id: `aud_${Date.now()}`,
      actorUserId: req.user!.id,
      action: 'BATCH_REFUND_EXECUTED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      metadata: { totalOrdersRefunded: targetOrders.length, reason },
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: `Processed refunds for ${targetOrders.length} order(s). Campaign marked as REFUNDED.`,
      ordersRefunded: targetOrders.length,
    });
  }

  public static async getAuditLogs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const logs = db.getAuditLogs();
    res.json({ logs });
  }

  public static async listOrders(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const orders = db.getOrders();
    res.json({ orders });
  }

  public static async exportCsvReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orders = db.getOrders();
    const headers = 'Order ID,Order Number,User ID,Campaign ID,Quantity,Unit Price (INR),Total Amount (INR),Status,Created At\n';
    const rows = orders
      .map(
        (o) =>
          `"${o.id}","${o.orderNumber}","${o.userId}","${o.campaignId}",${o.quantity},${o.unitPrice},${o.totalAmount},"${o.status}","${o.createdAt}"`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bulkbuy_orders_report.csv"');
    res.send(headers + rows);
  }
}
