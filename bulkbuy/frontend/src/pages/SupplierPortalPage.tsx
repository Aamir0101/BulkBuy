import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Supplier, Product, Campaign } from '../types/index.js';
import { Store, ShieldCheck, Plus, PackageCheck, AlertCircle, FileText, CheckCircle2, Loader2, Truck, Edit3, Trash2, X } from 'lucide-react';
import { getProductImageUrl, FALLBACK_PRODUCT_IMAGE } from '../utils/imageHelper.js';

export const SupplierPortalPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'propose' | 'dispatches'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Propose campaign state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [minTargetQty, setMinTargetQty] = useState<number>(100);
  const [maxTargetQty, setMaxTargetQty] = useState<number>(300);
  const [endsInDays, setEndsInDays] = useState<number>(14);
  const [deliveryWindow, setDeliveryWindow] = useState<string>('3-5 business days post campaign close');
  const [region, setRegion] = useState<string>('Bengaluru & NCR Metro Hubs');
  const [tier1Price, setTier1Price] = useState<number>(850);
  const [tier2Price, setTier2Price] = useState<number>(780);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add product state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cooking Oils & Ghee');
  const [newDescription, setNewDescription] = useState('');
  const [newUnitSize, setNewUnitSize] = useState('5 Litres');
  const [newMrp, setNewMrp] = useState(999);
  const [newImageUrl, setNewImageUrl] = useState('/src/assets/images/mustard_oil_5l_1792332417134.jpg');

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Cooking Oils & Ghee');
  const [editDescription, setEditDescription] = useState('');
  const [editUnitSize, setEditUnitSize] = useState('');
  const [editMrp, setEditMrp] = useState(999);
  const [editImageUrl, setEditImageUrl] = useState('');

  const loadSupplierData = async () => {
    setIsLoading(true);
    try {
      const [supRes, prodRes, campRes, dispRes] = await Promise.all([
        api.getSupplierProfile(),
        api.getSupplierProducts(),
        api.getSupplierCampaigns(),
        api.getSupplierDispatches(),
      ]);
      setSupplier(supRes.supplier);
      setProducts(prodRes.products);
      setCampaigns(campRes.campaigns);
      setDispatches(dispRes.manifests);
      if (prodRes.products.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err) {
      console.error('Failed to load supplier portal data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  const handleProposeCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endsAt = new Date(Date.now() + endsInDays * 24 * 60 * 60 * 1000).toISOString();
      await api.proposeSupplierCampaign({
        productId: selectedProductId,
        title: campaignTitle,
        minTargetQty: Number(minTargetQty),
        maxTargetQty: Number(maxTargetQty),
        endsAt,
        deliveryWindow,
        region,
        tiers: [
          { minQuantity: 1, priceInr: Number(tier1Price) },
          { minQuantity: Number(minTargetQty), priceInr: Number(tier2Price) },
        ],
      });
      setNotification('Campaign proposal submitted to Admin Moderation queue!');
      setActiveTab('overview');
      await loadSupplierData();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to propose campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addSupplierProduct({
        title: newTitle,
        category: newCategory,
        description: newDescription,
        unitSize: newUnitSize,
        mrpInr: Number(newMrp),
        imageUrl: newImageUrl,
      });
      setNotification('Product added to supplier catalog successfully.');
      setIsAddingProduct(false);
      await loadSupplierData();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditCategory(p.category);
    setEditDescription(p.description);
    setEditUnitSize(p.unitSize);
    setEditMrp(p.mrpInr);
    setEditImageUrl(p.imageUrl);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await api.updateProduct(editingProduct.id, {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        unitSize: editUnitSize,
        mrpInr: Number(editMrp),
        imageUrl: editImageUrl,
      });
      setNotification('Product updated successfully.');
      setEditingProduct(null);
      await loadSupplierData();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.deleteProduct(productId);
      setNotification('Product deleted from catalog.');
      await loadSupplierData();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete product');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Supplier & Agro-Mill Portal
            </span>
            {supplier?.status === 'VERIFIED' && (
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED FSSAI SUPPLIER
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {supplier?.businessName || user?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            GSTIN: <span className="font-mono text-slate-700">{supplier?.gstin || '29AABCA1234F1Z8'}</span> · FSSAI: <span className="font-mono text-slate-700">{supplier?.fssaiLicense || '11223334000125'}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'products' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('propose')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'propose' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Propose Campaign
          </button>
          <button
            onClick={() => setActiveTab('dispatches')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'dispatches' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatch Manifests ({dispatches.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Live & Proposed Campaigns</span>
              <div className="text-2xl font-bold font-mono text-slate-900">{campaigns.length}</div>
              <span className="text-[11px] text-emerald-700 block">Managed across societies</span>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Total Committed Pallet Units</span>
              <div className="text-2xl font-bold font-mono text-brand-emerald">
                {campaigns.reduce((sum, c) => sum + c.committedQty, 0)}
              </div>
              <span className="text-[11px] text-slate-500 block">Factory packaged units</span>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E0] p-5 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">FSSAI Status</span>
              <div className="text-base font-bold text-emerald-800 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Active & Compliant</span>
              </div>
              <span className="text-[11px] text-slate-500 block">Audit valid through 2027</span>
            </div>
          </div>

          {/* Active Campaigns Table */}
          <div className="bg-white rounded-xl border border-[#E7E5E0] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Your Collective Campaigns</h3>
              <button
                onClick={() => setActiveTab('propose')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch New Campaign</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{camp.title}</h4>
                    <p className="text-slate-500 text-[11px]">
                      Region: {camp.region} · Delivery: {camp.deliveryWindow}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block">Committed Units</span>
                      <span className="font-mono font-bold text-slate-900">
                        {camp.committedQty} / {camp.minTargetQty}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                        camp.status === 'TARGET_REACHED' || camp.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : camp.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Management Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Supplier Verified Products</h3>
            <button
              onClick={() => setIsAddingProduct(!isAddingProduct)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-emerald rounded-lg hover:bg-brand-moss transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product to Catalog</span>
            </button>
          </div>

          {isAddingProduct && (
            <form onSubmit={handleAddProduct} className="bg-white rounded-xl border border-[#E7E5E0] p-6 space-y-4 text-xs">
              <h4 className="font-semibold text-slate-900 text-sm">New Product Specifications</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Organic Cold-Pressed Mustard Oil 5L"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                  >
                    <option value="Cooking Oils & Ghee">Cooking Oils & Ghee</option>
                    <option value="Flours & Grains">Flours & Grains</option>
                    <option value="Pulses & Spices">Pulses & Spices</option>
                    <option value="Household Essentials">Household Essentials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    required
                    value={newUnitSize}
                    onChange={(e) => setNewUnitSize(e.target.value)}
                    placeholder="e.g. 5 Litres Tin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Standard Retail MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={newMrp}
                    onChange={(e) => setNewMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Product Image URL</label>
                  <input
                    type="text"
                    required
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Description & Processing Method</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail ingredients, single-origin provenance, cold-press technique, certification details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-brand-emerald hover:bg-brand-moss rounded-lg font-semibold"
                >
                  Save Product to Catalog
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <React.Fragment key={p.id}>
                {editingProduct?.id === p.id ? (
                  <form onSubmit={handleSaveEdit} className="bg-slate-50 rounded-xl border border-brand-emerald p-4 space-y-3 text-xs col-span-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Editing: {editingProduct.title}</span>
                      <button type="button" onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block font-medium text-slate-700 mb-1">Title</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600" /></div>
                      <div><label className="block font-medium text-slate-700 mb-1">Category</label>
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600">
                          <option value="Cooking Oils &amp; Ghee">Cooking Oils &amp; Ghee</option>
                          <option value="Flours &amp; Grains">Flours &amp; Grains</option>
                          <option value="Pulses &amp; Spices">Pulses &amp; Spices</option>
                          <option value="Household Essentials">Household Essentials</option>
                        </select>
                      </div>
                      <div><label className="block font-medium text-slate-700 mb-1">Pack Size</label><input type="text" value={editUnitSize} onChange={(e) => setEditUnitSize(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600" /></div>
                      <div><label className="block font-medium text-slate-700 mb-1">MRP (₹)</label><input type="number" value={editMrp} onChange={(e) => setEditMrp(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600" /></div>
                      <div className="col-span-2"><label className="block font-medium text-slate-700 mb-1">Description</label><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 resize-none" /></div>
                      <div className="col-span-2"><label className="block font-medium text-slate-700 mb-1">Image URL</label><input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600" /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setEditingProduct(null)} className="px-3 py-1.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg text-xs font-bold">Save Changes</button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E7E5E0] p-4 flex gap-4 text-xs">
                    <img
                      src={getProductImageUrl(p.imageUrl)}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-emerald-800 font-medium uppercase tracking-wider">{p.category}</span>
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{p.title}</h4>
                      <p className="text-slate-500">{p.unitSize} · MRP: ₹{p.mrpInr}</p>
                      <p className="text-slate-600 line-clamp-2 text-[11px]">{p.description}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleStartEdit(p)} title="Edit product" className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(p.id)} title="Delete product" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Propose Campaign Tab */}
      {activeTab === 'propose' && (
        <div className="bg-white rounded-xl border border-[#E7E5E0] p-6 space-y-5 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Propose New Collective Buying Campaign</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin review is mandatory before campaigns go live on the customer storefront.
            </p>
          </div>

          <form onSubmit={handleProposeCampaign} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Select Product from Catalog</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.unitSize}) — MRP ₹{p.mrpInr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Campaign Marketing Title</label>
              <input
                type="text"
                required
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Pure Mustard Oil 5L Society Collective Buy - Batch 4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Minimum Target Quota (Units)</label>
                <input
                  type="number"
                  required
                  value={minTargetQty}
                  onChange={(e) => setMinTargetQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Maximum Stock Cap (Units)</label>
                <input
                  type="number"
                  required
                  value={maxTargetQty}
                  onChange={(e) => setMaxTargetQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                />
              </div>
            </div>

            {/* Volume Tier Pricing */}
            <div className="bg-brand-warm-bg border border-[#E7E5E0] rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-slate-900">Volume Discount Tiers (INR)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Base Price (1+ units)</label>
                  <input
                    type="number"
                    required
                    value={tier1Price}
                    onChange={(e) => setTier1Price(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Target Volume Price ({minTargetQty}+ units)</label>
                  <input
                    type="number"
                    required
                    value={tier2Price}
                    onChange={(e) => setTier2Price(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-brand-emerald font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  required
                  value={endsInDays}
                  onChange={(e) => setEndsInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Delivery Region</label>
                <input
                  type="text"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-emerald"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-semibold text-white bg-brand-emerald hover:bg-brand-moss rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Submitting Proposal...' : 'Submit Campaign for Admin Verification'}
            </button>
          </form>
        </div>
      )}

      {/* Dispatches Tab */}
      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          <div className="bg-brand-warm-bg border border-[#E7E5E0] p-4 rounded-xl text-xs text-slate-700">
            <h4 className="font-semibold text-slate-900 mb-1">Consolidated Pallet Manifests</h4>
            <p className="text-slate-600 text-[11px]">
              These campaigns have either reached or confirmed their required minimum commitment. Pack according to aggregated unit totals for bulk delivery to society hubs.
            </p>
          </div>

          <div className="space-y-3">
            {dispatches.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-[#E7E5E0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {item.status}
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm mt-1">{item.campaignTitle}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Hub: {item.region} · Delivery Timeline: {item.deliveryWindow}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Total Units to Dispatch</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {item.totalUnitsToDispatch} units
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Escrow Settlement Total</span>
                    <span className="text-base font-bold font-mono text-emerald-800">
                      ₹{item.totalSettlementInr}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
