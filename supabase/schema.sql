-- DSA tracker storage. Run once in the Supabase SQL editor.

create table if not exists public.tracker_state (
  id uuid primary key default gen_random_uuid(),
  secret text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists tracker_state_secret_idx on public.tracker_state (secret);

alter table public.tracker_state enable row level security;

-- The app sends the passphrase as the `x-tracker-secret` request header.
-- PostgREST exposes request headers as a JSON GUC with lowercased keys.
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
