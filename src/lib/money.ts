// Money is stored as integer paise. Forms work in whole rupees.
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}

// ₹ with Indian digit grouping, e.g. ₹1,49,900. Converts from paise.
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}
