import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Only published listings and approved storefronts — a draft listing or a
 * pending vendor 404s for the public, so indexing it would be a dead entry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/packages`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/hotels`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/vehicles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/plan`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${APP_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/register`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [packages, hotels, vehicles, vendors] = await Promise.all([
      prisma.package.findMany({
        where: { isPublished: true },
        select: { slug: true, createdAt: true },
      }),
      prisma.hotel.findMany({
        where: { isPublished: true },
        select: { slug: true, createdAt: true },
      }),
      prisma.vehicleListing.findMany({
        where: { isPublished: true },
        select: { id: true, createdAt: true },
      }),
      prisma.vendorProfile.findMany({
        where: { status: "APPROVED" },
        select: { slug: true, createdAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...packages.map((p) => ({
        url: `${APP_URL}/packages/${p.slug}`,
        lastModified: p.createdAt,
        priority: 0.8,
      })),
      ...hotels.map((h) => ({
        url: `${APP_URL}/hotels/${h.slug}`,
        lastModified: h.createdAt,
        priority: 0.8,
      })),
      ...vehicles.map((v) => ({
        url: `${APP_URL}/vehicles/${v.id}`,
        lastModified: v.createdAt,
        priority: 0.7,
      })),
      ...vendors.map((v) => ({
        url: `${APP_URL}/vendors/${v.slug}`,
        lastModified: v.createdAt,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    // A sitemap is not worth failing a build or a request over — Neon's free
    // tier throws transient connection errors, so degrade to the static routes.
    console.error("[sitemap] listing query failed:", err);
    return staticRoutes;
  }
}
