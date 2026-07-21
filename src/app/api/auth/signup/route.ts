import { NextResponse } from "next/server";
import { clientIpFromRequest, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail, sanitizePassword, sanitizeDisplayName } from "@/lib/security/sanitize";
import { getSupabaseServerAnon } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`auth:signup:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const { email: rawEmail, password: rawPassword, displayName: rawName } = body as {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
  };

  const email = sanitizeEmail(rawEmail);
  if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });
  const password = sanitizePassword(rawPassword);
  if (!password.ok) return NextResponse.json({ error: password.error }, { status: 400 });

  let displayName: string | undefined;
  if (rawName !== undefined && rawName !== null && String(rawName).trim()) {
    const name = sanitizeDisplayName(rawName);
    if (!name.ok) return NextResponse.json({ error: name.error }, { status: 400 });
    displayName = name.value;
  }

  const supabase = getSupabaseServerAnon();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    // Generic message — avoid leaking "User already registered" (email enumeration).
    return NextResponse.json(
      { error: "Could not create account. Try a different email or sign in instead." },
      { status: 400 }
    );
  }

  // Best-effort profile name update when session exists (email confirm may delay session).
  if (displayName && data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      display_name: displayName,
    });
  }

  return NextResponse.json({
    session: data.session,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    needsEmailConfirmation: !data.session,
  });
}
