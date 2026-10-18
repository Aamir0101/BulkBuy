import crypto from 'crypto';

export interface RazorpayOrderPayload {
  orderId: string;
  amountInr: number;
  currency: string;
  receipt: string;
}

export interface PaymentVerificationInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export class PaymentGatewayService {
  private static readonly KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_bulkbuy_sandbox';
  private static readonly KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret_key_2026';
  public static readonly IS_SIMULATED = true;

  /**
   * Generates a payment order payload for Razorpay Checkout
   */
  public static createGatewayOrder(amountInr: number, orderId: string): {
    gatewayOrderId: string;
    amountInPaise: number;
    currency: string;
    keyId: string;
    isSimulation: boolean;
  } {
    const gatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    const amountInPaise = Math.round(amountInr * 100);

    return {
      gatewayOrderId,
      amountInPaise,
      currency: 'INR',
      keyId: this.KEY_ID,
      isSimulation: this.IS_SIMULATED,
    };
  }

  /**
   * Generates a valid test signature for client test flows
   */
  public static generateTestSignature(gatewayOrderId: string, gatewayPaymentId: string): string {
    return crypto
      .createHmac('sha256', this.KEY_SECRET)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');
  }

  /**
   * Cryptographically verifies the payment signature returned from Razorpay
   */
  public static verifyPaymentSignature(input: PaymentVerificationInput): boolean {
    const { gatewayOrderId, gatewayPaymentId, gatewaySignature } = input;
    if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.KEY_SECRET)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    const expBuf = Buffer.from(expectedSignature);
    const gotBuf = Buffer.from(gatewaySignature);
    if (expBuf.length === gotBuf.length && crypto.timingSafeEqual(expBuf, gotBuf)) {
      return true;
    }
    return false;
  }

  /**
   * Generates a valid test webhook signature for test payloads
   */
  public static generateTestWebhookSignature(rawBody: string): string {
    return crypto
      .createHmac('sha256', this.KEY_SECRET)
      .update(rawBody)
      .digest('hex');
  }

  /**
   * Verifies incoming webhook signature against raw payload
   */
  public static verifyWebhookSignature(rawBody: string, webhookSignature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.KEY_SECRET)
      .update(rawBody)
      .digest('hex');

    const expBuf = Buffer.from(expected);
    const gotBuf = Buffer.from(webhookSignature);
    if (expBuf.length === gotBuf.length && crypto.timingSafeEqual(expBuf, gotBuf)) {
      return true;
    }
    return false;
  }
}

