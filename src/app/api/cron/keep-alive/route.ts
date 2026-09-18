import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAnon } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Vercel Cron keep-alive for free-tier Supabase.
 * Free projects pause after ~7 days without database activity. Hitting the
 * REST health endpoint is not enough — this issues a real PostgREST select
 * so Postgres sees a query and the inactivity timer resets.
 */
function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const expected = Buffer.from(secret);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin() ?? getSupabaseServerAnon();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { error } = await supabase.from("profiles").select("id").limit(1);
  if (error) {
    console.error("keep-alive ping failed", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
  });
}
