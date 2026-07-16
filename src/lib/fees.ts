/**
 * Listing prices are tax-inclusive, so checkout discloses what's already
 * baked into the total rather than adding anything on top. The parts are
 * derived from the total and always sum back to it exactly — nothing here
 * changes what the traveller is charged or what the vendor is owed.
 */

/** GST on tour and accommodation services. */
export const GST_RATE = 0.05;
const CONVENIENCE_RATE = 0.01;
/** ₹99 — the fee stops growing on expensive circuits. */
const CONVENIENCE_CAP = 9_900;

export type PriceBreakdown = {
  /** Pre-tax portion of the total. */
  base: number;
  gst: number;
  convenienceFee: number;
  total: number;
};

export function splitInclusiveTotal(total: number): PriceBreakdown {
  const convenienceFee = Math.min(CONVENIENCE_CAP, Math.round(total * CONVENIENCE_RATE));
  const taxable = total - convenienceFee;
  // Back out GST that is already inside `taxable`, hence the 1 + rate divisor.
  const gst = Math.round((taxable * GST_RATE) / (1 + GST_RATE));
  // Base absorbs the rounding remainder so the parts always re-sum to total.
  return { base: taxable - gst, gst, convenienceFee, total };
}
