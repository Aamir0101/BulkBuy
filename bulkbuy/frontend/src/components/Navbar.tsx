import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';
import {
  ShoppingBag,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Menu,
  X,
  MapPin,
  ChevronDown,
  Search,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, role, logout, quickSwitchDemoAccount } = useAuth();
  const { currentHub, setIsLocationModalOpen } = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularSearches = [
    { label: 'Kachi Ghani Mustard Oil 5L', id: 'cmp_1' },
    { label: 'MP Sharbati Chakki Atta 10kg', id: 'cmp_3' },
    { label: 'Aged Royal Basmati Rice 10kg', id: 'cmp_4' },
    { label: 'Virgin Groundnut Oil 5L', id: 'cmp_2' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('explore', searchQuery.trim());
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSelectSearchItem = (campaignId: string) => {
    onNavigate('product', campaignId);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-warm-bg/95 backdrop-blur-md border-b border-brand-warm-border transition-all">
      {/* Top Utility Notification & Location Strip */}
      <div className="bg-brand-emerald text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Origin & Trust Pillars */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold text-lime-400 shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping inline-block" />
              Direct From Mill
            </span>
            <span aria-hidden="true" className="text-emerald-500/70 shrink-0">·</span>
            <span className="text-emerald-100 truncate hidden md:inline">
              FSSAI Certified Cooperative Milling & Zero Middleman Markup
            </span>
            <span className="text-emerald-200 truncate md:hidden">
              Zero Middleman Markup
            </span>
          </div>

          {/* Right: Location Hub Selector & Persona Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Society Hub Location Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors cursor-pointer group"
              title="Change Delivery Society Hub"
            >
              <MapPin className="w-3.5 h-3.5 text-lime-300 group-hover:scale-110 transition-transform" />
              <span className="font-medium truncate max-w-35 sm:max-w-50">
                {currentHub.city} ({currentHub.pincode})
              </span>
              <ChevronDown className="w-3 h-3 text-emerald-300" />
            </button>

            <span aria-hidden="true" className="text-emerald-600 hidden sm:inline">|</span>

            {/* Persona Quick Switcher Pill */}
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-300 hidden sm:inline">Role:</span>
              <span className="font-mono text-[10px] sm:text-xs font-bold text-lime-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                {role || 'CUSTOMER'}
              </span>
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="underline hover:text-white text-emerald-300 text-[11px] cursor-pointer"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher Drawer */}
      {showRoleSwitcher && (
        <div className="bg-white border-b border-brand-warm-border py-2.5 px-4 shadow-sm animate-in fade-in">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">Quick Persona Switch for Testing:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  quickSwitchDemoAccount('CUSTOMER');
                  setShowRoleSwitcher(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  role === 'CUSTOMER'
                    ? 'bg-brand-emerald text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Customer (Priya Sharma)
              </button>
              <button
                onClick={() => {
                  quickSwitchDemoAccount('SUPPLIER');
                  setShowRoleSwitcher(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  role === 'SUPPLIER'
                    ? 'bg-brand-emerald text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Supplier (Amara Agro)
              </button>
              <button
                onClick={() => {
                  quickSwitchDemoAccount('ADMIN');
                  setShowRoleSwitcher(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  role === 'ADMIN'
                    ? 'bg-brand-emerald text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Admin (Aakash Verma)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between gap-4 sm:gap-8">
        {/* Brand Monogram & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-emerald flex items-center justify-center text-lime-400 font-bold font-serif text-xl shadow-xs group-hover:scale-105 group-hover:bg-brand-moss transition-all border border-emerald-800">
              B
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-brand-emerald font-sans">
                  BulkBuy
                </span>
                <span className="bg-lime-200/80 text-brand-emerald text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                  India
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block tracking-wide">
                Direct Mill Group Commerce
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div ref={searchRef} className="hidden lg:block flex-1 max-w-md relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mustard oils, sharbati atta, basmati rice..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-brand-warm-border hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Trending Staple Campaigns
              </span>
              <div className="space-y-1">
                {popularSearches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSearchItem(item.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-emerald-50 hover:text-brand-emerald flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-emerald group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-brand-emerald py-1 relative ${
              currentView === 'home'
                ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('explore')}
            className={`transition-colors hover:text-brand-emerald py-1 relative ${
              currentView === 'explore'
                ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                : ''
            }`}
          >
            Explore Deals
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className={`transition-colors hover:text-brand-emerald py-1 relative ${
              currentView === 'how-it-works'
                ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                : ''
            }`}
          >
            How It Works
          </button>

          {role === 'SUPPLIER' && (
            <button
              onClick={() => onNavigate('supplier')}
              className={`transition-colors hover:text-brand-emerald py-1 relative ${
                currentView === 'supplier'
                  ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                  : ''
              }`}
            >
              Supplier Portal
            </button>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`transition-colors hover:text-brand-emerald py-1 relative ${
                currentView === 'admin'
                  ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                  : ''
              }`}
            >
              Admin Console
            </button>
          )}

          <button
            onClick={() => onNavigate('policies')}
            className={`transition-colors hover:text-brand-emerald py-1 relative ${
              currentView === 'policies'
                ? 'text-brand-emerald font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-emerald'
                : ''
            }`}
          >
            Trust & Escrow
          </button>
        </nav>

        {/* Right Section: Primary Actions & User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-brand-emerald hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-brand-emerald font-bold flex items-center justify-center text-xs">
                  {user.fullName.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-25 truncate">{user.fullName.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Account Dropdown */}
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.phone}</p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('account');
                      setShowAccountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-brand-emerald font-medium transition-colors"
                  >
                    My Orders & Group Buys
                  </button>

                  <button
                    onClick={() => {
                      setIsLocationModalOpen(true);
                      setShowAccountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-brand-emerald font-medium transition-colors"
                  >
                    Delivery Society: {currentHub.city}
                  </button>

                  {role === 'SUPPLIER' && (
                    <button
                      onClick={() => {
                        onNavigate('supplier');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-emerald hover:bg-emerald-50"
                    >
                      Supplier Portal
                    </button>
                  )}

                  {role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-emerald hover:bg-emerald-50"
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowAccountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 text-xs font-semibold text-brand-emerald bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => onNavigate('explore')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-emerald hover:bg-brand-moss rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-98"
          >
            <span>Join A Group</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="lg:hidden px-4 pb-3 pt-1 border-t border-brand-warm-border bg-white animate-in fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staples, oils, atta, rice..."
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-warm-bg border-b border-brand-warm-border px-4 pt-3 pb-6 space-y-3 animate-in fade-in">
          {/* Location hub selector button inside mobile menu */}
          <div className="pb-3 border-b border-slate-200">
            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-emerald" />
                <div className="text-left">
                  <span className="font-semibold text-slate-900 block">{currentHub.city} — {currentHub.pincode}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{currentHub.society}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Change
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('explore');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-800"
          >
            Explore Active Deals
          </button>
          <button
            onClick={() => {
              onNavigate('how-it-works');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-800"
          >
            How Group Buying Works
          </button>
          <button
            onClick={() => {
              onNavigate('account');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-800"
          >
            My Orders & Group Buys
          </button>
          {role === 'SUPPLIER' && (
            <button
              onClick={() => {
                onNavigate('supplier');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-bold text-brand-emerald"
            >
              Supplier Portal
            </button>
          )}
          {role === 'ADMIN' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-bold text-brand-emerald"
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={() => {
              onNavigate('policies');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-slate-800"
          >
            Trust & Policies
          </button>
        </div>
      )}
    </header>
  );
};
