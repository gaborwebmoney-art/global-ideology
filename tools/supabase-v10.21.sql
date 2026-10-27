-- Global Ideology v10.21 (Step 9.2 Grand Coalition): run once in the Supabase SQL Editor (safe to re-run). Also folded into supabase-telemetry.sql.
-- Needs tools/supabase-v10.20.sql first (already applied 2026-10-27).
alter table public.gi_runs add column if not exists gc_size       int;   -- members when the Grand Coalition formed (null = none)
alter table public.gi_runs add column if not exists gc_broke_week int;   -- week you broke it (null = never)
alter table public.gi_runs drop constraint if exists gi_runs_gc_limits;
alter table public.gi_runs add  constraint gi_runs_gc_limits check (
  (gc_size is null or gc_size between 0 and 32) and (gc_broke_week is null or gc_broke_week between 0 and 100000));
-- the results view lists columns at creation time: rebuild it so it includes the new ones
drop view if exists public.gi_run_results;
create view public.gi_run_results with (security_invoker = true) as
select distinct on (run_id) *
from public.gi_runs
where event = 'run_end' and channel <> 'dev'
order by run_id, (outcome = 'abandoned') asc, created_at desc;
revoke all on public.gi_run_results from anon, authenticated, public;
notify pgrst, 'reload schema';
