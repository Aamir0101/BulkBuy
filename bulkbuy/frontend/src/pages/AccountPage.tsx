import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';
import { api } from '../services/api.js';
import { Order, Address } from '../types/index.js';
import {
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  Share2,
  Check,
  Printer,
  X,
  Plus,
  Truck,
  Building2,
  BadgePercent,
  Edit2,
  Trash2,
  Star,
  User as UserIcon,
} from 'lucide-react';

interface AccountPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, addresses, refreshUser, updateProfile } = useAuth();
  const { currentHub, searchPincode } = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected order for invoice receipt modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Add new address in address tab state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState(user?.fullName || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState(currentHub.city || 'Bengaluru');
  const [newState, setNewState] = useState(currentHub.state || 'Karnataka');
  const [newPincode, setNewPincode] = useState(currentHub.pincode || '560103');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Edit address state
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editRecipient, setEditRecipient] = useState('');
  const [editAddressPhone, setEditAddressPhone] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyOrders();
      setOrders(res.orders.reverse());
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (
      !confirm(
        'Are you sure you want to cancel this order commitment? Funds will be refunded to your original payment method automatically within 24 hours.'
      )
    ) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await api.cancelOrder(orderId);
      setNotification('Order cancelled successfully. Escrow refund initiated to your payment source.');
      await fetchOrders();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      await api.addAddress({
        recipientName: newRecipient,
        phone: newPhone,
        streetAddress: newStreet,
        landmark: newLandmark || undefined,
        city: newCity,
        state: newState,
        postalCode: newPincode,
        isDefault: addresses.length === 0,
      });
      await refreshUser();
      setIsAddingAddress(false);
      setNewStreet('');
      setNewLandmark('');
      setNotification('New delivery address saved successfully!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setEditRecipient(addr.recipientName);
    setEditAddressPhone(addr.phone);
    setEditStreet(addr.streetAddress);
    setEditLandmark(addr.landmark || '');
    setEditCity(addr.city);
    setEditState(addr.state);
    setEditPincode(addr.postalCode);
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;
    setIsUpdatingAddress(true);
    try {
      await api.updateAddress(editingAddress.id, {
        recipientName: editRecipient,
        phone: editAddressPhone,
        streetAddress: editStreet,
        landmark: editLandmark || undefined,
        city: editCity,
        state: editState,
        postalCode: editPincode,
      });
      await refreshUser();
      setEditingAddress(null);
      setNotification('Address updated successfully!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update address');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await api.deleteAddress(id);
      setNotification('Address deleted successfully');
      await refreshUser();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      setNotification('Default delivery address updated');
      await refreshUser();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to set default address');
    }
  };

  const handleOpenEditProfile = () => {
    setEditFullName(user?.fullName || '');
    setEditPhone(user?.phone || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: editFullName,
        phone: editPhone,
      });
      setIsEditingProfile(false);
      setNotification('Profile details updated successfully!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalUnits = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-warm-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Customer Dashboard
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Namaste, {user?.fullName || 'Customer'}
            </h1>
            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Profile</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.email} · {user?.phone} · Default Delivery Hub: <strong className="text-slate-700">{currentHub.city}</strong>
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shadow-2xs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Group Buys ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Addresses ({addresses.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Account Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-brand-warm-border shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Orders Placed</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {orders.length} <span className="text-xs font-normal text-slate-400">group pool{orders.length > 1 ? 's' : ''}</span>
          </div>
          <span className="text-[11px] text-emerald-700 block font-medium">100% Escrow protected</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-warm-border shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Units Committed</span>
          <div className="text-2xl font-extrabold text-brand-emerald font-mono">
            {totalUnits} <span className="text-xs font-normal text-slate-400">tins / bags</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Society bulk pooled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-warm-border shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Volume Authorized</span>
          <div className="text-2xl font-extrabold text-brand-emerald font-mono">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 block font-medium">Guaranteed price drop protection</span>
        </div>
      </div>

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-brand-emerald" />
              <span className="font-medium">Loading your society commitments...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-brand-warm-border p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-emerald flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No active commitments yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Join an active collective pool for cooking oils, whole wheat atta, or aged basmati to unlock genuine mill-gate pricing.
              </p>
              <button
                onClick={() => onNavigate('explore')}
                className="inline-flex px-5 py-2.5 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Explore Active Deals
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const campaign = order.campaign;
                const isConfirmed = order.status === 'CONFIRMED';
                const isCancelled = order.status === 'CANCELLED';
                const isRefunded = order.status === 'REFUNDED';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-brand-warm-border p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-slate-300"
                  >
                    {/* Top Order Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {order.orderNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-3 py-1 rounded-full text-[11px] ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-950'
                              : isCancelled || isRefunded
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-100 text-amber-950'
                          }`}
                        >
                          {order.status === 'CONFIRMED' ? 'Confirmed in Escrow' : order.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {campaign?.title || 'Group Buy Order'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span>Quantity: <strong className="font-mono text-slate-900 font-bold">{order.quantity} units</strong></span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span>Unit Price: <strong className="font-mono text-brand-emerald font-bold">₹{order.unitPrice}</strong></span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Delivery to: {order.shippingAddress.streetAddress}, {order.shippingAddress.city} — {order.shippingAddress.postalCode}</span>
                        </p>
                      </div>

                      <div className="text-right sm:self-center bg-brand-warm-bg p-3 px-4 rounded-2xl border border-slate-200 shrink-0">
                        <span className="text-[11px] text-slate-500 block font-medium">Total Paid in Escrow</span>
                        <span className="text-xl font-extrabold text-brand-emerald font-mono tabular-nums">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Campaign Milestone Progress within Order */}
                    {campaign && (
                      <div className="bg-brand-warm-bg p-4 rounded-2xl border border-brand-warm-border text-xs space-y-2">
                        <div className="flex justify-between text-slate-700 font-medium">
                          <span>Society Campaign Progress ({campaign.status}):</span>
                          <span className="font-mono font-bold text-brand-emerald">
                            {campaign.committedQty} / {campaign.minTargetQty} units ({Math.round((campaign.committedQty / campaign.minTargetQty) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-0.5">
                          <div
                            className="bg-linear-to-r from-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (campaign.committedQty / campaign.minTargetQty) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs gap-2">
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Escrow protected. 100% refund guaranteed if target is not met.</span>
                      </div>

                      {isConfirmed && (
                        <button
                          type="button"
                          disabled={cancellingOrderId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-700 hover:text-red-800 font-bold hover:underline text-xs cursor-pointer"
                        >
                          {cancellingOrderId === order.id ? 'Processing refund...' : 'Cancel & Request Refund'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Addresses View */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Registered Delivery Addresses</h3>
            {!isAddingAddress && (
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            )}
          </div>

          {/* Add Address Form */}
          {isAddingAddress && (
            <div className="bg-white rounded-3xl border border-brand-warm-border p-6 space-y-4 shadow-sm animate-in fade-in">
              <h4 className="text-sm font-bold text-slate-900">Add Society Address</h4>
              <form onSubmit={handleSaveAddress} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (+91)</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apartment / Tower / Flat No. & Street
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={newPincode}
                      onChange={(e) => {
                        const pin = e.target.value.replace(/\D/g, '');
                        setNewPincode(pin);
                        if (pin.length === 6) {
                          const res = searchPincode(pin);
                          if (res) {
                            setNewCity(res.city);
                            setNewState(res.state);
                          }
                        }
                      }}
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className="px-4 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-all cursor-pointer"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-3xl border border-brand-warm-border p-5 sm:p-6 space-y-2 text-xs relative shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-800" />
                      <h4 className="font-bold text-slate-900 text-sm">{addr.recipientName}</h4>
                    </div>
                    {addr.isDefault && (
                      <span className="bg-emerald-100 text-emerald-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-mono font-medium">{addr.phone}</p>
                  <p className="text-slate-700 font-medium mt-1">{addr.streetAddress}</p>
                  <p className="text-slate-500">
                    {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.state} — <strong className="font-mono text-slate-800">{addr.postalCode}</strong>
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddress(addr)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[11px] font-semibold text-brand-emerald hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3 h-3 text-brand-emerald" />
                      <span>Set as Default</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-warm-bg">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  BulkBuy Escrow Statement & Receipt
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Order #{selectedInvoiceOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Issued To:</span>
                  <strong className="text-slate-900">{selectedInvoiceOrder.shippingAddress.recipientName}</strong>
                  <p className="text-slate-500">{selectedInvoiceOrder.shippingAddress.city}, {selectedInvoiceOrder.shippingAddress.postalCode}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Date Authorized:</span>
                  <strong className="text-slate-900">
                    {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Product Title</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{selectedInvoiceOrder.campaign?.title || 'Group Item'} (Qty: {selectedInvoiceOrder.quantity})</span>
                  <span className="font-mono">₹{selectedInvoiceOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                  <span>Society Bulk Delivery</span>
                  <span className="uppercase">FREE</span>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                <span>Total Escrow Authorized:</span>
                <span className="font-mono text-brand-emerald">₹{selectedInvoiceOrder.totalAmount}</span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed text-center pt-2">
                This document serves as an electronic proof of payment under RBI escrow guidelines.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-warm-bg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald text-white flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Profile</h3>
                  <p className="text-xs text-slate-500">Update your name and primary contact number</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Email is permanently bound to your account.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Edit Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-warm-bg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Delivery Address</h3>
                  <p className="text-xs text-slate-500">Update recipient and location specifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddress(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAddress} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={editRecipient}
                    onChange={(e) => setEditRecipient(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editAddressPhone}
                    onChange={(e) => setEditAddressPhone(e.target.value)}
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apartment / Tower / Flat No. & Street
                </label>
                <input
                  type="text"
                  required
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={editLandmark}
                  onChange={(e) => setEditLandmark(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={editPincode}
                    onChange={(e) => {
                      const pin = e.target.value.replace(/\D/g, '');
                      setEditPincode(pin);
                      if (pin.length === 6) {
                        const res = searchPincode(pin);
                        if (res) {
                          setEditCity(res.city);
                          setEditState(res.state);
                        }
                      }
                    }}
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAddress}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
