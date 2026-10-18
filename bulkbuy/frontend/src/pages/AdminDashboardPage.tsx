import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Campaign, Supplier, PlatformMetrics } from '../types/index.js';
import { ShieldCheck, Check, X, RotateCcw, Download, Eye, AlertCircle, CheckCircle2, Loader2, ArrowUpRight } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'suppliers' | 'campaigns' | 'refunds' | 'audit'>('analytics');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [anaRes, supRes, campRes, ordRes, logRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminSuppliers(),
        api.getCampaigns({ status: 'ALL' }),
        api.getAdminOrders(),
        api.getAdminAuditLogs(),
      ]);
      setMetrics(anaRes.metrics);
      setBreakdown(anaRes.breakdown);
      setSuppliers(supRes.suppliers);
      setCampaigns(campRes.campaigns);
      setAllOrders(ordRes.orders);
      setAuditLogs(logRes.logs);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifySupplier = async (supplierId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.verifySupplier(supplierId, status, status === 'VERIFIED' ? 'FSSAI credentials validated' : 'Failed verification check');
      setNotification(`Supplier marked as ${status}`);
      await loadAdminData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update supplier status');
    }
  };

  const handleUpdateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      await api.updateCampaignStatus(campaignId, status, `Admin manual transition to ${status}`);
      setNotification(`Campaign status updated to ${status}`);
      await loadAdminData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update campaign status');
    }
  };

  const handleTriggerBatchRefund = async (campaignId: string) => {
    if (!confirm('Execute batch refund for this campaign? All confirmed customer orders will be marked REFUNDED.')) {
      return;
    }
    try {
      const res = await api.triggerRefunds(campaignId, 'Target not met before scheduled closing deadline');
      setNotification(res.message);
      await loadAdminData();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to process refunds');
    }
  };

  const handleExportCsv = () => {
    const token = api.getToken();
    window.open(`/api/v1/admin/reports/csv?token=${token}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E5E0]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            BulkBuy Master Operations
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Admin Management Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Managed marketplace oversight, FSSAI verification queue, escrow settlement, and audit logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#E7E5E0] hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Analytics & GMV
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Orders ({allOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Supplier Verification Queue ({suppliers.filter((s) => s.status === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'campaigns' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Campaign Moderation ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 font-medium rounded-md transition-colors ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Ledger ({auditLogs.length})
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-bold font-mono text-brand-emerald">
                ₹{metrics.totalGmv.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500">Total consumer escrow throughput</span>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Total Money Saved</span>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                ₹{metrics.totalSavingsInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-800">Delivered directly to Indian buyers</span>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Customer Commitments</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {metrics.totalCommittedUnits} units
              </div>
              <span className="text-[11px] text-slate-500">Across all active society pools</span>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Registered Accounts</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {breakdown?.totalUsers || 0}
              </div>
              <span className="text-[11px] text-slate-500">
                {breakdown?.totalCustomers} customers · {breakdown?.totalSuppliers} mills
              </span>
            </div>
          </div>

          {/* Recent Orders in Admin */}
          <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Escrow Orders</h3>
              <span className="text-xs text-slate-500">Real-time database stream</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(breakdown?.recentOrders || []).map((o: any) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900">{o.orderNumber}</span>
                    <span className="text-slate-500 ml-2">Customer: {o.shippingAddress?.recipientName}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {o.shippingAddress?.city}, {o.shippingAddress?.state} · Qty: {o.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-slate-900 text-sm">₹{o.totalAmount}</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">All Platform Orders</h3>
              <p className="text-xs text-slate-500 mt-0.5">{allOrders.length} total orders across all campaigns</p>
            </div>
          </div>
          {allOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Order ID','User ID','Campaign','Qty','Amount','Status','Placed At'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{o.id.slice(0, 12)}…</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{o.userId.slice(0, 12)}…</td>
                      <td className="px-4 py-3 text-slate-800">{o.campaignId.slice(0, 12)}…</td>
                      <td className="px-4 py-3 text-slate-800">{o.quantity}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                          o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supplier Verification Queue Tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Registered Supplier Verification Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict governance: Suppliers cannot list products or launch campaigns until validated.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-sm">{sup.businessName}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        sup.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : sup.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {sup.status}
                    </span>
                  </div>
                  <div className="text-slate-600 flex flex-wrap gap-4 text-[11px]">
                    <span>GSTIN: <strong className="font-mono">{sup.gstin}</strong></span>
                    <span>FSSAI License: <strong className="font-mono">{sup.fssaiLicense}</strong></span>
                    <span>Bank IFSC: <strong className="font-mono">{sup.ifscCode}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sup.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerifySupplier(sup.id, 'VERIFIED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Verify</span>
                    </button>
                  )}

                  {sup.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleVerifySupplier(sup.id, 'REJECTED')}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Moderation Tab */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Campaign Lifecycle Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm campaigns that achieved targets, or trigger automated batch refunds for expired ones.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-sm">{camp.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-800">
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Committed: <strong className="font-mono text-slate-900">{camp.committedQty}</strong> / {camp.minTargetQty} units · Supplier: {camp.supplier?.businessName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {camp.status === 'DRAFT' && (
                    <button
                      onClick={() => handleUpdateCampaignStatus(camp.id, 'ACTIVE')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-emerald rounded-lg"
                    >
                      Approve to Active
                    </button>
                  )}

                  {camp.status === 'TARGET_REACHED' && (
                    <button
                      onClick={() => handleUpdateCampaignStatus(camp.id, 'CONFIRMED')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                    >
                      Confirm Dispatch
                    </button>
                  )}

                  {camp.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateCampaignStatus(camp.id, 'FULFILLING')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                    >
                      Mark Fulfilling
                    </button>
                  )}

                  {camp.status !== 'REFUNDED' && camp.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleTriggerBatchRefund(camp.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      Cancel & Refund Buyers
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Ledger Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Immutable System Audit Log</h3>
              <p className="text-xs text-slate-500">Cryptographically verifiable sequence of all critical operations</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} events logged</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-mono">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-800">{log.action}</span>
                  <span className="text-slate-500 ml-2">[{log.entityType} : {log.entityId}]</span>
                  {log.metadata && (
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>

                <div className="text-slate-400 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
