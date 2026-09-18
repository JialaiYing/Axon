# Deploy preflight checklist

Run through this before pointing a public URL at Axon. Skipping any of these breaks auth, sync, or SEO.

## Required for any production deploy

1. **Apply schema** — run `supabase/schema.sql` in the Supabase SQL editor (includes RLS + storage policies).
2. **Env vars on the host** (Vercel → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-real-domain.com` (no trailing slash)
   - `SUPABASE_SERVICE_ROLE_KEY` = service role / secret key (server-only; enables Delete account + storage purge)
   - `CRON_SECRET` = random 16+ character string (server-only; Vercel Cron sends it as `Authorization: Bearer …` to `/api/cron/keep-alive`)
3. **Supabase Auth → URL configuration**
   - Site URL = production origin
   - Redirect allow-list includes `https://your-domain.com/**` and `/dashboard` OAuth callback
4. **Google OAuth** (if enabled) — consent screen + Supabase provider redirect URIs match production.
5. **Auth rate limits** — turn on Supabase dashboard Auth rate limits (in-memory app limits are weak on serverless).
6. **Email confirmation** — decide on/off in Supabase Auth settings and match signup UX.
7. **Keep-alive cron** — after deploy, confirm Vercel → Settings → Cron Jobs lists `/api/cron/keep-alive` daily. Restore a paused Supabase project from the dashboard first; the cron only prevents future pauses.

## Smoke test after deploy

- [ ] Open site over HTTPS; landing loads; unauthenticated `/dashboard` redirects to `/login`
- [ ] Sign up / sign in / Google (required — dashboard is account-gated)
- [ ] Create an objective → appears after refresh / second device pull
- [ ] Delete an objective on device A → gone on device B after sync/pull
- [ ] Sign out → local study data cleared; guest session starts empty
- [ ] Settings → Delete account (only if service role key is set) — confirm flashcard images are gone from Storage
- [ ] `/sitemap.xml` and OG tags use the production host, not localhost
- [ ] `/login` stays dark even if the dashboard theme is light
- [ ] Cron keep-alive: Vercel → Cron Jobs shows `/api/cron/keep-alive`; Run Now returns `{ ok: true }` once the project is restored

Full walkthrough: [`supabase-setup.md`](./supabase-setup.md).
