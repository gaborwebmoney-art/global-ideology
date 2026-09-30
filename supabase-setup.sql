-- Global Ideology: online accounts and saves. Safe to run more than once.
-- Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.saves (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  state      jsonb not null,
  week       int  not null default 0,
  updated_at timestamptz not null default now()
);

-- Limits: one save per user (primary key), at most ~200 KB, sane week and timestamp values.
alter table public.saves drop constraint if exists saves_state_size;
alter table public.saves add  constraint saves_state_size check (pg_column_size(state) <= 200000);
alter table public.saves drop constraint if exists saves_state_object;
alter table public.saves add  constraint saves_state_object check (jsonb_typeof(state) = 'object');
alter table public.saves drop constraint if exists saves_week_range;
alter table public.saves add  constraint saves_week_range check (week between 0 and 5000);

-- The server sets the time; clients cannot backdate or future-date saves.
create or replace function public.saves_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before insert or update on public.saves
for each row execute function public.saves_touch();

-- Row-level security: every user sees and changes only their own row.
alter table public.saves enable row level security;
drop policy if exists "saves: read own"   on public.saves;
drop policy if exists "saves: insert own" on public.saves;
drop policy if exists "saves: update own" on public.saves;
drop policy if exists "saves: delete own" on public.saves;
create policy "saves: read own"   on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: insert own" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: update own" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: delete own" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.saves from anon, public;
grant select, insert, update, delete on public.saves to authenticated;
revoke execute on function public.saves_touch() from anon, authenticated, public;

-- Check: expect rowsecurity = true and 4 policies.
select (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'saves') as rls_on,
       (select count(*) from pg_policies where schemaname = 'public' and tablename = 'saves') as policies;
