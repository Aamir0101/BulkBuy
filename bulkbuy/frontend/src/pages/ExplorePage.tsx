import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Campaign } from '../types/index.js';
import { CampaignCard } from '../components/CampaignCard.js';
import { useLocation } from '../context/LocationContext.js';
import { Search, Filter, RotateCcw, Loader2, MapPin, X, ArrowUpDown, Sparkles } from 'lucide-react';

interface ExplorePageProps {
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ initialCategory, onNavigate }) => {
  const { currentHub, setIsLocationModalOpen } = useLocation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<{ name: string; productCount: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getCategories();
        setCategories(res.categories);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCampaigns({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        status: selectedStatus,
        search: searchQuery || undefined,
        sort: sortBy,
      });
      setCampaigns(res.campaigns);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [selectedCategory, selectedStatus, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCampaigns();
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setSortBy('popular');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' || selectedStatus !== 'ALL' || searchQuery.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Location Hub */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-warm-border">
        <div>
          {/* Location hub breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span className="font-bold uppercase tracking-wider text-emerald-800">
              Collective Catalog
            </span>
            <span>·</span>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="text-slate-700 hover:text-brand-emerald font-semibold flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{currentHub.city} ({currentHub.pincode})</span>
              <span className="text-[10px] text-emerald-800 underline">Change</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Community Buying Pools
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time bulk orders aggregated across verified Indian grocery mills.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-88">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search oils, chakki atta, basmati rice..."
            className="w-full text-xs pl-9 pr-9 py-2.5 bg-white border border-brand-warm-border hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadCampaigns();
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-4">
        {/* Category Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'bg-white border border-brand-warm-border text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Staples
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'bg-white border border-brand-warm-border text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-950/60 text-lime-300'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.productCount}
              </span>
            </button>
          ))}
        </div>

        {/* Status Selector & Sort Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          {/* Status selector tabs */}
          <div className="flex items-center gap-1 bg-white border border-brand-warm-border rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === 'ACTIVE'
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Pools
            </button>
            <button
              onClick={() => setSelectedStatus('TARGET_REACHED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === 'TARGET_REACHED'
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Target Met
            </button>
            <button
              onClick={() => setSelectedStatus('CLOSING_SOON')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatus === 'CLOSING_SOON'
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closing Soon
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-brand-warm-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald text-slate-800 shadow-2xs cursor-pointer"
            >
              <option value="popular">Most Popular Commitments</option>
              <option value="savings_desc">Highest Savings %</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="deadline">Closing Soonest</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <span className="text-slate-500">Active filters:</span>
            {selectedCategory !== 'All' && (
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-red-700">✕</button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')} className="hover:text-red-700">✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-700">✕</button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-red-700 hover:underline font-semibold ml-2 cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-88 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-warm-border p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No campaigns match your filters</h3>
          <p className="text-xs text-slate-500">
            Try resetting your search query or switching categories to see other active bulk buying pools in your region.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-brand-emerald bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {campaigns.map((camp) => (
            <CampaignCard
              key={camp.id}
              campaign={camp}
              onSelect={(id) => onNavigate('product', id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
