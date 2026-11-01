-- Global Ideology admin tools v1 (server only, no game build needed). Run after supabase-ranking.sql and supabase-v10.33.sql.
-- Safe to re-run. Supabase dashboard -> SQL Editor -> paste -> Run.
--
-- Admin = whoever can open the SQL Editor (the project owner). The gi_admin_* functions are NOT callable from the game:
-- execute is revoked from anon and authenticated, so only the dashboard (postgres) and the service role can run them.
--
-- Cheat sheet (p_who = ranking name, e-mail or user id):
--   select public.gi_admin_find('somename');                                   -- look a player up
--   select public.gi_admin_grant('tester@mail.com', 'all', null, 'beta tester');  -- free branches, forever
--   select public.gi_admin_grant('tester@mail.com', 'covert', 30, 'giveaway');    -- one branch for 30 days
--   select public.gi_admin_revoke('tester@mail.com', null, 'beta over');           -- remove all free grants (paid ones stay)
--   select public.gi_admin_ban('cheatername', 'shadow', 'impossible scores', null); -- scores/goal runs silently ignored, hidden from ranking
--   select public.gi_admin_ban('cheatername', 'hard', 'repeat offender', 30);       -- also blocks login for 30 days
--   select public.gi_admin_unban('cheatername', 'appeal accepted');
--   select public.gi_admin_reset_goals('cheatername', 'cheated unlock goals');      -- wipe server goal progress (re-locks earned branches)
--   select * from public.gi_admin_log order by id desc limit 50;                    -- what was done
--   select * from public.gi_admin_suspects;                                         -- cheat candidates

-- ---------------------------------------------------------------- tables
create table if not exists public.gi_bans (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  level      text not null,
  reason     text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,                               -- null = permanent
  constraint gi_bans_level check (level in ('shadow', 'hard')),
  constraint gi_bans_reason check (char_length(reason) between 1 and 500)
);

create table if not exists public.gi_admin_log (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor      text not null default current_user,
  action     text not null,
  user_id    uuid,                                      -- no FK: the log outlives deleted accounts
  detail     jsonb not null default '{}'::jsonb
);

alter table public.gi_bans      enable row level security;
alter table public.gi_admin_log enable row level security;
revoke all on public.gi_bans, public.gi_admin_log from anon, authenticated, public;

-- Free grants live next to purchases: source tells them apart, expires_at limits them, purchase_token is only for Google Play.
alter table public.gi_entitlements add column if not exists source text not null default 'play';
alter table public.gi_entitlements add column if not exists expires_at timestamptz;
alter table public.gi_entitlements add column if not exists note text;
alter table public.gi_entitlements alter column purchase_token drop not null;      -- unique still holds; NULLs never clash
do $$ begin
  alter table public.gi_entitlements add constraint gi_entitlements_source check (source in ('play', 'grant', 'promo'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.gi_entitlements add constraint gi_entitlements_token_play check (source <> 'play' or purchase_token is not null);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- ban check
create or replace function public.gi_is_banned(p_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_uid is not null and exists (select 1 from public.gi_bans b where b.user_id = p_uid and (b.expires_at is null or b.expires_at > now()));
$$;
revoke all on function public.gi_is_banned(uuid) from public, anon, authenticated;

-- Shadow ban: a banned player's scores and goal runs are dropped silently. The game still gets ok=true, so its upload queue
-- empties and nothing tells the cheater they were caught.
create or replace function public.gi_drop_if_banned() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.gi_is_banned(new.user_id) then return null; end if;
  return new;
end $$;
revoke all on function public.gi_drop_if_banned() from public, anon, authenticated;

drop trigger if exists gi_ban_gate on public.gi_scores;
create trigger gi_ban_gate before insert on public.gi_scores for each row execute function public.gi_drop_if_banned();
drop trigger if exists gi_ban_gate on public.gi_goal_runs;
create trigger gi_ban_gate before insert on public.gi_goal_runs for each row execute function public.gi_drop_if_banned();
drop trigger if exists gi_ban_gate on public.gi_goal_import;
create trigger gi_ban_gate before insert on public.gi_goal_import for each row execute function public.gi_drop_if_banned();

-- Ranking without banned players (same as supabase-ranking.sql plus the ban filter). gi_ranking and gi_rank_preview read this.
create or replace function public.gi_board(p_level text, p_period text)
returns table (user_id uuid, name text, country text, score int, stars int, weeks int, start_country text, rnk bigint)
language sql stable security definer set search_path = '' as $$
  with since as (select case when p_period = 'week' then (date_trunc('week', now() at time zone 'Europe/Budapest') at time zone 'Europe/Budapest') else '-infinity'::timestamptz end as t),
  best as (
    select distinct on (s.user_id) s.user_id, s.score, s.stars, s.weeks, s.start_country, s.created_at
    from public.gi_scores s, since where s.level = p_level and s.created_at >= since.t
      and not public.gi_is_banned(s.user_id)
    order by s.user_id, s.score desc, s.weeks asc, s.created_at asc)
  select b.user_id, p.name, p.country, b.score, b.stars, b.weeks, b.start_country,
         rank() over (order by b.score desc, b.weeks asc, b.created_at asc)
  from best b join public.gi_players p on p.user_id = b.user_id;
$$;

-- Owned branches (same as supabase-v10.33.sql plus expiry, so time-limited grants end on their own).
create or replace function public.gi_my_branches()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', auth.uid() is not null, 'branches', coalesce((
    select jsonb_agg(distinct b order by b) from public.gi_entitlements e,
      lateral unnest(case e.product when 'gi.branches.all' then array['covert', 'spin', 'faith', 'under']
                                    when 'gi.branch.covert' then array['covert'] when 'gi.branch.spin' then array['spin']
                                    when 'gi.branch.grassroots' then array['faith'] when 'gi.branch.backchannels' then array['under'] end) b
    where e.user_id = auth.uid() and e.state = 'active' and (e.expires_at is null or e.expires_at > now())), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(distinct e.product) from public.gi_entitlements e
                          where e.user_id = auth.uid() and e.state = 'active' and (e.expires_at is null or e.expires_at > now())), '[]'::jsonb));
$$;
revoke all on function public.gi_my_branches() from public, anon;
grant execute on function public.gi_my_branches() to authenticated;

-- ---------------------------------------------------------------- admin functions (dashboard only)
-- Resolve a player: user id, e-mail or ranking name. Exactly one match or an error.
create or replace function public.gi_admin_uid(p_who text)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare r uuid[];
begin
  if p_who is null or btrim(p_who) = '' then raise exception 'gi_admin: say who (ranking name, e-mail or user id)'; end if;
  if p_who ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select array_agg(id) into r from auth.users where id = p_who::uuid;
  elsif position('@' in p_who) > 0 then
    select array_agg(id) into r from auth.users where lower(email) = lower(btrim(p_who));
  else
    select array_agg(user_id) into r from public.gi_players where lower(name) = lower(btrim(p_who));
  end if;
  if r is null then raise exception 'gi_admin: no player "%"', p_who; end if;
  if cardinality(r) > 1 then raise exception 'gi_admin: "%" matches % players, use the user id', p_who, cardinality(r); end if;
  return r[1];
end $$;

create or replace function public.gi_admin_product(p text)
returns text language sql immutable set search_path = '' as $$
  select case lower(btrim(coalesce(p, '')))
    when 'all' then 'gi.branches.all' when 'bundle' then 'gi.branches.all'
    when 'covert' then 'gi.branch.covert' when 'spin' then 'gi.branch.spin'
    when 'grassroots' then 'gi.branch.grassroots' when 'faith' then 'gi.branch.grassroots'
    when 'backchannels' then 'gi.branch.backchannels' when 'under' then 'gi.branch.backchannels' when 'underworld' then 'gi.branch.backchannels'
    else case when lower(btrim(p)) in ('gi.branches.all', 'gi.branch.covert', 'gi.branch.spin', 'gi.branch.grassroots', 'gi.branch.backchannels')
              then lower(btrim(p)) end end;
$$;

-- Everything about one player (or several when p_who is part of a name/e-mail).
create or replace function public.gi_admin_find(p_who text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', u.id, 'email', u.email, 'name', p.name, 'signed_up', u.created_at, 'last_login', u.last_sign_in_at,
    'login_blocked_until', u.banned_until,
    'ban', (select to_jsonb(b) - 'user_id' from public.gi_bans b where b.user_id = u.id),
    'entitlements', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'product', e.product, 'source', e.source, 'state', e.state,
                       'expires_at', e.expires_at, 'note', e.note, 'created_at', e.created_at) order by e.created_at), '[]'::jsonb)
                     from public.gi_entitlements e where e.user_id = u.id),
    'scores', (select count(*) from public.gi_scores s where s.user_id = u.id),
    'goal_runs', (select count(*) from public.gi_goal_runs g where g.user_id = u.id),
    'goal_import', (select gi.best from public.gi_goal_import gi where gi.user_id = u.id)
  ) order by u.created_at), '[]'::jsonb)
  from auth.users u left join public.gi_players p on p.user_id = u.id
  where p_who is null or u.id::text = p_who or u.email ilike '%' || p_who || '%' or p.name ilike '%' || p_who || '%';
$$;

-- Free branches. p_days null = forever. Re-granting the same product replaces the expiry of the existing grant.
create or replace function public.gi_admin_grant(p_who text, p_product text, p_days int default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gi_admin_uid(p_who); prod text := public.gi_admin_product(p_product); exp timestamptz; eid uuid;
begin
  if prod is null then raise exception 'gi_admin: unknown product "%" (all, covert, spin, grassroots, backchannels)', p_product; end if;
  if p_days is not null and p_days < 1 then raise exception 'gi_admin: p_days must be >= 1 or null'; end if;
  exp := case when p_days is null then null else now() + make_interval(days => p_days) end;
  select id into eid from public.gi_entitlements where user_id = uid and product = prod and source = 'grant' order by created_at desc limit 1;
  if eid is null then
    insert into public.gi_entitlements (user_id, product, source, state, expires_at, note, purchased_at)
      values (uid, prod, 'grant', 'active', exp, p_note, now()) returning id into eid;
  else
    update public.gi_entitlements set state = 'active', expires_at = exp, note = coalesce(p_note, note), updated_at = now() where id = eid;
  end if;
  insert into public.gi_admin_log (action, user_id, detail) values ('grant', uid, jsonb_build_object('product', prod, 'expires_at', exp, 'note', p_note, 'entitlement', eid));
  return jsonb_build_object('ok', true, 'user_id', uid, 'product', prod, 'expires_at', exp, 'entitlement', eid);
end $$;

-- Take free grants back (one product, or all with p_product null). Paid Google Play purchases are never touched here:
-- those are revoked only by refunds (Edge Function play-voided).
create or replace function public.gi_admin_revoke(p_who text, p_product text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gi_admin_uid(p_who); prod text := public.gi_admin_product(p_product); n int;
begin
  if p_product is not null and prod is null then raise exception 'gi_admin: unknown product "%"', p_product; end if;
  update public.gi_entitlements set state = 'revoked', updated_at = now()
    where user_id = uid and source in ('grant', 'promo') and state <> 'revoked' and (prod is null or product = prod);
  get diagnostics n = row_count;
  insert into public.gi_admin_log (action, user_id, detail) values ('revoke', uid, jsonb_build_object('product', coalesce(prod, 'all grants'), 'rows', n, 'note', p_note));
  return jsonb_build_object('ok', true, 'user_id', uid, 'revoked', n);
end $$;

-- shadow: scores and goal runs silently ignored, hidden from the ranking. hard: shadow + login blocked (Supabase Auth banned_until;
-- a login token already issued keeps working until it expires, up to 1 hour). p_days null = permanent.
create or replace function public.gi_admin_ban(p_who text, p_level text, p_reason text, p_days int default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gi_admin_uid(p_who); exp timestamptz;
begin
  if p_level not in ('shadow', 'hard') then raise exception 'gi_admin: level must be shadow or hard'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'gi_admin: give a reason'; end if;
  if p_days is not null and p_days < 1 then raise exception 'gi_admin: p_days must be >= 1 or null'; end if;
  exp := case when p_days is null then null else now() + make_interval(days => p_days) end;
  insert into public.gi_bans (user_id, level, reason, expires_at) values (uid, p_level, left(p_reason, 500), exp)
    on conflict (user_id) do update set level = excluded.level, reason = excluded.reason, expires_at = excluded.expires_at, created_at = now();
  update auth.users set banned_until = case when p_level = 'hard' then coalesce(exp, 'infinity'::timestamptz) else null end where id = uid;
  insert into public.gi_admin_log (action, user_id, detail) values ('ban', uid, jsonb_build_object('level', p_level, 'reason', p_reason, 'expires_at', exp));
  return jsonb_build_object('ok', true, 'user_id', uid, 'level', p_level, 'expires_at', exp);
end $$;

create or replace function public.gi_admin_unban(p_who text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gi_admin_uid(p_who); n int;
begin
  delete from public.gi_bans where user_id = uid;
  get diagnostics n = row_count;
  update auth.users set banned_until = null where id = uid;
  insert into public.gi_admin_log (action, user_id, detail) values ('unban', uid, jsonb_build_object('was_banned', n > 0, 'note', p_note));
  return jsonb_build_object('ok', true, 'user_id', uid, 'was_banned', n > 0);
end $$;

-- Wipe server goal progress (won runs + the one-time device import). Branches unlocked by goals lock again; purchases and grants stay.
-- The ranking (gi_scores) is not touched; hide it with a ban instead.
create or replace function public.gi_admin_reset_goals(p_who text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.gi_admin_uid(p_who); a int; b int;
begin
  delete from public.gi_goal_runs where user_id = uid;   get diagnostics a = row_count;
  delete from public.gi_goal_import where user_id = uid; get diagnostics b = row_count;
  insert into public.gi_admin_log (action, user_id, detail) values ('reset_goals', uid, jsonb_build_object('runs', a, 'import', b, 'note', p_note));
  return jsonb_build_object('ok', true, 'user_id', uid, 'runs_deleted', a, 'import_deleted', b);
end $$;

-- Cheat candidates: many goal runs in a day, or runs at the plausibility ceiling (score near max, weeks near the minimum).
create or replace view public.gi_admin_suspects with (security_invoker = true) as
  with r as (
    select g.user_id, count(*) filter (where g.created_at > now() - interval '1 day') runs_24h, count(*) runs_all,
           count(*) filter (where g.weeks <= (select l.min_weeks from public.gi_rank_limits(g.level) l) + 5) near_min_weeks,
           max(g.score) max_score
    from public.gi_goal_runs g group by g.user_id)
  select r.*, p.name, u.email, public.gi_is_banned(r.user_id) banned
  from r join auth.users u on u.id = r.user_id left join public.gi_players p on p.user_id = r.user_id
  where r.runs_24h >= 15 or r.near_min_weeks >= 3
  order by r.runs_24h desc, r.near_min_weeks desc;
revoke all on public.gi_admin_suspects from anon, authenticated, public;

revoke all on function public.gi_admin_uid(text), public.gi_admin_product(text), public.gi_admin_find(text),
  public.gi_admin_grant(text, text, int, text), public.gi_admin_revoke(text, text, text), public.gi_admin_ban(text, text, text, int),
  public.gi_admin_unban(text, text), public.gi_admin_reset_goals(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
