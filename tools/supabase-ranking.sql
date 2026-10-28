-- Global Ideology v10.22: global ranking. Run once in the Supabase SQL Editor (safe to re-run).
-- Players opt in with a ranking name (never the email) and an optional self-chosen country; 16+ only (Hungary's GDPR age of
-- digital consent). Scores come from the browser, so they are checked for plausibility on the way in. Nobody reads the tables
-- directly: everything goes through the functions below, which only ever return name, country and game results.

create table if not exists public.gi_players (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  country     text,                       -- ISO 3166 alpha-2, chosen by the player, or null
  age16       boolean not null,           -- player confirmed being 16 or older
  created_at  timestamptz not null default now(),
  name_set_at timestamptz not null default now(),
  constraint gi_players_name check (name ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint gi_players_country check (country is null or country ~ '^[A-Z]{2}$'),
  constraint gi_players_age check (age16)
);
create unique index if not exists gi_players_name_uq on public.gi_players (lower(name));

create table if not exists public.gi_scores (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  run_id        uuid not null unique,
  level         text not null,
  score         int  not null,
  stars         int  not null,
  weeks         int  not null,
  start_country text not null,
  version       text not null,
  constraint gi_scores_level check (level in ('casual', 'normal', 'brutal')),
  constraint gi_scores_stars check (stars between 1 and 3),
  constraint gi_scores_score check (score between 0 and 100000),
  constraint gi_scores_weeks check (weeks between 1 and 100000),
  constraint gi_scores_start check (start_country ~ '^[a-z]{3,16}$'),
  constraint gi_scores_version check (char_length(version) <= 16)
);
create index if not exists gi_scores_board_idx on public.gi_scores (level, created_at desc, score desc);
create index if not exists gi_scores_user_idx on public.gi_scores (user_id, created_at desc);

alter table public.gi_players enable row level security;
alter table public.gi_scores  enable row level security;
revoke all on public.gi_players, public.gi_scores from anon, authenticated, public;   -- no policies: functions only

-- Plausibility limits per level: score = base + 10 x weeks under par - 10 x average notoriety - 50 x lost countries,
-- so it can never exceed base + 10 x (par - weeks). par_max is the largest PAR any version used (stars 2-3 need weeks <= par).
create or replace function public.gi_rank_limits(p_level text, out base int, out par_max int, out min_weeks int)
language sql immutable set search_path = '' as $$
  select case p_level when 'casual' then 1000 when 'normal' then 1500 else 2500 end,
         case p_level when 'casual' then 210 when 'normal' then 260 else 280 end,
         60;
$$;

-- Join (or rename / change country). Name: 3-20 letters, digits, _; unique; a short list of reserved words; renamed at most every 30 days.
create or replace function public.gi_join_ranking(p_name text, p_country text, p_age16 boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cur public.gi_players; n text := btrim(coalesce(p_name, '')); c text := nullif(upper(btrim(coalesce(p_country, ''))), '');
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  if p_age16 is not true then return jsonb_build_object('ok', false, 'why', 'age'); end if;
  if n !~ '^[A-Za-z0-9_]{3,20}$' then return jsonb_build_object('ok', false, 'why', 'name'); end if;
  if lower(n) ~ '(admin|moderator|support|official|staff|anthropic|claude|fuck|shit|nazi|hitler)' then return jsonb_build_object('ok', false, 'why', 'reserved'); end if;
  if c is not null and c !~ '^[A-Z]{2}$' then return jsonb_build_object('ok', false, 'why', 'country'); end if;
  select * into cur from public.gi_players where user_id = uid;
  if exists (select 1 from public.gi_players where lower(name) = lower(n) and user_id <> uid) then return jsonb_build_object('ok', false, 'why', 'taken'); end if;
  if cur.user_id is null then
    insert into public.gi_players (user_id, name, country, age16) values (uid, n, c, true);
  else
    if lower(cur.name) <> lower(n) and cur.name_set_at > now() - interval '30 days' then
      return jsonb_build_object('ok', false, 'why', 'rename', 'next', cur.name_set_at + interval '30 days');
    end if;
    update public.gi_players set name = n, country = c, age16 = true,
      name_set_at = case when lower(cur.name) <> lower(n) then now() else cur.name_set_at end where user_id = uid;
  end if;
  return jsonb_build_object('ok', true, 'name', n, 'country', c);
end $$;

-- Leave: the player row and every score of this user are deleted.
create or replace function public.gi_leave_ranking() returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  delete from public.gi_scores where user_id = uid;
  delete from public.gi_players where user_id = uid;
  return jsonb_build_object('ok', true);
end $$;

-- The signed-in player's ranking profile (null when not joined).
create or replace function public.gi_my_player() returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(p) - 'user_id' - 'age16' from public.gi_players p where p.user_id = auth.uid();
$$;

-- Submit a won run. Kept for any signed-in player (shown publicly only once they join). Rejected when implausible.
create or replace function public.gi_submit_score(p_run uuid, p_level text, p_score int, p_stars int, p_weeks int, p_start text, p_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); L record; n int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  if p_level not in ('casual', 'normal', 'brutal') then return jsonb_build_object('ok', false, 'why', 'level'); end if;
  select * into L from public.gi_rank_limits(p_level);
  if p_weeks is null or p_weeks < L.min_weeks or p_weeks > 100000 then return jsonb_build_object('ok', false, 'why', 'weeks'); end if;
  if p_stars is null or p_stars not between 1 and 3 or (p_stars >= 2 and p_weeks > L.par_max) then return jsonb_build_object('ok', false, 'why', 'stars'); end if;
  if p_score is null or p_score < 0 or p_score > L.base + 10 * greatest(0, L.par_max - p_weeks) then return jsonb_build_object('ok', false, 'why', 'score'); end if;
  if p_start is null or p_start !~ '^[a-z]{3,16}$' or p_version is null or char_length(p_version) > 16 then return jsonb_build_object('ok', false, 'why', 'bad'); end if;
  select count(*) into n from public.gi_scores where user_id = uid and created_at > now() - interval '1 day';
  if n >= 30 then return jsonb_build_object('ok', false, 'why', 'rate'); end if;
  insert into public.gi_scores (user_id, run_id, level, score, stars, weeks, start_country, version)
    values (uid, p_run, p_level, p_score, p_stars, p_weeks, p_start, p_version)
    on conflict (run_id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- Best run per joined player on a board: p_period 'week' (since Monday 00:00 Budapest time) or 'all'.
create or replace function public.gi_board(p_level text, p_period text)
returns table (user_id uuid, name text, country text, score int, stars int, weeks int, start_country text, rnk bigint)
language sql stable security definer set search_path = '' as $$
  with since as (select case when p_period = 'week' then (date_trunc('week', now() at time zone 'Europe/Budapest') at time zone 'Europe/Budapest') else '-infinity'::timestamptz end as t),
  best as (
    select distinct on (s.user_id) s.user_id, s.score, s.stars, s.weeks, s.start_country, s.created_at
    from public.gi_scores s, since where s.level = p_level and s.created_at >= since.t
    order by s.user_id, s.score desc, s.weeks asc, s.created_at asc)
  select b.user_id, p.name, p.country, b.score, b.stars, b.weeks, b.start_country,
         rank() over (order by b.score desc, b.weeks asc, b.created_at asc)
  from best b join public.gi_players p on p.user_id = b.user_id;
$$;

-- Top 100 of a board plus the caller's own line (rank among joined players, or the rank their best would have if not joined).
create or replace function public.gi_ranking(p_level text, p_period text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid(); top jsonb; me jsonb; my record; joined boolean; total int; since timestamptz;
begin
  if p_level not in ('casual', 'normal', 'brutal') or p_period not in ('week', 'all') then return jsonb_build_object('ok', false); end if;
  select coalesce(jsonb_agg(jsonb_build_object('rank', rnk, 'name', name, 'country', country, 'score', score, 'stars', stars, 'weeks', weeks, 'start', start_country, 'you', user_id = uid) order by rnk), '[]'::jsonb), count(*)
    into top, total from (select * from public.gi_board(p_level, p_period) order by rnk limit 100) t;
  select count(*) into total from public.gi_board(p_level, p_period);
  if uid is not null then
    joined := exists (select 1 from public.gi_players where user_id = uid);
    since := case when p_period = 'week' then (date_trunc('week', now() at time zone 'Europe/Budapest') at time zone 'Europe/Budapest') else '-infinity'::timestamptz end;
    select s.score, s.stars, s.weeks, s.start_country into my from public.gi_scores s
      where s.user_id = uid and s.level = p_level and s.created_at >= since order by s.score desc, s.weeks asc limit 1;
    if my.score is not null then
      me := jsonb_build_object('joined', joined, 'score', my.score, 'stars', my.stars, 'weeks', my.weeks, 'start', my.start_country,
        'rank', 1 + (select count(*) from public.gi_board(p_level, p_period) b where b.user_id <> uid and (b.score > my.score or (b.score = my.score and b.weeks < my.weeks))),
        'ahead', (select jsonb_build_object('name', b.name, 'score', b.score) from public.gi_board(p_level, p_period) b where b.user_id <> uid and b.score > my.score order by b.score asc limit 1));
    else me := jsonb_build_object('joined', joined); end if;
  end if;
  return jsonb_build_object('ok', true, 'rows', top, 'total', total, 'me', me);
end $$;

-- Where a score would land this week (end screen, also for guests): rank and the player just ahead.
create or replace function public.gi_rank_preview(p_level text, p_score int)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true,
    'week', 1 + (select count(*) from public.gi_board(p_level, 'week') b where b.score > p_score and b.user_id is distinct from auth.uid()),
    'all',  1 + (select count(*) from public.gi_board(p_level, 'all')  b where b.score > p_score and b.user_id is distinct from auth.uid()),
    'ahead', (select jsonb_build_object('name', b.name, 'score', b.score) from public.gi_board(p_level, 'week') b where b.score > p_score and b.user_id is distinct from auth.uid() order by b.score asc limit 1))
  where p_level in ('casual', 'normal', 'brutal');
$$;

revoke all on function public.gi_rank_limits(text), public.gi_board(text, text) from public, anon, authenticated;
revoke all on function public.gi_join_ranking(text, text, boolean), public.gi_leave_ranking(), public.gi_my_player(), public.gi_submit_score(uuid, text, int, int, int, text, text) from public, anon;
grant execute on function public.gi_join_ranking(text, text, boolean), public.gi_leave_ranking(), public.gi_my_player(), public.gi_submit_score(uuid, text, int, int, int, text, text) to authenticated;
revoke all on function public.gi_ranking(text, text), public.gi_rank_preview(text, int) from public;
grant execute on function public.gi_ranking(text, text), public.gi_rank_preview(text, int) to anon, authenticated;

notify pgrst, 'reload schema';
