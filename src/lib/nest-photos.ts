import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "property-photos";
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MIN_PHOTOS = 3;

const MAX_DIMENSION = 1600;
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

export const isAcceptedPhoto = (file: File) =>
  ACCEPTED_PHOTO_TYPES.includes(file.type.toLowerCase()) ||
  /\.(jpe?g|png|webp)$/i.test(file.name);

/** Downsizes large photos in the browser so uploads stay fast and light. */
export const compressImage = async (file: File): Promise<Blob> => {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
    );
    bitmap.close?.();
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
};

/** Uploads one photo to the host's own folder and returns its stored path. */
export const uploadPropertyPhoto = async (file: File, userId: string): Promise<string> => {
  const blob = await compressImage(file);
  const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext.toLowerCase()}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return path;
};

export const deletePropertyPhoto = async (path: string) => {
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
};

/** Turns stored photo paths into viewable URLs. */
export const signPhotoPaths = async (paths: string[]): Promise<Record<string, string>> => {
  const wanted = paths.filter((p) => p && !p.startsWith("http") && !p.startsWith("/"));
  const map: Record<string, string> = {};
  for (const p of paths) if (p.startsWith("http") || p.startsWith("/")) map[p] = p;
  if (!wanted.length) return map;
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(wanted, SIGNED_URL_TTL);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
};
