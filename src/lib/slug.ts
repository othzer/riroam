import { prisma } from "@/lib/prisma";

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "vendor"
  );
}

/** Slugify a name and suffix `-2`, `-3`, … until `exists` returns false. */
export async function uniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await exists(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Slugify a name and suffix `-2`, `-3`, … until the vendor slug is free. */
export async function uniqueVendorSlug(name: string): Promise<string> {
  return uniqueSlug(name, (slug) =>
    prisma.vendorProfile.findUnique({ where: { slug } }).then(Boolean),
  );
}
