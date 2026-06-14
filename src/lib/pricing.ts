// Server-side price computation (paise). The client only ever displays a
// preview — a booking's stored amounts always come from here, never from a
// number the browser sent.

/** Nights/days between two date-only UTC dates. */
export function unitsBetween(startDate: Date, endDate: Date): number {
  const ms = endDate.getTime() - startDate.getTime();
  return Math.round(ms / 86_400_000);
}

export function computeExtrasAmount(extras: { priceSnapshot: number }[]): number {
  return extras.reduce((sum, e) => sum + e.priceSnapshot, 0);
}

export function computePackagePrice(
  pricePerPerson: number,
  guestCount: number,
  extrasAmount = 0,
) {
  const baseAmount = pricePerPerson * guestCount;
  return { baseAmount, extrasAmount, totalAmount: baseAmount + extrasAmount };
}

export function computeRoomPrice(
  pricePerNight: number,
  nights: number,
  unitCount: number,
  extrasAmount = 0,
) {
  const baseAmount = pricePerNight * nights * unitCount;
  return { baseAmount, extrasAmount, totalAmount: baseAmount + extrasAmount };
}

export function computeVehiclePrice(
  pricePerDay: number,
  days: number,
  unitCount: number,
  extrasAmount = 0,
) {
  const baseAmount = pricePerDay * days * unitCount;
  return { baseAmount, extrasAmount, totalAmount: baseAmount + extrasAmount };
}
