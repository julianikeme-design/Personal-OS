"use client";
/**
 * Downscale a photo in the browser before upload: faster on mobile data,
 * and keeps us under the AI service's image size limit.
 */
export async function downscaleImage(file: File, maxEdge = 2000, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality));
}

/** Small thumbnail as a data URL for the on-device journal. */
export async function toThumbnailDataUrl(file: File, maxEdge = 640): Promise<string | null> {
  const blob = await downscaleImage(file, maxEdge, 0.75);
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}
