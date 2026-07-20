/**
 * Shared input sanitization for auth and user-generated text.
 * Rejects oversized / malformed payloads before they hit Supabase or storage.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeEmail(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Email is required." };
  const value = raw.trim().toLowerCase();
  if (!value) return { ok: false, error: "Email is required." };
  if (value.length > 254) return { ok: false, error: "Email is too long." };
  if (!EMAIL_RE.test(value)) return { ok: false, error: "Enter a valid email address." };
  return { ok: true, value };
}

export function sanitizePassword(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Password is required." };
  if (raw.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (raw.length > 128) return { ok: false, error: "Password is too long." };
  return { ok: true, value: raw };
}

export function sanitizeDisplayName(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Name is required." };
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) return { ok: false, error: "Name is required." };
  if (value.length > 60) return { ok: false, error: "Name must be under 60 characters." };
  if (/[<>{}]/.test(value)) return { ok: false, error: "Name contains invalid characters." };
  return { ok: true, value };
}

export function sanitizeShortText(
  raw: unknown,
  label: string,
  max = 120
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: `${label} is required.` };
  const value = raw.trim();
  if (!value) return { ok: false, error: `${label} is required.` };
  if (value.length > max) return { ok: false, error: `${label} must be under ${max} characters.` };
  return { ok: true, value };
}

export function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
