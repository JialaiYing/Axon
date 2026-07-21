# Security audit report — Axon

**Date:** July 20, 2026 (updated same day — added security headers + dependency/secret re-scan)  
**Scope:** Application source under `src/`, Supabase schema, env handling, auth flows, HTTP response headers, dependency tree.

## Executive summary

Axon is primarily a **client-side, offline-first** Next.js app. Sensitive study data lives in `localStorage` unless the user signs in and syncs to Supabase. Cloud access is gated by **Row Level Security (RLS)** on every user-owned table. Dedicated `/api/auth/login` and `/api/auth/signup` routes add **rate limiting** (5 attempts / 15 minutes per IP) and **input sanitization**.

## Checklist results

| Item | Status | Notes |
|------|--------|-------|
| 1. Rate limit login (5 / 15 min) | Done | `src/lib/security/rate-limit.ts` + `/api/auth/login` + `/api/auth/signup` |
| 2. Scan for hardcoded secrets | Done | No API keys/passwords committed; only `NEXT_PUBLIC_*` placeholders in `.env.example` |
| 3. Secrets in env / not in git | Done | `.gitignore` excludes `.env*.local`; anon key is public-by-design for Supabase clients |
| 4. Sanitize / reject oversized input | Done | `src/lib/security/sanitize.ts` on auth APIs; form maxLengths on client |
| 5. URL IDOR (user A opens user B’s URL) | N/A / Mitigated | App routes are shared (`/dashboard`, etc.). Cloud rows are keyed by `user_id` with RLS `auth.uid() = user_id`. No per-user secret URLs. |
| 6. Session after logout | Mitigated | `signOut()` clears Supabase session; replaying a page URL does not restore auth. Sync requires a valid session JWT. |
| 7. Skip if N/A | Applied | No generic REST CRUD endpoints exposing other users’ resources |
| 8. Remaining vulnerabilities | See below | |
| 9. Security response headers | Done | `next.config.mjs` sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS on every route |
| 10. Dependency vulnerability scan | Done | `npm audit` — 0 high/critical; 2 moderate advisories, both inside `next`'s own bundled build-time `postcss` (CSS stringifier used by Next's tooling, not by app-rendered pages) — no fix without a major Next downgrade; low real-world risk, monitor for a Next patch release |
| 11. Re-scan for hardcoded secrets + committed env files | Done | No `.env`/`.env.local` ever committed (checked full git history); no live keys in source, docs, or scripts |

## Secrets scan

Searched `src/`, `supabase/`, docs, README for hardcoded keys/tokens. Findings were limited to:

- Auth function names (`signInWithPassword`)
- Documentation mentions of Supabase Client Secret (setup instructions only)
- CSS `mask-*` properties (false positives)

**Do not commit** `.env.local`. The anon key is safe to expose in the browser; **never** put the service role key in `NEXT_PUBLIC_*` or client bundles.

## Authz model (questions 5–6)

1. **Another user’s URL:** Opening `/dashboard` or `/kanban` as user B does not load user A’s cloud data. Sync client only reads rows where RLS allows `auth.uid() = user_id`. Local `localStorage` is per-browser profile, not per URL.
2. **After logout:** Session tokens are cleared. Without a session, Supabase requests fail RLS. Local offline data on that browser remains (by design) until storage is cleared.

## Remaining risks / recommendations

1. **In-memory rate limiter** resets on cold serverless instances. Pair with Supabase Auth dashboard rate limits and/or an edge KV store for multi-region production.
2. **XSS via unsanitized rich text** — titles/notes are React-escaped when rendered as text; avoid `dangerouslySetInnerHTML` for user content (none found in critical paths).
3. **localStorage XSS theft** — any future XSS could read offline data; CSP is now in place (see below) to reduce that risk, though `script-src`/`style-src` still allow `'unsafe-inline'` (required by the inline theme-flash script and by Framer Motion's inline styles). A stricter nonce-based CSP is possible later but not required to deploy safely.
4. **Google OAuth redirect** — ensure Supabase redirect allow-list matches production origin.
5. **Email enumeration** — login API returns a generic “Invalid email or password” message (good); keep it that way.
6. **No middleware forcing auth** — intentional for offline-first. If you later require accounts, add cookie-based middleware.
7. **`npm audit` moderate advisories** — both trace to `postcss` bundled *inside* `next`'s own dependency tree (build tooling), not a dependency of the shipped app code. No action needed beyond watching for a Next.js point release.

## Security headers (added)

`next.config.mjs` now sends these on every response:

- `Content-Security-Policy` — restricts scripts/styles/connects to `'self'` plus `*.supabase.co` (needed for optional auth/sync), blocks framing entirely, blocks plugins/objects.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` — clickjacking protection.
- `X-Content-Type-Options: nosniff` — stops MIME-sniffing attacks.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — denies camera/microphone/geolocation (unused by the app).
- `Strict-Transport-Security` — forces HTTPS once deployed (no effect on `localhost`).

## Files added for hardening

- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/security/sanitize.ts`
- `src/lib/supabase/server.ts`
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `next.config.mjs` — response security headers / CSP
