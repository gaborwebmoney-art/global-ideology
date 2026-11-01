-- Global Ideology v10.33: server-side unlock-goal progress and purchased branches (Google Play).
-- Run once in the Supabase SQL Editor after supabase-ranking.sql (safe to re-run). Nobody reads the tables directly:
-- the game calls the functions below; purchases are written only by the Edge Function play-verify (service role).

-- ---------------------------------------------------------------- goal progress
-- One row per finished, won run of a signed-in player (losses never count toward a goal).
create table if not exists public.gi_goal_runs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  run_id        uuid not null unique,
  level         text not null,
  start_country text not null,
  stars         int  not null,
  score         int  not null,
  weeks         int  not null,
  avg_noto      int  not null,
  version       text not null,
  constraint gi_goal_runs_level check (level in ('casual', 'normal', 'brutal')),
  constraint gi_goal_runs_stars check (stars between 1 and 3),
  constraint gi_goal_runs_start check (start_country ~ '^[a-z]{3,16}$'),
  constraint gi_goal_runs_noto check (avg_noto between 0 and 100),
  constraint gi_goal_runs_version check (char_length(version) <= 16)
);
create index if not exists gi_goal_runs_user_idx on public.gi_goal_runs (user_id, created_at desc);

-- Progress the player had on the device before v10.33, uploaded once per account (best stars per "start|level" + ghost wins).
create table if not exists public.gi_goal_import (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  imported_at timestamptz not null default now(),
  best        jsonb not null,
  ghost       int not null,
  version     text not null,
  constraint gi_goal_import_ghost check (ghost between 0 and 10)
);

alter table public.gi_goal_runs   enable row level security;
alter table public.gi_goal_import enable row level security;
revoke all on public.gi_goal_runs, public.gi_goal_import from anon, authenticated, public;

-- Record a won run. Same plausibility limits as the ranking (gi_rank_limits). Idempotent per run id.
create or replace function public.gi_goal_record(p_run uuid, p_level text, p_start text, p_stars int, p_score int, p_weeks int, p_avg_noto int, p_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); L record; n int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  if p_run is null then return jsonb_build_object('ok', false, 'why', 'bad'); end if;
  if p_level not in ('casual', 'normal', 'brutal') then return jsonb_build_object('ok', false, 'why', 'level'); end if;
  select * into L from public.gi_rank_limits(p_level);
  if p_weeks is null or p_weeks < L.min_weeks or p_weeks > 100000 then return jsonb_build_object('ok', false, 'why', 'weeks'); end if;
  if p_stars is null or p_stars not between 1 and 3 or (p_stars >= 2 and p_weeks > L.par_max) then return jsonb_build_object('ok', false, 'why', 'stars'); end if;
  if p_score is null or p_score < 0 or p_score > L.base + 10 * greatest(0, L.par_max - p_weeks) then return jsonb_build_object('ok', false, 'why', 'score'); end if;
  if p_avg_noto is null or p_avg_noto not between 0 and 100 then return jsonb_build_object('ok', false, 'why', 'noto'); end if;
  if p_start is null or p_start !~ '^[a-z]{3,16}$' or p_version is null or char_length(p_version) > 16 then return jsonb_build_object('ok', false, 'why', 'bad'); end if;
  select count(*) into n from public.gi_goal_runs where user_id = uid and created_at > now() - interval '1 day';
  if n >= 40 then return jsonb_build_object('ok', false, 'why', 'rate'); end if;
  insert into public.gi_goal_runs (user_id, run_id, level, start_country, stars, score, weeks, avg_noto, version)
    values (uid, p_run, p_level, p_start, p_stars, p_score, p_weeks, p_avg_noto, p_version)
    on conflict (run_id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- One-time upload of the device progress. p_best: {"pannonia|normal": 2, ...}. Bad keys are dropped, stars capped at 3.
create or replace function public.gi_goal_import(p_best jsonb, p_ghost int, p_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); clean jsonb := '{}'::jsonb; k text; v jsonb; st int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  if exists (select 1 from public.gi_goal_import where user_id = uid) then return jsonb_build_object('ok', false, 'why', 'done'); end if;
  if p_best is null or jsonb_typeof(p_best) <> 'object' then p_best := '{}'::jsonb; end if;
  for k, v in select * from jsonb_each(p_best) loop
    exit when (select count(*) from jsonb_object_keys(clean)) >= 60;
    continue when k !~ '^[a-z]{3,16}\|(casual|normal|brutal)$' or jsonb_typeof(v) <> 'number';
    st := least(3, greatest(0, floor((v #>> '{}')::numeric)::int));
    if st > 0 then clean := clean || jsonb_build_object(k, st); end if;
  end loop;
  insert into public.gi_goal_import (user_id, best, ghost, version)
    values (uid, clean, least(10, greatest(0, coalesce(p_ghost, 0))), left(coalesce(p_version, ''), 16));
  return jsonb_build_object('ok', true, 'keys', (select count(*) from jsonb_object_keys(clean)));
end $$;

-- The caller's progress: best stars per "start|level" (runs and the import), ghost wins (Normal/Brutal, average notoriety <= p_noto).
create or replace function public.gi_goal_state(p_noto int default 25)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); best jsonb; ghost int; imp public.gi_goal_import;
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  select * into imp from public.gi_goal_import where user_id = uid;
  select coalesce(jsonb_object_agg(k, s), '{}'::jsonb) into best from (
    select k, max(s) s from (
      select start_country || '|' || level k, stars s from public.gi_goal_runs where user_id = uid
      union all
      select key, (value #>> '{}')::int from jsonb_each(coalesce(imp.best, '{}'::jsonb))
    ) a group by k) b;
  select count(*) into ghost from public.gi_goal_runs where user_id = uid and level in ('normal', 'brutal') and avg_noto <= least(100, greatest(0, coalesce(p_noto, 25)));
  return jsonb_build_object('ok', true, 'best', best, 'ghost', ghost + coalesce(imp.ghost, 0), 'imported', imp.user_id is not null);
end $$;

-- ---------------------------------------------------------------- purchases (Google Play, verified server side)
create table if not exists public.gi_entitlements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  product        text not null,
  order_id       text,
  purchase_token text not null unique,
  state          text not null default 'active',     -- active | pending | revoked
  purchased_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint gi_entitlements_product check (product in ('gi.branches.all', 'gi.branch.covert', 'gi.branch.spin', 'gi.branch.grassroots', 'gi.branch.backchannels')),
  constraint gi_entitlements_state check (state in ('active', 'pending', 'revoked'))
);
create index if not exists gi_entitlements_user_idx on public.gi_entitlements (user_id);
alter table public.gi_entitlements enable row level security;
revoke all on public.gi_entitlements from anon, authenticated, public;   -- written by the Edge Function with the service role only

-- Branch ids (as in the game) the caller owns through active purchases. The bundle covers all four.
create or replace function public.gi_my_branches()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', auth.uid() is not null, 'branches', coalesce((
    select jsonb_agg(distinct b order by b) from public.gi_entitlements e,
      lateral unnest(case e.product when 'gi.branches.all' then array['covert', 'spin', 'faith', 'under']
                                    when 'gi.branch.covert' then array['covert'] when 'gi.branch.spin' then array['spin']
                                    when 'gi.branch.grassroots' then array['faith'] when 'gi.branch.backchannels' then array['under'] end) b
    where e.user_id = auth.uid() and e.state = 'active'), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(distinct e.product) from public.gi_entitlements e where e.user_id = auth.uid() and e.state = 'active'), '[]'::jsonb));
$$;

revoke all on function public.gi_goal_record(uuid, text, text, int, int, int, int, text), public.gi_goal_import(jsonb, int, text), public.gi_goal_state(int), public.gi_my_branches() from public, anon;
grant execute on function public.gi_goal_record(uuid, text, text, int, int, int, int, text), public.gi_goal_import(jsonb, int, text), public.gi_goal_state(int), public.gi_my_branches() to authenticated;

-- Account deletion (gi_delete_my_account, v10.23) deletes auth.users; the tables above cascade.
notify pgrst, 'reload schema';
