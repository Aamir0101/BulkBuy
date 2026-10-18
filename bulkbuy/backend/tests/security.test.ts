import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { db } from '../src/repositories/db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getJwtSecret,
} from '../src/utils/security.js';
import { resetRateLimits } from '../src/middleware/rateLimiter.js';

console.log('--- Running BulkBuy Comprehensive Application Security Test Suite ---');

async function runSecurityTests() {
  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // Test Group 1: Password Hashing & Verification
    // -------------------------------------------------------------
    console.log('\n[Group 1] Password Hashing & Safe Verification:');
    {
      const rawPassword = 'SuperSecretPassword@2026';
      const hash = await hashPassword(rawPassword);

      assert.ok(hash.startsWith('$2b$12$'), 'Password hash must be bcrypt with cost factor 12');
      assert.strictEqual(hash.length, 60, 'Bcrypt hash must be exactly 60 characters long');

      const matches = await verifyPassword(rawPassword, hash);
      assert.strictEqual(matches, true, 'Valid password must verify successfully against hash');

      const wrongMatches = await verifyPassword('WrongPassword123', hash);
      assert.strictEqual(wrongMatches, false, 'Invalid password must be rejected');

      // Crucial test: Plaintext password stored in DB must NEVER be treated as a valid hash
      const legacyPlaintextMatches = await verifyPassword('admin123', 'admin123');
      assert.strictEqual(legacyPlaintextMatches, false, 'Plaintext string must never be verified as valid hash');

      const malformedMatches = await verifyPassword('admin123', '$2b$12$invalid_short_hash');
      assert.strictEqual(malformedMatches, false, 'Malformed hash format must be safely rejected');

      console.log('  ✓ Bcrypt hashing and plaintext rejection assertions passed');
    }

    // -------------------------------------------------------------
    // Test Group 2: Public Registration Security & Privilege Escalation
    // -------------------------------------------------------------
    console.log('\n[Group 2] Registration Security & Admin Self-Assignment Prevention:');
    {
      resetRateLimits();

      // Attempt privilege escalation: client tries to register as ADMIN
      const escalationRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'attacker@evil.com',
          password: 'Password123!',
          fullName: 'Attacker User',
          phone: '+91 99999 88888',
          role: 'ADMIN',
          adminSecretToken: 'secure-admin-token-2026',
        }),
      });

      assert.strictEqual(
        escalationRes.status,
        400,
        'Registering with role ADMIN must be rejected with 400 Bad Request'
      );
      const escalationBody = await escalationRes.json();
      assert.ok(
        escalationBody.error,
        'Should return error when attempting to register as ADMIN'
      );

      // Legitimate customer registration
      const custEmail = `test.cust.${Date.now()}@example.com`;
      const custRegRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: custEmail,
          password: 'StrongPassword123!',
          fullName: 'Legit Customer',
          phone: '+91 91234 56780',
          role: 'CUSTOMER',
        }),
      });

      assert.strictEqual(custRegRes.status, 201, 'Customer registration should succeed');
      const custData = await custRegRes.json();
      assert.ok(custData.token, 'Registration should return an authentication token');
      assert.strictEqual(custData.user.role, 'CUSTOMER');

      // Verify that the stored password in database is a bcrypt hash and NOT plaintext
      const storedUser = db.findUserByEmail(custEmail);
      assert.ok(storedUser, 'User must exist in repository');
      assert.ok(
        storedUser!.passwordHash.startsWith('$2b$'),
        'Stored password in repository must be a bcrypt hash'
      );
      assert.notStrictEqual(
        storedUser!.passwordHash,
        'StrongPassword123!',
        'Plaintext password must NEVER be persisted in repository'
      );

      console.log('  ✓ Registration privilege escalation prevention and hash storage assertions passed');
    }

    // -------------------------------------------------------------
    // Test Group 3: Login Security, Generic Errors & Safe Logging
    // -------------------------------------------------------------
    console.log('\n[Group 3] Login Security & Generic Error Responses:');
    {
      resetRateLimits();

      // 1. Success with seed admin
      const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bulkbuy.in',
          password: 'admin123',
        }),
      });
      assert.strictEqual(adminLoginRes.status, 200, 'Admin login with seed credentials should succeed');
      const adminLoginData = await adminLoginRes.json();
      assert.ok(adminLoginData.token, 'Login must return signed JWT');

      // 2. Failed login: non-existent email
      const nonExistentRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent.user.404@bulkbuy.in',
          password: 'SomePassword123',
        }),
      });
      assert.strictEqual(nonExistentRes.status, 401, 'Unknown email must return 401');
      const nonExistentBody = await nonExistentRes.json();
      assert.strictEqual(
        nonExistentBody.error,
        'Invalid email or password',
        'Generic error message required to prevent email enumeration'
      );

      // 3. Failed login: wrong password for existing user
      const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@bulkbuy.in',
          password: 'DefinitelyWrongPassword!',
        }),
      });
      assert.strictEqual(wrongPassRes.status, 401, 'Wrong password must return 401');
      const wrongPassBody = await wrongPassRes.json();
      assert.strictEqual(
        wrongPassBody.error,
        'Invalid email or password',
        'Generic error message required to prevent timing/content enumeration'
      );

      console.log('  ✓ Login flow and generic authentication errors verified');
    }

    // -------------------------------------------------------------
    // Test Group 4: Cryptographic Token Validation, Forgery & Expiration
    // -------------------------------------------------------------
    console.log('\n[Group 4] Cryptographic JWT Validation & Rejection of Forgeries:');
    {
      const jwtSecret = getJwtSecret();

      // 1. Valid token succeeds
      const validToken = generateToken({
        userId: 'usr_customer_1',
        role: 'CUSTOMER',
        email: 'priya.sharma@example.com',
      });
      const validMeRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.strictEqual(validMeRes.status, 200, 'Valid JWT must be accepted');

      // 2. Forged token with altered payload signature
      const [headerB64, payloadB64, sigB64] = validToken.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          userId: 'usr_admin_1',
          role: 'ADMIN',
          iss: 'bulkbuy-api',
          aud: 'bulkbuy-client',
        })
      ).toString('base64url');
      const forgedToken = `${headerB64}.${tamperedPayload}.${sigB64}`;

      const forgedRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      assert.strictEqual(forgedRes.status, 401, 'Forged token with altered payload must be rejected with 401');

      // 3. Token signed with wrong secret key
      const wrongSecretToken = jwt.sign(
        { userId: 'usr_admin_1', role: 'ADMIN', iss: 'bulkbuy-api', aud: 'bulkbuy-client' },
        'malicious-attacker-secret-key-1234567890',
        { algorithm: 'HS256' }
      );
      const wrongSecretRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${wrongSecretToken}` },
      });
      assert.strictEqual(wrongSecretRes.status, 401, 'Token signed with wrong key must be rejected');

      // 4. Token with algorithm 'none'
      const noneAlgHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const noneAlgToken = `${noneAlgHeader}.${payloadB64}.`;
      const noneAlgRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${noneAlgToken}` },
      });
      assert.strictEqual(noneAlgRes.status, 401, "Token with alg 'none' must be rejected");

      // 5. Expired token
      const expiredToken = generateToken(
        { userId: 'usr_customer_1', role: 'CUSTOMER', email: 'priya.sharma@example.com' },
        -10 // Expired 10 seconds ago
      );
      const expiredRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      assert.strictEqual(expiredRes.status, 401, 'Expired token must be rejected with 401');

      // 6. Insecure legacy Base64 string
      const legacyBase64Token = Buffer.from(
        JSON.stringify({ userId: 'usr_admin_1', role: 'ADMIN' })
      ).toString('base64');
      const legacyRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${legacyBase64Token}` },
      });
      assert.strictEqual(legacyRes.status, 401, 'Insecure legacy Base64 token must be rejected with 401');

      // 7. Direct User ID string
      const rawUserIdRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer usr_admin_1' },
      });
      assert.strictEqual(rawUserIdRes.status, 401, 'Direct user ID string must be rejected with 401');

      console.log('  ✓ All token forgery, algorithm none, expired and legacy token tests passed');
    }

    // -------------------------------------------------------------
    // Test Group 5: Server-Side Role Enforcement & RBAC Isolation
    // -------------------------------------------------------------
    console.log('\n[Group 5] Server-Side Role Enforcement & Cross-Role Access Control:');
    {
      const customerToken = generateToken({
        userId: 'usr_customer_1',
        role: 'CUSTOMER',
        email: 'priya.sharma@example.com',
      });

      const supplierToken = generateToken({
        userId: 'usr_supplier_1',
        role: 'SUPPLIER',
        email: 'supplier@amaraagro.in',
      });

      const adminToken = generateToken({
        userId: 'usr_admin_1',
        role: 'ADMIN',
        email: 'admin@bulkbuy.in',
      });

      // Customer attempts to access Supplier routes
      const custSupplierRes = await fetch(`${baseUrl}/supplier/products`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(
        custSupplierRes.status,
        403,
        'Customer accessing supplier route must be rejected with 403 Forbidden'
      );

      // Customer attempts to access Admin routes
      const custAdminRes = await fetch(`${baseUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(
        custAdminRes.status,
        403,
        'Customer accessing admin route must be rejected with 403 Forbidden'
      );

      // Supplier attempts to access Admin routes
      const supAdminRes = await fetch(`${baseUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${supplierToken}` },
      });
      assert.strictEqual(
        supAdminRes.status,
        403,
        'Supplier accessing admin route must be rejected with 403 Forbidden'
      );

      // Admin accesses Admin routes
      const adminRes = await fetch(`${baseUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(adminRes.status, 200, 'Admin should have access to admin routes');

      // Tampered Token Claim: Customer token signed with server key but claiming role: 'ADMIN' in payload
      const secret = getJwtSecret();
      const fakeAdminPayloadToken = jwt.sign(
        {
          userId: 'usr_customer_1', // Actual user in DB is CUSTOMER
          role: 'ADMIN', // Tampered role in token
        },
        secret,
        {
          algorithm: 'HS256',
          issuer: 'bulkbuy-api',
          audience: 'bulkbuy-client',
          expiresIn: '1h',
        }
      );

      const fakeAdminRes = await fetch(`${baseUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${fakeAdminPayloadToken}` },
      });
      assert.strictEqual(
        fakeAdminRes.status,
        403,
        'Server must load role from database and reject fake admin role in token with 403 Forbidden'
      );

      console.log('  ✓ Server-side RBAC and privilege escalation defenses passed');
    }

    // -------------------------------------------------------------
    // Test Group 6: Resource Ownership & BOLA Protections
    // -------------------------------------------------------------
    console.log('\n[Group 6] Resource Ownership & BOLA Protections:');
    {
      const supplier1 = db.findSupplierById('sup_1');
      assert.ok(supplier1, 'Supplier 1 must exist');

      // Find products belonging to supplier 1
      const supplier1Products = db.getProducts().filter((p) => p.supplierId === 'sup_1');
      assert.ok(supplier1Products.length > 0, 'Supplier 1 should have products');
      const supplier1ProductId = supplier1Products[0].id;

      // Find or verify another product belonging to another supplier (sup_2)
      const supplier2Products = db.getProducts().filter((p) => p.supplierId === 'sup_2');
      assert.ok(supplier2Products.length > 0, 'Supplier 2 should have products');
      const supplier2ProductId = supplier2Products[0].id;

      // Supplier 1 token
      const sup1Token = generateToken({
        userId: 'usr_supplier_1',
        role: 'SUPPLIER',
        email: 'supplier@amaraagro.in',
      });

      // Supplier 1 attempts to propose a campaign for Supplier 2's product (BOLA attack)
      const bolaCampaignRes = await fetch(`${baseUrl}/supplier/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sup1Token}`,
        },
        body: JSON.stringify({
          productId: supplier2ProductId, // BELONGS TO SUP_2!
          title: 'Unauthorized Hijacked Campaign',
          minTargetQty: 100,
          maxTargetQty: 200,
          endsAt: '2026-12-31T23:59:59.000Z',
          deliveryWindow: '3-5 business days',
          region: 'Bengaluru',
          tiers: [{ minQuantity: 1, priceInr: 500 }],
        }),
      });

      assert.strictEqual(
        bolaCampaignRes.status,
        403,
        'Supplier proposing campaign for another supplier product must be rejected with 403 Forbidden'
      );
      const bolaBody = await bolaCampaignRes.json();
      assert.ok(
        bolaBody.error.includes('Forbidden'),
        'Error should indicate forbidden resource ownership'
      );

      // Supplier 1 proposing campaign for their OWN product succeeds
      const legitCampaignRes = await fetch(`${baseUrl}/supplier/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sup1Token}`,
        },
        body: JSON.stringify({
          productId: supplier1ProductId, // Belongs to sup_1!
          title: 'Legitimate Supplier 1 Campaign',
          minTargetQty: 50,
          maxTargetQty: 150,
          endsAt: '2026-12-31T23:59:59.000Z',
          deliveryWindow: '3-5 business days',
          region: 'Bengaluru',
          tiers: [{ minQuantity: 1, priceInr: 450 }],
        }),
      });

      assert.strictEqual(legitCampaignRes.status, 201, 'Supplier should be able to create campaign for own product');

      // Customer Order Cancellation Ownership Check:
      // Customer B cannot cancel Customer A's order
      const orders = db.getOrders();
      const confirmedOrder = orders.find((o) => o.status === 'CONFIRMED');
      if (confirmedOrder) {
        // Create attacker customer
        const otherCustToken = generateToken({
          userId: 'usr_attacker_random',
          role: 'CUSTOMER',
          email: 'attacker.random@example.com',
        });

        // Add dummy user to DB so auth succeeds
        db.addUser({
          id: 'usr_attacker_random',
          email: 'attacker.random@example.com',
          passwordHash: '$2b$12$AZ3fQ0UvoVhgXIOvZ72JseulkOiwIYHqYHZJcITPk4aeMfRXVeJBK',
          fullName: 'Attacker User',
          phone: '+91 99999 11111',
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
        });

        const cancelAttackRes = await fetch(`${baseUrl}/orders/${confirmedOrder.id}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${otherCustToken}` },
        });

        assert.strictEqual(
          cancelAttackRes.status,
          403,
          "User attempting to cancel another user's order must be rejected with 403 Forbidden"
        );
      }

      console.log('  ✓ Resource ownership and BOLA defenses passed');
    }

    // -------------------------------------------------------------
    // Test Group 7: Rate Limiting Protections
    // -------------------------------------------------------------
    console.log('\n[Group 7] Rate Limiting Protections on Authentication Endpoints:');
    {
      resetRateLimits();

      let rateLimited = false;
      // Send 12 rapid login requests from the same client IP
      for (let i = 0; i < 12; i++) {
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@bulkbuy.in',
            password: 'wrong_password_attempt',
          }),
        });

        if (res.status === 429) {
          rateLimited = true;
          const retryAfter = res.headers.get('Retry-After');
          assert.ok(retryAfter, 'Rate limited response must include Retry-After header');
          break;
        }
      }

      assert.strictEqual(rateLimited, true, 'Rate limiter must trigger 429 Too Many Requests after threshold');
      console.log('  ✓ Rate limiter triggered 429 with Retry-After header');
    }

    // -------------------------------------------------------------
    // Test Group 8: Logout Endpoint & Session Termination
    // -------------------------------------------------------------
    console.log('\n[Group 8] Logout & Safe Session Termination:');
    {
      const userToken = generateToken({
        userId: 'usr_customer_1',
        role: 'CUSTOMER',
        email: 'priya.sharma@example.com',
      });

      const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.strictEqual(logoutRes.status, 200, 'Logout request should return 200');
      const logoutBody = await logoutRes.json();
      assert.ok(logoutBody.message.includes('logged out'), 'Logout response confirms termination');

      console.log('  ✓ Logout endpoint executed and confirmed');
    }

    console.log('\n======================================================');
    console.log(' ALL SECURITY & AUTHORIZATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runSecurityTests().catch((err) => {
  console.error('\n❌ Security Test Suite Failed:', err);
  process.exit(1);
});
