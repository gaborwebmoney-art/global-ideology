-- Global Ideology v10.19 + v10.20: run once in the Supabase SQL Editor (safe to re-run). Also folded into supabase-telemetry.sql.
-- 1) endgame columns for gi_runs, 2) rate limits against junk inserts, 3) lock down rls_auto_enable(), 4) refresh the results view.

-- 1. Endgame fields on run_end / run_final (v10.19: breakup_week, cap_auto, cap_terms, win_type; v10.20: cap_ultimatum)
alter table public.gi_runs add column if not exists breakup_week  int;
alter table public.gi_runs add column if not exists cap_auto      int;
alter table public.gi_runs add column if not exists cap_terms     int;
alter table public.gi_runs add column if not exists win_type      text;
alter table public.gi_runs add column if not exists cap_ultimatum int;
alter table public.gi_runs drop constraint if exists gi_runs_endgame_limits;
alter table public.gi_runs add  constraint gi_runs_endgame_limits check (
  (breakup_week is null or breakup_week between 0 and 100000)
  and (cap_auto is null or cap_auto between 0 and 1000) and (cap_terms is null or cap_terms between 0 and 1000)
  and (cap_ultimatum is null or cap_ultimatum between 0 and 1000)
  and (win_type is null or char_length(win_type) <= 16));

-- 2. Rate limits. Rows over a limit are dropped silently (the client sees success, so it does not retry in a loop).
--    Per device (anon_id) per window, plus a global per-minute and per-day ceiling that also caps rotating fake device ids
--    and keeps the free-tier database (500 MB) safe. Normal play sends a few rows per run.
create index if not exists gi_errors_anon_idx  on public.gi_errors  (anon_id, created_at desc);
create index if not exists gi_runs_anon_idx    on public.gi_runs    (anon_id, created_at desc);
create index if not exists gi_reports_anon_idx on public.gi_reports (anon_id, created_at desc);

create or replace function public.gi_rate_limit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  dev_max int; dev_win interval; min_max int; day_max int; n int;
begin
  if tg_table_name = 'gi_runs' then dev_max := 60; dev_win := interval '10 minutes'; min_max := 120; day_max := 20000;
  elsif tg_table_name = 'gi_errors' then dev_max := 30; dev_win := interval '10 minutes'; min_max := 60; day_max := 5000;
  elsif tg_table_name = 'gi_reports' then dev_max := 5; dev_win := interval '1 hour'; min_max := 10; day_max := 200;
  else return new; end if;
  execute format('select count(*) from public.%I where anon_id = $1 and created_at > now() - $2', tg_table_name) into n using new.anon_id, dev_win;
  if n >= dev_max then return null; end if;
  execute format('select count(*) from public.%I where created_at > now() - interval ''1 minute''', tg_table_name) into n;
  if n >= min_max then return null; end if;
  execute format('select count(*) from public.%I where created_at > now() - interval ''1 day''', tg_table_name) into n;
  if n >= day_max then return null; end if;
  return new;
end $$;
revoke all on function public.gi_rate_limit() from public, anon, authenticated;

drop trigger if exists gi_rate_limit on public.gi_errors;
drop trigger if exists gi_rate_limit on public.gi_runs;
drop trigger if exists gi_rate_limit on public.gi_reports;
create trigger gi_rate_limit before insert on public.gi_errors  for each row execute function public.gi_rate_limit();
create trigger gi_rate_limit before insert on public.gi_runs    for each row execute function public.gi_rate_limit();
create trigger gi_rate_limit before insert on public.gi_reports for each row execute function public.gi_rate_limit();

-- 3. Advisor warning: rls_auto_enable() was executable by anon/authenticated. Revoke it, whatever its arguments.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname = 'public' and p.proname = 'rls_auto_enable' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- 4. The results view was created with "select *" before the new columns: recreate it so it includes them, still locked down.
drop view if exists public.gi_run_results;
create view public.gi_run_results with (security_invoker = true) as
select distinct on (run_id) *
from public.gi_runs
where event = 'run_end' and channel <> 'dev'
order by run_id, (outcome = 'abandoned') asc, created_at desc;
revoke all on public.gi_run_results from anon, authenticated, public;

notify pgrst, 'reload schema';
