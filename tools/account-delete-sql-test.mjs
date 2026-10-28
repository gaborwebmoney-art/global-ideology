// Account-deletion SQL check in an in-memory Postgres (PGlite). usage: in a scratch folder `npm i @electric-sql/pglite@0.2`, then from
// that folder: node <repo>/tools/account-delete-sql-test.mjs
import { createRequire } from 'module'; import { pathToFileURL } from 'url';
const { PGlite } = await import(pathToFileURL(createRequire(process.cwd() + '/').resolve('@electric-sql/pglite')).href); import fs from 'fs';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create table public.saves (user_id uuid primary key references auth.users(id) on delete cascade, state jsonb);`);
const load = f => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/notify pgrst, 'reload schema';/g, '');
for (const f of ['supabase-telemetry.sql', 'supabase-ranking.sql', 'supabase-v10.23.sql']) await db.exec(load(f));
await db.exec(load('supabase-v10.23.sql')); console.log('sql ok (v10.23 twice)');
const U = i => 'a0000000-0000-4000-8000-' + String(i).padStart(12, '0');
const as = i => db.exec(`select set_config('test.uid', '${i === null ? '' : U(i)}', false)`);
const q = async (s, p) => (await db.query(s, p)).rows[0];
const n = async (t, w, p) => (await q(`select count(*)::int n from ${t} ${w || ''}`, p)).n;
for (const i of [1, 2]) { await db.query(`insert into auth.users values ($1)`, [U(i)]); await db.query(`insert into public.saves values ($1, '{}')`, [U(i)]); }
for (const i of [1, 2]) {
  await db.query(`insert into public.gi_errors (anon_id,user_id,version,channel,message) values ($1,$2,'10.23','live','x')`, [U(100 + i), U(i)]);
  await db.query(`insert into public.gi_runs (anon_id,user_id,version,channel,event,run_id) values ($1,$2,'10.23','live','run_start',$3)`, [U(100 + i), U(i), U(200 + i)]);
  await db.query(`insert into public.gi_reports (anon_id,user_id,version,channel,report) values ($1,$2,'10.23','live','x')`, [U(100 + i), U(i)]);
}
await as(1); await q(`select public.gi_join_ranking('Pavel','HU',true) j`); await q(`select public.gi_submit_score($1::uuid,'normal',1600,3,231,'pannonia','10.23') j`, [U(9001)]);
const res = [];
res.push(['anon cannot delete', await (async () => { try { await db.exec(`set role anon`); await q(`select public.gi_delete_my_account() j`); return false; } catch { return true; } finally { await db.exec(`reset role`); } })()]);
await as(null); res.push(['no login: refused', (await q(`select public.gi_delete_my_account() j`)).j.why === 'login']);
await as(1); res.push(['delete ok', (await q(`select public.gi_delete_my_account() j`)).j.ok === true]);
res.push(['user gone', await n('auth.users', 'where id=$1', [U(1)]) === 0]);
res.push(['save gone', await n('public.saves', 'where user_id=$1', [U(1)]) === 0]);
res.push(['ranking name + score gone', await n('public.gi_players', 'where user_id=$1', [U(1)]) === 0 && await n('public.gi_scores', 'where user_id=$1', [U(1)]) === 0]);
res.push(['telemetry kept but detached', await n('public.gi_errors', 'where user_id is null') === 1 && await n('public.gi_runs', 'where user_id is null') === 1 && await n('public.gi_reports', 'where user_id is null') === 1]);
res.push(['other player untouched', await n('auth.users', 'where id=$1', [U(2)]) === 1 && await n('public.saves', 'where user_id=$1', [U(2)]) === 1 && await n('public.gi_errors', 'where user_id=$1', [U(2)]) === 1]);
res.push(['second call: refused or harmless', (await q(`select public.gi_delete_my_account() j`)).j.ok === true]);
res.forEach(([m, ok]) => console.log((ok === true ? 'PASS ' : 'FAIL ') + m + (ok === true ? '' : ' -- ' + ok)));
process.exit(res.every(r => r[1] === true) ? 0 : 1);
