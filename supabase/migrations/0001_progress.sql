-- LingoArena cloud progress: one row per signed-in user holding the app state JSON
-- (progress, review deck, XP, streak, name, settings). Free Talk transcripts are never uploaded.
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Each user can read and write only their own row; the public anon key cannot see anyone else's.
alter table public.progress enable row level security;

drop policy if exists "progress: read own" on public.progress;
create policy "progress: read own" on public.progress
  for select using (auth.uid() = user_id);

drop policy if exists "progress: insert own" on public.progress;
create policy "progress: insert own" on public.progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress: update own" on public.progress;
create policy "progress: update own" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress: delete own" on public.progress;
create policy "progress: delete own" on public.progress
  for delete using (auth.uid() = user_id);

-- Keep stored state to a sane size (about 1 MB) so a client bug cannot bloat the table.
alter table public.progress drop constraint if exists progress_state_size;
alter table public.progress add constraint progress_state_size check (pg_column_size(state) < 1000000);
