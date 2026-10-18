import React, { useState } from 'react';
import { Campaign } from '../types/index.js';
import { Users, Clock, ShieldCheck, ArrowRight, Share2, Check, Sparkles, MapPin } from 'lucide-react';
import { getProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper.js';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (campaignId: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect }) => {
  const { product, supplier, pricing, tiers = [] } = campaign;
  const mrp = product?.mrpInr || 1000;
  const currentPrice = pricing?.currentUnitPrice || mrp;
  const savingsInr = Math.max(0, mrp - currentPrice);
  const savingsPercent = pricing?.savingsPercent || Math.round((savingsInr / mrp) * 100);
  const progressRatio = Math.min(1, campaign.committedQty / campaign.minTargetQty);
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  const [copied, setCopied] = useState(false);

  // Time remaining calculation
  const calculateDaysLeft = () => {
    const diff = new Date(campaign.endsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : 'Ends today';
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Join our society bulk buy pool for ${campaign.title} at ₹${currentPrice} (MRP ₹${mrp}). Only ${campaign.minTargetQty - campaign.committedQty} more orders needed! Check here: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      onClick={() => onSelect(campaign.id)}
      className="group bg-white rounded-2xl border border-brand-warm-border hover:border-brand-emerald/30 hover:shadow-xl hover:shadow-brand-emerald/5 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-4/3 w-full bg-brand-warm-bg overflow-hidden">
        <img
          src={getProductImageUrl(product?.imageUrl)}
          alt={product?.title || 'Product'}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
          {/* Savings Badge */}
          <div className="bg-brand-emerald text-white text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-md backdrop-blur-md flex items-center gap-1 shadow-md border border-emerald-700/50">
            <span className="text-lime-300 font-mono tracking-tight">{savingsPercent}% OFF</span>
            <span className="text-emerald-300 font-normal hidden sm:inline">GROUP DEAL</span>
          </div>

          {/* Provenance Tag */}
          {product?.originState && (
            <div className="bg-white/95 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-md shadow-xs flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-amber-600" />
              <span>{product.originState}</span>
            </div>
          )}
        </div>

        {/* Top Right Status or Share Trigger */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {campaign.status === 'TARGET_REACHED' ? (
            <span className="bg-lime-500 text-brand-emerald text-[10px] font-extrabold px-2 py-1 rounded shadow-md uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3 h-3 stroke-3" />
              <span>Target Met</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="Share to Society WhatsApp Group"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-emerald-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ambient Gradient Scrim on Bottom of Image */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Category & Unit Size Row */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="text-emerald-800 font-semibold">{product?.category || 'Staples'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-mono text-[10px]">
              {product?.unitSize}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 group-hover:text-brand-emerald transition-colors leading-snug">
            {campaign.title}
          </h3>

          {/* Verified Producer Stamp */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate text-[11px] font-medium text-slate-700">
              {supplier?.businessName || 'Certified Producer'}
            </span>
          </div>
        </div>

        {/* Campaign Progress & Milestone Section */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {/* Progress Quantities */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-900 font-mono tabular-nums">{campaign.committedQty}</strong>
              <span className="text-slate-500">/ {campaign.minTargetQty} units</span>
            </span>
            <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 text-slate-400" />
              {calculateDaysLeft()}
            </span>
          </div>

          {/* Visual Milestone Track Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  campaign.committedQty >= campaign.minTargetQty
                    ? 'bg-linear-to-r from-emerald-600 to-lime-500'
                    : 'bg-linear-to-r from-brand-emerald to-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (campaign.committedQty / campaign.minTargetQty) * 100)}%` }}
              />
            </div>

            {/* Next tier milestone micro-copy */}
            <div className="flex items-center justify-between text-[11px]">
              {pricing?.nextTier ? (
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>
                    Need <strong className="font-mono text-brand-emerald">{pricing.unitsToNextTier} units</strong> for ₹{pricing.nextTier.priceInr}!
                  </span>
                </span>
              ) : (
                <span className="text-lime-800 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-lime-600" />
                  <span>Maximum Wholesale Tier Reached!</span>
                </span>
              )}
              <span className="font-mono text-slate-400 text-[10px] font-semibold">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>MRP</span>
              <span className="line-through font-mono tabular-nums">₹{mrp}</span>
              <span className="text-emerald-700 font-semibold font-mono text-[10px] bg-emerald-50 px-1 rounded">
                -₹{savingsInr}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-brand-emerald font-mono tabular-nums tracking-tight">
                ₹{currentPrice}
              </span>
              <span className="text-xs text-slate-500 font-medium">/unit</span>
            </div>
          </div>

          {/* Join Group Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(campaign.id);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-emerald group-hover:bg-brand-moss rounded-xl transition-all shadow-sm hover:shadow active:scale-98 cursor-pointer whitespace-nowrap"
          >
            <span>Join Group</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
};
