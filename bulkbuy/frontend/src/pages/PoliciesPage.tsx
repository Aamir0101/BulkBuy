import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, FileText, CheckCircle2, RotateCcw, Truck, Lock, Scale } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'refund' | 'shipping' | 'terms' | 'fssai' | 'privacy'>('refund');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Legal & Regulatory Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 flex items-start gap-3.5 shadow-2xs">
        <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-amber-900 text-sm">Regulatory Transparency & Compliance Notice</h4>
          <p className="leading-relaxed text-amber-900/90">
            BulkBuy operations are designed in accordance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the <strong>Food Safety and Standards Act, 2006</strong>, and the <strong>Digital Personal Data Protection Act, 2023 (DPDP)</strong> for group commerce in India.
          </p>
        </div>
      </div>

      <div className="pb-4 border-b border-brand-warm-border">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Governance & Standards
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Trust, Escrow Protection & Policies
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Clear, consumer-first terms governing society demand aggregation, escrow refunds, and mill auditing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold shadow-2xs">
        <button
          onClick={() => setActiveTab('refund')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'refund'
              ? 'bg-brand-emerald text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Refund & Escrow Guarantee
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'shipping'
              ? 'bg-brand-emerald text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Society Gate Shipping Protocol
        </button>
        <button
          onClick={() => setActiveTab('fssai')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'fssai'
              ? 'bg-brand-emerald text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          FSSAI & Mill Verification
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-brand-emerald text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-brand-emerald text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Privacy & Data Protection
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-10 text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed shadow-sm">
        {activeTab === 'refund' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-emerald font-extrabold text-base sm:text-lg">
              <RotateCcw className="w-5 h-5 text-emerald-700" />
              <h3>100% Escrow Refund & Cancellation Policy</h3>
            </div>
            <p>
              BulkBuy maintains an ironclad, consumer-first escrow model for all community pooled orders:
            </p>
            <div className="space-y-4 pt-1">
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  1. Unfulfilled Quota Refund Guarantee (Zero Risk):
                </strong>
                <p className="text-xs text-slate-600">
                  If a collective campaign fails to achieve its minimum required units by the scheduled closing timestamp, the campaign is classified as <code>UNFULFILLED</code>. 100% of the funds authorized by buyers are returned to their original payment source (bank account, UPI, or card) within 24 to 48 hours without any deduction or penalty.
                </p>
              </div>

              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  2. Price-Drop Cashback Guarantee:
                </strong>
                <p className="text-xs text-slate-600">
                  When you commit to a group buy, you are guaranteed the current active tier price. If additional participants join before campaign closure and unlock a lower wholesale tier, all earlier buyers automatically receive the price difference credited back to their payment method.
                </p>
              </div>

              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  3. Buyer-Initiated Cancellation:
                </strong>
                <p className="text-xs text-slate-600">
                  A buyer may cancel their order commitment directly from their Account page at any time prior to the campaign closing and reaching <code>CONFIRMED</code> or <code>FULFILLING</code> status.
                </p>
              </div>

              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  4. Transit Damage & Replacement:
                </strong>
                <p className="text-xs text-slate-600">
                  In the rare event of oil tin denting, leakage, or grain bag puncture during palletized transit, photo evidence shared with <code>grievance@bulkbuy.in</code> within 24 hours of delivery will result in an immediate replacement or full refund.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-emerald font-extrabold text-base sm:text-lg">
              <Truck className="w-5 h-5 text-emerald-700" />
              <h3>Society Gate Pallet Shipping Protocol</h3>
            </div>
            <p>
              By eliminating individual delivery bikes and consolidating orders onto bulk pallets, BulkBuy slashes supply chain costs and urban emissions:
            </p>
            <div className="space-y-4 pt-1">
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  1. Direct Pallet Drops:
                </strong>
                <p className="text-xs text-slate-600">
                  Confirmed campaign orders are consolidated onto palletized crates at the processing mill and dispatched directly to your registered apartment society security gate or clubhouse collection point.
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  2. Free Society Delivery:
                </strong>
                <p className="text-xs text-slate-600">
                  All group-buying campaigns feature 100% free delivery to active society clusters in Bengaluru, Delhi NCR, Mumbai, Pune, and Hyderabad.
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  3. Delivery Timeframe & Verification:
                </strong>
                <p className="text-xs text-slate-600">
                  Fresh milling begins immediately upon campaign confirmation. Regional society delivery takes 2–4 business days post campaign close. Customers receive real-time SMS/WhatsApp dispatch alerts with pickup OTP.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fssai' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-emerald font-extrabold text-base sm:text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3>FSSAI Compliance & Mill Auditing Standards</h3>
            </div>
            <p>
              Food safety is non-negotiable. BulkBuy enforces strict verification before any mill or farmer cooperative can list a campaign:
            </p>
            <div className="space-y-4 pt-1">
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  1. Statutory Licensing Verification:
                </strong>
                <p className="text-xs text-slate-600">
                  Every supplier must submit an active 14-digit FSSAI manufacturing license, GSTIN certificate, and proof of physical mill premises.
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  2. NABL Lab Testing:
                </strong>
                <p className="text-xs text-slate-600">
                  Cooking oils are verified for acid value, peroxide value, and zero argemone or solvent contamination. Flours are tested for moisture content and bran retention.
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  3. Direct Farmer Producer Co-Ops:
                </strong>
                <p className="text-xs text-slate-600">
                  We prioritize Farmer Producer Organizations (FPOs) and regional milling cooperatives, ensuring higher realization for Indian agriculture.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-emerald font-extrabold text-base sm:text-lg">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h3>Terms of Service</h3>
            </div>
            <p>
              By participating in BulkBuy group buying pools, you agree to these operational guidelines:
            </p>
            <div className="space-y-4 pt-1">
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  1. Marketplace Role:
                </strong>
                <p className="text-xs text-slate-600">
                  BulkBuy operates as a technology intermediary facilitating demand aggregation between consumer societies and verified agricultural suppliers under the Information Technology Act, 2000.
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  2. Pricing & Currency:
                </strong>
                <p className="text-xs text-slate-600">
                  All prices are denominated in Indian National Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  3. Household Consumption:
                </strong>
                <p className="text-xs text-slate-600">
                  BulkBuy deals are intended for residential households and housing societies. Unauthorized commercial hoarding or black-market arbitrage may result in order cancellation.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-emerald font-extrabold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-emerald-700" />
              <h3>Privacy & Data Protection (DPDP Act, 2023)</h3>
            </div>
            <p>
              Your personal data is treated with the highest confidentiality standards:
            </p>
            <div className="space-y-4 pt-1">
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  1. Data Minimization:
                </strong>
                <p className="text-xs text-slate-600">
                  We only collect details strictly required for delivery (Name, Phone number, Delivery Address, and PIN code).
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  2. Payment Credential Security:
                </strong>
                <p className="text-xs text-slate-600">
                  Card numbers, UPI PINs, and bank credentials never touch BulkBuy servers. All transactions are processed through RBI-authorized payment aggregators (Razorpay).
                </p>
              </div>
              <div className="bg-brand-warm-bg p-4 rounded-2xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs sm:text-sm">
                  3. Zero Telemarketing Spam:
                </strong>
                <p className="text-xs text-slate-600">
                  Your phone number will never be sold to third-party telemarketers. It is used strictly for order tracking and society pickup OTPs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
