# BulkBuy REST API Documentation

Base URL: `/api/v1`

## 1. Authentication & Profile
- `POST /api/v1/auth/register`: Create customer, supplier, or admin account.
- `POST /api/v1/auth/login`: Authenticate with email/password; returns JWT and user profile.
- `GET /api/v1/auth/me`: Fetch current authenticated session and profile details.
- `POST /api/v1/auth/logout`: Invalidate session.

## 2. Public Storefront & Campaigns
- `GET /api/v1/campaigns`: List campaigns with query parameters:
  - `status`: Filter by `ACTIVE`, `TARGET_REACHED`, `CLOSING_SOON`, etc.
  - `category`: Filter by product category.
  - `search`: Full text search on product name, description, brand.
  - `sort`: `popular`, `deadline`, `price_asc`, `savings_desc`.
  - `page`, `limit`: Pagination controls.
- `GET /api/v1/campaigns/:id`: Get detailed campaign data, including current committed units, remaining units to reach next tier, tier pricing table, product FSSAI details, and supplier verification credentials.
- `GET /api/v1/categories`: List active product categories with campaign counts.
- `GET /api/v1/metrics/platform`: Aggregated live statistics (Total ₹ saved by collective buyers, committed units, confirmed campaigns).

## 3. Checkout, Orders & Group Buying
- `POST /api/v1/campaigns/:id/reserve`: Concurrency-safe stock reservation before payment.
- `POST /api/v1/orders/create`: Initiate order with calculated unit price, address snapshot, and gateway order preparation.
- `POST /api/v1/payments/verify`: Verify Razorpay payment signature, finalize committed quantity on campaign, and confirm order.
- `GET /api/v1/orders/my`: List logged-in user's orders and group-buy participation.
- `GET /api/v1/orders/:id`: Detailed order status, tracking, and downloadable invoice summary.
- `POST /api/v1/orders/:id/cancel`: Customer cancellation request (strictly within allowed cancellation window).

## 4. Supplier Operations (Requires Role: `SUPPLIER`)
- `GET /api/v1/supplier/profile`: View supplier KYC status and credentials.
- `PUT /api/v1/supplier/profile`: Update business contact, FSSAI, or GSTIN.
- `POST /api/v1/supplier/products`: Add a product to the supplier's catalog.
- `GET /api/v1/supplier/campaigns`: View all campaigns initiated by this supplier.
- `POST /api/v1/supplier/campaigns`: Propose a new group-buy campaign with price tiers.
- `GET /api/v1/supplier/orders/aggregated`: View consolidated dispatch manifest quantities for confirmed campaigns.

## 5. Admin Control Center (Requires Role: `ADMIN`)
- `GET /api/v1/admin/analytics`: Platform GMV, escrow totals, conversion rates, and campaign metrics.
- `GET /api/v1/admin/suppliers`: Verification queue of pending supplier applications.
- `POST /api/v1/admin/suppliers/:id/verify`: Approve or reject supplier verification.
- `POST /api/v1/admin/campaigns/:id/status`: Transition campaign states (`ACTIVE`, `CONFIRMED`, `FULFILLING`, `CANCELLED`).
- `POST /api/v1/admin/refunds/trigger`: Execute authorized batch refunds for cancelled/unreached campaigns.
- `GET /api/v1/admin/audit-logs`: View cryptographic or chronological action audit logs.
