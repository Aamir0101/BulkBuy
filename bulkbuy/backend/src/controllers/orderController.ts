import { Response } from 'express';
import { db } from '../repositories/db.js';
import { PricingService } from '../services/pricingService.js';
import { PaymentGatewayService } from '../services/paymentService.js';
import { createOrderSchema, verifyPaymentSchema } from '../validators/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Order, Payment, Address } from '../models/types.js';

export class OrderController {
  public static async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid order request', details: parsed.error.format() });
        return;
      }

      const { campaignId, quantity, addressId, newAddress, reservationId } = parsed.data;

      const campaign = db.findCampaignById(campaignId);
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      if (campaign.status !== 'ACTIVE' && campaign.status !== 'TARGET_REACHED') {
        res.status(400).json({ error: `Cannot purchase for campaign in status ${campaign.status}` });
        return;
      }

      // Concurrency & reservation validation
      let effectiveReservationId = reservationId;
      if (effectiveReservationId) {
        const resObj = db.findReservationById(effectiveReservationId);
        if (!resObj) {
          res.status(400).json({ error: 'Reservation not found or expired' });
          return;
        }
        if (resObj.userId !== req.user.id) {
          res.status(403).json({ error: 'Reservation does not belong to the authenticated user' });
          return;
        }
        if (resObj.campaignId !== campaignId) {
          res.status(400).json({ error: 'Reservation does not match requested campaign' });
          return;
        }
        if (resObj.status !== 'ACTIVE') {
          res.status(400).json({ error: `Reservation is no longer active (status: ${resObj.status})` });
          return;
        }
        if (new Date(resObj.expiresAt) <= new Date()) {
          res.status(400).json({ error: 'Reservation has expired. Please reserve stock again.' });
          return;
        }
        if (resObj.quantity !== quantity) {
          res.status(400).json({ error: `Order quantity (${quantity}) must match reserved quantity (${resObj.quantity})` });
          return;
        }
      } else {
        const reserveResult = db.reserveStock(campaignId, req.user.id, quantity);
        if (!reserveResult.success || !reserveResult.reservation) {
          res.status(400).json({ error: reserveResult.message || 'Failed to reserve stock for order' });
          return;
        }
        effectiveReservationId = reserveResult.reservation.id;
      }

      // Resolve delivery address
      let selectedAddress: Address | undefined;
      if (addressId) {
        const userAddresses = db.getAddressesByUserId(req.user.id);
        selectedAddress = userAddresses.find((a) => a.id === addressId);
      } else if (newAddress) {
        selectedAddress = {
          id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: req.user.id,
          ...newAddress,
        };
        db.addAddress(selectedAddress);
      } else {
        const userAddresses = db.getAddressesByUserId(req.user.id);
        selectedAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      }

      if (!selectedAddress) {
        res.status(400).json({ error: 'Delivery address is required' });
        return;
      }

      // Calculate authoritative server price
      const pricing = PricingService.calculateUnitPrice(campaign);
      const unitPrice = pricing.unitPrice;
      const totalAmount = unitPrice * quantity;

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderNumber = `BB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Prepare Razorpay order payload
      const gatewayOrder = PaymentGatewayService.createGatewayOrder(totalAmount, orderId);

      // Persist authoritative pending order in server storage (15 minute TTL)
      const pendingOrder: Order = {
        id: orderId,
        orderNumber,
        userId: req.user.id,
        campaignId,
        quantity,
        unitPrice,
        totalAmount,
        status: 'PENDING_PAYMENT',
        shippingAddress: selectedAddress,
        reservationId: effectiveReservationId,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
      db.addPendingOrder(pendingOrder);

      // Return order draft and gateway payload to client
      res.status(201).json({
        orderDraft: {
          id: orderId,
          orderNumber,
          campaignId,
          productTitle: campaign.product?.title,
          quantity,
          unitPrice,
          totalAmount,
          shippingAddress: selectedAddress,
        },
        gateway: gatewayOrder,
        reservationId: effectiveReservationId,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async simulateSignature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!PaymentGatewayService.IS_SIMULATED && process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Signature simulation is disabled in live production mode' });
        return;
      }

      const { gatewayOrderId, gatewayPaymentId } = req.body;
      if (!gatewayOrderId || !gatewayPaymentId) {
        res.status(400).json({ error: 'gatewayOrderId and gatewayPaymentId are required' });
        return;
      }

      const signature = PaymentGatewayService.generateTestSignature(gatewayOrderId, gatewayPaymentId);
      res.json({ signature, isSimulation: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = verifyPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid verification payload', details: parsed.error.format() });
        return;
      }

      const { orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature, reservationId } = parsed.data;

      // Authoritative order lookup from database
      const order = db.findOrderById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Verify resource ownership
      if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Unauthorized to verify payment for this order' });
        return;
      }

      // Idempotency: if order is already confirmed, return existing confirmed record
      if (order.status === 'CONFIRMED') {
        res.status(200).json({
          message: 'Order already confirmed',
          order,
          payment: order.payment,
        });
        return;
      }

      if (order.status !== 'PENDING_PAYMENT') {
        res.status(400).json({ error: `Cannot process payment for order in status ${order.status}` });
        return;
      }

      if (order.expiresAt && new Date(order.expiresAt) <= new Date()) {
        res.status(400).json({ error: 'Order payment window has expired. Please create a new order.' });
        return;
      }

      if (order.gatewayOrderId && order.gatewayOrderId !== gatewayOrderId) {
        res.status(400).json({ error: 'Gateway order ID does not match order record' });
        return;
      }

      // Strict cryptographic HMAC-SHA256 verification
      const isValid = PaymentGatewayService.verifyPaymentSignature({
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
      });

      if (!isValid) {
        res.status(400).json({ error: 'Payment signature verification failed. Untrusted transaction rejected.' });
        return;
      }

      // Replay attack prevention on payment ID
      const paymentAlreadyExists = db.getPayments().some((p) => p.gatewayPaymentId === gatewayPaymentId);
      if (paymentAlreadyExists) {
        res.status(400).json({ error: 'Payment transaction has already been processed.' });
        return;
      }

      const campaign = db.findCampaignById(order.campaignId);
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      const payment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        gateway: PaymentGatewayService.IS_SIMULATED ? 'RAZORPAY_SANDBOX' : 'RAZORPAY',
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature,
        amountInr: order.totalAmount,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      };

      // Atomic commit
      const result = db.commitOrderAndParticipation(order, payment, order.reservationId || reservationId);

      // Audit log
      db.addAuditLog({
        id: `aud_${Date.now()}`,
        actorUserId: req.user.id,
        action: 'ORDER_CONFIRMED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: {
          campaignId: campaign.id,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          paymentId: payment.id,
        },
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        message: 'Order and payment confirmed successfully',
        order: result.order,
        payment,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async listMyOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const orders = db.getOrders(req.user.id);
      res.json({ orders });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const order = db.findOrderById(id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Check ownership or admin
      if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Unauthorized to view this order' });
        return;
      }

      res.json({ order });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  public static async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const order = db.findOrderById(id);

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.userId !== req.user.id) {
        res.status(403).json({ error: 'Forbidden: you can only cancel your own orders' });
        return;
      }

      if (order.status !== 'CONFIRMED') {
        res.status(400).json({ error: `Cannot cancel order in status ${order.status}` });
        return;
      }

      db.updateOrderStatus(order.id, 'CANCELLED');

      // Adjust campaign commitment if still active
      const campaign = db.findCampaignById(order.campaignId);
      if (campaign && (campaign.status === 'ACTIVE' || campaign.status === 'TARGET_REACHED')) {
        campaign.committedQty = Math.max(0, campaign.committedQty - order.quantity);
      }

      // Audit log
      db.addAuditLog({
        id: `aud_${Date.now()}`,
        actorUserId: req.user.id,
        action: 'ORDER_CANCELLED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: { reason: 'Customer initiated cancellation' },
        timestamp: new Date().toISOString(),
      });

      res.json({ message: 'Order cancelled successfully and refund initiated', order: { ...order, status: 'CANCELLED' } });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
}
