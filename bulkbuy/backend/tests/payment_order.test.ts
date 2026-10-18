import assert from 'assert';
import http from 'http';
import { app } from '../src/app.js';
import { db } from '../src/repositories/db.js';
import { generateToken } from '../src/utils/security.js';
import { PaymentGatewayService } from '../src/services/paymentService.js';
import { resetRateLimits } from '../src/middleware/rateLimiter.js';

console.log('--- Running BulkBuy Payments & Order Integrity Test Suite ---');

async function runPaymentOrderTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    resetRateLimits();

    // Setup test users
    const customer = db.findUserByEmail('priya.sharma@example.com')!;
    const admin = db.findUserByEmail('admin@bulkbuy.in')!;
    const customerToken = generateToken({ userId: customer.id, email: customer.email, role: customer.role });
    const adminToken = generateToken({ userId: admin.id, email: admin.email, role: admin.role });

    const authHeaders = {
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json',
    };

    // -------------------------------------------------------------
    // Test 1: Authoritative Order Draft Creation & Pending Order Storage
    // -------------------------------------------------------------
    console.log('\n[Test 1] Authoritative Order Draft Creation & Pending Storage:');
    let createdOrderId = '';
    let gatewayOrderId = '';
    let reservationId = '';

    {
      // First, reserve 2 units
      const reserveRes = await fetch(`${baseUrl}/campaigns/cmp_1/reserve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ quantity: 2 }),
      });
      assert.strictEqual(reserveRes.status, 200, 'Reserve stock should return 200');
      const reserveData = (await reserveRes.json()) as any;
      assert.ok(reserveData.reservation?.id, 'Reservation ID must be returned');
      reservationId = reserveData.reservation.id;

      // Create order
      const createRes = await fetch(`${baseUrl}/orders/create`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          campaignId: 'cmp_1',
          quantity: 2,
          reservationId,
        }),
      });

      assert.strictEqual(createRes.status, 201, 'Create order should return 201');
      const createData = (await createRes.json()) as any;

      assert.ok(createData.orderDraft?.id, 'Order draft must have an id');
      assert.strictEqual(createData.orderDraft.quantity, 2, 'Quantity must match requested quantity');
      assert.ok(createData.gateway?.gatewayOrderId, 'Gateway order must be created');

      createdOrderId = createData.orderDraft.id;
      gatewayOrderId = createData.gateway.gatewayOrderId;

      // Verify the order is persisted server-side as PENDING_PAYMENT
      const persisted = db.findOrderById(createdOrderId);
      assert.ok(persisted, 'Order must be persisted in database store');
      assert.strictEqual(persisted?.status, 'PENDING_PAYMENT', 'Persisted order must be PENDING_PAYMENT');
      assert.strictEqual(persisted?.userId, customer.id, 'Persisted order must belong to authenticated user');
      assert.ok(persisted?.expiresAt, 'Order draft must have an expiration TTL');

      console.log('  ✓ Pending order draft persisted authoritatively server-side with 15m TTL');
    }

    // -------------------------------------------------------------
    // Test 2: Reservation Ownership & Mismatch Validation
    // -------------------------------------------------------------
    console.log('\n[Test 2] Reservation Ownership & Mismatch Enforcement:');
    {
      // Attempt to create order using another user's reservation
      const otherUser = db.findUserByEmail('supplier@amaraagro.in')!;
      const otherUserToken = generateToken({ userId: otherUser.id, email: otherUser.email, role: otherUser.role });

      const stealRes = await fetch(`${baseUrl}/orders/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherUserToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: 'cmp_1',
          quantity: 2,
          reservationId, // Belongs to customer, not otherUser
        }),
      });

      assert.strictEqual(stealRes.status, 403, 'Cross-user reservation hijacking must be rejected with 403');

      // Attempt to create order with mismatched quantity
      const mismatchRes = await fetch(`${baseUrl}/orders/create`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          campaignId: 'cmp_1',
          quantity: 5, // Reserved 2, requested 5
          reservationId,
        }),
      });

      assert.strictEqual(mismatchRes.status, 400, 'Quantity mismatch against reservation must be rejected with 400');
      console.log('  ✓ Reservation ownership and quantity invariants enforced');
    }

    // -------------------------------------------------------------
    // Test 3: Rejection of Forged / Mock Signatures
    // -------------------------------------------------------------
    console.log('\n[Test 3] Cryptographic Signature Verification & Mock Prefix Rejection:');
    {
      const fakePaymentId = 'pay_fake_signature_test_01';
      // Attempt bypass with legacy mock prefix 'sig_mock_...'
      const mockBypassSig = `sig_mock_${gatewayOrderId}_${fakePaymentId}`;

      const forgedRes = await fetch(`${baseUrl}/payments/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: createdOrderId,
          gatewayOrderId,
          gatewayPaymentId: fakePaymentId,
          gatewaySignature: mockBypassSig,
          reservationId,
        }),
      });

      assert.strictEqual(forgedRes.status, 400, 'Mock prefix bypass must be completely rejected with 400');
      const forgedData = (await forgedRes.json()) as any;
      assert.ok(forgedData.error.includes('signature verification failed'), 'Error must specify signature failure');

      console.log('  ✓ Mock signature bypass successfully eliminated; untrusted transaction rejected');
    }

    // -------------------------------------------------------------
    // Test 4: Genuine HMAC-SHA256 Signature via Simulation & Order Confirmation
    // -------------------------------------------------------------
    console.log('\n[Test 4] Authentic HMAC-SHA256 Verification & Order Confirmation:');
    const validPaymentId = `pay_valid_${Date.now()}`;
    {
      // Obtain test HMAC signature
      const sigRes = await fetch(`${baseUrl}/payments/simulate-signature`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          gatewayOrderId,
          gatewayPaymentId: validPaymentId,
        }),
      });

      assert.strictEqual(sigRes.status, 200, 'Simulation signature endpoint must return 200');
      const sigData = (await sigRes.json()) as any;
      assert.ok(sigData.signature, 'Cryptographic signature must be returned');

      // Verify payment with valid HMAC signature
      const confirmRes = await fetch(`${baseUrl}/payments/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: createdOrderId,
          gatewayOrderId,
          gatewayPaymentId: validPaymentId,
          gatewaySignature: sigData.signature,
          reservationId,
        }),
      });

      assert.strictEqual(confirmRes.status, 200, 'Legitimate payment verification must succeed with 200');
      const confirmData = (await confirmRes.json()) as any;
      assert.strictEqual(confirmData.order.status, 'CONFIRMED', 'Order status must be CONFIRMED');
      assert.strictEqual(confirmData.payment.status, 'SUCCESS', 'Payment status must be SUCCESS');

      // Verify DB state
      const confirmedDbOrder = db.findOrderById(createdOrderId);
      assert.strictEqual(confirmedDbOrder?.status, 'CONFIRMED', 'Database order must be updated to CONFIRMED');

      console.log('  ✓ Genuine HMAC verification succeeded and order transitioned to CONFIRMED');
    }

    // -------------------------------------------------------------
    // Test 5: Idempotency & Replay Attack Prevention
    // -------------------------------------------------------------
    console.log('\n[Test 5] Idempotency & Replay Attack Prevention:');
    {
      // 1. Idempotency test: Repeat exact same verifyPayment for already confirmed order
      const validSig = PaymentGatewayService.generateTestSignature(gatewayOrderId, validPaymentId);
      const duplicateConfirmRes = await fetch(`${baseUrl}/payments/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: createdOrderId,
          gatewayOrderId,
          gatewayPaymentId: validPaymentId,
          gatewaySignature: validSig,
          reservationId,
        }),
      });

      assert.strictEqual(duplicateConfirmRes.status, 200, 'Duplicate request must return 200 idempotently');
      const duplicateData = (await duplicateConfirmRes.json()) as any;
      assert.strictEqual(duplicateData.order.id, createdOrderId);
      assert.strictEqual(duplicateData.order.status, 'CONFIRMED');

      // 2. Replay attack test: Try using the already processed validPaymentId on a NEW order
      const newOrderRes = await fetch(`${baseUrl}/orders/create`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ campaignId: 'cmp_1', quantity: 1 }),
      });
      const newOrderData = (await newOrderRes.json()) as any;
      const newOrderId = newOrderData.orderDraft.id;
      const newGatewayOrderId = newOrderData.gateway.gatewayOrderId;

      const reusedSig = PaymentGatewayService.generateTestSignature(newGatewayOrderId, validPaymentId);
      const replayRes = await fetch(`${baseUrl}/payments/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: newOrderId,
          gatewayOrderId: newGatewayOrderId,
          gatewayPaymentId: validPaymentId, // Replaying previous payment ID!
          gatewaySignature: reusedSig,
        }),
      });

      assert.strictEqual(replayRes.status, 400, 'Replayed payment ID must be rejected with 400');
      const replayData = (await replayRes.json()) as any;
      assert.ok(replayData.error.includes('already been processed'), 'Must indicate transaction already processed');

      console.log('  ✓ Idempotent duplicate confirmations and payment replay attacks handled correctly');
    }

    // -------------------------------------------------------------
    // Test 6: Admin CSV Report Export via Query Token
    // -------------------------------------------------------------
    console.log('\n[Test 6] Admin CSV Report Export via Query Token:');
    {
      // Download with valid admin query token
      const csvRes = await fetch(`${baseUrl}/admin/reports/csv?token=${adminToken}`);
      assert.strictEqual(csvRes.status, 200, 'Admin CSV export with query token must return 200');
      assert.strictEqual(csvRes.headers.get('content-type'), 'text/csv; charset=utf-8');
      const csvText = await csvRes.text();
      assert.ok(csvText.includes('Order Number,User ID,Campaign ID'), 'CSV headers must be present');
      assert.ok(csvText.includes(createdOrderId), 'Confirmed order must be present in exported CSV');

      // Attempt download without token
      const unauthCsvRes = await fetch(`${baseUrl}/admin/reports/csv`);
      assert.strictEqual(unauthCsvRes.status, 401, 'CSV export without token must return 401');

      // Attempt download with customer token (insufficient role)
      const forbiddenCsvRes = await fetch(`${baseUrl}/admin/reports/csv?token=${customerToken}`);
      assert.strictEqual(forbiddenCsvRes.status, 403, 'CSV export with customer token must return 403 Forbidden');

      console.log('  ✓ Admin CSV export authenticated via query token works securely with RBAC');
    }

    console.log('\n>>> All Phase 2 Payments & Order Integrity Tests Passed Successfully! <<<\n');
  } finally {
    server.close();
  }
}

runPaymentOrderTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
