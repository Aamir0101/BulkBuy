import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Campaign } from '../types/index.js';
import { TierProgress } from '../components/TierProgress.js';
import { getProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper.js';
import { useLocation } from '../context/LocationContext.js';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Share2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Building,
  AlertCircle,
  Check,
  MapPin,
  Sparkles,
  Award,
  Clock,
  Users,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

interface ProductDetailPageProps {
  campaignId: string;
  onNavigate: (view: string, param?: string) => void;
  onProceedToCheckout: (campaign: Campaign, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  campaignId,
  onNavigate,
  onProceedToCheckout,
}) => {
  const { currentHub, setIsLocationModalOpen } = useLocation();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showImageZoom, setShowImageZoom] = useState<boolean>(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      setIsLoading(true);
      try {
        const res = await api.getCampaignById(campaignId);
        setCampaign(res.campaign);
      } catch (err) {
        console.error('Failed to load campaign detail', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-white rounded-3xl h-96 border border-slate-200 animate-pulse" />
          <div className="lg:col-span-5 bg-white rounded-3xl h-96 border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Campaign Not Found</h2>
        <p className="text-xs text-slate-500">The collective campaign may have ended or been rescheduled.</p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-moss transition-colors"
        >
          Return to Explore Deals
        </button>
      </div>
    );
  }

  const { product, supplier, pricing, tiers = [] } = campaign;
  const mrp = product?.mrpInr || 1000;
  const currentUnitPrice = pricing?.currentUnitPrice || mrp;
  const totalMrp = mrp * quantity;
  const totalGroupPrice = currentUnitPrice * quantity;
  const totalSavings = totalMrp - totalGroupPrice;
  const savingsPercent = pricing?.savingsPercent || Math.round(((mrp - currentUnitPrice) / mrp) * 100);

  const handleShareWhatsApp = () => {
    const text = `Join our society bulk buy pool for *${campaign.title}* at ₹${currentUnitPrice}/unit (MRP ₹${mrp}). Only ${campaign.minTargetQty - campaign.committedQty} more orders needed! Order here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('explore')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Deals</span>
        </button>

        {/* Current delivery hub badge */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-brand-emerald font-semibold cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>Delivering to {currentHub.city} ({currentHub.pincode})</span>
          <span className="text-[10px] text-emerald-800 underline">Change</span>
        </button>
      </div>

      {/* Main Grid: Gallery & Specs on Left, Contiguous Purchase Module on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Product Imagery, Provenance & Milestones */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Hero Image */}
          <div className="rounded-3xl border border-brand-warm-border overflow-hidden aspect-4/3 bg-brand-warm-bg relative shadow-sm group">
            <img
              src={getProductImageUrl(product?.imageUrl)}
              alt={product?.title || 'Product'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
              }}
              className="w-full h-full object-cover object-center cursor-zoom-in group-hover:scale-102 transition-transform duration-500"
              onClick={() => setShowImageZoom(!showImageZoom)}
            />

            {/* Savings & Badges overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              <div className="bg-brand-emerald text-white text-xs font-extrabold px-3 py-1.5 rounded-lg backdrop-blur-md shadow-md border border-emerald-700/60">
                <span className="text-lime-300 font-mono">SAVE {savingsPercent}%</span> VIA GROUP BUY
              </div>
              <div className="bg-white/95 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md shadow-xs flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>100% Cold-Pressed Mill Direct</span>
              </div>
            </div>

            {/* Target Met Badge */}
            {campaign.status === 'TARGET_REACHED' && (
              <div className="absolute top-4 right-4 bg-lime-500 text-brand-emerald text-xs font-extrabold px-3 py-1 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-3" />
                <span>Target Met · Dispatch Locked</span>
              </div>
            )}
          </div>

          {/* Product Specifications Bento Box */}
          <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Mill Provenance & Standards
              </h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                Batch Lab Tested
              </span>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-brand-warm-bg p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Pack Unit</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{product?.unitSize}</span>
              </div>
              <div className="bg-brand-warm-bg p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Origin State</span>
                <span className="font-bold text-slate-900 text-sm">{product?.originState || 'Certified Mills'}</span>
              </div>
              <div className="bg-brand-warm-bg p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1 font-medium">Shelf Life</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{product?.shelfLifeDays || 180} Days</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-slate-700 leading-relaxed space-y-2">
              <h4 className="font-bold text-slate-900">Product Overview</h4>
              <p>{product?.description}</p>
            </div>

            {/* Supplier Verification Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{supplier?.businessName}</span>
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                  <span>FSSAI License: <strong className="font-mono text-slate-800">{supplier?.fssaiLicense}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>GSTIN: <strong className="font-mono text-slate-800">{supplier?.gstin}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold shrink-0 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Mill Partner</span>
              </div>
            </div>
          </div>

          {/* Volume Milestone Table */}
          <TierProgress
            tiers={tiers}
            committedQty={campaign.committedQty}
            currentUnitPrice={currentUnitPrice}
            minTargetQty={campaign.minTargetQty}
          />
        </div>

        {/* Right Column: Contiguous Purchase Module (Sticky on Desktop) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-7 shadow-lg shadow-emerald-950/5 space-y-6">
            {/* Header Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="text-emerald-800 font-bold">{product?.category}</span>
                <span aria-hidden="true">·</span>
                <span>{campaign.region}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-bold">Mill Direct</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {campaign.title}
              </h1>
            </div>

            {/* Price Box */}
            <div className="bg-brand-warm-bg p-5 rounded-2xl border border-brand-warm-border space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span>Retail MRP</span>
                    <span className="line-through font-mono tabular-nums">₹{mrp}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-brand-emerald font-mono tabular-nums">
                      ₹{currentUnitPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/unit</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-brand-emerald bg-lime-200/90 px-3 py-1.5 rounded-lg font-mono inline-block shadow-2xs">
                    SAVE ₹{mrp - currentUnitPrice} ({savingsPercent}%)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Free delivery to: <strong>{currentHub.city}</strong></span>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-emerald-800 underline font-semibold cursor-pointer"
                >
                  Change Hub
                </button>
              </div>
            </div>

            {/* Campaign Progress Meter */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-700 font-medium">
                <span>
                  <strong className="text-slate-900 font-mono">{campaign.committedQty}</strong> / {campaign.minTargetQty} units committed
                </span>
                <span className="font-bold text-emerald-800">
                  {Math.round((campaign.committedQty / campaign.minTargetQty) * 100)}% of target
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="bg-linear-to-r from-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (campaign.committedQty / campaign.minTargetQty) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 font-medium text-amber-800">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>
                    {(() => {
                      const diffMs = new Date(campaign.endsAt).getTime() - Date.now();
                      if (diffMs <= 0) return 'Campaign closed';
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      return diffDays > 1 ? `Quota closes in ${diffDays} days` : 'Quota closes today';
                    })()}
                  </span>
                </span>
                <span className="text-slate-700 font-medium">{campaign.deliveryWindow}</span>
              </div>
            </div>

            {/* Quantity Selector & Real-Time Calculation */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Select Quantity to Commit:</label>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-mono font-bold text-slate-900 min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(50, quantity + 1))}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Real-Time Total Calculation Strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Retail (MRP):</span>
                  <span className="font-mono line-through">₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm">
                  <span>Collective Group Total:</span>
                  <span className="font-mono text-brand-emerald text-base">₹{totalGroupPrice}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-slate-200">
                  <span>Instant Family Savings:</span>
                  <span className="font-mono text-emerald-800">₹{totalSavings} saved</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onProceedToCheckout(campaign, quantity)}
                className="w-full py-4 px-6 text-sm font-extrabold text-white bg-brand-emerald hover:bg-brand-moss rounded-2xl shadow-md shadow-brand-emerald/15 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Commit & Join Group (₹{totalGroupPrice})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 px-3 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp Group</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Zero Risk: 100% refund initiated automatically if target not met.</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Doorstep delivery to apartment societies in {currentHub.city}.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Mobile Commit Bar */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-slate-500 font-medium">Group Deal Price</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-brand-emerald font-mono">
              ₹{totalGroupPrice}
            </span>
            <span className="text-[10px] text-slate-400">({quantity}x)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onProceedToCheckout(campaign, quantity)}
          className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-moss text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-1.5"
        >
          <span>Join Group</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
