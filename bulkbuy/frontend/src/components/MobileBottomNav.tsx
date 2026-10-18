import React from 'react';
import { Home, Compass, Sparkles, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-warm-border px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 items-center justify-around">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            currentView === 'home'
              ? 'text-brand-emerald'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </button>

        {/* Explore */}
        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            currentView === 'explore'
              ? 'text-brand-emerald'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className={`w-5 h-5 ${currentView === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'explore' ? 'font-bold' : 'font-medium'}`}>
            Deals
          </span>
        </button>

        {/* How It Works / Savings */}
        <button
          onClick={() => onNavigate('how-it-works')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            currentView === 'how-it-works'
              ? 'text-brand-emerald'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${currentView === 'how-it-works' ? 'stroke-[2.5] text-brand-amber' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'how-it-works' ? 'font-bold text-brand-amber' : 'font-medium'}`}>
            Savings
          </span>
        </button>

        {/* My Orders */}
        <button
          onClick={() => {
            if (user) {
              onNavigate('account');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative ${
            currentView === 'account'
              ? 'text-brand-emerald'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className={`w-5 h-5 ${currentView === 'account' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'account' ? 'font-bold' : 'font-medium'}`}>
            Orders
          </span>
        </button>

        {/* Account / Role */}
        <button
          onClick={() => {
            if (user) {
              onNavigate('account');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
            currentView === 'account'
              ? 'text-brand-emerald'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentView === 'account' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentView === 'account' ? 'font-bold' : 'font-medium'}`}>
            {user ? user.fullName.split(' ')[0] : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
