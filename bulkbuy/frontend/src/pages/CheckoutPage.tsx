import React, { useState } from 'react';
import { Campaign, Address } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';
import { api } from '../services/api.js';
import { PaymentModal } from '../components/PaymentModal.js';
import { getProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper.js';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Plus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CheckoutPageProps {
  campaign: Campaign;
  quantity: number;
  onNavigate: (view: string, param?: string) => void;
  onOrderCompleted: (order: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  campaign,
  quantity,
  onNavigate,
  onOrderCompleted,
}) => {
  const { user, addresses, refreshUser } = useAuth();
  const { currentHub, searchPincode } = useLocation();

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(addresses.length === 0);

  React.useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setIsAddingNewAddress(false);
      }
    }
  }, [addresses, selectedAddressId]);

  // New address state
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(currentHub.city || 'Bengaluru');
  const [state, setState] = useState(currentHub.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(currentHub.pincode || '560103');
  const [dropLocation, setDropLocation] = useState<'gate' | 'clubhouse' | 'doorstep'>('gate');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gateway modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState<any | null>(null);
  const [gatewayOrder, setGatewayOrder] = useState<any | null>(null);
  const [reservationId, setReservationId] = useState<string | undefined>(undefined);

  const { product, pricing } = campaign;
  const mrp = product?.mrpInr || 1000;
  const unitPrice = pricing?.currentUnitPrice || mrp;
  const totalAmount = unitPrice * quantity;
  const totalSavings = (mrp - unitPrice) * quantity;

  const handlePincodeChange = (pin: string) => {
    const cleaned = pin.replace(/\D/g, '');
    setPostalCode(cleaned);
    if (cleaned.length === 6) {
      const match = searchPincode(cleaned);
      if (match) {
        setCity(match.city);
        setState(match.state);
      }
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Concurrency-safe stock reservation
      const resResult = await api.reserveStock(campaign.id, quantity);
      const resId = resResult.reservation?.id;
      setReservationId(resId);

      // 2. Prepare payload
      let newAddressPayload: any = undefined;
      if (isAddingNewAddress) {
        newAddressPayload = {
          recipientName,
          phone,
          streetAddress: `${streetAddress} [Drop Preference: ${dropLocation.toUpperCase()}]`,
          landmark,
          city,
          state,
          postalCode,
          isDefault: true,
        };
      }

      // 3. Create server-calculated order draft & gateway order
      const orderRes = await api.createOrder({
        campaignId: campaign.id,
        quantity,
        addressId: isAddingNewAddress ? undefined : selectedAddressId,
        newAddress: newAddressPayload,
        reservationId: resId,
      });

      setOrderDraft(orderRes.orderDraft);
      setGatewayOrder(orderRes.gateway);
      setPaymentModalOpen(true);
      await refreshUser();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to initialize order');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (confirmedOrder: any) => {
    setPaymentModalOpen(false);
    onOrderCompleted(confirmedOrder);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Return Button */}
      <div>
        <button
          onClick={() => onNavigate('product', campaign.id)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Return to Campaign Details</span>
        </button>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-brand-warm-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
          <span>Secure Escrow Checkout</span>
          <span>·</span>
          <span>Step 2 of 2</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Review Commitment & Society Delivery
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Lock in your wholesale pricing slab. Funds are authorized into RBI-compliant escrow until the campaign target quorum confirms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Society Preference */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>Society Delivery Address (India)</span>
              </h3>
              {addresses.length > 0 && !isAddingNewAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewAddress(true)}
                  className="text-xs font-bold text-brand-emerald hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Existing Address Selection */}
            {!isAddingNewAddress && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-emerald bg-emerald-50/40 ring-1 ring-brand-emerald shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address_select"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-brand-emerald focus:ring-brand-emerald"
                        />
                        <div className="text-xs space-y-1 flex-1">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>{addr.recipientName}</span>
                            <span className="text-slate-500 font-mono text-xs">{addr.phone}</span>
                          </div>
                          <p className="text-slate-700 font-medium">{addr.streetAddress}</p>
                          <p className="text-slate-500">
                            {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.state} — <strong className="font-mono text-slate-800">{addr.postalCode}</strong>
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Add New Address Form */}
            {isAddingNewAddress && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (+91)</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apartment / Flat No., Tower & Society Name
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    placeholder="e.g. Flat 402, Oakwood Enclave, Outer Ring Road, Bellandur"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      placeholder="560103"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                </div>

                {/* Society Delivery Drop Preference */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Society Delivery Drop Preference:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDropLocation('gate')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        dropLocation === 'gate'
                          ? 'border-brand-emerald bg-emerald-50 text-brand-emerald font-bold ring-1 ring-brand-emerald'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block">Main Security Gate</span>
                      <span className="text-[10px] text-slate-500 font-normal">Pallet collection</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropLocation('clubhouse')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        dropLocation === 'clubhouse'
                          ? 'border-brand-emerald bg-emerald-50 text-brand-emerald font-bold ring-1 ring-brand-emerald'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block">Clubhouse Reception</span>
                      <span className="text-[10px] text-slate-500 font-normal">Indoor desk drop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropLocation('doorstep')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        dropLocation === 'doorstep'
                          ? 'border-brand-emerald bg-emerald-50 text-brand-emerald font-bold ring-1 ring-brand-emerald'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block">Flat Doorstep</span>
                      <span className="text-[10px] text-slate-500 font-normal">Tower delivery</span>
                    </button>
                  </div>
                </div>

                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancel and use saved address
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Transparent Escrow Guarantee Card */}
          <div className="bg-brand-warm-bg border border-brand-warm-border rounded-3xl p-6 text-xs text-slate-700 space-y-4">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <span>BulkBuy 4-Point Escrow Protection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">1. Zero-Risk Authorization:</strong>
                <p className="text-slate-600">Your funds remain safely in escrow until the target quota ({campaign.minTargetQty} units) is met.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">2. Automated 100% Refund:</strong>
                <p className="text-slate-600">If the quorum is not reached by the deadline, funds return to your payment source automatically.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">3. Price-Drop Cashback:</strong>
                <p className="text-slate-600">If later buyers unlock a lower volume slab, you automatically receive the difference back.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">4. Fresh Mill Pallet:</strong>
                <p className="text-slate-600">Batch packed fresh upon confirmation and delivered directly to your society security gate.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Itemized Order Summary */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-7 shadow-lg shadow-emerald-950/5 space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
              Itemized Order Summary
            </h3>

            {/* Product Card Row */}
            <div className="flex items-start gap-3.5">
              <img
                src={getProductImageUrl(product?.imageUrl)}
                alt={product?.title || 'Product'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
                className="w-18 h-18 object-cover rounded-2xl border border-slate-200 shrink-0 shadow-2xs"
              />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 leading-snug">{product?.title}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{product?.unitSize}</p>
                <div className="flex items-center gap-2 text-slate-700 pt-1">
                  <span>Qty: <strong className="font-mono text-slate-900 font-bold">{quantity}</strong></span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Unit Price: <strong className="font-mono text-brand-emerald font-bold">₹{unitPrice}</strong></span>
                </div>
              </div>
            </div>

            {/* Pricing Math */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Retail Price (MRP):</span>
                <span className="font-mono line-through">₹{mrp * quantity}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Group Buying Discount:</span>
                <span className="font-mono">-₹{totalSavings}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Society Palletized Delivery:</span>
                <span className="font-mono text-emerald-800 font-bold uppercase">FREE</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-extrabold text-slate-900">
                <span>Total Amount in Escrow:</span>
                <span className="font-mono text-brand-emerald text-xl">₹{totalAmount}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleInitiatePayment}
              className="w-full py-4 px-6 text-sm font-extrabold text-white bg-brand-emerald hover:bg-brand-moss rounded-2xl shadow-md shadow-brand-emerald/15 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Stock & Connecting Gateway...</span>
                </>
              ) : (
                <span>Authorize & Pay ₹{totalAmount}</span>
              )}
            </button>

            <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Razorpay Verified Merchant Escrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {orderDraft && gatewayOrder && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderDraft={orderDraft}
          gatewayOrder={gatewayOrder}
          reservationId={reservationId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
