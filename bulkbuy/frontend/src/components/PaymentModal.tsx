import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, Loader2, QrCode, CreditCard, Building } from 'lucide-react';
import { api } from '../services/api.js';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDraft: any;
  gatewayOrder: {
    gatewayOrderId: string;
    amountInPaise: number;
    currency: string;
    keyId: string;
    isSimulation: boolean;
  };
  reservationId?: string;
  onPaymentSuccess: (confirmedOrder: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderDraft,
  gatewayOrder,
  reservationId,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'cards' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('priya.sharma@oksbi');
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred'>('gpay');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate Razorpay checkout response
      const simulatedPaymentId = `pay_${Date.now().toString().slice(-8)}`;
      
      // Obtain cryptographic HMAC-SHA256 test signature from isolated simulation service
      let simulatedSignature: string;
      if (gatewayOrder.isSimulation) {
        const sigRes = await api.simulatePaymentSignature(gatewayOrder.gatewayOrderId, simulatedPaymentId);
        simulatedSignature = sigRes.signature;
      } else {
        throw new Error('Real payment gateway credentials required for live payments');
      }

      // Server-side verification & atomic order commitment (authoritative server draft)
      const response = await api.verifyPayment({
        orderId: orderDraft.id,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        gatewayPaymentId: simulatedPaymentId,
        gatewaySignature: simulatedSignature,
        reservationId,
      });

      // Fire celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // harmless
      }

      onPaymentSuccess(response.order);
    } catch (err: unknown) {
      setError((err as Error).message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Gateway Simulation Header Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Razorpay Sandbox:</strong> Simulating RBI-compliant escrow authorization.
          </span>
        </div>

        {/* Razorpay Branded Top Header */}
        <div className="bg-[#0C2340] text-white p-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                BulkBuy Group Commerce
              </span>
              <h3 className="text-2xl font-extrabold font-mono tabular-nums mt-0.5 text-white">
                ₹{orderDraft.totalAmount}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Escrow Order</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {gatewayOrder.gatewayOrderId.slice(-10)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Order Summary Recap */}
          <div className="bg-brand-warm-bg border border-brand-warm-border rounded-2xl p-4 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-700">
              <span>Item:</span>
              <span className="font-bold text-slate-900 text-right truncate max-w-50">
                {orderDraft.productTitle}
              </span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Committed Quantity:</span>
              <span className="font-mono font-bold text-slate-900">{orderDraft.quantity} unit(s)</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Group Unit Price:</span>
              <span className="font-mono font-bold text-slate-900">₹{orderDraft.unitPrice}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
              <span>Amount in Escrow:</span>
              <span className="font-mono text-brand-emerald text-sm">₹{orderDraft.totalAmount}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'upi'
                    ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                UPI Apps / QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('cards')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'cards'
                    ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cards / RuPay
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'netbanking'
                    ? 'border-brand-emerald bg-emerald-50 text-brand-emerald ring-1 ring-brand-emerald shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                NetBanking
              </button>
            </div>
          </div>

          {/* UPI Method View */}
          {selectedMethod === 'upi' && (
            <div className="space-y-3.5">
              {/* Quick UPI App Selector */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'gpay', name: 'Google Pay' },
                  { id: 'phonepe', name: 'PhonePe' },
                  { id: 'paytm', name: 'Paytm' },
                  { id: 'cred', name: 'CRED' },
                ].map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setSelectedApp(app.id as any);
                      setUpiId(`priya.sharma@${app.id}`);
                    }}
                    className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all cursor-pointer ${
                      selectedApp === app.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>

              {/* UPI ID Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  placeholder="mobilenumber@upi"
                />
              </div>

              {/* Simulated QR Code Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm11 0h2v2h-2v-2zm-3 0h2v2h-2v-2zm0 3h2v2h-2v-2zm3 0h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm0-6h2v2h-2v-2zm-6 0h2v2h-2v-2zm3 0h2v2h-2v-2z" />
                  </svg>
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  <span className="font-bold text-slate-900 block mb-0.5">Instant UPI Scan & Pay</span>
                  <span>Open GPay, PhonePe or any banking app to authorize ₹{orderDraft.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cards Method View */}
          {selectedMethod === 'cards' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>RuPay / Visa / Mastercard Ready</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Test Sandbox
                </span>
              </div>
              <div className="font-mono text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                Card: •••• •••• •••• 4242 &nbsp;|&nbsp; Exp: 12/28 &nbsp;|&nbsp; CVV: 123
              </div>
              <p className="text-[11px] text-slate-500">
                One-click authorization for seamless evaluation.
              </p>
            </div>
          )}

          {/* NetBanking Method View */}
          {selectedMethod === 'netbanking' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              >
                <option value="HDFC">HDFC Bank</option>
                <option value="SBI">State Bank of India (SBI)</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="flex-1 py-3 px-4 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePay}
              className="flex-2 py-3 px-4 text-xs font-extrabold text-white bg-brand-emerald hover:bg-brand-moss rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Escrow Lock...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-lime-400" />
                  <span>Authorize ₹{orderDraft.totalAmount}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>256-Bit SSL Encrypted Escrow · 100% Refund Guarantee</span>
        </div>
      </div>
    </div>
  );
};
