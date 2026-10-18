import React from 'react';
import { ShieldCheck, Truck, RotateCcw, HeartHandshake, MapPin } from 'lucide-react';
import { useLocation } from '../context/LocationContext.js';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { currentHub, setIsLocationModalOpen } = useLocation();

  return (
    <footer className="bg-[#0B261D] text-slate-300 pt-16 pb-12 border-t border-emerald-950">
      {/* 4 Pillars of Collective Buying Trust */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-emerald-900/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 flex items-center justify-center shrink-0 text-lime-400 shadow-sm border border-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Verified FSSAI Mills</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Every supplier is audited on premises with NABL lab-tested purity certifications.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 flex items-center justify-center shrink-0 text-lime-400 shadow-sm border border-emerald-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Direct Society Pallet Drop</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bulk lots dispatch directly from processing mills to your apartment complex gate.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 flex items-center justify-center shrink-0 text-lime-400 shadow-sm border border-emerald-800">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">100% Escrow Guarantee</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                If a campaign quota is not achieved by deadline, escrow funds return automatically.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 flex items-center justify-center shrink-0 text-lime-400 shadow-sm border border-emerald-800">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Cooperative Fair Sourcing</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct procurement guarantees higher realization for farmer producer companies.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-400 text-brand-emerald font-bold flex items-center justify-center font-serif text-lg">
                B
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">BulkBuy</span>
              <span className="bg-emerald-900/80 text-lime-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700">
                INDIA
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              India's community-led collective commerce platform. We aggregate residential apartment demand to unlock direct-from-mill volume pricing on daily cooking oils, stone-ground flours, and grains.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
              <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Active in 420+ gated communities in Bengaluru, NCR, Mumbai & Pune.</span>
            </div>
          </div>

          {/* Shop Essentials */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
              Shop Essentials
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('explore', 'Cooking Oils & Ghee')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Cooking Oils & Ghee
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'Flours & Grains')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Whole Wheat Atta & Flours
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'Flours & Grains')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Royal Basmati & Daily Rice
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  All Group Campaigns
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Model */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
              Company & Model
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  How Group Buying Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  FSSAI Mill Standards
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Track Society Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <span>Select Society Hub</span>
                  <span className="text-[10px] text-lime-400 font-mono">({currentHub.city})</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">
              Trust & Compliance
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy (DPDP 2023)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  100% Escrow Refund SLA
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-lime-300 transition-colors cursor-pointer text-left"
                >
                  Grievance Officer Details
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BulkBuy Commerce Private Limited. Bengaluru, India.</p>
          <p className="text-[11px] text-slate-500 text-center sm:text-right">
            Operating under Consumer Protection (E-Commerce) Rules, 2020. Razorpay Escrow Partner.
          </p>
        </div>
      </div>
    </footer>
  );
};
