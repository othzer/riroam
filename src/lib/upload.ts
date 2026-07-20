import { getSignedUploadParams } from "@/actions/uploads";

/** Upload a file straight to Cloudinary using a server-signed request. */
export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<string> {
  const params = await getSignedUploadParams(folder);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", params.apiKey);
  form.append("timestamp", String(params.timestamp));
  form.append("signature", params.signature);
  form.append("folder", params.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    // Cloudinary explains itself in the body ("Invalid cloud_name", "Invalid
    // signature", file-too-large…). Swallowing it turned every one of those
    // into an indistinguishable "try again", which is unactionable for a
    // misconfiguration that retrying can never fix.
    const detail = await res
      .json()
      .then((b: { error?: { message?: string } }) => b?.error?.message)
      .catch(() => undefined);
    throw new Error(detail || `Upload failed (${res.status})`);
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
