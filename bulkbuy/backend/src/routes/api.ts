import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { CampaignController } from '../controllers/campaignController.js';
import { OrderController } from '../controllers/orderController.js';
import { SupplierController } from '../controllers/supplierController.js';
import { AdminController } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter.js';

export const apiRouter = Router();

// --- Health Check ---
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'BulkBuy API', time: new Date().toISOString() });
});

// --- Auth & Profile (Rate limited on registration and login) ---
apiRouter.post('/auth/register', registerRateLimiter, AuthController.register);
apiRouter.post('/auth/login', loginRateLimiter, AuthController.login);
apiRouter.post('/auth/logout', authMiddleware, AuthController.logout);
apiRouter.get('/auth/me', authMiddleware, AuthController.me);
apiRouter.put('/auth/profile', authMiddleware, AuthController.updateProfile);
apiRouter.post('/auth/address', authMiddleware, AuthController.addAddress);
apiRouter.get('/auth/addresses', authMiddleware, AuthController.listAddresses);
apiRouter.put('/auth/addresses/:id', authMiddleware, AuthController.updateAddress);
apiRouter.delete('/auth/addresses/:id', authMiddleware, AuthController.deleteAddress);
apiRouter.put('/auth/addresses/:id/default', authMiddleware, AuthController.setDefaultAddress);

// --- Public Campaigns & Catalog ---
apiRouter.get('/campaigns', CampaignController.listCampaigns);
apiRouter.get('/campaigns/:id', CampaignController.getCampaignById);
apiRouter.post('/campaigns/:id/reserve', authMiddleware, CampaignController.reserveStock);
apiRouter.get('/categories', CampaignController.listCategories);
apiRouter.get('/metrics/platform', CampaignController.getPlatformMetrics);

// --- Orders & Checkout ---
apiRouter.post('/orders/create', authMiddleware, OrderController.createOrder);
apiRouter.post('/payments/verify', authMiddleware, OrderController.verifyPayment);
apiRouter.post('/payments/simulate-signature', authMiddleware, OrderController.simulateSignature);
apiRouter.get('/orders/my', authMiddleware, OrderController.listMyOrders);
apiRouter.get('/orders/:id', authMiddleware, OrderController.getOrderById);
apiRouter.post('/orders/:id/cancel', authMiddleware, OrderController.cancelOrder);

// --- Supplier Operations (RBAC: SUPPLIER only) ---
apiRouter.get('/supplier/profile', authMiddleware, requireRole('SUPPLIER'), SupplierController.getProfile);
apiRouter.put('/supplier/profile', authMiddleware, requireRole('SUPPLIER'), SupplierController.updateProfile);
apiRouter.get('/supplier/products', authMiddleware, requireRole('SUPPLIER'), SupplierController.listMyProducts);
apiRouter.post('/supplier/products', authMiddleware, requireRole('SUPPLIER'), SupplierController.addProduct);
apiRouter.put('/supplier/products/:id', authMiddleware, requireRole('SUPPLIER'), SupplierController.updateProduct);
apiRouter.delete('/supplier/products/:id', authMiddleware, requireRole('SUPPLIER'), SupplierController.deleteProduct);
apiRouter.get('/supplier/campaigns', authMiddleware, requireRole('SUPPLIER'), SupplierController.listMyCampaigns);
apiRouter.post('/supplier/campaigns', authMiddleware, requireRole('SUPPLIER'), SupplierController.proposeCampaign);
apiRouter.get('/supplier/dispatches', authMiddleware, requireRole('SUPPLIER'), SupplierController.getAggregatedDispatches);

// --- Admin Operations (RBAC: ADMIN only) ---
apiRouter.get('/admin/analytics', authMiddleware, requireRole('ADMIN'), AdminController.getAnalytics);
apiRouter.get('/admin/orders', authMiddleware, requireRole('ADMIN'), AdminController.listOrders);
apiRouter.get('/admin/suppliers', authMiddleware, requireRole('ADMIN'), AdminController.listSuppliers);
apiRouter.post('/admin/suppliers/:id/verify', authMiddleware, requireRole('ADMIN'), AdminController.verifySupplier);
apiRouter.post('/admin/campaigns/:id/status', authMiddleware, requireRole('ADMIN'), AdminController.updateCampaignStatus);
apiRouter.post('/admin/refunds/trigger', authMiddleware, requireRole('ADMIN'), AdminController.triggerRefunds);
apiRouter.get('/admin/audit-logs', authMiddleware, requireRole('ADMIN'), AdminController.getAuditLogs);
apiRouter.get('/admin/reports/csv', authMiddleware, requireRole('ADMIN'), AdminController.exportCsvReport);
