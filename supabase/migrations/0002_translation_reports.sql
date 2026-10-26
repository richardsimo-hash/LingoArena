-- Learner reports about course phrases (wrong translation, unnatural, typo, audio).
-- Written only by the server (/api/feedback with the service-role key); read them in the
-- Supabase Table Editor. Row-level security is on with no policies, so the public anon key
-- can neither read nor write this table.
create table if not exists public.translation_reports (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  concept_id text not null,
  target text not null,
  native text not null,
  phrase_target text not null default '',
  phrase_native text not null default '',
  reason text not null check (reason in ('wrong_translation', 'unnatural', 'typo', 'audio')),
  comment text not null default '' check (char_length(comment) <= 300),
  resolved boolean not null default false
);

alter table public.translation_reports enable row level security;

create index if not exists translation_reports_open on public.translation_reports (target, concept_id) where not resolved;
