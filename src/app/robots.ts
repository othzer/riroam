import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-user surfaces — nothing here is useful in an index, and
      // some of it is behind auth anyway.
      disallow: ["/admin", "/vendor", "/trips", "/checkout", "/profile", "/api"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
