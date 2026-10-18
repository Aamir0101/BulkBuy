# BulkBuy — Group Commerce Platform

BulkBuy is a full-stack collective buying marketplace designed for the Indian consumer market. It enables apartment societies, residential colonies, and consumer clusters to aggregate demand for daily groceries, cold-pressed cooking oils, whole wheat attas, and household staples directly from certified mills and agricultural co-operatives, unlocking 20% to 35% savings over retail MRP.

---

## 1. Architecture Overview

BulkBuy strictly partitions frontend and backend responsibilities:

```
bulkbuy/
├── frontend/               # React (Vite, TypeScript, Tailwind CSS, Lucide)
│   ├── src/
│   │   ├── components/    # Reusable design primitives (CampaignCard, TierProgress, PaymentModal)
│   │   ├── context/       # AuthContext with multi-role state & persona switching
│   │   ├── pages/         # Storefront, Explore, ProductDetail, Checkout, Account, Supplier, Admin
│   │   ├── services/      # REST API client with Razorpay payment adapter
│   │   └── types/         # Domain TypeScript models
│   ├── package.json
│   └── vite.config.ts
├── backend/                # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── controllers/   # Auth, Campaign, Order, Supplier, Admin controllers
│   │   ├── middleware/    # JWT Auth, Role-Based Access Control (RBAC), Rate Limiter
│   │   ├── models/        # Relational entity definitions & types
│   │   ├── repositories/  # Concurrency-safe persistent database with transactional locks
│   │   ├── routes/        # Versioned endpoints (/api/v1/*)
│   │   ├── services/      # Tier pricing calculations & Razorpay signature verifications
│   │   ├── validators/    # Zod payload validation schemas
│   │   ├── app.ts         # Express application configuration
│   │   └── server.ts      # Standalone backend server entry point
│   ├── tests/             # Automated test suite (pricing tiers, signature validation)
│   └── package.json
├── docs/                   # Formal architectural and governance specifications
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── security.md
└── server.ts               # Full-stack integrated entry point (port 3000)
```

---

## 2. Prerequisites
- **Node.js**: `v20.x` or later
- **Package Manager**: `npm` v10+

---

## 3. Installation & Getting Started

### Quick Start (Integrated Dev Server)
To run the full stack (Express backend mounted with Vite frontend middleware on port 3000):
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Backend Standalone
```bash
cd bulkbuy/backend
npm install
npm run dev # Starts on port 3000 or custom PORT
```

### Running Frontend Standalone
```bash
cd bulkbuy/frontend
npm install
npm run dev # Starts on port 5173 proxying /api/v1 to localhost:3000
```

---

## 4. Pre-Seeded Personas for Testing

BulkBuy includes a persistent data store seeded with realistic Indian grocery campaigns, verified suppliers, and test accounts:

| Persona | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Customer** | `priya.sharma@example.com` | `customer123` | Browses campaigns, reserves stock, authorizes payments, tracks orders |
| **Supplier** | `supplier@amaraagro.in` | `supplier123` | FSSAI certified agro-mill; proposes campaigns, manages catalog, views dispatch manifests |
| **Administrator** | `admin@bulkbuy.in` | `admin123` | Platform oversight; supplier KYC approval, campaign lifecycle confirmation, refunds, audit logs |

> **Pro-Tip**: Use the **"Switch Role"** quick dropdown in the top navigation bar to seamlessly toggle between personas during testing.

---

## 5. Automated Tests

Execute the backend test suite verifying volume price tier math and HMAC SHA256 payment signature validation:
```bash
npm test
```

---

## 6. Environment Variables

### Backend (`bulkbuy/backend/.env.example`)
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-replace-in-production
DATABASE_URL=file:./data/bulkbuy_db.json
RAZORPAY_KEY_ID=rzp_test_bulkbuy_sandbox
RAZORPAY_KEY_SECRET=rzp_test_mock_secret_key_2026
ADMIN_REGISTRATION_TOKEN=secure-admin-token-2026
```

### Frontend (`bulkbuy/frontend/.env.example`)
```env
VITE_API_BASE_URL=/api/v1
VITE_BRAND_NAME=BulkBuy
VITE_CURRENCY_SYMBOL=₹
VITE_RAZORPAY_KEY_ID=rzp_test_bulkbuy_sandbox
```

---

## 7. Payment Gateway Integration

BulkBuy includes an abstraction for **Razorpay**:
- Server creates payment order with calculated amount and currency.
- Client checkout opens the checkout interface (clearly identified with a sandbox simulation banner in local testing).
- Upon authorization, the server cryptographically validates the payment signature using HMAC SHA256 against `KEY_SECRET` before atomically incrementing campaign commitment quotas and confirming the order.

---

## 8. License & Governance
Draft operational policies and FSSAI standards are documented in `/docs` and on the `/policies` page.
