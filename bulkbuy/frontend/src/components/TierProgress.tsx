import React from 'react';
import { CampaignPriceTier } from '../types/index.js';
import { Check, Sparkles, TrendingDown, ShieldCheck } from 'lucide-react';

interface TierProgressProps {
  tiers: CampaignPriceTier[];
  committedQty: number;
  currentUnitPrice: number;
  minTargetQty: number;
}

export const TierProgress: React.FC<TierProgressProps> = ({
  tiers,
  committedQty,
  currentUnitPrice,
  minTargetQty,
}) => {
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  const highestPrice = sorted[0]?.priceInr || currentUnitPrice;

  return (
    <div className="bg-white border border-brand-warm-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <TrendingDown className="w-4 h-4 text-emerald-700" />
            <span>Collective Volume Discount Slabs</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices drop for every society buyer as collective group volume increases.
          </p>
        </div>
        <div className="flex items-baseline gap-2 bg-brand-warm-bg px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span className="text-[11px] text-slate-500 font-medium">Current Pool Price:</span>
          <span className="text-lg font-extrabold text-brand-emerald font-mono tabular-nums">
            ₹{currentUnitPrice}
          </span>
          <span className="text-[10px] text-slate-400">/unit</span>
        </div>
      </div>

      {/* Tier Steps Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sorted.map((t, idx) => {
          const isUnlocked = committedQty >= t.minQuantity;
          const isCurrent = currentUnitPrice === t.priceInr;
          const isTargetTier = t.minQuantity === minTargetQty;
          const slabSavings = highestPrice - t.priceInr;

          return (
            <div
              key={t.id || idx}
              className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-linear-to-b from-emerald-50/70 to-white border-brand-emerald ring-1 ring-brand-emerald shadow-md'
                  : isUnlocked
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/80 border-slate-200/80 opacity-80'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-brand-emerald text-lime-400 text-[9px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Active
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-slate-600 font-bold">
                    {t.minQuantity}+ units
                  </span>
                  {isUnlocked ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  ) : isTargetTier ? (
                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                      Quorum
                    </span>
                  ) : null}
                </div>

                <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                  ₹{t.priceInr}
                  <span className="text-[10px] font-normal text-slate-500 font-sans ml-0.5">/unit</span>
                </div>

                {slabSavings > 0 && (
                  <span className="text-[10px] font-medium text-emerald-700 block mt-0.5">
                    Save ₹{slabSavings}/unit vs base
                  </span>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px]">
                {isUnlocked ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Unlocked for All</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    Need <strong className="text-slate-800 font-mono">{t.minQuantity - committedQty}</strong> more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Escrow Price Protection Guarantee */}
      <div className="bg-brand-warm-bg rounded-xl p-3 px-4 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">BulkBuy Price-Drop Protection:</strong> If more people join your society pool and unlock a cheaper tier before close, the difference is automatically refunded to your original payment method.
        </p>
      </div>
    </div>
  );
};
