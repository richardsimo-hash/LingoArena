-- Weekly leaderboard (opt-in). Each row shares only a first name and that week's XP.
create table if not exists public.weekly_xp (
  user_id uuid not null references auth.users (id) on delete cascade,
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  xp integer not null default 0 check (xp >= 0 and xp < 100000),
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);
alter table public.weekly_xp enable row level security;

drop policy if exists "weekly_xp: signed-in users read" on public.weekly_xp;
create policy "weekly_xp: signed-in users read" on public.weekly_xp for select to authenticated using (true);
drop policy if exists "weekly_xp: insert own" on public.weekly_xp;
create policy "weekly_xp: insert own" on public.weekly_xp for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "weekly_xp: update own" on public.weekly_xp;
create policy "weekly_xp: update own" on public.weekly_xp for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "weekly_xp: delete own" on public.weekly_xp;
create policy "weekly_xp: delete own" on public.weekly_xp for delete to authenticated using (auth.uid() = user_id);

create index if not exists weekly_xp_board on public.weekly_xp (week, xp desc);
