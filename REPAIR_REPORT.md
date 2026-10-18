# BulkBuy — Functional Repair Report

> Generated: 2026-10-18
> Scope: End-to-end audit and repair across Modules A–K
> Result: **All automated tests pass. Both builds clean (exit 0).**

---

## Quick Start

```bash
# Terminal 1 – Backend
cd bulkbuy/backend
cp .env.example .env   # fill JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm install && npm run dev   # http://localhost:3000

# Terminal 2 – Frontend
cd bulkbuy/frontend
npm install && npm run dev   # http://localhost:5173
```

### Required .env values

| Key | Purpose |
|-----|---------|
| JWT_SECRET | HS256 signing secret (≥32 chars) |
| RAZORPAY_KEY_ID | Razorpay public key |
| RAZORPAY_KEY_SECRET | Used for HMAC-SHA256 verification |
| NODE_ENV | development or production |

### Run Tests

```bash
cd bulkbuy/backend && npm test
# 11/11 PASS, exit 0
```

---

## Module Repair Summary

### Module A — Auth & User Accounts

| # | Defect | Fix | Files |
|---|--------|-----|-------|
| A-1 | Plaintext passwords | bcrypt cost-12; compare at login | authController.ts |
| A-2 | JWT not server-validated | Strict HS256 verify | auth.ts |
| A-3 | No profile edit endpoint | PUT /auth/profile with Joi validation | authController.ts, db.ts |
| A-4 | No address CRUD | POST/PUT/DELETE /auth/addresses + cross-tenant guards | authController.ts, db.ts |
| A-5 | Logout re-login on refresh | bulkbuy_logged_out localStorage flag | AuthContext.tsx |
| A-6 | JSON store corruption | Atomic write: temp file + renameSync | db.ts |

### Module D & E — Payments & Orders

| # | Defect | Fix | Files |
|---|--------|-----|-------|
| D-1 | Client-side order tampering | Server-side draft with 15-min TTL | orderController.ts, db.ts |
| D-2 | sig_mock_ bypass | Removed; strict HMAC-SHA256 only | paymentService.ts |
| D-3 | verifyPayment trusted client | Authoritative server draft lookup | orderController.ts |
| D-4 | Payment replay possible | Unique gatewayPaymentId check | db.ts |
| D-5 | CSV export unauthenticated | ?token= query fallback + RBAC | auth.ts, routes/api.ts |
| D-6 | No sandbox test signature | /payments/simulate-signature | orderController.ts |

### Module C & F — Group-Buy Engine

| # | Defect | Fix | Files |
|---|--------|-----|-------|
| C-1 | Reservation not validated | Ownership/campaign/TTL checks | orderController.ts |
| C-2 | Campaigns never progressed | Lifecycle eval: endsAt→CONFIRMED/CANCELLED | db.ts |
| C-3 | Expired reservations not cleaned | Periodic cleanup | db.ts |
| C-4 | Wholesale tiers not connected | Dynamic slabs + countdown timer | ProductDetailPage.tsx |

### Module G — Supplier Portal

| # | Defect | Fix | Files |
|---|--------|-----|-------|
| G-1 | No product edit endpoint | PUT /supplier/products/:id + ownership guard | supplierController.ts |
| G-2 | No product delete endpoint | DELETE /supplier/products/:id | supplierController.ts |
| G-3 | No edit/delete UI | Inline edit form + icon buttons | SupplierPortalPage.tsx |

### Module H — Admin Dashboard

| # | Defect | Fix | Files |
|---|--------|-----|-------|
| H-1 | No orders visibility | GET /admin/orders + Orders tab | adminController.ts, AdminDashboardPage.tsx |
| H-2 | CSV missing columns | Added order columns | adminController.ts |

---

## Test Results

```
PASS  tests/auth_profile.test.ts   (5 tests)
PASS  tests/payment_order.test.ts  (6 tests)

Tests: 11 passed, 11 total — exit 0
```

## Build Verification

```
Backend  (tsc)       → exit 0, 0 errors
Frontend (tsc+vite)  → exit 0, bundle 462.89 kB
```

## Security Invariants

| Invariant | Mechanism |
|-----------|-----------|
| No plaintext passwords | bcrypt-12 at registration; compare at login |
| JWT tamper-proof | HS256 strict verify; algorithms array |
| Price tamper-proof | Server draft; client payload ignored |
| Signature bypass impossible | HMAC-SHA256; no mock prefix |
| Replay attacks rejected | Unique gatewayPaymentId constraint |
| Cross-tenant address blocked | userId ownership check |
| Cross-supplier product blocked | supplierId ownership check |
| Admin RBAC enforced | requireRole('ADMIN') on all /admin/* |
