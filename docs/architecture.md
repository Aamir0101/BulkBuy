# BulkBuy Architecture Overview

## 1. System Vision
BulkBuy is a collective commerce marketplace designed for Indian households and local community clusters (apartment societies, neighborhoods, tier-2/tier-3 consumer groups) to aggregate demand for staples like cooking oil, wheat flour (atta), pulses (dal), rice, and household goods directly from verified FMCG distributors and regional agro-processors.

## 2. Directory Layout & Separation
```
bulkbuy/
├── frontend/                     # React + Vite + TypeScript Storefront & Dashboards
│   ├── src/
│   │   ├── assets/              # Images, branded iconography
│   │   ├── components/          # Reusable UI primitives (zero-pill metadata, buttons, modals)
│   │   ├── context/             # AuthContext, CartContext, NotificationContext
│   │   ├── hooks/               # useCampaigns, useOrders, useSupplier, useAdmin
│   │   ├── layouts/             # StorefrontLayout, SupplierLayout, AdminLayout
│   │   ├── pages/               # Home, Explore, ProductDetail, Checkout, Account, Supplier, Admin, HowItWorks, Policies
│   │   ├── services/            # API client with axios/fetch, Razorpay payment adapter
│   │   ├── types/               # TypeScript domain contracts
│   │   └── utils/               # Currency formatting (INR), date calculations, tier pricing helpers
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # Node.js + Express + TypeScript REST API Server
│   ├── src/
│   │   ├── config/              # Environment variables, database connection pool, constants
│   │   ├── controllers/         # Auth, Product, Campaign, Order, Payment, Supplier, Admin controllers
│   │   ├── middleware/          # JWT verify, RBAC guard, rate-limiting, error handler, audit logger
│   │   ├── models/              # Schema types and table definitions
│   │   ├── repositories/        # Concurrency-safe data store with transaction rollback support
│   │   ├── routes/              # Versioned API routes (/api/v1/*)
│   │   ├── services/            # Campaign engine, stock reservation manager, tier calculator, payment gateway
│   │   ├── validators/          # Zod request validators
│   │   ├── app.ts               # Express application initialization & middleware pipeline
│   │   └── server.ts            # Standalone backend server entry point
│   ├── tests/                   # Automated API integration and business rule tests
│   ├── package.json
│   └── tsconfig.json
├── docs/                        # Formal architecture, schema, security and API documentation
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── security.md
```

## 3. High-Level Component Interactions

```
  +-------------------------------------------------------------------------+
  |                          CLIENT TIER (React SPA)                        |
  |  [Public Storefront]      [Customer Account]     [Supplier / Admin]    |
  +------------------------------------+------------------------------------+
                                       |
                                HTTP /api/v1
                                       v
  +-------------------------------------------------------------------------+
  |                          EXPRESS BACKEND TIER                           |
  |                                                                         |
  |  +--------------------+   +-------------------+   +------------------+  |
  |  | Security & Guard   |   | REST Controllers  |   | Concurrency &    |  |
  |  | - JWT auth tokens  |-->| - /campaigns      |-->| Stock Engine     |  |
  |  | - RBAC roles       |   | - /orders         |   | - Atomic lock    |  |
  |  | - Zod validation   |   | - /payments       |   | - Tier recalcul  |  |
  |  +--------------------+   +-------------------+   +------------------+  |
  +------------------------------------+------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  |                      PERSISTENT RELATIONAL DATA LAYER                   |
  |  Users | Suppliers | Products | Campaigns | Orders | Ledger | Audits    |
  +-------------------------------------------------------------------------+
```

## 4. Campaign State Machine

```
   [DRAFT] ──(Admin Approve)──> [SCHEDULED] ──(Start Time)──> [ACTIVE]
                                                                  │
              ┌───────────────────────────────────────────────────┼─────────────────────────────────┐
              │                                                   │                                 │
              v                                                   v                                 v
     [TARGET_REACHED]                                         [EXPIRED]                        [CANCELLED]
              │                                                   │                                 │
        (Admin Confirm)                                     (Auto Refund)                     (Auto Refund)
              │                                                   v                                 v
              v                                            [REFUND_PENDING]                  [REFUND_PENDING]
        [CONFIRMED]                                               │                                 │
              │                                                   v                                 v
              v                                               [REFUNDED]                        [REFUNDED]
        [FULFILLING] ──> [SHIPPED] ──> [DELIVERED]
```

## 5. Stock Reservation & Race Condition Mitigation
When a user begins checkout:
1. An atomic check verifies `currentCommittedQuantity + requestedQty <= maxTargetQuantity`.
2. A temporary stock reservation record is issued with a 15-minute Time-To-Live (TTL).
3. Once the payment signature is verified, the reservation is permanently committed into `order_items` and the campaign committed quantity is incremented.
4. If payment fails or expires, background cleanup releases the held units back to the campaign pool.
