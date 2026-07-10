"use server";

import { requireUser } from "@/lib/auth";
import { getCloudinaryConfig, signParams } from "@/lib/cloudinary";

export type SignedUploadParams = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

/**
 * Mint signed params for a direct browser->Cloudinary upload. Any logged-in
 * user may request them; the folder is namespaced and sanitized server-side.
 */
export async function getSignedUploadParams(
  folder: string,
): Promise<SignedUploadParams> {
  await requireUser();

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const safeFolder = `riroam/${folder.replace(/[^a-z0-9/_-]/gi, "")}`;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = signParams({ folder: safeFolder, timestamp }, apiSecret);

  return { cloudName, apiKey, timestamp, signature, folder: safeFolder };
}
