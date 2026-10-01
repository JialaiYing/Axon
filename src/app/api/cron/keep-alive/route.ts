import { timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Tables the keep-alive reads with the anon key. Supabase pauses a free
 * project when it sees too few user database requests over the week — one
 * query a day is below that bar. Each entry is a separate PostgREST call.
 * An empty RLS result still counts: Postgres evaluated the policy.
 */
const READS: { table: string; column: string }[] = [
  { table: "profiles", column: "id" },
  { table: "objectives", column: "id" },
  { table: "progress", column: "user_id" },
  { table: "goals", column: "id" },
  { table: "pomodoro_sessions", column: "id" },
  { table: "flashcard_sets", column: "id" },
];

const MIN_SUCCESSFUL_QUERIES = 3;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  const token = match?.[1]?.trim();
  if (!token) return false;
  const expected = Buffer.from(secret);
  const provided = Buffer.from(token);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

/**
 * Anon key, not the service role. Supabase's pause check looks for user API
 * traffic; the service role is only a fallback when the anon key is absent.
 * `cache: "no-store"` so a daily invocation cannot reuse a cached response
 * and skip the database.
 */
function createKeepAliveClient(key: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const apiKey = key.trim();
  if (!url || !apiKey) return null;
  return createClient(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabase =
    (anonKey ? createKeepAliveClient(anonKey) : null) ??
    (serviceKey ? createKeepAliveClient(serviceKey) : null);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const results = await Promise.all(
    READS.map(async ({ table, column }) => {
      const { error } = await supabase.from(table).select(column).limit(1);
      return { table, ok: !error, message: error?.message };
    }),
  );

  const succeeded = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);

  if (succeeded.length < MIN_SUCCESSFUL_QUERIES) {
    console.error(
      "keep-alive ping failed",
      failed.map((result) => `${result.table}: ${result.message ?? "unknown"}`).join("; "),
    );
    return NextResponse.json(
      { ok: false, queries: succeeded.length, failed: failed.map((result) => result.table) },
      { status: 502 },
    );
  }

  for (const result of failed) {
    console.error("keep-alive read failed", result.table, result.message);
  }

  console.info("keep-alive ok", { queries: succeeded.length });

  return NextResponse.json({
    ok: true,
    queries: succeeded.length,
    pingedAt: new Date().toISOString(),
  });
}
