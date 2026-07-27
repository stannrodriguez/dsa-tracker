# dsa-tracker

A 28-day DSA prep tracker. Vite + React, one JSON blob of state, synced to a single
Supabase row that is gated by a passphrase you type once per device.

## Run it locally

```bash
npm install
cp .env.example .env
# fill in the two values, then
npm run dev
```

Without the two env vars the app still runs — it falls back to localStorage only.

## 1. The SQL to paste

Open your Supabase project → **SQL Editor** → new query → paste
[`supabase/schema.sql`](supabase/schema.sql) → **Run**. It creates the table, turns on
RLS, and adds the three policies:

```sql
create table if not exists public.tracker_state (
  id uuid primary key default gen_random_uuid(),
  secret text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists tracker_state_secret_idx on public.tracker_state (secret);

alter table public.tracker_state enable row level security;

create policy "read own row"
  on public.tracker_state
  for select
  using (
    secret = (current_setting('request.headers', true)::json ->> 'x-tracker-secret')
  );

create policy "create own row"
  on public.tracker_state
  for insert
  with check (
    secret = (current_setting('request.headers', true)::json ->> 'x-tracker-secret')
  );

create policy "update own row"
  on public.tracker_state
  for update
  using (
    secret = (current_setting('request.headers', true)::json ->> 'x-tracker-secret')
  )
  with check (
    secret = (current_setting('request.headers', true)::json ->> 'x-tracker-secret')
  );
```

The app sends your passphrase on every request as the `x-tracker-secret` header.
PostgREST — the layer behind the Supabase REST API — exposes request headers to SQL as a
JSON GUC, with **header names lowercased**, so `current_setting('request.headers', true)::json ->> 'x-tracker-secret'`
is the form to use. (The older `current_setting('request.header.x-tracker-secret', true)`
spelling is the legacy pre-JSON-GUC syntax and is not what current Supabase projects use.)

There is no Supabase Auth in play. Your passphrase is the only credential, so pick a long
random one — anyone with it can read and write your row.

### Optional: lock out new rows

Once your row exists and you have entered the passphrase on every device you use, run
[`supabase/lock-inserts.sql`](supabase/lock-inserts.sql) once:

```sql
drop policy if exists "create own row" on public.tracker_state;
```

After that nobody can create rows in this table; reading and updating the existing row
with a matching passphrase keeps working. If you later need a fresh row, re-add the
insert policy from `schema.sql`.

## 2. Where your two env values go

Supabase → **Project Settings → API** gives you the Project URL and the `anon` public key.

| Variable                 | Value                                |
| ------------------------ | ------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://<project-ref>.supabase.co`  |
| `VITE_SUPABASE_ANON_KEY` | the `anon` / `public` key            |

- **Locally:** put them in `.env` (git-ignored; `.env.example` is the template).
- **On Vercel:** Project → **Settings → Environment Variables** → add those two names,
  for Production, Preview, and Development. Redeploy after adding them — Vite inlines
  env vars at build time, so a running deployment will not pick up new values.

Only `VITE_`-prefixed vars reach the browser bundle, which is what we want here: the anon
key is public by design, and RLS is what actually protects the row.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. Vercel → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist` —
   Vercel detects both. No `vercel.json` is needed: this is a single-page app with no
   custom routing, and Vercel's Vite preset already serves `index.html` for unknown paths.
4. Add the two environment variables above, then **Deploy**.
5. Open the deployment, enter your sync passphrase at the prompt, and the first row is
   created for you.

## How syncing behaves

- The passphrase is read from `localStorage` on load; if it is missing you get the inline
  prompt, and it is stored once you submit it.
- On mount the app selects the row for that passphrase, creating it if none exists.
- Every state change is written to the `localStorage` cache immediately and pushed to
  Supabase on a ~1.5s debounce, last-write-wins.
- If Supabase is unreachable the app loads from the cache, keeps working, shows a quiet
  `offline — will sync` note, and retries in the background. A failed save never blocks
  the UI; it shows `save failed — retrying` instead.
- **Export JSON** / **Import JSON** in the footer are the manual backup pair.
- **Reset everything** confirms first, then wipes state and restarts the 28 days from
  today.

## State shape

```jsonc
{
  "startDate": "2026-07-27",
  "problems": [
    {
      "id": "…",
      "date": "2026-07-27",
      "name": "Coin Change",
      "pattern": "DP",
      "difficulty": "medium",  // easy 8m · medium 15m · hard 40m
      "minutes": 12,
      "result": "clean",       // clean | rough | missed
      "narrated": false,
      "reviewed": false
    }
  ],
  "ladder": { "lad:0": true },
  "machines": { "mac:0": true },
  "objectives": { "w1:0": true },
  "mocks": 0,
  "contests": 0
}
```

Objectives marked `auto` in the plan are derived from state and are not clickable:
first/second human mock (`mocks >= 1` / `>= 2`), mocks three and four (`mocks >= 4`),
four contests (`contests >= 4`), all 8 ladder rungs, and review queue at zero.
