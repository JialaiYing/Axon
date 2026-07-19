"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * If the user is signed in and the value is a data URL, upload it to the
 * `flashcard-images` bucket and return a public URL. Otherwise return the
 * original value (keeps offline / anonymous local data URLs working).
 */
export async function maybeUploadFlashcardImage(
  imageDataUrl: string | undefined,
  folderId: string
): Promise<string | undefined> {
  if (!imageDataUrl || !imageDataUrl.startsWith("data:")) return imageDataUrl;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return imageDataUrl;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return imageDataUrl;

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
  if (!match?.[1] || !match[2]) return imageDataUrl;

  const contentType = match[1];
  const base64 = match[2];
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const path = `${user.id}/${folderId}.${ext}`;

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { error } = await supabase.storage.from("flashcard-images").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.error("Flashcard image upload failed", error);
    return imageDataUrl;
  }

  const { data } = supabase.storage.from("flashcard-images").getPublicUrl(path);
  return data.publicUrl || imageDataUrl;
}
