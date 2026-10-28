-- Global Ideology v10.23: delete my account (Google Play requires an in-app way to delete an account). Safe to run more than once.
-- Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- gi_delete_my_account(): for the signed-in player only.
--   * gameplay data, crash reports and bug reports that carry the player's account id are detached from it (user_id -> null), so they
--     become anonymous; they stay until the normal retention clean-up
--   * the auth user is deleted; that cascades to saves, gi_players (ranking name) and gi_scores (ranking scores)
-- The game calls it with the player's own login token; anon cannot call it.

create or replace function public.gi_delete_my_account() returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'why', 'login'); end if;
  update public.gi_errors  set user_id = null where user_id = uid;
  update public.gi_runs    set user_id = null where user_id = uid;
  update public.gi_reports set user_id = null where user_id = uid;
  delete from auth.users where id = uid;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.gi_delete_my_account() from public, anon;
grant execute on function public.gi_delete_my_account() to authenticated;

-- Optional, to keep the promise in the privacy policy (data kept up to 24 months): run this now and then (for example monthly).
-- It is not scheduled automatically. Run it by hand in the SQL Editor when you want it.
--   delete from public.gi_errors  where created_at < now() - interval '24 months';
--   delete from public.gi_runs    where created_at < now() - interval '24 months';
--   delete from public.gi_reports where created_at < now() - interval '24 months';

notify pgrst, 'reload schema';
