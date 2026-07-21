import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { clientIpFromRequest, rateLimit } from "@/lib/security/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Permanently deletes the authenticated user's Supabase account.
 * Cascades cloud study rows via FK ON DELETE CASCADE.
 * Requires SUPABASE_SERVICE_ROLE_KEY (legacy service_role JWT or sb_secret_…).
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`auth:delete:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Account deletion is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server and redeploy.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized — sign in again." }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized — sign in again." }, { status: 401 });
  }

  // Validate the caller's JWT (do not also set Authorization on createClient —
  // that can confuse new publishable keys).
  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    console.error("delete-account auth failed", userError?.message);
    return NextResponse.json(
      { error: "Session expired. Sign out, sign in, then try Delete account again." },
      { status: 401 }
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
  if (deleteError) {
    console.error("delete-account failed", deleteError.message, deleteError);
    return NextResponse.json(
      {
        error:
          deleteError.message?.includes("not allowed") || deleteError.status === 403
            ? "Server key lacks admin permission. Use the secret / service_role key from Supabase → Settings → API Keys."
            : `Could not delete account: ${deleteError.message || "unknown error"}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
