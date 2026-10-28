// Ranking SQL check in an in-memory Postgres (PGlite). usage: in a scratch folder `npm i @electric-sql/pglite@0.2`, then from
// that folder: node <repo>/tools/ranking-sql-test.mjs   (24 checks)
import { createRequire } from 'module'; import { pathToFileURL } from 'url';
const { PGlite } = await import(pathToFileURL(createRequire(process.cwd() + '/').resolve('@electric-sql/pglite')).href); import fs from 'fs';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;`);
const sql = fs.readFileSync(new URL('./supabase-ranking.sql', import.meta.url), 'utf8').replace(/notify pgrst, 'reload schema';/g, '');
await db.exec(sql); await db.exec(sql); console.log('ranking sql ok (twice)');
const U = i => 'a0000000-0000-4000-8000-' + String(i).padStart(12, '0');
const as = async (i) => db.exec(`select set_config('test.uid', '${i === null ? '' : U(i)}', false)`);
const q = async (s, p) => (await db.query(s, p)).rows[0];
for (let i = 1; i <= 120; i++) await db.query(`insert into auth.users values ($1)`, [U(i)]);
const res = [];
await as(1);
res.push(['join ok', (await q(`select public.gi_join_ranking('Pavel','hu',true) j`)).j.ok === true]);
res.push(['age required', (await q(`select public.gi_join_ranking('Pavel','HU',false) j`)).j.why === 'age']);
res.push(['bad name', (await q(`select public.gi_join_ranking('a b','HU',true) j`)).j.why === 'name']);
res.push(['reserved', (await q(`select public.gi_join_ranking('TheAdmin','HU',true) j`)).j.why === 'reserved']);
res.push(['rename blocked 30d', (await q(`select public.gi_join_ranking('Pavel2','HU',true) j`)).j.why === 'rename']);
res.push(['country change ok', (await q(`select public.gi_join_ranking('pavel',null,true) j`)).j.ok === true]);
await as(2); res.push(['name taken (case-insensitive)', (await q(`select public.gi_join_ranking('PAVEL','DE',true) j`)).j.why === 'taken']);
// scores
await as(1);
const sub = (run, lv, score, stars, weeks) => q(`select public.gi_submit_score($1::uuid,$2,$3,$4,$5,'pannonia','10.22') j`, [run, lv, score, stars, weeks]);
res.push(['valid score', (await sub(U(9001), 'normal', 1600, 3, 231)).j.ok === true]);
res.push(['too high rejected', (await sub(U(9002), 'normal', 9999, 3, 231)).j.why === 'score']);
res.push(['3 stars too slow rejected', (await sub(U(9003), 'normal', 1500, 3, 300)).j.why === 'stars']);
res.push(['too fast rejected', (await sub(U(9004), 'normal', 1500, 1, 20)).j.why === 'weeks']);
res.push(['duplicate run ignored', (await sub(U(9001), 'normal', 1600, 3, 231)).j.ok === true && (await q(`select count(*)::int n from gi_scores`)).n === 1]);
// many players
for (let i = 3; i <= 110; i++) { await as(i); await q(`select public.gi_join_ranking($1,'DE',true) j`, ['P' + i]); await q(`select public.gi_submit_score($1::uuid,'normal',$2,2,230,'kestria','10.22') j`, [U(10000 + i), 1000 + i * 7]); }
// a non-joined player with a score
await as(111); await sub(U(20000), 'normal', 1790, 3, 230);
await as(1);
const r = (await q(`select public.gi_ranking('normal','week') j`)).j;
res.push(['top 100 rows', r.rows.length === 100 && r.rows[0].rank === 1 && r.rows[0].name === 'P110']);
res.push(['non-joined not listed', !r.rows.some(x => x.score === 1790)]);
res.push(['total = joined with scores', r.total === 102 || r.total]);
res.push(['me: rank, ahead', r.me && r.me.joined === true && r.me.score === 1600 && r.me.rank === 1 + [...Array(108)].filter((_, k) => 1000 + (k + 3) * 7 > 1600).length && r.me.ahead && r.me.ahead.score === 1602 || JSON.stringify(r.me)]);
console.log('me', JSON.stringify(r.me));
res.push(['no user ids leak', !JSON.stringify(r).includes('a0000000')]);
await as(111); const r2 = (await q(`select public.gi_ranking('normal','week') j`)).j; res.push(['not joined: hypothetical rank', r2.me.joined === false && r2.me.rank === 1]);
await as(null); const r3 = (await q(`select public.gi_ranking('normal','all') j`)).j; res.push(['anon read', r3.ok && r3.rows.length === 100 && r3.me === null]);
const pv = (await q(`select public.gi_rank_preview('normal', 1300) j`)).j; res.push(['preview', pv.week === 1 + [...Array(108)].filter((_, k) => 1000 + (k + 3) * 7 > 1300).length + 1 && pv.ahead && pv.ahead.score === 1301 || JSON.stringify(pv)]);
console.log('preview', JSON.stringify(pv));
res.push(['anon cannot submit', (await (async () => { try { await db.exec(`set role anon`); await q(`select public.gi_submit_score('${U(30000)}'::uuid,'normal',2000,1,230,'kestria','x') j`); return false; } catch { return true; } finally { await db.exec(`reset role`); } })())]);
res.push(['anon cannot read tables', (await (async () => { try { await db.exec(`set role anon`); await q(`select * from public.gi_players`); return false; } catch { return true; } finally { await db.exec(`reset role`); } })())]);
res.push(['anon can read ranking', (await (async () => { try { await db.exec(`set role anon`); await q(`select public.gi_ranking('normal','all') j`); return true; } catch (e) { return e.message; } finally { await db.exec(`reset role`); } })())]);
await as(1); await q(`select public.gi_leave_ranking() j`);
res.push(['leave deletes', (await q(`select count(*)::int n from gi_scores where user_id=$1`, [U(1)])).n === 0 && (await q(`select count(*)::int n from gi_players where user_id=$1`, [U(1)])).n === 0]);
res.forEach(([n, ok]) => console.log((ok === true ? 'PASS ' : 'FAIL ') + n + (ok === true ? '' : ' -- ' + ok)));
