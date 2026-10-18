import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Campaign, PlatformMetrics } from '../types/index.js';
import { CampaignCard } from '../components/CampaignCard.js';
import { useLocation } from '../context/LocationContext.js';
import {
  ArrowRight,
  Users,
  ShieldCheck,
  TrendingDown,
  Clock,
  PackageCheck,
  Sparkles,
  Building2,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Percent,
  Check,
  ChevronRight,
  Truck,
  HeartHandshake,
  BadgePercent,
  Award,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { currentHub, setIsLocationModalOpen, searchPincode, setHub } = useLocation();

  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [categories, setCategories] = useState<{ name: string; productCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Hero Simulator Quantity
  const [heroQty, setHeroQty] = useState(2);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  // Pincode input state for inline banner
  const [homePincode, setHomePincode] = useState('');
  const [pincodeFeedback, setPincodeFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [campRes, metRes, catRes] = await Promise.all([
          api.getCampaigns({ status: 'ALL' }),
          api.getPlatformMetrics(),
          api.getCategories(),
        ]);
        setFeaturedCampaigns(campRes.campaigns.slice(0, 4));
        setMetrics(metRes.metrics);
        setCategories(catRes.categories);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homePincode || homePincode.length < 6) {
      setPincodeFeedback('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    const result = searchPincode(homePincode);
    if (result) {
      setHub(result);
      setPincodeFeedback(`Great news! Delivering to ${result.city} (${result.pincode}) with 0 delivery charge.`);
    } else {
      setPincodeFeedback(`PIN ${homePincode} will be added in our next regional cluster expansion.`);
    }
  };

  return (
    <div className="space-y-14 md:space-y-20 pb-20">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-14 pb-14 border-b border-brand-warm-border bg-linear-to-b from-brand-warm-bg via-[#F6F3EC] to-brand-warm-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Location & Sourcing Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-800/20 text-xs font-semibold text-emerald-950 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Direct Mill Sourcing</span>
                <span aria-hidden="true" className="text-emerald-400">·</span>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-brand-emerald font-bold underline hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>{currentHub.city} ({currentHub.pincode}) Hub</span>
                </button>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-emerald tracking-tight leading-[1.12] text-balance font-sans">
                Pool orders with your apartment society. Unlock wholesale prices on daily kitchen staples.
              </h1>

              {/* Sub-paragraph */}
              <p className="text-base text-slate-700 max-w-xl leading-relaxed">
                BulkBuy connects Indian residential societies directly with FSSAI-certified processing mills. By aggregating neighborhood volume on cold-pressed mustard oil, Sharbati chakki atta, and aged royal basmati rice, we eliminate distributor margins and warehouse markups.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-6 py-3.5 text-xs sm:text-sm font-bold text-white bg-brand-emerald hover:bg-brand-moss rounded-xl shadow-md shadow-brand-emerald/15 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Explore Active Group Pools</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-brand-warm-border hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-2xs"
                >
                  How Group Buying Works
                </button>
              </div>

              {/* Trust Markers Bar */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>100% Certified FSSAI Mills</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <PackageCheck className="w-4 h-4 text-emerald-700" />
                  <span>Direct Doorstep Pallet Drop</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  <span>100% Escrow Auto-Refund</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card: Live Example Calculation */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-7 shadow-xl shadow-emerald-950/5 relative overflow-hidden space-y-5">
                {/* Header Strip with Live Ticker */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-brand-emerald flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {currentHub.city} Society Pool
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{currentHub.society.split('(')[0]}</span>
                    </div>
                  </div>

                  {/* Live closing soon timer */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block">
                      Closes in {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                    </span>
                  </div>
                </div>

                {/* Product Preview */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Featured Batch Direct
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Amara Kachi Ghani Mustard Oil 5L
                      </h3>
                      <p className="text-[11px] text-slate-500">Wood-Pressed Kolhu · Rajasthan Origin</p>
                    </div>
                    <span className="text-xs text-slate-400 line-through font-mono">MRP ₹975</span>
                  </div>

                  {/* Dynamic Pricing Callout */}
                  <div className="bg-brand-warm-bg p-4 rounded-2xl border border-brand-warm-border space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Group Price (Wholesale Slab)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold font-mono text-brand-emerald">₹749</span>
                          <span className="text-xs text-slate-500 font-medium">/ 5L Tin</span>
                        </div>
                      </div>
                      <span className="bg-lime-200/90 text-brand-emerald text-xs font-extrabold px-2.5 py-1 rounded-md font-mono">
                        SAVE 23%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs text-emerald-900 font-medium flex items-center justify-between">
                      <span>Total Savings for Your Society:</span>
                      <span className="font-mono font-bold text-emerald-800">₹18,984 saved</span>
                    </div>
                  </div>

                  {/* Live Progress Bar with Ticks */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-900 font-mono">84</strong> committed
                      </span>
                      <span>Target: <strong className="text-slate-900 font-mono">100 units</strong></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div className="bg-linear-to-r from-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500" style={{ width: '84%' }} />
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Just 16 more orders to guarantee factory dispatch!</span>
                    </p>
                  </div>

                  {/* Interactive Quantity Quick Calculator */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Simulate Your Order:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 5].map((qty) => (
                        <button
                          key={qty}
                          onClick={() => setHeroQty(qty)}
                          className={`w-7 h-7 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                            heroQty === qty
                              ? 'bg-brand-emerald text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      ₹{749 * heroQty}
                      <span className="text-[10px] text-emerald-700 font-sans block text-right font-normal">
                        (save ₹{226 * heroQty})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Direct Action */}
                <button
                  onClick={() => onNavigate('product', 'cmp_1')}
                  className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-brand-emerald bg-lime-200/90 hover:bg-lime-300 rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <span>Join This Society Pool ({heroQty} unit{heroQty > 1 ? 's' : ''})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Platform Data Metrics Strip */}
      {metrics && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-brand-warm-border p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="px-3 text-center sm:text-left">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Total Consumer Savings</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-emerald font-mono tabular-nums">
                  ₹{metrics.totalSavingsInr.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">
                  Direct to Indian households
                </span>
              </div>

              <div className="px-3 pt-4 md:pt-0 text-center sm:text-left">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Units Committed</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {metrics.totalCommittedUnits.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Tins, grain bags & staples
                </span>
              </div>

              <div className="px-3 pt-4 md:pt-0 text-center sm:text-left">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Active Collective Pools</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {metrics.activeCampaignsCount}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Reaching quorum this week
                </span>
              </div>

              <div className="px-3 pt-4 md:pt-0 text-center sm:text-left">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Verified Processing Mills</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {metrics.verifiedSuppliersCount}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  100% FSSAI audited & certified
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Active Group Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              <span>Live Collective Campaigns</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trending Staple Pools Near You
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lock in your order quantity before campaign quotas close for supplier dispatch.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-brand-emerald hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View all active campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Campaign Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-88 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCampaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                onSelect={(id) => onNavigate('product', id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive PIN Code Serviceability Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-emerald rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
          {/* Subtle Decorative Pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#A3E635_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-lime-300 text-[11px] font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Free Society Gate Pallet Delivery</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Does BulkBuy deliver to your apartment society or residential layout?
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              We service 420+ gated communities and layout hubs across Bengaluru, Delhi NCR, Mumbai, Pune, and Hyderabad with consolidated bulk drops.
            </p>

            <form onSubmit={handlePincodeCheck} className="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-md">
              <input
                type="text"
                maxLength={6}
                value={homePincode}
                onChange={(e) => {
                  setHomePincode(e.target.value.replace(/\D/g, ''));
                  setPincodeFeedback(null);
                }}
                placeholder="Enter 6-digit PIN code (e.g. 560103)"
                className="flex-1 text-xs font-mono px-4 py-3 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-lime-400 hover:bg-lime-500 text-brand-emerald text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-98"
              >
                Check My Society
              </button>
            </form>

            {pincodeFeedback && (
              <div className="p-3 bg-white/10 rounded-xl text-xs text-lime-200 border border-white/20 animate-in fade-in flex items-center gap-2">
                <Check className="w-4 h-4 text-lime-400 shrink-0" />
                <span>{pincodeFeedback}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Browse By Essential Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
            Origin Sourced Essentials
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Household Staples Sourced Directly at Origin
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onNavigate('explore', cat.name)}
              className="p-5 bg-white rounded-2xl border border-brand-warm-border hover:border-brand-emerald text-left transition-all hover:shadow-md group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-warm-bg group-hover:bg-emerald-100/70 text-brand-emerald flex items-center justify-center font-bold mb-3 transition-colors">
                <BadgePercent className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-emerald transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {cat.productCount} active group pool{cat.productCount > 1 ? 's' : ''}
              </p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Deals</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Traditional Retail vs. BulkBuy Bento Comparison Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Radical Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Why Individual Retail Pays 30% More
          </h2>
          <p className="text-xs text-slate-600 mt-2">
            The multi-layer Indian supply chain charges you for warehouse holding costs, distributor credit, and individual courier dispatch. BulkBuy cuts out the middle layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Retail Box */}
          <div className="bg-white rounded-2xl border border-red-200/80 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Traditional Retail / Quick-Commerce
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">Higher Markup</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  ✕
                </div>
                <span><strong>25% to 40% Middleman Margin:</strong> Clearing agents, state distributors, and local kirana markups inflate retail prices.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  ✕
                </div>
                <span><strong>Aged Warehouse Inventory:</strong> Products sit in regional godowns for 3 to 6 months before reaching store shelves.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  ✕
                </div>
                <span><strong>High Packaging & Delivery Waste:</strong> Dozens of delivery bikes making individual trips to the same apartment building every day.</span>
              </li>
            </ul>
          </div>

          {/* BulkBuy Group Commerce Box */}
          <div className="bg-linear-to-b from-emerald-50/50 to-white rounded-2xl border-2 border-brand-emerald p-6 sm:p-8 space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-emerald text-lime-400 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              BulkBuy Direct
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald">
                BulkBuy Society Collective
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800">22%–35% Savings</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-800">
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-3" />
                </div>
                <span><strong>Direct Mill Gate Pricing:</strong> Demand aggregated upfront means zero distributor margins and zero credit risk for mills.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-3" />
                </div>
                <span><strong>Fresh Milling Guarantee:</strong> Cold-pressed oils and stone-ground chakki attas are packed fresh upon campaign confirmation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-3" />
                </div>
                <span><strong>Single Pallet Society Drop:</strong> Consolidated delivery to society security gate or clubhouse drops transit carbon footprint by 80%.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Step-by-Step Community Buying Guide */}
      <section className="bg-white border-y border-brand-warm-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              The 4-Step Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Society Group Buying Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-brand-warm-bg p-6 rounded-2xl border border-brand-warm-border space-y-3 relative">
              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Step 01
              </span>
              <h4 className="text-base font-bold text-slate-900">Discover & Select</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse verified direct-from-mill campaigns for cold-pressed oils, chakki flours, and royal aged rice.
              </p>
            </div>

            <div className="bg-brand-warm-bg p-6 rounded-2xl border border-brand-warm-border space-y-3 relative">
              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Step 02
              </span>
              <h4 className="text-base font-bold text-slate-900">Commit with Escrow</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick your quantity. Funds are securely locked in Razorpay escrow and protected by our 100% refund guarantee.
              </p>
            </div>

            <div className="bg-brand-warm-bg p-6 rounded-2xl border border-brand-warm-border space-y-3 relative">
              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Step 03
              </span>
              <h4 className="text-base font-bold text-slate-900">Target Reached</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When the campaign quota is fulfilled, volume tier wholesale prices lock for every participant automatically.
              </p>
            </div>

            <div className="bg-brand-warm-bg p-6 rounded-2xl border border-brand-warm-border space-y-3 relative">
              <span className="font-mono text-xs font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Step 04
              </span>
              <h4 className="text-base font-bold text-slate-900">Society Delivery</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The supplier prepares fresh mill batches and dispatches directly to your registered society gate collection hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Society Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Real Society RWAs
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            What Apartment Communities Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-warm-border space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "Our 240-apartment society pooled orders for cold-pressed mustard oil. We reached the wholesale tier within 48 hours and saved over ₹48,000 collectively. Delivery was smooth at the main gate."
            </p>
            <div className="pt-2 border-t border-slate-100 text-xs">
              <strong className="text-slate-900 block font-semibold">Rajesh Menon</strong>
              <span className="text-[11px] text-slate-500">RWA Committee, Prestige Lakeside Habitat (Bengaluru)</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-warm-border space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "The freshness of the MP Sharbati chakki atta was incredible compared to supermarket bags that sit on shelves for months. BulkBuy's escrow refund guarantee gave all our residents total peace of mind."
            </p>
            <div className="pt-2 border-t border-slate-100 text-xs">
              <strong className="text-slate-900 block font-semibold">Sunita Aggarwal</strong>
              <span className="text-[11px] text-slate-500">Community Lead, DLF Phase 5 (Gurugram)</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-warm-border space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "We run our society's buying group on WhatsApp. BulkBuy makes it effortless to share one link and let everyone commit individually while unlocking the factory bulk tier together."
            </p>
            <div className="pt-2 border-t border-slate-100 text-xs">
              <strong className="text-slate-900 block font-semibold">Vikram Kulkarni</strong>
              <span className="text-[11px] text-slate-500">Resident Secretary, Hiranandani Gardens (Mumbai)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
