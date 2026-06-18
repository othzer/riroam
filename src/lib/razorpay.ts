import crypto from "crypto";
import Razorpay from "razorpay";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (client) return client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay environment variables are not configured");
  }
  client = new Razorpay({ key_id, key_secret });
  return client;
}

/** Creates a Razorpay order for `amountPaise` (Razorpay's native unit). */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
) {
  return getClient().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
}

/**
 * Client-callback verification: Razorpay checkout returns
 * {order_id, payment_id, signature}; recompute
 * HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) and compare.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}

/** Webhook verification: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Refunds a captured payment (test mode). `amountPaise` omitted = full refund. */
export async function refundPayment(paymentId: string, amountPaise?: number) {
  return getClient().payments.refund(paymentId, {
    ...(amountPaise !== undefined && { amount: amountPaise }),
  });
}
