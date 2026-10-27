-- Global Ideology: crash capture, run data and bug reports (v10.18). Safe to run more than once.
-- Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- Three tables, insert-only for the game (anon and signed-in players). The game can never read, change or
-- delete rows: there are no select/update/delete policies and no such grants. You read the data in the
-- dashboard (Table editor or SQL Editor), which runs with full rights.
--   gi_errors   JavaScript errors caught in the game
--   gi_runs     run_start / run_end (and run_continue / run_final for runs that use "Continue playing")
--   gi_reports  "Report a bug" messages with a snapshot of the game state
-- Size limits are enforced by CHECK constraints, so a hostile client cannot fill the tables with huge rows.

create table if not exists public.gi_errors (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  anon_id       uuid not null,
  user_id       uuid,
  version       text not null,
  channel       text not null,
  message       text not null,
  stack         text,
  src           text,          -- onerror | unhandledrejection | loop
  ua            text,
  screen        text,
  lang          text,
  level         text,
  start_country text,
  week          int
);

create table if not exists public.gi_runs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  anon_id       uuid not null,
  user_id       uuid,
  version       text not null,
  channel       text not null,
  event         text not null, -- run_start | run_end | run_continue | run_final
  run_id        uuid not null, -- one id per run; all events of a run share it
  level         text,
  start_country text,
  lang          text,
  seed          bigint,
  upgrades      text[],        -- upgrade ids in the order they were bought
  outcome       text,          -- win | collapse | perfect | treaty | coup | baseLost | extinct | retired | abandoned
  reason        text,          -- abandoned only: new_game | page_closed | logout | replaced
  weeks         int,
  stars         int,
  score         int,
  held          int,
  peak_share    real,          -- 0..1
  avg_noto      int,
  peak_noto     int,
  uprisings     int,
  coups         int,
  relocations   int,
  used_continue boolean,
  session_min   real           -- minutes of play with the page visible
);

create table if not exists public.gi_reports (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  anon_id       uuid not null,
  user_id       uuid,
  version       text not null,
  channel       text not null,
  report        text not null,
  contact       text,          -- optional, typed by the player
  source        text,          -- more | end
  seed          bigint,
  week          int,
  level         text,
  start_country text,
  lang          text,
  ua            text,
  screen        text,
  state_trim    text,          -- none | news | dropped (how much of the state had to be cut to fit)
  state         jsonb          -- same shape as a save: { fmt, week, share, savedAt, S, selected }
);

-- Limits (drop + add, so re-running updates them).
alter table public.gi_errors  drop constraint if exists gi_errors_limits;
alter table public.gi_errors  add  constraint gi_errors_limits check (
  char_length(message) <= 2000 and (stack is null or char_length(stack) <= 8000)
  and char_length(version) <= 16 and channel in ('live','beta','dev')
  and (src is null or char_length(src) <= 32) and (ua is null or char_length(ua) <= 300)
  and (screen is null or char_length(screen) <= 20) and (lang is null or char_length(lang) <= 8)
  and (level is null or char_length(level) <= 16) and (start_country is null or char_length(start_country) <= 32)
  and (week is null or week between 0 and 100000));

alter table public.gi_runs    drop constraint if exists gi_runs_limits;
alter table public.gi_runs    add  constraint gi_runs_limits check (
  char_length(version) <= 16 and channel in ('live','beta','dev')
  and event in ('run_start','run_end','run_continue','run_final')
  and (level is null or char_length(level) <= 16) and (start_country is null or char_length(start_country) <= 32)
  and (lang is null or char_length(lang) <= 8) and (outcome is null or char_length(outcome) <= 24)
  and (reason is null or char_length(reason) <= 24)
  and (upgrades is null or (cardinality(upgrades) <= 64 and pg_column_size(upgrades) <= 2000))
  and (weeks is null or weeks between 0 and 100000) and (stars is null or stars between 0 and 3)
  and (score is null or score between -100000 and 100000) and (held is null or held between 0 and 100)
  and (peak_share is null or peak_share between 0 and 1)
  and (avg_noto is null or avg_noto between 0 and 1000) and (peak_noto is null or peak_noto between 0 and 1000)
  and (uprisings is null or uprisings between 0 and 1000) and (coups is null or coups between 0 and 1000)
  and (relocations is null or relocations between 0 and 1000)
  and (session_min is null or session_min between 0 and 100000));

alter table public.gi_reports drop constraint if exists gi_reports_limits;
alter table public.gi_reports add  constraint gi_reports_limits check (
  char_length(report) between 1 and 2000 and (contact is null or char_length(contact) <= 200)
  and char_length(version) <= 16 and channel in ('live','beta','dev')
  and (source is null or char_length(source) <= 16) and (week is null or week between 0 and 100000)
  and (level is null or char_length(level) <= 16) and (start_country is null or char_length(start_country) <= 32)
  and (lang is null or char_length(lang) <= 8) and (ua is null or char_length(ua) <= 300)
  and (screen is null or char_length(screen) <= 20) and (state_trim is null or char_length(state_trim) <= 16));
alter table public.gi_reports drop constraint if exists gi_reports_state_size;
alter table public.gi_reports add  constraint gi_reports_state_size check (state is null or (pg_column_size(state) <= 200000 and jsonb_typeof(state) = 'object'));

create index if not exists gi_errors_created_idx  on public.gi_errors  (created_at desc);
create index if not exists gi_runs_run_idx        on public.gi_runs    (run_id);
create index if not exists gi_runs_created_idx    on public.gi_runs    (created_at desc);
create index if not exists gi_reports_created_idx on public.gi_reports (created_at desc);

-- Row-level security: insert only. A signed-in player may attach their own user_id; an anonymous client may not
-- send one at all, so nobody can file rows under somebody else's account.
alter table public.gi_errors  enable row level security;
alter table public.gi_runs    enable row level security;
alter table public.gi_reports enable row level security;

drop policy if exists "gi_errors: insert anon"   on public.gi_errors;
drop policy if exists "gi_errors: insert authed" on public.gi_errors;
create policy "gi_errors: insert anon"   on public.gi_errors for insert to anon          with check (user_id is null);
create policy "gi_errors: insert authed" on public.gi_errors for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "gi_runs: insert anon"   on public.gi_runs;
drop policy if exists "gi_runs: insert authed" on public.gi_runs;
create policy "gi_runs: insert anon"   on public.gi_runs for insert to anon          with check (user_id is null);
create policy "gi_runs: insert authed" on public.gi_runs for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "gi_reports: insert anon"   on public.gi_reports;
drop policy if exists "gi_reports: insert authed" on public.gi_reports;
create policy "gi_reports: insert anon"   on public.gi_reports for insert to anon          with check (user_id is null);
create policy "gi_reports: insert authed" on public.gi_reports for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));

revoke all on public.gi_errors, public.gi_runs, public.gi_reports from anon, authenticated, public;
grant insert on public.gi_errors, public.gi_runs, public.gi_reports to anon, authenticated;

-- Check: expect rls_on = 3 and policies = 6.
select (select count(*) from pg_tables where schemaname = 'public' and tablename in ('gi_errors','gi_runs','gi_reports') and rowsecurity) as rls_on,
       (select count(*) from pg_policies where schemaname = 'public' and tablename in ('gi_errors','gi_runs','gi_reports')) as policies;
