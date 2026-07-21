import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { clientIpFromRequest, rateLimit } from "@/lib/security/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const FLASHCARD_BUCKET = "flashcard-images";

/**
 * Lists and removes every object under `{userId}/` in the flashcard-images
 * bucket. Best-effort: failures are logged but do not block account deletion
 * (DB rows still cascade with the auth user).
 */
async function purgeUserFlashcardImages(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  userId: string
) {
  const paths: string[] = [];
  let offset = 0;
  const pageSize = 100;

  for (;;) {
    const { data, error } = await admin.storage.from(FLASHCARD_BUCKET).list(userId, {
      limit: pageSize,
      offset,
    });
    if (error) {
      console.error("delete-account storage list failed", error.message);
      return;
    }
    if (!data || data.length === 0) break;
    for (const obj of data) {
      if (obj.name) paths.push(`${userId}/${obj.name}`);
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  if (paths.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    const { error } = await admin.storage.from(FLASHCARD_BUCKET).remove(chunk);
    if (error) {
      console.error("delete-account storage remove failed", error.message);
    }
  }
}

/**
 * Permanently deletes the authenticated user's Supabase account.
 * Cascades cloud study rows via FK ON DELETE CASCADE and purges flashcard
 * Storage objects. Requires SUPABASE_SERVICE_ROLE_KEY.
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

  const userId = userData.user.id;

  // Purge storage first — auth delete cascades DB rows but not Storage objects.
  await purgeUserFlashcardImages(admin, userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
  if (deleteError) {
    console.error("delete-account failed", deleteError.message, deleteError);
    const needsServiceRole =
      deleteError.message?.includes("not allowed") || deleteError.status === 403;
    return NextResponse.json(
      {
        error: needsServiceRole
          ? "Server key lacks admin permission. Use the secret / service_role key from Supabase → Settings → API Keys."
          : "Could not delete account. Try again in a moment, or contact support if it keeps failing.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
