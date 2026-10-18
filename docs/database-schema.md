# BulkBuy Database Schema Documentation

## 1. Schema Principles
- **Relational Integrity**: Foreign key constraints protect parent-child integrity across campaigns, orders, and participants.
- **Monetary Precision**: All monetary quantities are recorded as integer minor units (paise) or exact decimal representations with precision (e.g. `15000` = ₹150.00) to eliminate floating-point calculation errors.
- **Audit Traceability**: Immutable `audit_logs` record all privileged operations including supplier approvals, campaign status updates, manual refunds, and order cancellations.

## 2. Table Specifications

### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted bcrypt or Argon2 hash |
| `full_name` | VARCHAR(128) | NOT NULL | Customer or representative name |
| `phone` | VARCHAR(20) | NOT NULL | 10-digit Indian mobile number (+91) |
| `role` | VARCHAR(20) | NOT NULL | `CUSTOMER`, `SUPPLIER`, `ADMIN` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation UTC timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### `suppliers`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `user_id` | VARCHAR(36) | FOREIGN KEY (users.id) | Linked user account |
| `business_name`| VARCHAR(255) | NOT NULL | Registered entity name |
| `gstin` | VARCHAR(15) | UNIQUE, NOT NULL | 15-character Indian GST identification |
| `fssai_license`| VARCHAR(14) | NOT NULL | 14-digit FSSAI food safety license |
| `bank_account` | VARCHAR(64) | NOT NULL | Account number for settlement payouts |
| `ifsc_code` | VARCHAR(11) | NOT NULL | Bank branch IFSC code |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| `verified_at` | TIMESTAMP | NULL | Timestamp of admin verification |

### `products`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `supplier_id` | VARCHAR(36) | FOREIGN KEY (suppliers.id) | Owning supplier |
| `category` | VARCHAR(64) | NOT NULL | E.g. `Oils & Ghee`, `Flours & Grains`, `Pulses` |
| `title` | VARCHAR(255) | NOT NULL | Product title |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | SEO URL slug |
| `description` | TEXT | NOT NULL | Product specifications and provenance |
| `unit_size` | VARCHAR(64) | NOT NULL | E.g. `5 Litres`, `10 Kilograms` |
| `mrp_inr` | INT | NOT NULL | Standard retail MRP in paise (or integer ₹) |
| `image_url` | VARCHAR(512) | NOT NULL | Asset URL |
| `is_approved` | BOOLEAN | DEFAULT FALSE | Verified by admin before campaign use |

### `campaigns`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `product_id` | VARCHAR(36) | FOREIGN KEY (products.id) | Linked product |
| `supplier_id` | VARCHAR(36) | FOREIGN KEY (suppliers.id) | Linked supplier |
| `title` | VARCHAR(255) | NOT NULL | Marketing campaign title |
| `min_target_qty`| INT | NOT NULL | Threshold needed to confirm campaign |
| `max_target_qty`| INT | NOT NULL | Stock ceiling cap |
| `committed_qty` | INT | DEFAULT 0 | Real-time aggregate committed units |
| `status` | VARCHAR(32) | NOT NULL | `DRAFT`, `ACTIVE`, `TARGET_REACHED`, `CONFIRMED`, `FULFILLING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `starts_at` | TIMESTAMP | NOT NULL | Opening timestamp |
| `ends_at` | TIMESTAMP | NOT NULL | Closing deadline |
| `delivery_window`| VARCHAR(64) | NOT NULL | E.g. "3-5 business days after campaign ends" |

### `campaign_price_tiers`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `campaign_id` | VARCHAR(36) | FOREIGN KEY (campaigns.id) | Parent campaign |
| `min_quantity`| INT | NOT NULL | Quota threshold (e.g. 50, 100, 250) |
| `price_inr` | INT | NOT NULL | Price per unit at or above this threshold |

### `orders` & `order_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `order_number`| VARCHAR(32) | UNIQUE, NOT NULL | E.g. `BB-2026-98124` |
| `user_id` | VARCHAR(36) | FOREIGN KEY (users.id) | Purchasing customer |
| `campaign_id` | VARCHAR(36) | FOREIGN KEY (campaigns.id) | Target campaign |
| `quantity` | INT | NOT NULL | Units purchased |
| `unit_price` | INT | NOT NULL | Price per unit in ₹ |
| `total_amount`| INT | NOT NULL | Total paid amount in ₹ |
| `status` | VARCHAR(32) | NOT NULL | `PENDING`, `CONFIRMED`, `CANCELLED`, `REFUNDED` |
| `shipping_address`| JSON | NOT NULL | Snapshot of recipient address |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Order placement timestamp |

### `payments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUIDv4 |
| `order_id` | VARCHAR(36) | FOREIGN KEY (orders.id) | Linked order |
| `gateway` | VARCHAR(32) | NOT NULL | `RAZORPAY` |
| `gateway_order_id`| VARCHAR(128)| NOT NULL | Razorpay `order_xxx` |
| `gateway_payment_id`| VARCHAR(128)| NULL | Razorpay `pay_xxx` |
| `gateway_signature` | VARCHAR(255)| NULL | HMAC SHA256 signature |
| `amount_inr` | INT | NOT NULL | Amount in INR |
| `status` | VARCHAR(32) | NOT NULL | `SUCCESS`, `PENDING`, `FAILED`, `REFUNDED` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Transaction timestamp |
