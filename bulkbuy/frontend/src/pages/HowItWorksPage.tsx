import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Users,
  TrendingDown,
  Truck,
  RotateCcw,
  Building2,
  ChevronDown,
  Sparkles,
  HelpCircle,
  PackageCheck,
  Award,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What happens if our society campaign does not reach the minimum target quota?',
      a: 'Zero risk. If a campaign deadline passes without achieving its minimum target, the campaign is automatically cancelled. 100% of your committed funds are refunded immediately to your original payment method (bank account, UPI, or card) within 24 hours. No cancellation fee or deductions apply.',
    },
    {
      q: 'How does BulkBuy guarantee product purity and authenticity?',
      a: 'Every supplier on BulkBuy is audited in person by our quality operations team. We verify 14-digit FSSAI manufacturing licenses, GSTIN registrations, and factory pressing facilities. Products undergo independent third-party NABL-accredited laboratory testing before batch dispatch.',
    },
    {
      q: 'What is the "Price-Drop Protection" guarantee?',
      a: 'When you commit early, your price is locked at that tier. If more residents join later and unlock a cheaper volume tier before the campaign closes, the price drops for everyone! The difference is automatically credited back to your payment method upon campaign confirmation.',
    },
    {
      q: 'How is delivery handled for gated societies and apartment complexes?',
      a: 'Bulk lots arrive on a consolidated pallet drop directly to your apartment complex security gate or clubhouse reception. You receive an SMS/WhatsApp notification with your pickup code. By delivering 1 pallet instead of 50 individual delivery vans, we reduce traffic congestion and eliminate packaging waste.',
    },
    {
      q: 'Can an individual household order, or do I need my RWA permission?',
      a: 'Any household can join an active pool in their PIN code area! You do not need formal RWA permission to join. However, sharing the campaign link in your society WhatsApp group helps reach the volume quorum faster to unlock the lowest wholesale tier.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>The Demand Aggregation Model</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-emerald tracking-tight leading-[1.15]">
          How BulkBuy Slashes Household Grocery Bills by 20% to 35%
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Traditional retail adds heavy distributor markups, godown holding costs, and credit risk. BulkBuy enables consumers to pool orders directly with certified processing mills.
        </p>
      </div>

      {/* Visual Supply Chain Disruption Comparison */}
      <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-10 shadow-sm space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 text-center">
          Supply Chain: Traditional Retail vs. BulkBuy Society Collective
        </h2>

        <div className="space-y-4">
          {/* Traditional Multi-tier Model */}
          <div className="p-5 rounded-2xl bg-red-50/50 border border-red-200 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-700 block">
              Traditional Multi-Tier Retail (MRP +35%)
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Processing Mill</span>
              <span className="text-red-400">→</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">National Broker</span>
              <span className="text-red-400">→</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">C&F Agent</span>
              <span className="text-red-400">→</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Wholesaler</span>
              <span className="text-red-400">→</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">Local Kirana / App</span>
              <span className="text-red-400">→</span>
              <span className="bg-red-100 text-red-900 px-2.5 py-1 rounded-lg font-bold">End Consumer</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Each intermediary takes a 5%–12% margin and adds warehouse inventory aging.
            </p>
          </div>

          {/* BulkBuy Model */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border-2 border-brand-emerald space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald">
                BulkBuy Society Direct (Wholesale Factory Rate)
              </span>
              <span className="bg-brand-emerald text-lime-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Zero Middlemen
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800 pt-1">
              <span className="bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-brand-emerald">
                Certified Mill & Co-Op
              </span>
              <span className="text-brand-emerald font-extrabold">════►</span>
              <span className="bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-brand-emerald flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Consolidated Pallet Drop</span>
              </span>
              <span className="text-brand-emerald font-extrabold">════►</span>
              <span className="bg-brand-emerald text-white px-3 py-1.5 rounded-xl">
                Society Residents (22%–35% Saved)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The 5-Step Customer Journey */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Step-by-Step Walkthrough
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            How An Order Progresses from Pool to Pallet
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              num: '01',
              title: 'Discover Verified Staple Pools',
              desc: 'Explore weekly campaigns for cold-pressed oils (Kachi Ghani mustard, virgin groundnut), whole wheat flours (Chakki Sharbati), and aged Basmati rice. Each campaign details the required minimum quota, current commitments, and scheduled delivery window.',
            },
            {
              num: '02',
              title: 'Join the Pool & Authorize in Escrow',
              desc: 'Select your desired quantity (1 to 50 units). Payment is authorized securely via Razorpay escrow. You are guaranteed the current price, and will automatically receive price-drop cashback if more neighbors join before close!',
            },
            {
              num: '03',
              title: 'Share with Society WhatsApp Groups',
              desc: 'Spread the campaign link in your apartment society WhatsApp group. Every committed unit brings the pool closer to quorum and unlocks deeper volume discounts for everyone.',
            },
            {
              num: '04',
              title: 'Target Quorum Reached & Fresh Batch Packing',
              desc: 'When the campaign reaches its target quota, our operations team verifies the batch with the supplier mill. Fresh lots are stone-ground or cold-pressed, packaged, palletized, and prepared for dispatch.',
            },
            {
              num: '05',
              title: 'Direct Pallet Delivery to Society Gate',
              desc: 'The consolidated pallet is delivered directly to your society security gate or designated clubhouse collection hub, drastically reducing individual delivery emissions and packaging waste.',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-5 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald text-lime-400 font-mono font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {step.num}
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white rounded-3xl border border-brand-warm-border p-6 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <HelpCircle className="w-8 h-8 text-emerald-800 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">Everything you need to know about collective buying</p>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-brand-emerald' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-brand-warm-bg">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-brand-emerald text-white rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-xl">
        <RotateCcw className="w-10 h-10 text-lime-400 mx-auto" />
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ready to pool orders with your apartment society?
        </h3>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto leading-relaxed">
          Browse active campaigns for cold-pressed cooking oils, stone-ground flours, and aged basmati rice. 100% escrow guaranteed.
        </p>
        <button
          onClick={() => onNavigate('explore')}
          className="inline-flex items-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-brand-emerald bg-lime-400 hover:bg-lime-500 rounded-2xl transition-all cursor-pointer shadow-md active:scale-98"
        >
          <span>Explore Live Group Deals</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
