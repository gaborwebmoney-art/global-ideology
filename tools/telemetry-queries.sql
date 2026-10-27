-- Global Ideology: starter queries for the telemetry tables (run in the Supabase SQL Editor; for the dashboard later).
-- They read with full rights; the game itself can only insert.
--
-- Conventions
--   * Each run has one run_id. Events: run_start, run_end, run_continue, run_final.
--   * "result" of a run = its run_end row (how it first ended). If a run was abandoned (page closed) and later resumed
--     and finished, the finished row wins over the abandoned one.
--   * Win = outcome in ('win','collapse','perfect'). 'retired' = End game from the menu, 'abandoned' = left mid-run.
--   * channel 'dev' = localhost/debug sessions. Every query below excludes it; change the filter to look at beta only.
--   * Hide your own test runs by adding:  and anon_id <> '<your anon id>'  (the id is in localStorage key gi.anon).

-- 0. Reusable view of one result row per run (optional; run once).
create or replace view public.gi_run_results as
select distinct on (run_id) *
from public.gi_runs
where event = 'run_end' and channel <> 'dev'
order by run_id, (outcome = 'abandoned') asc, created_at desc;
-- Supabase gives new objects in "public" to anon by default: lock the view down so only the dashboard can read it.
alter view public.gi_run_results set (security_invoker = true);
revoke all on public.gi_run_results from anon, authenticated, public;

-- 1. Win rate by level and start country (finished runs only: abandoned and retired runs are excluded).
select level, start_country,
       count(*)                                                        as runs,
       count(*) filter (where outcome in ('win','collapse','perfect')) as wins,
       round(100.0 * count(*) filter (where outcome in ('win','collapse','perfect')) / count(*), 1) as win_pct
from public.gi_run_results
where outcome not in ('abandoned','retired')
group by level, start_country
order by level, win_pct desc, runs desc;

-- 1b. Same by level only, plus how many runs were abandoned or retired.
select level,
       count(*)                                                        as runs,
       count(*) filter (where outcome in ('win','collapse','perfect')) as wins,
       count(*) filter (where outcome = 'abandoned')                   as abandoned,
       count(*) filter (where outcome = 'retired')                     as retired,
       round(100.0 * count(*) filter (where outcome in ('win','collapse','perfect'))
             / nullif(count(*) filter (where outcome not in ('abandoned','retired')), 0), 1) as win_pct_of_finished
from public.gi_run_results
group by level
order by level;

-- 2. Loss causes (what ended runs that were not won), by level.
select level, outcome, count(*) as runs,
       round(100.0 * count(*) / sum(count(*)) over (partition by level), 1) as pct_of_level_losses
from public.gi_run_results
where outcome not in ('win','collapse','perfect','abandoned','retired')
group by level, outcome
order by level, runs desc;

-- 3. Median (and quartiles of) weeks to a win and to a loss, by level.
select level,
       case when outcome in ('win','collapse','perfect') then 'win' else 'loss' end as result,
       count(*) as runs,
       percentile_cont(0.25) within group (order by weeks) as p25_weeks,
       percentile_cont(0.50) within group (order by weeks) as median_weeks,
       percentile_cont(0.75) within group (order by weeks) as p75_weeks
from public.gi_run_results
where outcome not in ('abandoned','retired')
group by level, result
order by level, result desc;

-- 4. Where players abandon: weeks reached when a run was left, in 20-week buckets, by level.
select level, (weeks / 20) * 20 as week_from, count(*) as abandoned_runs
from public.gi_run_results
where outcome = 'abandoned'
group by level, week_from
order by level, week_from;

-- 4b. Abandon reasons.
select reason, count(*) as runs, round(avg(weeks)) as avg_week
from public.gi_run_results
where outcome = 'abandoned'
group by reason order by runs desc;

-- 5. Errors by version (and the top messages per version).
select version, channel, count(*) as errors, count(distinct anon_id) as players
from public.gi_errors
where channel <> 'dev'
group by version, channel
order by version desc, errors desc;

select version, left(message, 120) as message, src, count(*) as n, count(distinct anon_id) as players, max(created_at) as last_seen
from public.gi_errors
where channel <> 'dev'
group by version, left(message, 120), src
order by n desc
limit 50;

-- 6. Funnel: runs started vs finished, and players, per version.
select s.version,
       count(distinct s.run_id)                                         as started,
       count(distinct e.run_id)                                         as ended,
       count(distinct e.run_id) filter (where e.outcome <> 'abandoned') as finished,
       count(distinct s.anon_id)                                        as players
from public.gi_runs s
left join public.gi_run_results e on e.run_id = s.run_id
where s.event = 'run_start' and s.channel <> 'dev'
group by s.version
order by s.version desc;

-- 7. Doctrine path: first three upgrades bought vs win rate (finished runs).
select upgrades[1:3] as first_three, count(*) as runs,
       round(100.0 * count(*) filter (where outcome in ('win','collapse','perfect')) / count(*), 1) as win_pct
from public.gi_run_results
where outcome not in ('abandoned','retired') and upgrades is not null
group by first_three
having count(*) >= 3
order by runs desc;

-- 8. Newest bug reports (open one in the Table editor to see the full state; the state replays in the game with
--    ?debug and  __GI.loadReport(<the state column as JSON>)).
select created_at, version, channel, level, start_country, week, left(report, 140) as report, contact
from public.gi_reports
where channel <> 'dev'
order by created_at desc
limit 50;

-- 9. v10.19+ endgame, per level and version: real players vs the bot (bot sharp/slow, Normal: win 68-81%, Breakup in
--    66-80% of runs at week ~230, win ~20 weeks after the Breakup). Needs the v10.19/v10.20 columns of supabase-telemetry.sql.
--    (gi_run_results was created with "select *" before these columns existed: query gi_runs directly.)
with r as (
  select distinct on (run_id) * from public.gi_runs
  where event = 'run_end' and channel <> 'dev' and version >= '10.19'
  order by run_id, (outcome = 'abandoned') asc, created_at desc)
select version, level, count(*) as runs,
  round(100.0 * avg((outcome in ('win','collapse','perfect'))::int), 1) as win_pct,
  round(100.0 * avg((breakup_week is not null)::int), 1) as breakup_pct,
  percentile_cont(.5) within group (order by breakup_week) as med_breakup_week,
  percentile_cont(.5) within group (order by weeks) filter (where outcome = 'win') as med_win_week,
  percentile_cont(.5) within group (order by weeks - breakup_week) filter (where outcome = 'win' and breakup_week is not null) as med_weeks_breakup_to_win,
  round(avg(cap_auto), 2) as cap_auto, round(avg(cap_terms), 2) as cap_terms, round(avg(cap_ultimatum), 2) as cap_ultimatum,
  count(*) filter (where win_type = 'held') as wins_held, count(*) filter (where win_type = 'share') as wins_share,
  count(*) filter (where outcome in ('abandoned','retired') and breakup_week is not null) as quit_after_breakup
from r group by 1, 2 order by 1, 2;

-- 10. Where post-Breakup runs end up: quits after the Breakup are the "boring mop-up" signal for Step 9.2.
select level, outcome, count(*) as runs, percentile_cont(.5) within group (order by weeks - breakup_week) as med_weeks_after_breakup
from public.gi_runs
where event in ('run_end','run_final') and channel <> 'dev' and breakup_week is not null
group by 1, 2 order by 1, 3 desc;
