import { Campaign, Order, Address, Supplier, Product, PlatformMetrics } from '../types/index.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('bulkbuy_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('bulkbuy_token', token);
    } else {
      localStorage.removeItem('bulkbuy_token');
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // --- Auth ---
  public async register(payload: { email: string; password: string; fullName: string; phone: string; role?: 'CUSTOMER' | 'SUPPLIER' }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(payload: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async logout() {
    try {
      await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network errors on logout to allow local cleanup
    } finally {
      this.setToken(null);
    }
  }

  public async getMe() {
    return this.request<{ user: any; addresses: Address[]; supplierDetails: Supplier | null }>('/auth/me');
  }

  public async updateProfile(payload: { fullName: string; phone: string }) {
    return this.request<{ message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async addAddress(payload: Omit<Address, 'id'>) {
    return this.request<{ address: Address }>('/auth/address', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateAddress(id: string, payload: Partial<Omit<Address, 'id' | 'userId'>>) {
    return this.request<{ message: string; address: Address }>(`/auth/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteAddress(id: string) {
    return this.request<{ message: string }>(`/auth/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  public async setDefaultAddress(id: string) {
    return this.request<{ message: string; address: Address }>(`/auth/addresses/${id}/default`, {
      method: 'PUT',
    });
  }

  // --- Catalog & Campaigns ---
  public async getCampaigns(params?: { category?: string; status?: string; search?: string; sort?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    return this.request<{ campaigns: Campaign[]; total: number }>(`/campaigns${query ? `?${query}` : ''}`);
  }

  public async getCampaignById(id: string) {
    return this.request<{ campaign: Campaign }>(`/campaigns/${id}`);
  }

  public async reserveStock(campaignId: string, quantity: number) {
    return this.request<{ message: string; reservation: any }>(`/campaigns/${campaignId}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  }

  public async getCategories() {
    return this.request<{ categories: { name: string; productCount: number }[] }>('/categories');
  }

  public async getPlatformMetrics() {
    return this.request<{ metrics: PlatformMetrics }>('/metrics/platform');
  }

  // --- Orders & Payments ---
  public async createOrder(payload: { campaignId: string; quantity: number; addressId?: string; newAddress?: any; reservationId?: string }) {
    return this.request<{
      orderDraft: any;
      gateway: { gatewayOrderId: string; amountInPaise: number; currency: string; keyId: string; isSimulation: boolean };
      reservationId?: string;
    }>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async simulatePaymentSignature(gatewayOrderId: string, gatewayPaymentId: string) {
    return this.request<{ signature: string; isSimulation: boolean }>('/payments/simulate-signature', {
      method: 'POST',
      body: JSON.stringify({ gatewayOrderId, gatewayPaymentId }),
    });
  }

  public async verifyPayment(payload: {
    orderId: string;
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    orderDraft?: any;
    reservationId?: string;
  }) {
    return this.request<{ message: string; order: Order; payment: any }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMyOrders() {
    return this.request<{ orders: Order[] }>('/orders/my');
  }

  public async getOrderById(id: string) {
    return this.request<{ order: Order }>(`/orders/${id}`);
  }

  public async cancelOrder(id: string) {
    return this.request<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  }

  // --- Supplier Operations ---
  public async getSupplierProfile() {
    return this.request<{ supplier: Supplier | null }>('/supplier/profile');
  }

  public async updateSupplierProfile(payload: { businessName: string; gstin: string; fssaiLicense: string; bankAccount: string; ifscCode: string }) {
    return this.request<{ message: string; supplier: Supplier }>('/supplier/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async getSupplierProducts() {
    return this.request<{ products: Product[] }>('/supplier/products');
  }

  public async addSupplierProduct(payload: any) {
    return this.request<{ product: Product }>('/supplier/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProduct(id: string, payload: any) {
    return this.request<{ message: string; product: Product }>(`/supplier/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProduct(id: string) {
    return this.request<{ message: string }>(`/supplier/products/${id}`, {
      method: 'DELETE',
    });
  }

  public async getSupplierCampaigns() {
    return this.request<{ campaigns: Campaign[] }>('/supplier/campaigns');
  }

  public async proposeSupplierCampaign(payload: any) {
    return this.request<{ message: string; campaign: Campaign }>('/supplier/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getSupplierDispatches() {
    return this.request<{ manifests: any[] }>('/supplier/dispatches');
  }

  // --- Admin Operations ---
  public async getAdminAnalytics() {
    return this.request<{ metrics: PlatformMetrics; breakdown: any }>('/admin/analytics');
  }

  public async getAdminOrders() {
    return this.request<{ orders: Order[] }>('/admin/orders');
  }

  public async getAdminSuppliers() {
    return this.request<{ suppliers: Supplier[] }>('/admin/suppliers');
  }

  public async verifySupplier(id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    return this.request<{ message: string; supplier: Supplier }>(`/admin/suppliers/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  public async updateCampaignStatus(id: string, status: string, reason?: string) {
    return this.request<{ message: string; campaign: Campaign }>(`/admin/campaigns/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  public async triggerRefunds(campaignId: string, reason?: string) {
    return this.request<{ message: string; ordersRefunded: number }>('/admin/refunds/trigger', {
      method: 'POST',
      body: JSON.stringify({ campaignId, reason }),
    });
  }

  public async getAdminAuditLogs() {
    return this.request<{ logs: any[] }>('/admin/audit-logs');
  }
}

export const api = new ApiService();
