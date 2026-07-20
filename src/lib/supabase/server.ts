import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the public anon key.
 * Never import the service role key into the browser.
 */
export function getSupabaseServerAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
