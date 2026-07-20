/**
 * Site ownership and contact details.
 *
 * The links come from env so the deployed site can carry real URLs without a
 * code change — set them in Vercel and they light up. Anything unset stays
 * `null`, and the footer renders it as plain muted text rather than a dead
 * link, so a placeholder never looks like a broken one.
 */
export const SITE = {
  /** Legal owner shown in the footer's copyright line. */
  owner: "OthzrLabs",
  ownerUrl: process.env.NEXT_PUBLIC_OWNER_URL || null,
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || null,
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || null,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
} as const;
