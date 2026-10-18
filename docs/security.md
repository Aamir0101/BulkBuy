# BulkBuy Security Architecture & Threat Model

## 1. Core Security Invariants
1. **Zero Client Trust**: The browser client is never trusted for pricing, order totals, discount tiers, user roles, stock availability, or payment verification.
2. **Server-Authoritative Price Calculation**: All unit pricing and total amounts are computed deterministically in the backend service using registered `campaign_price_tiers` and the current committed quantity.
3. **Idempotent Payment Webhooks & Verification**: Razorpay payment signatures are validated on the server using HMAC SHA256 against the raw order payload and gateway secret. Duplicate webhooks cannot double-count commitments.
4. **Role-Based Access Control (RBAC)**: All routes under `/api/v1/supplier/*` and `/api/v1/admin/*` require verified JWT tokens issued to actors whose role matches `SUPPLIER` or `ADMIN`.

## 2. Protection Mechanisms
- **Input Validation**: All payloads pass through strict Zod schemas with whitelist properties, preventing parameter pollution and SQL/NoSQL injection.
- **Race Condition & Concurrency Defense**: Campaign participation uses transactional reservation locks. If two customers attempt to commit the final 5 units simultaneously, the database atomically grants the first and rejects or queues the second without overselling.
- **Data Protection**: Sensitive credentials (passwords, payment signatures) are salted and hashed or validated strictly in memory. Card numbers and CVVs never touch BulkBuy servers.
- **Rate Limiting**: Authentication and checkout endpoints are protected against brute-force attacks via token bucket rate limiting.
- **Audit Logging**: All administrative mutations (supplier approval, campaign manual override, refund dispatch) emit immutable audit log entries detailing the actor ID, timestamp, and metadata diff.
