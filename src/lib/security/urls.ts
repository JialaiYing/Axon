/**
 * Same-origin relative path only. Rejects protocol-relative (`//evil.com`),
 * backslashes, and absolute URLs. Returns null when unsafe/missing.
 */
export function safeInternalPathOrNull(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  if (path.includes("\\")) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return null;
  return path;
}

export function safeInternalPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  return safeInternalPathOrNull(raw) ?? fallback;
}

/** Allow only http(s) absolute URLs for user-supplied links. */
export function safeExternalHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
