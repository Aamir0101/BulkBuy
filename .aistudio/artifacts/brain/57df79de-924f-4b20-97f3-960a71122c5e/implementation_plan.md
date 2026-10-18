# BulkBuy — Group Commerce Platform Architecture & Implementation Plan

BulkBuy is a full-stack group-buying commerce platform built for the Indian market, enabling consumers to aggregate demand for volume discounts on daily household staples, groceries, and cooking oils. It combines a customer storefront with campaign milestone tracking, a verified supplier management portal, an admin control center, and an Express REST API backend with transactional stock reservation and ledger persistence.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during Phase 1 clarification:

- **Launch Catalog**: Focused on essential groceries, premium cooking oils (mustard, sunflower, cold-pressed groundnut), and household bulk staples (Aashirvaad/chakki atta, basmati rice, organic pulses).
- **Backend & Persistence Engine**: Dedicated Node.js Express REST API (`/api/v1`) with persistent relational storage, foreign keys, transaction-level quantity aggregation, stock reservations, and automated campaign state transitions.
- **Visual Aesthetic & Theme**: Editorial Indian commerce aesthetic with a deep forest green primary (`#0F382A`), warm ivory/linen canvas (`#FAF8F5`), crisp charcoal typography, and vibrant fresh lime highlights (`#84CC16` / `#65A30D`), using Plus Jakarta Sans and DM Sans with tabular numerals.
- **Architectural Boundary**: Clear separation into `frontend/` (React, Vite, Tailwind CSS, Lucide, Framer Motion) and `backend/` (Express, routes, controllers, middleware, repositories, validators, audit logging) with comprehensive architecture and database documentation in `docs/`.

---

## 1. Overview & Core Concept

BulkBuy eliminates middleman markups by facilitating collective purchasing directly from certified regional mills, farmers' cooperatives, and FMCG distributors:
- **Campaign Quota Model**: Each campaign features a normal retail price (MRP), tiered group prices (e.g. ₹150 at 100 units, ₹135 at 250 units), a minimum commitment target, a closing deadline, and real-time progress indicators.
- **Risk-Free Aggregation**: Customers join campaigns by reserving units with verified payment authorization. When the target quantity is met before deadline, the campaign transitions to `TARGET_REACHED` and is confirmed by administrators for supplier dispatch. If a target is unmet, stock reservations are released and refunds are automatically initiated.
- **Managed Marketplace Trust**: Suppliers must submit GSTIN, FSSAI certificates, and warehouse credentials for admin approval before their products or campaigns can be listed.

---

## 2. User Experience & Visual Design

BulkBuy adheres to the universal frontend design constitution and e-commerce retail guidelines, eliminating AI slop, fake status dots, and pill badge sandwiches in favor of clean editorial presentation.

### A. Color Palette & Typography
- **Canvas (60%)**: `#FAF8F5` (Warm Alabaster / Ivory) with clean surface cards in `#FFFFFF` and subtle `#E7E5E0` hairline borders.
- **Structural Surfaces & Text (30%)**: Deep Forest Green (`#0F382A`), Slate Charcoal (`#1F2937`), and Muted Pewter (`#6B7280`).
- **High-Intent Accents (10%)**: Zesty Lime (`#65A30D` / `#4D7C0F`) and Terracotta Gold (`#D97706`) for progress bars, savings badges, and active checkout actions.
- **Typography**: `Plus Jakarta Sans` for bold editorial headlines (`clamp(2rem, 3.5vw, 3rem)`), `DM Sans` for body copy, and `tabular-nums` monospace for prices, countdown timers, and unit counts.

### B. Core User Flows & Views
1. **Public Storefront (`/`)**:
   - Hero banner highlighting collective savings with real-time participation statistics.
   - Featured active group campaigns with visual progress bars, time left, and committed vs target quantities.
   - Category navigation: Cooking Oils, Grains & Flours, Pulses & Spices, Household Essentials.
   - "How It Works" 5-step transparent guide with clear cancellation and refund guarantees.
2. **Explore & Campaign Discovery (`/explore`)**:
   - Multi-criteria filter drawer: Category, Price range, Discount %, Delivery pincode/city, and Status (Active, Closing Soon, Target Reached).
   - Responsive product cards with high-fidelity imagery, percentage savings counter, and progress tracker.
3. **Product & Campaign Detail Page (`/campaigns/:id`)**:
   - Contiguous Purchase Module: Product gallery on left, sticky purchase card on right with dynamic price tier calculator.
   - Live committed progress, units remaining to unlock the next discount tier, and supplier verification badge.
   - FSSAI license details, shelf life, pack dimensions, return/cancellation policy, and social sharing links.
4. **Checkout & Payment Flow (`/checkout`)**:
   - Quantity selector with real-time tier calculation and instant savings feedback in INR (₹).
   - Indian delivery address collection (Name, Phone, Flat/Street, City, State, PIN code).
   - Simulated Razorpay Payment Gateway modal with instant signature generation, verification, and order confirmation.
5. **Customer Dashboard (`/account`)**:
   - My Group Buys (Active campaigns, completed orders, live delivery tracking).
   - Delivery addresses management and profile settings.
6. **Supplier Portal (`/supplier`)**:
   - Dedicated business portal for onboarding, FSSAI/GST document submission, catalog inventory management, campaign submissions, and aggregated dispatch manifests.
7. **Admin Control Center (`/admin`)**:
   - Platform analytics (Gross Merchandise Value, active campaigns, conversion rates, escrow funds).
   - Supplier verification queue, campaign approval/rejection, manual refund execution, and audit log inspection.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Trade-Offs |
| :--- | :--- | :--- |
| **Backend & Frontend Partition** | Dedicated `frontend/` and `backend/` source directories with shared types and modular architecture | Keeps separation of concerns clean, allows backend to run independently as a headless API service, and adheres strictly to project specs. |
| **Concurrency & Stock Reservation** | Server-authoritative transactional reservations with TTL expiration | Prevents race conditions and overselling when campaigns near target quantity during high traffic. |
| **Payment Integration** | Razorpay SDK abstraction with simulated test mode and signature verification | Real-world Indian standard; supports test orders without risking live credentials, while retaining exact production payload structures. |
| **Role-Based Access Control** | JWT + session authentication with strict server-side RBAC (`CUSTOMER`, `SUPPLIER`, `ADMIN`) | Browser UI state cannot forge administrative actions; all mutation endpoints verify ownership and privileges in middleware. |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BULKBUY CLIENT                                 │
│                                                                             │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │  Customer Storefront  │ │    Supplier Portal    │ │  Admin Dashboard  │  │
│  │  (Browse, Join, Pay)  │ │   (Products, Orders)  │ │ (Approve, Refunds)│  │
│  └───────────┬───────────┘ └───────────┬───────────┘ └─────────┬─────────┘  │
│              └─────────────────────────┼───────────────────────┘            │
│                                        ▼                                    │
│                    REST API Client (Axios / Fetch + Query)                   │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │  HTTP /api/v1 (JSON)
┌────────────────────────────────────────▼────────────────────────────────────┐
│                             EXPRESS BACKEND                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Security & Middlewares: CORS, Helmet, RateLimiter, JWT Auth, Zod Validator│
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ REST Controllers & Services:                                          │  │
│  │ • Auth & Profiles       • Products & Categories • Campaigns Engine    │  │
│  │ • Orders & Reservations • Razorpay Payment Hub  • Supplier & Admin Ops│  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Business Engine:                                                      │  │
│  │ • Concurrency Lock • Tier Price Calculator • Milestone State Machine  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Data Access Layer & Repositories (Persistent Relational Store)        │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE & LEDGER                                 │
│  • users & addresses              • suppliers & verifications               │
│  • products & categories          • campaigns & price_tiers                 │
│  • stock_reservations             • orders, order_items & payments          │
│  • audit_logs & refunds           • notification_events                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Relational Schema Entities
- `users`: ID, email, passwordHash, fullName, phone, role (`CUSTOMER`, `SUPPLIER`, `ADMIN`), createdAt.
- `addresses`: ID, userId, recipientName, phone, streetAddress, landmark, city, state, postalCode, isDefault.
- `suppliers`: ID, userId, businessName, gstin, fssaiLicense, bankAccountNumber, ifscCode, verificationStatus (`PENDING`, `VERIFIED`, `REJECTED`).
- `products`: ID, supplierId, categoryId, title, slug, description, unitMeasurement (e.g. `5 L`, `10 kg`), baseMrp, images, isApproved.
- `campaigns`: ID, productId, supplierId, title, minTargetQuantity, maxTargetQuantity, currentCommittedQuantity, status (`DRAFT`, `ACTIVE`, `TARGET_REACHED`, `CONFIRMED`, `FULFILLING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), startsAt, endsAt, estimatedDeliveryDays.
- `campaign_price_tiers`: ID, campaignId, minQuantityThreshold, unitPriceInr.
- `orders`: ID, orderNumber, userId, campaignId, quantity, unitPricePaid, totalAmount, status (`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `REFUNDED`), shippingAddressId.
- `payments`: ID, orderId, paymentProvider (`RAZORPAY`), providerOrderId, providerPaymentId, providerSignature, amount, currency (`INR`), status (`SUCCESS`, `FAILED`, `REFUNDED`).
- `audit_logs`: ID, actorUserId, action, entityType, entityId, metadataJson, timestamp.

---

## 5. Implementation Stages & Verification Plan

1. **Stage 1 — Directory Skeleton & Docs**:
   - Establish `frontend/`, `backend/`, and `docs/` (`architecture.md`, `database-schema.md`, `api-documentation.md`, `security.md`).
2. **Stage 2 — Backend Engine & Persistence**:
   - Express server with `/api/v1` routes, Zod validation, JWT authentication, persistent database repositories, and realistic Indian seed data.
3. **Stage 3 — Storefront & Discovery**:
   - Navigation header, hero showcase, campaign cards with real-time savings calculations, and category filters.
4. **Stage 4 — Group Buy & Purchase Engine**:
   - Campaign detail page, stock reservation mechanism, tiered discount calculator, and address manager.
5. **Stage 5 — Payments & Checkout**:
   - Simulated Razorpay gateway integration with signature verification, order receipt generation, and timeline tracker.
6. **Stage 6 — Supplier & Admin Portals**:
   - Supplier campaign submission, KYC approval, admin dispute resolution, manual refund trigger, and CSV analytics export.
7. **Stage 7 — Verification & Polish**:
   - Compilation checks, end-to-end user journeys (joining campaign, reaching quota, admin confirmation, tracking order), and responsive layout verification.
