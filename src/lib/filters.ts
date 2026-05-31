import type { Prisma } from "@prisma/client";

export const PAGE_SIZE = 9;

export type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
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

export function buildPackageWhere(sp: SearchParams): Prisma.PackageWhereInput {
  const destination = first(sp.destination)?.trim();
  const duration = Number(first(sp.duration));
  const { min, max } = budgetRangePaise(sp);
  const rating = minRating(sp);

  return {
    isPublished: true,
    ...(destination && {
      OR: [
        { startCity: { contains: destination, mode: "insensitive" } },
        { destinations: { has: destination } },
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
    ...((min !== undefined || max !== undefined) && {
      rooms: {
        some: {
          ...(min !== undefined && { pricePerNight: { gte: min } }),
          ...(max !== undefined && { pricePerNight: { lte: max } }),
        },
      },
    }),
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
