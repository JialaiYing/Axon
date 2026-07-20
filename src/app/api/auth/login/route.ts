import { NextResponse } from "next/server";
import { clientIpFromRequest, rateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail, sanitizePassword, sanitizeDisplayName } from "@/lib/security/sanitize";
import { getSupabaseServerAnon } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`auth:login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
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

  const { email: rawEmail, password: rawPassword } = body as {
    email?: unknown;
    password?: unknown;
  };

  const email = sanitizeEmail(rawEmail);
  if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });
  const password = sanitizePassword(rawPassword);
  if (!password.ok) return NextResponse.json({ error: password.error }, { status: 400 });

  const supabase = getSupabaseServerAnon();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  return NextResponse.json({
    session: data.session,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
  });
}
