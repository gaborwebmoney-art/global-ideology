// Admin tools SQL check in an in-memory Postgres (PGlite). usage: in a scratch folder
// `npm i @electric-sql/pglite@0.2`, then from that folder: node <repo>/tools/admin-sql-test.mjs
import { createRequire } from 'module'; import { pathToFileURL } from 'url';
const { PGlite } = await import(pathToFileURL(createRequire(process.cwd() + '/').resolve('@electric-sql/pglite')).href); import fs from 'fs';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users (id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, banned_until timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;`);
const rd = f => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/notify pgrst, 'reload schema';/g, '');
await db.exec(rd('supabase-ranking.sql'));
await db.exec(rd('supabase-v10.33.sql'));
const admin = rd('supabase-admin.sql'); await db.exec(admin); await db.exec(admin); console.log('admin sql ok (twice)');
await db.exec(rd('supabase-v10.33.sql')); await db.exec(admin); console.log('v10.33 re-run then admin again ok');

const U = i => 'c0000000-0000-4000-8000-' + String(i).padStart(12, '0');
const as = async i => db.exec(`select set_config('test.uid', '${i === null ? '' : U(i)}', false)`);
const q = async (s, p) => (await db.query(s, p)).rows[0];
const err = async (s, p) => { try { await db.query(s, p); return null; } catch (e) { return String(e.message); } };
for (let i = 1; i <= 4; i++) await db.query(`insert into auth.users (id, email) values ($1, $2)`, [U(i), `p${i}@mail.com`]);
const res = [], ok = (n, c, x) => res.push([n, !!c, x]);

// ranking names
for (const [i, n] of [[1, 'Tester1'], [2, 'Cheater'], [3, 'Honest']]) {
  await as(i); await q(`select public.gi_join_ranking($1, 'HU', true) j`, [n]);
}
const score = (run, s) => q(`select public.gi_submit_score($1::uuid,'normal',$2,2,230,'pannonia','10.33') j`, [run, s]);
const goal = (run) => q(`select public.gi_goal_record($1::uuid,'normal','pannonia',2,1500,230,20,'10.33') j`, [run]);
await as(2); await score(U(9001), 1600); await goal(U(9101));
await as(3); await score(U(9002), 1500);
const board = async () => (await db.query(`select name from public.gi_board('normal','all') order by rnk`)).rows.map(r => r.name).join(',');
ok('board before ban', (await board()) === 'Cheater,Honest', await board());

// lookup
await as(null);
ok('uid by name (case-insensitive)', (await q(`select public.gi_admin_uid('cheater') u`)).u === U(2));
ok('uid by email', (await q(`select public.gi_admin_uid('P1@mail.com') u`)).u === U(1));
ok('uid by id', (await q(`select public.gi_admin_uid($1) u`, [U(4)])).u === U(4));
ok('uid unknown -> error', /no player/.test(await err(`select public.gi_admin_uid('nobody')`)));
ok('find', (await q(`select jsonb_array_length(public.gi_admin_find('Cheater')) n`)).n === 1);

// grants
let g = (await q(`select public.gi_admin_grant('p1@mail.com', 'all', null, 'beta tester') j`)).j;
ok('grant all', g.ok && g.product === 'gi.branches.all' && g.expires_at === null, g);
await as(1);
let mb = (await q(`select public.gi_my_branches() j`)).j;
ok('player sees granted branches', JSON.stringify(mb.branches) === '["covert","faith","spin","under"]', mb);
await as(null);
const g2 = (await q(`select public.gi_admin_grant('p1@mail.com', 'all', 7, 'renew') j`)).j;
ok('re-grant updates, no duplicate', g2.entitlement === g.entitlement && (await q(`select count(*)::int n from gi_entitlements where user_id=$1`, [U(1)])).n === 1);
ok('bad product', /unknown product/.test(await err(`select public.gi_admin_grant('p1@mail.com', 'nukes')`)));
await q(`select public.gi_admin_grant($1, 'faith', 1) j`, [U(4)]);
await db.query(`update gi_entitlements set expires_at = now() - interval '1 minute' where user_id = $1`, [U(4)]);
await as(4); mb = (await q(`select public.gi_my_branches() j`)).j;
ok('expired grant not owned', mb.branches.length === 0, mb);

// paid purchase untouched by revoke
await as(null);
await db.query(`insert into gi_entitlements (user_id, product, purchase_token, state) values ($1, 'gi.branch.spin', 'tok-1', 'active')`, [U(1)]);
ok('play row still needs a token', /token_play/.test(await err(`insert into gi_entitlements (user_id, product, state) values ($1, 'gi.branch.spin', 'active')`, [U(1)])));
const rv = (await q(`select public.gi_admin_revoke('Tester1', null, 'beta over') j`)).j;
ok('revoke grants only', rv.revoked === 1, rv);
await as(1); mb = (await q(`select public.gi_my_branches() j`)).j;
ok('paid branch survives revoke', JSON.stringify(mb.branches) === '["spin"]', mb);

// shadow ban
await as(null);
const b = (await q(`select public.gi_admin_ban('Cheater', 'shadow', 'impossible scores') j`)).j;
ok('shadow ban', b.ok && (await q(`select banned_until from auth.users where id=$1`, [U(2)])).banned_until === null, b);
ok('board hides banned', (await board()) === 'Honest', await board());
await as(2);
const s2 = (await score(U(9003), 1700)).j, g3 = (await goal(U(9102))).j;
ok('banned submit returns ok', s2.ok && g3.ok, [s2, g3]);
ok('banned rows dropped', (await q(`select count(*)::int n from gi_scores where user_id=$1`, [U(2)])).n === 1 && (await q(`select count(*)::int n from gi_goal_runs where user_id=$1`, [U(2)])).n === 1);
await as(3); ok('others still record', (await score(U(9004), 1550)).j.ok && (await q(`select count(*)::int n from gi_scores where user_id=$1`, [U(3)])).n === 2);

// hard ban, timed
await as(null);
await q(`select public.gi_admin_ban('Cheater', 'hard', 'again', 30) j`);
const bu = (await q(`select banned_until from auth.users where id=$1`, [U(2)])).banned_until;
ok('hard ban blocks login ~30 days', bu && (new Date(bu) - Date.now()) / 864e5 > 29, bu);
// expired ban no longer gates
await db.query(`update gi_bans set expires_at = now() - interval '1 minute' where user_id=$1`, [U(2)]);
ok('expired ban lifts board filter', (await board()) === 'Cheater,Honest', await board());
await q(`select public.gi_admin_unban('Cheater', 'appeal') j`);
ok('unban clears both', (await q(`select count(*)::int n from gi_bans`)).n === 0 && (await q(`select banned_until from auth.users where id=$1`, [U(2)])).banned_until === null);

// reset goals
const rg = (await q(`select public.gi_admin_reset_goals('Cheater', 'cheated') j`)).j;
ok('reset goals', rg.runs_deleted === 1, rg);
await as(2); ok('goal state empty after reset', Object.keys((await q(`select public.gi_goal_state() j`)).j.best).length === 0);

// log + suspects view
await as(null);
const lg = (await db.query(`select action from gi_admin_log order by id`)).rows.map(r => r.action).join(',');
ok('audit log', lg === 'grant,grant,grant,revoke,ban,ban,unban,reset_goals', lg);
ok('suspects view runs', Array.isArray((await db.query(`select * from public.gi_admin_suspects`)).rows));

// the game cannot call admin functions
const priv = (await q(`select has_function_privilege('authenticated', 'public.gi_admin_grant(text,text,int,text)', 'execute') a,
                              has_function_privilege('anon', 'public.gi_admin_ban(text,text,text,int)', 'execute') b,
                              has_table_privilege('authenticated', 'public.gi_bans', 'select') c,
                              has_function_privilege('authenticated', 'public.gi_my_branches()', 'execute') d`));
ok('admin locked from game roles, gi_my_branches still callable', !priv.a && !priv.b && !priv.c && priv.d, priv);

let bad = 0; for (const [n, c, x] of res) { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : '  ' + JSON.stringify(x))); if (!c) bad++; }
console.log(bad ? `${bad} FAILED` : `all ${res.length} passed`); process.exit(bad ? 1 : 0);
