import React, { useState } from 'react';
import { useLocation, POPULAR_HUBS, SocietyHub } from '../context/LocationContext.js';
import { MapPin, X, Check, Search, Building2, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

export const LocationModal: React.FC = () => {
  const { currentHub, setHub, isLocationModalOpen, setIsLocationModalOpen, searchPincode } = useLocation();
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [verifiedHub, setVerifiedHub] = useState<SocietyHub | null>(null);

  if (!isLocationModalOpen) return null;

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError(null);
    setVerifiedHub(null);

    const result = searchPincode(pincodeInput);
    if (!result) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code (e.g. 560103, 122002, 400076)');
      return;
    }
    setVerifiedHub(result);
  };

  const handleSelectHub = (hub: SocietyHub) => {
    setHub(hub);
    setIsLocationModalOpen(false);
    setPincodeInput('');
    setVerifiedHub(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-brand-warm-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald text-lime-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Delivery Society Hub</h3>
              <p className="text-xs text-slate-500">Bulk shipments dispatch directly to your gated society</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pincode Search Input */}
        <div className="p-6 space-y-5">
          <form onSubmit={handlePincodeSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Enter Your Area PIN Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => {
                    setPincodeInput(e.target.value.replace(/\D/g, ''));
                    setPincodeError(null);
                  }}
                  placeholder="e.g. 560103, 122002, 400076"
                  className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-emerald hover:bg-brand-moss text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                Check Hub
              </button>
            </div>

            {pincodeError && (
              <p className="text-[11px] text-red-600">{pincodeError}</p>
            )}

            {verifiedHub && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between text-xs mt-2 animate-in fade-in">
                <div>
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Hub Available: {verifiedHub.city} ({verifiedHub.pincode})</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">{verifiedHub.society}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectHub(verifiedHub)}
                  className="px-3 py-1 bg-emerald-700 text-white rounded text-[11px] font-semibold hover:bg-emerald-800 transition-colors"
                >
                  Deliver Here
                </button>
              </div>
            )}
          </form>

          {/* Popular Metro Society Clusters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Metro Society Clusters
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">Free Society Drop</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {POPULAR_HUBS.map((hub) => {
                const isSelected = currentHub.pincode === hub.pincode;
                return (
                  <button
                    key={hub.pincode}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-brand-emerald bg-emerald-50/40 ring-1 ring-brand-emerald'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-brand-emerald" />
                        <span className="text-xs font-bold text-slate-900">
                          {hub.city} — {hub.pincode}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{hub.society}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{hub.societyCount}+ Societies Pooling</span>
                        <span>·</span>
                        <span>{hub.deliveryDays}</span>
                      </div>
                    </div>

                    <div className="shrink-0 self-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'border-brand-emerald bg-brand-emerald text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 px-6 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Palletized drop at society security gate or clubhouse</span>
          </span>
          <span className="font-semibold text-slate-700">Zero Delivery Fee</span>
        </div>
      </div>
    </div>
  );
};
