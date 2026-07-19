# Supabase setup for Axon — complete walkthrough

This guide assumes you have never used Supabase before. Follow every step in order. When you’re done, signing in from Axon’s avatar menu will sync your study data to the cloud.

**What you’re building**

- Axon still works **offline** with no account (data in the browser).
- Signing in turns on **background sync** so the same data appears on other devices.
- Each user only sees **their own** rows (Row Level Security).

**Time:** about 15–25 minutes for email auth; add ~10 minutes if you also want Google sign-in.

**You will need**

- A browser
- The Axon repo on your machine (`c:\Users\jiala\Developer\Axon` or wherever you cloned it)
- An email address (for a Supabase account)
- Optional: a Google Cloud account (only if you want “Continue with Google”)

---

## Part A — Create a Supabase account and project

### A1. Open Supabase

1. Go to [https://supabase.com](https://supabase.com).
2. Click **Start your project** (or **Sign in** if you already have an account).
3. Sign up with GitHub or email. Finish any email confirmation Supabase sends you.

### A2. Create an organization (first time only)

1. If Supabase asks you to create an organization, give it a name (e.g. `Personal` or your name).
2. Choose the free plan if offered.
3. Click **Create organization**.

### A3. Create the Axon project

1. From the dashboard, click **New project**.
2. Fill in:

   | Field | What to enter |
   | --- | --- |
   | **Organization** | The one you just created |
   | **Project name** | `axon` (or anything you’ll recognize) |
   | **Database password** | Click **Generate a password**, then **copy it somewhere safe** (password manager or a private note). You rarely need it day-to-day, but you cannot recover it easily later. |
   | **Region** | Pick the region **closest to you** (e.g. West US if you’re in Colorado). Lower latency = snappier sync. |
   | **Pricing plan** | Free |

3. Click **Create new project**.
4. Wait until the status shows the project is ready (often 1–2 minutes). The left sidebar will populate when it’s done.

You are now inside **one** Supabase project. All later steps happen inside this project.

---

## Part B — Copy API keys into Axon

Axon’s browser code only needs two **public** values. Never put the `service_role` secret key in the frontend or commit it to git.

### B1. Open the API settings

1. In the left sidebar, click the **gear icon** at the bottom: **Project Settings**.
2. In the settings submenu, click **API** (under “Configuration” / “Project Settings”).

### B2. Copy the two values you need

On the API page you should see:

1. **Project URL**  
   Looks like: `https://abcdefghijklmnop.supabase.co`  
   Copy the whole URL.

2. **Project API keys → `anon` `public`**  
   A long JWT-looking string starting with `eyJ...`  
   Copy that entire key.  
   **Do not** use `service_role` — that key bypasses security and must stay secret on a server only.

### B3. Create `.env.local` in the Axon repo

1. Open your Axon folder in Cursor / VS Code / File Explorer.
2. In the **root** of the repo (same folder as `package.json` and `README.md`), create a new file named exactly:

   ```text
   .env.local
   ```

   Tip: there is already a template file named `.env.example`. You can copy it:

   - Windows PowerShell (from the repo root):

     ```powershell
     Copy-Item .env.example .env.local
     ```

3. Open `.env.local` and replace the placeholders with your real values. Example shape:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...
   ```

   Rules:

   - No quotes around the values
   - No spaces around `=`
   - No trailing slash on the URL
   - One variable per line
   - Do not commit `.env.local` (it’s already gitignored via `.env*.local`)

### B4. Restart the Next.js dev server

Env vars are read **only at startup**.

1. In the terminal where `npm run dev` is running, press `Ctrl+C` to stop it.
2. Start it again:

   ```powershell
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

If the env file is wrong or missing, Axon still loads — but Sign in will say Supabase isn’t configured.

---

## Part C — Create the database tables (schema)

This step creates all tables, security policies, and the image storage bucket. You only need to do it **once** per project.

### C1. Open the SQL Editor

1. In the Supabase left sidebar, click **SQL Editor**.
2. Click **New query** (or **+ New query**).

### C2. Paste the Axon schema

1. On your computer, open the file:

   ```text
   Axon/supabase/schema.sql
   ```

2. Select **all** of its contents (`Ctrl+A`) and copy (`Ctrl+C`).
3. Paste into the empty Supabase SQL editor (`Ctrl+V`).

You should see SQL starting with a comment like `-- Axon Supabase schema`.

### C3. Run it

1. Click **Run** (bottom-right, or press `Ctrl+Enter`).
2. Wait a few seconds.
3. Success looks like a green/success notice, often with “Success. No rows returned” (that’s normal for `CREATE` statements).

If you see an error:

- Read the message carefully.
- Common cause: you only pasted **part** of the file — paste the entire file and run again.
- Most statements use `IF NOT EXISTS` / `DROP POLICY IF EXISTS`, so re-running the whole script is usually safe.

### C4. Confirm tables exist

1. Left sidebar → **Table Editor**.
2. You should see tables including at least:

   - `profiles`
   - `objectives`
   - `flashcard_folders`
   - `flashcard_sets`
   - `pomodoro_sessions`
   - `pomodoro_timers`
   - `goals`
   - `goal_history`
   - `goals_meta`
   - `progress`
   - `notifications`

Empty tables are expected until someone signs in and syncs.

### C5. Confirm the storage bucket

1. Left sidebar → **Storage**.
2. You should see a bucket named **`flashcard-images`**.
3. It should be **public** (so folder cover images can load in the app).

If the bucket is missing, re-run the bottom section of `schema.sql`, or create a public bucket named exactly `flashcard-images` and re-run the storage policies from the schema file.

---

## Part D — Configure authentication (email / password)

### D1. Set Site URL and redirect URLs (required)

Without this, Google sign-in and some email flows break. Do it even if you only use email for now.

1. Left sidebar → **Authentication**.
2. Open **URL Configuration** (sometimes under **Settings** inside Authentication).
3. Set:

   | Setting | Local development value |
   | --- | --- |
   | **Site URL** | `http://localhost:3000` |
   | **Redirect URLs** | Add both: `http://localhost:3000` and `http://localhost:3000/**` |

4. Click **Save**.

Later, when you deploy (e.g. Vercel), come back and also add:

- Site URL → your production URL (e.g. `https://axon.vercel.app`)
- Redirect URLs → `https://your-domain.com` and `https://your-domain.com/**`

### D2. Enable Email provider

1. Still under **Authentication**, open **Providers** (or **Sign In / Providers**).
2. Click **Email**.
3. Make sure **Enable Email provider** is **ON**.
4. Save if needed.

### D3. Make local sign-up easy (recommended for development)

By default Supabase may require users to click a confirmation email before they can sign in. That’s good for production, annoying while developing.

1. **Authentication → Providers → Email**, or **Authentication → Settings**.
2. Find **Confirm email** (wording may be “Confirm email” / “Enable email confirmations”).
3. For local testing: **turn confirmations OFF**.
4. Save.

Now “Create account” in Axon should sign you in immediately.

Before a public launch: turn confirmations **back ON**.

### D4. (Optional) Check password requirements

Under Email provider settings, note any minimum password length. Axon’s sign-up form requires at least **6** characters; if Supabase requires more, use a longer password.

---

## Part E — Google sign-in (optional)

Skip this entire part if email/password is enough.

### E1. Enable Google in Supabase

1. **Authentication → Providers → Google**.
2. Turn **Enable Sign in with Google** ON.
3. Leave the page open — you’ll need **Client ID** and **Client Secret** fields, and the **Callback URL** Supabase shows (looks like):

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   Copy that callback URL.

### E2. Create OAuth credentials in Google Cloud

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. If prompted, create or select a Google Cloud project (can be named `axon`).
3. Configure the **OAuth consent screen** if you haven’t yet:

   - User type: **External** (fine for personal / testing)
   - App name: `Axon`
   - Support email: your email
   - Save and continue through the wizard (Scopes can stay default for testing)
   - Add yourself as a **test user** if the app is in Testing mode

4. Back on **Credentials**, click **+ Create credentials → OAuth client ID**.
5. Application type: **Web application**.
6. Name: `Axon Supabase`.
7. Under **Authorized JavaScript origins**, add:

   - `http://localhost:3000`
   - Your Supabase project URL origin, e.g. `https://YOUR_PROJECT_REF.supabase.co`

8. Under **Authorized redirect URIs**, add **exactly** the Supabase callback from E1:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

9. Click **Create**.
10. Copy the **Client ID** and **Client Secret**.

### E3. Paste credentials into Supabase

1. Return to **Authentication → Providers → Google**.
2. Paste **Client ID** and **Client Secret**.
3. Save.

### E4. Test Google later

After finishing Part F, use **Continue with Google** in the Axon sign-in dialog. If it fails, double-check:

- Redirect URI matches character-for-character
- Site URL / Redirect URLs from Part D1 include `localhost:3000`
- You’re listed as a test user on the Google consent screen (while in Testing)

---

## Part F — Verify everything inside Axon

### F1. Start the app

```powershell
cd c:\Users\jiala\Developer\Axon
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (or go through the landing page into the app).

### F2. Sign up

1. In the top-right header, click the **round avatar**.
2. Click **Sign in**.
3. Switch to **Sign up** if needed.
4. Enter an email + password (6+ characters).
5. Submit.

Expected:

- Dialog closes (or shows a “check your inbox” note if email confirmation is still ON).
- Avatar menu shows your email under **Signed in**.
- A sync line appears (**Syncing…** then **Synced**).

### F3. Confirm a profile row was created

1. Supabase → **Table Editor → `profiles`**.
2. You should see one row with your user id / email.

### F4. Create data and watch it sync

1. In Axon, open **Kanban**.
2. Create a new objective (any title).
3. Wait a couple of seconds (sync is debounced ~1.2s after writes).
4. Avatar menu should show **Synced** (you can also click the sync row to force a sync).
5. Supabase → **Table Editor → `objectives`**.
6. You should see a row:

   - `id` = the objective id
   - `user_id` = your auth user id
   - `payload` = JSON of the objective
   - `updated_at` = recent timestamp

### F5. Confirm isolation (optional sanity check)

Sign out, create a second account, sign in. That second account should **not** see the first account’s objectives in Supabase when filtered by its own `user_id`. RLS enforces this automatically.

### F6. Cross-device check (optional)

1. Sign in on another browser / phone (or a private window) with the same account.
2. After sync finishes, your objectives should appear (localStorage on that device gets filled from Supabase).

---

## Part G — Production / Vercel (when you deploy)

Do this only when you have a live URL.

1. **Vercel project → Settings → Environment Variables**  
   Add the same two keys:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Apply to Production (and Preview if you want). Redeploy after saving.

2. **Supabase → Authentication → URL Configuration**

   - Site URL = `https://your-production-domain.com`
   - Redirect URLs include `https://your-production-domain.com/**`
   - Keep localhost URLs if you still develop locally

3. **Email confirmations**  
   Turn **Confirm email** back ON for real users.

4. **Google (if used)**  
   In Google Cloud OAuth client, add production origins/redirects as needed. The Supabase callback URL itself usually stays the same (`https://PROJECT_REF.supabase.co/auth/v1/callback`).

### Production checklist

- [ ] `.env` / Vercel env vars set (URL + anon key only)
- [ ] Schema already run once on this project
- [ ] Site URL + redirect URLs include production
- [ ] Email confirmation enabled for public use
- [ ] Google OAuth updated (if using Google)
- [ ] Test: sign up → create objective → row appears in Table Editor

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Sign-in dialog says Supabase isn’t configured | Missing / wrong `.env.local`, or server not restarted | Fix env file, restart `npm run dev` |
| Sign up works but nothing appears in Table Editor | Schema not run, or sync error | Run `supabase/schema.sql`; open browser DevTools → Console for sync errors |
| Sync stuck on **error** | RLS/table missing, or network | Confirm tables exist; check Console; click sync again while online |
| Sign up says check email and you can’t log in | Confirm email is ON | Disable for local dev, or click the email link |
| Google button fails / redirect error | Wrong redirect URI or Site URL | Match Part D1 + E2 exactly |
| Folder images don’t upload when signed in | Bucket missing / policies | Confirm Storage bucket `flashcard-images` exists; re-run schema storage section |
| Works on one computer, empty on another until sign-in | Expected | Data is local until you sign in; then sync fills the other device |

### How to read sync status in the app

Avatar menu (when signed in):

- **Syncing…** — push/pull in progress
- **Synced** — last full/push cycle succeeded
- **Offline** — browser reports offline
- **Sync error** — last attempt failed (check Console)

Click that row to force **Sync now**. Settings also has a **Sync now** button when signed in.

---

## How sync works (so the behavior makes sense)

1. Every feature still writes to **`localStorage` first**. The app never blocks on the network for normal edits.
2. When you **sign in**, Axon pushes local collections up and pulls remote rows down.
3. Conflicts use **last-write-wins** based on each item’s `updatedAt`.
4. After local edits, a **debounced push** (~1.2s) upserts to Supabase.
5. About every **60 seconds** (while the tab is visible), Axon **pulls** so other devices’ changes show up.
6. These stay **local-only** and never sync: calendar view mode, Pomodoro display mode, hidden objective IDs, onboarding “seen” flags (for now).

Synced collections:

- Objectives (Kanban + Calendar)
- Flashcard folders & sets
- Pomodoro sessions & timers
- Goals, goal history, goals meta
- Progress (XP bookkeeping)
- Timer notification archive

---

## Quick reference — files in this repo

| File | Purpose |
| --- | --- |
| [`.env.example`](../.env.example) | Template for env vars |
| `.env.local` | Your real keys (you create this; not committed) |
| [`supabase/schema.sql`](../supabase/schema.sql) | Paste into SQL Editor once |
| This doc | The setup steps you’re reading |

When all of Parts A–F succeed, you’re done: Supabase is live for Axon.
