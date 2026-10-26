# Sign-in and cross-device sync (Supabase)

LingoArena works without an account. When these steps are done, the welcome/settings dialog shows
**Continue with Google / Apple / Microsoft** at the bottom, and signed-in learners get their lessons,
review deck, XP, streak, name and settings synced across devices. Free Talk transcripts are never uploaded.

Until the keys below exist, the sign-in section is hidden and the Supabase library is never downloaded.

## 1. Create the Supabase project (free)
Easiest: Vercel dashboard → **lingoarena** project → **Integrations / Storage** → add **Supabase**.
This creates the project and adds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project.

Or create it at supabase.com and add these Vercel environment variables yourself (Production + Preview):

| Variable | Where to find it | Public? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | yes, by design |
| `VITE_SUPABASE_ANON_KEY` (or `..._PUBLISHABLE_KEY`) | Supabase → Project Settings → API → anon / publishable key | yes, by design |
| `VITE_AUTH_PROVIDERS` (optional) | e.g. `google,azure` to hide Apple until it is set up | yes |

Never add the **service_role / secret** key to Vercel with a `VITE_` or `NEXT_PUBLIC_` prefix — those are compiled into the public site.

## 2. Create the tables
Supabase → **SQL Editor** → paste and run, in order:
- `supabase/migrations/0001_progress.sql` — `public.progress` with row-level security: each user can only read/write their own row.
- `supabase/migrations/0002_translation_reports.sql` — `public.translation_reports`, where learners' "Report translation" flags are stored. Only the server can write it; read it in the Table Editor.

For translation reports to reach the database, add **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Project Settings → API → service_role / secret key) to Vercel as a **server-only** variable — no `VITE_` / `NEXT_PUBLIC_` prefix. Without it, reports still appear in the Vercel function logs.

## 3. URLs
Supabase → **Authentication → URL Configuration**
- Site URL: `https://lingoarena.vercel.app`
- Redirect URLs: `https://lingoarena.vercel.app/**` and, for local testing, `http://localhost:5173/**`

The callback URL every provider needs is: `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 4. Providers (Supabase → Authentication → Providers)
**Google** (free): Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (Web application),
add the callback URL above as an authorised redirect URI, then paste the Client ID and Secret into Supabase → Google.

**Microsoft** (free): Azure Portal → Microsoft Entra ID → App registrations → *New registration*,
supported accounts: "Any Entra ID tenant + personal Microsoft accounts", redirect URI (Web) = callback URL above.
Create a client secret, then in Supabase → **Azure**: Client ID, Secret, and Azure Tenant URL `https://login.microsoftonline.com/common`.

**Apple** (needs an Apple Developer account, $99/year): Certificates, Identifiers & Profiles → create a **Services ID**
with Sign in with Apple, return URL = callback URL above; create a **Key** with Sign in with Apple. Enter the Services ID,
Team ID, Key ID and private key in Supabase → Apple. Until then, set `VITE_AUTH_PROVIDERS=google,azure`.

## 5. Redeploy
Redeploy on Vercel (or push any commit). The sign-in buttons appear at the bottom of Settings.

## How sync behaves
- First sign-in on a device merges that device's progress with the account (nothing is lost; see `mergeStates`).
- Changes upload ~2 s later. Signing out keeps the progress on the device.
- Data stored per user: one JSON row (≈ tens of KB). Delete a user in Supabase → their row is deleted too.

## Push reminders (optional, free)
The calendar reminder in Settings works without any setup. For real notifications:
1. Run `supabase/migrations/0003_push_subscriptions.sql` in the SQL Editor.
2. Generate keys locally: `npx web-push generate-vapid-keys`.
3. Vercel env vars: `VITE_VAPID_PUBLIC_KEY` (public key — fine to expose), `VAPID_PRIVATE_KEY` (server-only),
   `VAPID_SUBJECT` (e.g. `mailto:you@example.com`), `CRON_SECRET` (any long random string), plus
   `SUPABASE_SERVICE_ROLE_KEY` from step 2 above.
4. GitHub → repository Settings → Secrets → Actions: add `CRON_SECRET` with the same value.
   `.github/workflows/reminders.yml` then calls `/api/cron-reminders` every hour (free for public repos).
5. Redeploy. Settings shows "Notifications on this device"; reminders go only to learners who
   have not practised that day, at their chosen hour and in their language.
