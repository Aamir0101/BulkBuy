import assert from 'assert';
import { PricingService } from '../src/services/pricingService.js';
import { PaymentGatewayService } from '../src/services/paymentService.js';
import { Campaign } from '../src/models/types.js';

console.log('--- Running BulkBuy Backend Automated Test Suite ---');

// 1. Test Pricing Tier Calculation
{
  const mockCampaign: Campaign = {
    id: 'cmp_test',
    productId: 'prod_test',
    supplierId: 'sup_test',
    title: 'Test Oil Campaign',
    minTargetQty: 100,
    maxTargetQty: 250,
    committedQty: 40,
    status: 'ACTIVE',
    startsAt: '2026-10-01T00:00:00Z',
    endsAt: '2026-10-25T00:00:00Z',
    deliveryWindow: '3-4 days',
    region: 'Bengaluru',
    product: {
      id: 'prod_test',
      supplierId: 'sup_test',
      category: 'Cooking Oils',
      title: 'Kachi Ghani Mustard Oil 5L',
      slug: 'mustard-oil-5l',
      description: 'Cold pressed',
      unitSize: '5L',
      mrpInr: 975,
      imageUrl: '/images/oil.jpg',
      isApproved: true,
    },
    tiers: [
      { id: 't1', campaignId: 'cmp_test', minQuantity: 1, priceInr: 890 },
      { id: 't2', campaignId: 'cmp_test', minQuantity: 50, priceInr: 820 },
      { id: 't3', campaignId: 'cmp_test', minQuantity: 100, priceInr: 749 },
      { id: 't4', campaignId: 'cmp_test', minQuantity: 200, priceInr: 699 },
    ],
  };

  // At 40 committed units: Tier 1 (890), 10 units away from Tier 2 (820)
  const p1 = PricingService.calculateUnitPrice(mockCampaign, 40);
  assert.strictEqual(p1.unitPrice, 890, 'At 40 units price should be 890');
  assert.strictEqual(p1.unitsToNextTier, 10, 'Units to next tier should be 10');

  // At 105 committed units: Tier 3 (749), 95 units away from Tier 4 (699)
  const p2 = PricingService.calculateUnitPrice(mockCampaign, 105);
  assert.strictEqual(p2.unitPrice, 749, 'At 105 units price should be 749');
  assert.strictEqual(p2.unitsToNextTier, 95, 'Units to Tier 4 should be 95');

  console.log('✓ PricingService tier calculation assertions passed');
}

// 2. Test Payment Signature Verification
{
  const orderId = 'order_test_12345';
  const paymentId = 'pay_test_67890';
  const validSignature = PaymentGatewayService.generateTestSignature(orderId, paymentId);

  const isValid = PaymentGatewayService.verifyPaymentSignature({
    gatewayOrderId: orderId,
    gatewayPaymentId: paymentId,
    gatewaySignature: validSignature,
  });

  assert.strictEqual(isValid, true, 'Cryptographic signature should be valid');

  const isInvalid = PaymentGatewayService.verifyPaymentSignature({
    gatewayOrderId: orderId,
    gatewayPaymentId: paymentId,
    gatewaySignature: 'tampered_invalid_signature',
  });

  assert.strictEqual(isInvalid, false, 'Tampered signature must be rejected');

  console.log('✓ PaymentGatewayService HMAC SHA256 verification assertions passed');
}

console.log('All automated tests passed successfully!');
