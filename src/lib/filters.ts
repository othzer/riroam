import type { Prisma } from "@prisma/client";

export const PAGE_SIZE = 9;

export type SearchParams = Record<string, string | string[] | undefined>;

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Prisma's `has`/`hasSome` on a String[] column is exact-match, not
 * case-insensitive (Postgres array containment has no ILIKE equivalent via
 * the fluent API). Destinations are stored Title Case in seed/vendor data, so
 * matching both the raw query and its Title Case form covers the common case
 * (a user typing lowercase) without a schema change or raw SQL.
 */
export function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export function getPage(sp: SearchParams): number {
  const n = Number(first(sp.page));
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function budgetRangePaise(sp: SearchParams) {
  const min = Number(first(sp.budgetMin));
  const max = Number(first(sp.budgetMax));
  return {
    min: Number.isFinite(min) && min > 0 ? min * 100 : undefined,
    max: Number.isFinite(max) && max > 0 ? max * 100 : undefined,
  };
}

function minRating(sp: SearchParams) {
  const r = Number(first(sp.rating));
  return Number.isFinite(r) && r > 0 ? r : undefined;
}

/**
 * A `yyyy-mm-dd` search param, or undefined if absent or malformed. Guards the
 * Date constructor against junk in a user-editable query string.
 */
export function isoDateParam(sp: SearchParams, key: string): Date | undefined {
  const raw = first(sp[key])?.trim();
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function buildPackageWhere(sp: SearchParams): Prisma.PackageWhereInput {
  const destination = first(sp.destination)?.trim();
  const duration = Number(first(sp.duration));
  const { min, max } = budgetRangePaise(sp);
  const rating = minRating(sp);
  const from = isoDateParam(sp, "from");

  return {
    isPublished: true,
    // "Starting from" — keep circuits whose availability window still has room
    // on or after the chosen date.
    ...(from && { availableTo: { gte: from } }),
    ...(destination && {
      OR: [
        { startCity: { contains: destination, mode: "insensitive" } },
        { destinations: { hasSome: [destination, titleCase(destination)] } },
        { title: { contains: destination, mode: "insensitive" } },
      ],
    }),
    ...(Number.isFinite(duration) && duration > 0 && { durationDays: { lte: duration } }),
    ...((min !== undefined || max !== undefined) && {
      pricePerPerson: {
        ...(min !== undefined && { gte: min }),
        ...(max !== undefined && { lte: max }),
      },
    }),
    ...(rating !== undefined && { avgRating: { gte: rating } }),
  };
}

export function buildHotelWhere(sp: SearchParams): Prisma.HotelWhereInput {
  const destination = first(sp.destination)?.trim();
  const propertyType = first(sp.propertyType);
  const { min, max } = budgetRangePaise(sp);
  const rating = minRating(sp);

  return {
    isPublished: true,
    ...(destination && {
      OR: [
        { city: { contains: destination, mode: "insensitive" } },
        { name: { contains: destination, mode: "insensitive" } },
      ],
    }),
    ...((propertyType === "HOTEL" || propertyType === "HOMESTAY") && {
      propertyType,
    }),
    // Always require at least one room — a listing with zero rooms can't be
    // booked or priced, and the card grid filters these out anyway. Requiring
    // it here keeps `total`/pagination consistent with what's rendered.
    rooms: {
      some: {
        ...(min !== undefined && { pricePerNight: { gte: min } }),
        ...(max !== undefined && { pricePerNight: { lte: max } }),
      },
    },
    ...(rating !== undefined && { avgRating: { gte: rating } }),
  };
}

export function buildVehicleWhere(sp: SearchParams): Prisma.VehicleListingWhereInput {
  const destination = first(sp.destination)?.trim();
  const type = first(sp.type);
  const { min, max } = budgetRangePaise(sp);
  const rating = minRating(sp);

  return {
    isPublished: true,
    ...(destination && {
      OR: [
        { city: { contains: destination, mode: "insensitive" } },
        { title: { contains: destination, mode: "insensitive" } },
      ],
    }),
    ...((type === "TAXI" || type === "BIKE") && { vehicleType: type }),
    ...(min !== undefined && { pricePerDay: { gte: min } }),
    ...(max !== undefined && { pricePerDay: { lte: max } }),
    ...(rating !== undefined && { avgRating: { gte: rating } }),
  };
}

/** Builds an href for a given page, preserving the other active filters. */
export function pageHref(basePath: string, sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v === undefined) continue;
    for (const val of Array.isArray(v) ? v : [v]) params.append(k, val);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
