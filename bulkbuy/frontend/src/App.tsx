import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { LocationProvider } from './context/LocationContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { LocationModal } from './components/LocationModal.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { HomePage } from './pages/HomePage.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { AccountPage } from './pages/AccountPage.js';
import { SupplierPortalPage } from './pages/SupplierPortalPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { HowItWorksPage } from './pages/HowItWorksPage.js';
import { PoliciesPage } from './pages/PoliciesPage.js';
import { Campaign } from './types/index.js';

export function BulkBuyApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('cmp_1');
  const [exploreCategory, setExploreCategory] = useState<string | undefined>(undefined);
  const [checkoutCampaign, setCheckoutCampaign] = useState<Campaign | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<any | null>(null);

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'product' && param) {
      setSelectedCampaignId(param);
    }
    if (view === 'explore') {
      setExploreCategory(param);
    }
    setCurrentView(view);
  };

  const handleProceedToCheckout = (campaign: Campaign, quantity: number) => {
    setCheckoutCampaign(campaign);
    setCheckoutQuantity(quantity);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCompleted = (confirmedOrder: any) => {
    setLastConfirmedOrder(confirmedOrder);
    setCurrentView('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-warm-bg text-slate-900 font-sans pb-16 md:pb-0">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentView === 'explore' && (
          <ExplorePage
            key={exploreCategory || 'all'}
            initialCategory={exploreCategory}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'product' && (
          <ProductDetailPage
            campaignId={selectedCampaignId}
            onNavigate={handleNavigate}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}
        {currentView === 'checkout' && checkoutCampaign && (
          <CheckoutPage
            campaign={checkoutCampaign}
            quantity={checkoutQuantity}
            onNavigate={handleNavigate}
            onOrderCompleted={handleOrderCompleted}
          />
        )}
        {currentView === 'account' && <AccountPage onNavigate={handleNavigate} />}
        {currentView === 'supplier' && <SupplierPortalPage />}
        {currentView === 'admin' && <AdminDashboardPage />}
        {currentView === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {currentView === 'policies' && <PoliciesPage />}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <LocationModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BulkBuyApp />
      </LocationProvider>
    </AuthProvider>
  );
}
