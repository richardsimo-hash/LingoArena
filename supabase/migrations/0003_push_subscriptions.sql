-- Web push reminder subscriptions. Written and read only by the server (service-role key);
-- RLS is on with no policies, so the public anon key cannot see or change them.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  reminder_hour smallint not null check (reminder_hour between 0 and 23),
  tz_offset_min smallint not null default 0, -- minutes to add to UTC to get local time
  last_active date,                          -- learner's local date of last practice
  native text not null default 'en',
  last_sent date,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
