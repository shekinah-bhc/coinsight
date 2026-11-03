import { createClient } from "@/lib/supabase/server";

/**
 * Resolves an avatar identifier into a renderable URL.
 *
 * Handles:
 * 1. Preset static avatars (e.g., `/avatars/avatar-1.webp`) -> returned directly.
 * 2. External HTTP(S) links -> returned directly.
 * 3. Private Supabase Storage object paths (e.g., `{userId}/{uuid}.webp`) ->
 *    generates a temporary 1-hour signed URL on the server.
 */
export async function resolveAvatarUrl(
  avatarUrl: string | null | undefined
): Promise<string | null> {
  if (!avatarUrl || typeof avatarUrl !== "string" || avatarUrl.trim() === "") {
    return null;
  }

  const trimmed = avatarUrl.trim();

  // Local preset assets
  if (trimmed.startsWith("/avatars/") || trimmed.startsWith("/")) {
    return trimmed;
  }

  // Absolute URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Supabase private storage object path: {userId}/{fileName}
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(trimmed, 3600); // 1 hour validity

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

