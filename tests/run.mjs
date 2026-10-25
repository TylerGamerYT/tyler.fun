import assert from 'node:assert/strict';
import { makeDB } from './d1shim.mjs';
import * as B from '../functions/_lib/badges.js';
import { hashPassword, verifyPassword, validateUsername, validatePassword } from '../functions/_lib/util.js';
import { onRequest as mw } from '../functions/api/_middleware.js';
import * as register from '../functions/api/auth/register.js';
import * as login from '../functions/api/auth/login.js';
import * as logout from '../functions/api/auth/logout.js';
import * as verify from '../functions/api/auth/verify-email.js';
import * as forgot from '../functions/api/auth/forgot-password.js';
import * as reset from '../functions/api/auth/reset-password.js';
import * as me from '../functions/api/me/index.js';
import * as mePw from '../functions/api/me/password.js';
import * as meBadges from '../functions/api/me/badges.js';
import * as profile from '../functions/api/users/[username].js';
import * as adminBadges from '../functions/api/admin/badges.js';
import * as adminRole from '../functions/api/admin/role.js';
import * as adminBan from '../functions/api/admin/ban.js';

let passed = 0;
const t = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; } };

const outbox = [];
const env = { DB: makeDB(), SITE_URL: 'https://tyler-fun.pages.dev', DEV_LOG_EMAILS: '1', __outbox: outbox };
const ORIGIN = 'https://tyler-fun.pages.dev';

// tiny client with a cookie jar
function client() {
  let cookie = '';
  return async (mod, method, body, { url = 'https://tyler-fun.pages.dev/api/x', params = {}, headers = {} } = {}) => {
    const req = new Request(url, { method, headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const fnName = 'onRequest' + method[0] + method.slice(1).toLowerCase();
    const res = await mod[fnName]({ request: req, env, params });
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) { const [kv, ...attrs] = c.split(';'); const [k, v] = [kv.slice(0, kv.indexOf('=')), kv.slice(kv.indexOf('=') + 1)]; cookie = cookie.split('; ').filter((x) => x && !x.startsWith(k + '=')).concat(/Max-Age=0/.test(c) ? [] : [`${k}=${v}`]).join('; '); }
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers, res };
  };
}
const tokenFromMail = (m) => m.text.match(/token=([\w-]+)/)[1];

console.log('\nbadge permission rules (pure)');
const U = (role, id = role, extra = {}) => ({ id, role, banned: 0, ...extra });
await t('regular users can never be granted anything manually', () => {
  for (const b of B.BADGE_IDS) assert.equal(B.canGrantBadge(U('user'), U('user', 'x'), b).ok, false, b);
});
await t('member/email_verified/banned/staff/admin are not hand-grantable by anyone, even owner', () => {
  for (const b of ['member', 'email_verified', 'banned', 'staff', 'admin']) assert.equal(B.canGrantBadge(U('owner'), U('user', 'x'), b).ok, false, b);
});
await t('tyler badge is owner-only; admin cannot give it', () => {
  assert.equal(B.canGrantBadge(U('admin'), U('user', 'x'), 'tyler').ok, false);
  assert.equal(B.canGrantBadge(U('owner'), U('user', 'x'), 'tyler').ok, true);
});
await t('admin can grant verified/fish/tawsif; staff can only grant contributor', () => {
  for (const b of ['verified', 'fish', 'tawsif', 'contributor']) assert.equal(B.canGrantBadge(U('admin'), U('user', 'x'), b).ok, true, b);
  assert.equal(B.canGrantBadge(U('staff'), U('user', 'x'), 'contributor').ok, true);
  assert.equal(B.canGrantBadge(U('staff'), U('user', 'x'), 'verified').ok, false);
});
await t('non-owners cannot grant themselves badges; banned staff can do nothing', () => {
  assert.equal(B.canGrantBadge(U('admin', 'a'), U('admin', 'a'), 'verified').reason, 'cannot_grant_self');
  assert.equal(B.canGrantBadge(U('admin', 'a', { banned: 1 }), U('user', 'x'), 'verified').ok, false);
});
await t('role changes: admin cannot make admins or touch equals; owner can; nobody edits self', () => {
  assert.equal(B.canSetRole(U('admin'), U('user', 'x'), 'admin').ok, false);
  assert.equal(B.canSetRole(U('admin'), U('user', 'x'), 'staff').ok, true);
  assert.equal(B.canSetRole(U('admin', 'a'), U('admin', 'b'), 'user').ok, false);
  assert.equal(B.canSetRole(U('owner'), U('user', 'x'), 'admin').ok, true);
  assert.equal(B.canSetRole(U('owner', 'o'), U('owner', 'o'), 'user').ok, false);
  assert.equal(B.canSetRole(U('staff'), U('user', 'x'), 'support').ok, false);
});
await t('ban rules: staff+ only, must outrank, never owner/self', () => {
  assert.equal(B.canBan(U('support'), U('user', 'x')).ok, false);
  assert.equal(B.canBan(U('staff'), U('user', 'x')).ok, true);
  assert.equal(B.canBan(U('staff'), U('staff', 'y')).ok, false);
  assert.equal(B.canBan(U('admin'), U('owner', 'o')).ok, false);
});
await t('display selection rejects unheld and unknown badges', () => {
  assert.equal(B.validateDisplaySelection(['member'], ['member']).ok, true);
  assert.deepEqual(B.validateDisplaySelection(['member'], ['member', 'admin', 'nope']).rejected, ['admin', 'nope']);
});

console.log('\nhelpers');
await t('password hashing round-trips and rejects wrong passwords', async () => {
  const h = await hashPassword('correct horse battery');
  assert.ok(await verifyPassword('correct horse battery', h));
  assert.ok(!(await verifyPassword('wrong', h)));
  assert.ok(!(await verifyPassword('x', 'garbage')));
});
await t('username/password validation', () => {
  assert.ok(validateUsername('ab')); assert.ok(validateUsername('Admin')); assert.ok(validateUsername('bad name'));
  assert.equal(validateUsername('Cool_Person1'), null);
  assert.ok(validatePassword('short')); assert.ok(validatePassword('password1'));
  assert.equal(validatePassword('a-fine-passphrase'), null);
});

console.log('\nCSRF middleware');
const mwCall = (method, headers) => mw({ request: new Request('https://tyler-fun.pages.dev/api/me', { method, headers, body: method === 'GET' ? undefined : '{}' }), env, next: async () => new Response('{}') });
await t('cross-site POST blocked, same-origin JSON allowed, non-JSON blocked', async () => {
  assert.equal((await mwCall('POST', { Origin: 'https://evil.example', 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await mwCall('POST', { Origin: ORIGIN, 'Content-Type': 'application/json' })).status, 200);
  assert.equal((await mwCall('POST', { Origin: ORIGIN, 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await mwCall('POST', { 'Content-Type': 'application/json' })).status, 403);
  assert.equal((await mwCall('GET', {})).status, 200);
});

console.log('\nregistration → verification → login');
const alice = client();
await t('register is generic (202) and creates a Member badge only', async () => {
  const r = await alice(register, 'POST', { username: 'Alice_1', email: 'Alice@Example.com', password: 'a-fine-passphrase' });
  assert.equal(r.status, 202);
  const row = env.DB.raw.prepare("SELECT id, email_verified, role FROM users WHERE username_lc='alice_1'").get();
  assert.equal(row.email_verified, 0); assert.equal(row.role, 'user');
  const badges = env.DB.raw.prepare('SELECT badge FROM badge_grants WHERE user_id=?').all(row.id).map((x) => x.badge);
  assert.deepEqual(badges, ['member']);
  assert.equal(outbox.length, 1);
});
await t('duplicate username → 409; duplicate email → same 202 (no enumeration) and sends a notice', async () => {
  assert.equal((await alice(register, 'POST', { username: 'alice_1', email: 'x@example.com', password: 'a-fine-passphrase' })).status, 409);
  const before = env.DB.raw.prepare("SELECT COUNT(*) n FROM users").get().n;
  const r = await alice(register, 'POST', { username: 'Other_2', email: 'alice@example.com', password: 'a-fine-passphrase' });
  assert.equal(r.status, 202);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM users").get().n, before);
  assert.match(outbox.at(-1).subject, /already have/);
});
await t('invalid input is rejected (reserved name, weak password)', async () => {
  assert.equal((await alice(register, 'POST', { username: 'admin', email: 'z@example.com', password: 'a-fine-passphrase' })).status, 400);
  assert.equal((await alice(register, 'POST', { username: 'zed_zed', email: 'z@example.com', password: 'short' })).status, 400);
});
await t('login before verifying works; wrong password and unknown user give identical errors', async () => {
  const bad = await alice(login, 'POST', { identifier: 'alice_1', password: 'nope-nope-nope' });
  const unk = await alice(login, 'POST', { identifier: 'ghost', password: 'nope-nope-nope' });
  assert.equal(bad.status, 401); assert.deepEqual(bad.body, unk.body);
  const ok = await alice(login, 'POST', { identifier: 'alice@example.com', password: 'a-fine-passphrase' });
  assert.equal(ok.status, 200);
  assert.ok(/__Host-tfsid=/.test(ok.headers.getSetCookie()[0]) && /HttpOnly/.test(ok.headers.getSetCookie()[0]) && /Secure/.test(ok.headers.getSetCookie()[0]));
  assert.equal(ok.body.user.emailVerified, false);
  assert.deepEqual(ok.body.user.badges.map((b) => b.id), ['member']);
});
await t('session token is stored hashed, not raw', async () => {
  const tok = env.DB.raw.prepare('SELECT id_hash FROM sessions').get().id_hash;
  assert.equal(tok.length, 64);
});
await t('verify-email: token works once, grants Email Verified badge', async () => {
  const token = tokenFromMail(outbox[0]);
  assert.equal((await alice(verify, 'POST', { token })).status, 200);
  assert.equal((await alice(verify, 'POST', { token })).status, 400);
  const g = await alice(me, 'GET');
  assert.equal(g.body.user.emailVerified, true);
  assert.deepEqual(g.body.user.badges.map((b) => b.id), ['member', 'email_verified']);
});

console.log('\nbadge self-service cannot be abused');
await t('user cannot display a badge they do not hold (admin, tyler, verified…)', async () => {
  for (const b of ['admin', 'staff', 'verified', 'tyler', 'fish', 'tawsif', 'banned', 'contributor']) {
    const r = await alice(meBadges, 'PUT', { displayed: ['member', b] });
    assert.equal(r.status, 403, b); assert.equal(r.body.error.code, 'badge_not_held');
  }
});
await t('user can hide/show only badges they hold; hiding is reflected on the public profile', async () => {
  const r = await alice(meBadges, 'PUT', { displayed: ['member'] });
  assert.equal(r.status, 200);
  const pub = await alice(profile, 'GET', undefined, { params: { username: 'alice_1' } });
  assert.deepEqual(pub.body.user.badges.map((b) => b.id), ['member']);
  assert.equal(pub.body.user.email, undefined);
});
await t('user-facing endpoints cannot change role or grant badges (admin routes 403)', async () => {
  assert.equal((await alice(adminBadges, 'POST', { username: 'alice_1', badge: 'verified', action: 'grant' })).status, 403);
  assert.equal((await alice(adminRole, 'POST', { username: 'alice_1', role: 'owner' })).status, 403);
  assert.equal((await alice(adminBan, 'POST', { username: 'alice_1', banned: true })).status, 403);
  // mass-assignment attempt on PATCH: extra fields are ignored, role stays user
  await alice(me, 'PATCH', { displayName: 'Alice', role: 'owner', banned: 0, email_verified: 1 });
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE username_lc='alice_1'").get().role, 'user');
});

console.log('\naccount management');
await t('profile update + public view; XSS-looking text is stored as plain text', async () => {
  const r = await alice(me, 'PATCH', { displayName: 'Alice <b>A</b>', bio: 'hi\u0000 there' });
  assert.equal(r.status, 200); assert.equal(r.body.user.bio, 'hi there');
  assert.equal((await alice(me, 'PATCH', { bio: 'x'.repeat(301) })).status, 400);
});
await t('username change: allowed once, then 30-day cooldown; taken names rejected', async () => {
  assert.equal((await alice(me, 'PATCH', { username: 'Alice_One' })).status, 200);
  assert.equal((await alice(me, 'PATCH', { username: 'Alice_Two' })).status, 429);
  assert.equal((await alice(me, 'PATCH', { username: 'ALICE_ONE' })).status, 200);   // case-only is free
});
await t('email change needs current password, drops Email Verified badge until re-verified', async () => {
  assert.equal((await alice(me, 'PATCH', { email: 'new@example.com' })).status, 403);
  const r = await alice(me, 'PATCH', { email: 'new@example.com', currentPassword: 'a-fine-passphrase' });
  assert.equal(r.status, 200); assert.equal(r.body.user.emailVerified, false);
  assert.ok(!r.body.user.badges.some((b) => b.id === 'email_verified'));
  const old = outbox.find((m) => m.to === 'Alice@Example.com' && /Verify your email/.test(m.text));
  assert.ok(outbox.at(-1).to === 'new@example.com');
  await alice(verify, 'POST', { token: tokenFromMail(outbox.at(-1)) });
  assert.ok((await alice(me, 'GET')).body.user.badges.some((b) => b.id === 'email_verified'));
});
await t('password change requires current password and logs out other sessions', async () => {
  const other = client();
  await other(login, 'POST', { identifier: 'alice_one', password: 'a-fine-passphrase' });
  assert.equal((await other(me, 'GET')).status, 200);
  assert.equal((await alice(mePw, 'POST', { currentPassword: 'wrong', newPassword: 'another-passphrase' })).status, 403);
  assert.equal((await alice(mePw, 'POST', { currentPassword: 'a-fine-passphrase', newPassword: 'another-passphrase' })).status, 200);
  assert.equal((await other(me, 'GET')).status, 401);
  assert.equal((await alice(me, 'GET')).status, 200);
});
await t('forgot/reset password: generic answer, one-time token, kills sessions', async () => {
  const n = outbox.length;
  const ghost = await alice(forgot, 'POST', { email: 'nobody@example.com' });
  const real = await alice(forgot, 'POST', { email: 'new@example.com' });
  assert.equal(ghost.status, 202); assert.deepEqual(ghost.body, real.body);
  assert.equal(outbox.length, n + 1);
  const token = tokenFromMail(outbox.at(-1));
  assert.equal((await alice(reset, 'POST', { token, password: 'short' })).status, 400);
  assert.equal((await alice(reset, 'POST', { token, password: 'brand-new-passphrase' })).status, 200);
  assert.equal((await alice(reset, 'POST', { token, password: 'brand-new-passphrase' })).status, 400);
  assert.equal((await alice(me, 'GET')).status, 401);
  assert.equal((await alice(login, 'POST', { identifier: 'alice_one', password: 'brand-new-passphrase' })).status, 200);
});
await t('logout invalidates the session server-side', async () => {
  assert.equal((await alice(logout, 'POST', {})).status, 200);
  assert.equal((await alice(me, 'GET')).status, 401);
});

console.log('\nstaff tooling');
const mk = (id, username, role) => {
  env.DB.raw.prepare('INSERT INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, created_at, updated_at) VALUES (?,?,?,?,?,?,1,?,?,?,?)')
    .run(id, username, username.toLowerCase(), username, `${username}@ex.com`, `${username}@ex.com`.toLowerCase(), 'x', role, 1, 1);
};
const ph = await hashPassword('owner-passphrase-1');
mk('o1', 'BossMan', 'owner'); mk('a1', 'Adm1', 'admin'); mk('s1', 'Staffer', 'staff'); mk('v1', 'Victim', 'user');
env.DB.raw.prepare("UPDATE users SET password_hash=? WHERE id IN ('o1','a1','s1','v1')").run(ph);
const owner = client(), adm = client(), stf = client(), usr = client();
for (const [c, n] of [[owner, 'bossman'], [adm, 'adm1'], [stf, 'staffer'], [usr, 'victim']]) assert.equal((await c(login, 'POST', { identifier: n, password: 'owner-passphrase-1' })).status, 200);
await t('owner promotes admin → staff/admin badges appear automatically; demotion removes them', async () => {
  assert.equal((await owner(adminRole, 'POST', { username: 'victim', role: 'admin' })).status, 200);
  assert.deepEqual(env.DB.raw.prepare("SELECT badge FROM badge_grants WHERE user_id='v1' ORDER BY badge").all().map((r) => r.badge), ['admin', 'staff']);
  assert.equal((await owner(adminRole, 'POST', { username: 'victim', role: 'user' })).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM badge_grants WHERE user_id='v1'").get().n, 0);
});
await t('admin cannot create admins, cannot touch owner; staff cannot change roles', async () => {
  assert.equal((await adm(adminRole, 'POST', { username: 'victim', role: 'admin' })).status, 403);
  assert.equal((await adm(adminRole, 'POST', { username: 'bossman', role: 'user' })).status, 403);
  assert.equal((await stf(adminRole, 'POST', { username: 'victim', role: 'support' })).status, 403);
  assert.equal((await adm(adminRole, 'POST', { username: 'victim', role: 'staff' })).status, 200);
  await adm(adminRole, 'POST', { username: 'victim', role: 'user' });
});
await t('badge grants follow the matrix and are audited', async () => {
  assert.equal((await adm(adminBadges, 'POST', { username: 'victim', badge: 'verified', action: 'grant' })).status, 200);
  assert.equal((await adm(adminBadges, 'POST', { username: 'victim', badge: 'tyler', action: 'grant' })).status, 403);
  assert.equal((await stf(adminBadges, 'POST', { username: 'victim', badge: 'fish', action: 'grant' })).status, 403);
  assert.equal((await stf(adminBadges, 'POST', { username: 'victim', badge: 'contributor', action: 'grant' })).status, 200);
  assert.equal((await owner(adminBadges, 'POST', { username: 'victim', badge: 'tyler', action: 'grant' })).status, 200);
  assert.equal((await adm(adminBadges, 'POST', { username: 'victim', badge: 'member', action: 'revoke' })).status, 403);
  assert.ok(env.DB.raw.prepare("SELECT COUNT(*) n FROM audit_log WHERE action='badge_grant'").get().n >= 3);
  const pub = await usr(profile, 'GET', undefined, { params: { username: 'victim' } });
  assert.ok(pub.body.user.badges.some((b) => b.id === 'verified'));
});
await t('ban kills sessions, blocks login, shows an unhideable Banned badge; unban restores', async () => {
  assert.equal((await stf(adminBan, 'POST', { username: 'staffer', banned: true })).status, 403);   // self
  assert.equal((await stf(adminBan, 'POST', { username: 'adm1', banned: true })).status, 403);      // outranks
  assert.equal((await stf(adminBan, 'POST', { username: 'victim', banned: true, reason: 'spam' })).status, 200);
  assert.equal((await usr(me, 'GET')).status, 401);
  assert.equal((await usr(login, 'POST', { identifier: 'victim', password: 'owner-passphrase-1' })).body.error.code, 'account_banned');
  const pub = await owner(profile, 'GET', undefined, { params: { username: 'victim' } });
  assert.ok(pub.body.user.badges.some((b) => b.id === 'banned'));
  assert.equal((await stf(adminBan, 'POST', { username: 'victim', banned: false })).status, 200);
  assert.equal((await usr(login, 'POST', { identifier: 'victim', password: 'owner-passphrase-1' })).status, 200);
  assert.ok(!(await usr(me, 'GET')).body.user.badges.some((b) => b.id === 'banned'));
});
await t('owner can demote another owner; account deletion removes all data', async () => {
  mk('o2', 'Boss2', 'owner');
  assert.equal((await owner(adminRole, 'POST', { username: 'boss2', role: 'admin' })).status, 200);   // two owners → ok
  assert.equal((await usr(me, 'DELETE', { currentPassword: 'wrong' })).status, 403);
  assert.equal((await usr(me, 'DELETE', { currentPassword: 'owner-passphrase-1' })).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM users WHERE id='v1'").get().n, 0);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM badge_grants WHERE user_id='v1'").get().n, 0);
});
await t('login rate limit kicks in', async () => {
  const c = client(); let last;
  for (let i = 0; i < 10; i++) last = await c(login, 'POST', { identifier: 'brute_target', password: 'guess-guess-' + i });
  assert.equal(last.status, 429);
});


console.log('\nno email provider (no domain owned yet)');
const envNoMail = { DB: env.DB, SITE_URL: 'https://tyler-fun.pages.dev' };           // no RESEND_API_KEY, no DEV_LOG_EMAILS
const callNoMail = async (mod, body) => mod.onRequestPost({ request: new Request('https://tyler-fun.pages.dev/api/x', { method: 'POST', headers: { Origin: 'https://tyler-fun.pages.dev', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9' }, body: JSON.stringify(body) }), env: envNoMail });
await t('register still works, says email is unavailable, and sends/stores no token', async () => {
  const before = env.DB.raw.prepare('SELECT COUNT(*) n FROM email_tokens').get().n;
  const res = await callNoMail(register, { username: 'NoMail_1', email: 'nomail@example.com', password: 'a-fine-passphrase' });
  const body = await res.json();
  assert.equal(res.status, 202); assert.equal(body.emailSent, false); assert.match(body.message, /log in now/);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM email_tokens').get().n, before);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM users WHERE username_lc='nomail_1'").get().n, 1);
});
await t('forgot-password is an honest 503 instead of silently doing nothing', async () => {
  const res = await callNoMail(forgot, { email: 'nomail@example.com' });
  assert.equal(res.status, 503); assert.equal((await res.json()).error.code, 'email_disabled');
});

console.log('\nGitHub sign-in (GitHub API mocked)');
import * as ghStart from '../functions/api/auth/github/start.js';
import * as ghCb from '../functions/api/auth/github/callback.js';
const envGh = { DB: env.DB, SITE_URL: 'https://tyler-fun.pages.dev', GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'sec', OWNER_GITHUB_ID: '777' };
const realFetch = globalThis.fetch;
const mockGitHub = ({ id, login, name, emails }) => { globalThis.fetch = async (u) => {
  const url = String(u);
  if (url.includes('login/oauth/access_token')) return Response.json({ access_token: 'tok' });
  if (url.endsWith('/user/emails')) return Response.json(emails);
  if (url.endsWith('/user')) return Response.json({ id, login, name });
  throw new Error('unexpected fetch ' + url);
}; };
async function ghLogin(profile, claim) {
  mockGitHub(profile);
  const s = await ghStart.onRequestGet({ env: envGh, request: new Request('https://tyler-fun.pages.dev/api/auth/github/start' + (claim ? `?claim=${claim}` : '')) });
  if (s.headers.get('Location').includes('/login/?error=')) return { cb: s, state: null, cookie: null };
  const loc = new URL(s.headers.get('Location'));
  assert.equal(loc.origin + loc.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(loc.searchParams.get('redirect_uri'), 'https://tyler-fun.pages.dev/api/auth/github/callback');
  const state = loc.searchParams.get('state');
  const cookie = s.headers.get('Set-Cookie').split(';')[0];
  const cb = await ghCb.onRequestGet({ env: envGh, request: new Request(`https://tyler-fun.pages.dev/api/auth/github/callback?code=abc&state=${state}`, { headers: { Cookie: cookie } }) });
  return { cb, state, cookie };
}
await t('state mismatch is rejected (no session created)', async () => {
  mockGitHub({ id: 1, login: 'x', emails: [] });
  const res = await ghCb.onRequestGet({ env: envGh, request: new Request('https://tyler-fun.pages.dev/api/auth/github/callback?code=abc&state=forged', { headers: { Cookie: '__Host-tfoauth=real' } }) });
  assert.match(res.headers.get('Location'), /error=oauth_state/);
});
await t('new GitHub user with a verified email: account + Member + Email Verified, lands on /settings/', async () => {
  const { cb } = await ghLogin({ id: 101, login: 'gh-person', name: 'GH Person', emails: [{ email: 'gh@example.com', primary: true, verified: true }] });
  assert.equal(cb.headers.get('Location'), 'https://tyler-fun.pages.dev/settings/');
  assert.ok(cb.headers.getSetCookie().some((c) => c.startsWith('__Host-tfsid=')));
  const u = env.DB.raw.prepare("SELECT id, username, role, email_verified FROM users WHERE username_lc='gh_person'").get();
  assert.ok(u && u.role === 'user' && u.email_verified === 1);
  assert.deepEqual(env.DB.raw.prepare('SELECT badge FROM badge_grants WHERE user_id=? ORDER BY badge').all(u.id).map((r) => r.badge), ['email_verified', 'member']);
});
await t('unverified GitHub email is never trusted: no Email Verified badge, no linking', async () => {
  await ghLogin({ id: 102, login: 'sneaky', emails: [{ email: 'alice@example.com', primary: true, verified: false }] });
  const u = env.DB.raw.prepare("SELECT id, email, email_verified FROM users WHERE username_lc='sneaky'").get();
  assert.equal(u.email, null); assert.equal(u.email_verified, 0);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM oauth_accounts WHERE provider_id = ?').get('102').n, 1);
});
await t('verified GitHub email matching a verified local account links to it (same user id)', async () => {
  const alice = env.DB.raw.prepare("SELECT id FROM users WHERE username_lc='alice_one'").get();
  env.DB.raw.prepare("UPDATE users SET email_verified=1 WHERE id=?").run(alice.id);
  const em = env.DB.raw.prepare('SELECT email FROM users WHERE id=?').get(alice.id).email;
  await ghLogin({ id: 103, login: 'alice-gh', emails: [{ email: em, primary: true, verified: true }] });
  assert.equal(env.DB.raw.prepare("SELECT user_id FROM oauth_accounts WHERE provider_id='103'").get().user_id, alice.id);
});
await t('OWNER_GITHUB_ID adopts the migrated "Tyler" account: owner role, same id/username/badges, nothing duplicated', async () => {
  const before = env.DB.raw.prepare('SELECT COUNT(*) n FROM users').get().n;
  await ghLogin({ id: 777, login: 'TylerGamerYT', name: 'Tyler', emails: [{ email: 'owner@example.com', primary: true, verified: true }] });
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM users').get().n, before);
  const u = env.DB.raw.prepare("SELECT id, username, role, unclaimed, email_verified FROM users WHERE username_lc='tyler'").get();
  assert.equal(u.id, 'legacy-tyler'); assert.equal(u.username, 'Tyler'); assert.equal(u.role, 'owner'); assert.equal(u.unclaimed, 0);
  assert.equal(env.DB.raw.prepare("SELECT user_id FROM oauth_accounts WHERE provider_id='777'").get().user_id, 'legacy-tyler');
  const badges = env.DB.raw.prepare('SELECT badge FROM badge_grants WHERE user_id=?').all(u.id).map((r) => r.badge).sort();
  assert.deepEqual(badges, ['admin', 'email_verified', 'member', 'staff', 'tyler', 'verified']);
});
await t('a non-owner GitHub user cannot take a reserved name (and the migrated one is untouched)', async () => {
  await ghLogin({ id: 888, login: 'admin', emails: [] });
  const gh = env.DB.raw.prepare("SELECT u.username, u.role FROM users u JOIN oauth_accounts o ON o.user_id=u.id WHERE o.provider_id='888'").get();
  assert.notEqual(gh.username.toLowerCase(), 'admin'); assert.equal(gh.role, 'user');
  assert.equal(env.DB.raw.prepare("SELECT unclaimed FROM users WHERE id='legacy-admin'").get().unclaimed, 1);
});

console.log('\nmigrated example accounts');
const LEGACY = {
  'tyler.fun': ['staff', 'verified'], yoiashley: ['member'], tawsif: ['member', 'tawsif'], staff: ['staff'], angle: ['member'],
  Tyler: ['admin', 'email_verified', 'member', 'staff', 'tyler', 'verified'], Fish: ['fish', 'member', 'staff', 'verified'], Support: ['staff', 'verified'],
  Guest: [], Ban: ['banned', 'member'], Admin: ['admin', 'staff', 'verified'], Aaban: ['member'],
};
await t('all 12 accounts exist with exact usernames; none can authenticate (no password, no email, no GitHub link) until handed over', async () => {
  const rows = env.DB.raw.prepare("SELECT username FROM users WHERE id LIKE 'legacy-%' ORDER BY username").all().map((r) => r.username);
  assert.deepEqual(rows, Object.keys(LEGACY).sort());
  const bad = env.DB.raw.prepare("SELECT username FROM users WHERE id LIKE 'legacy-%' AND id != 'legacy-tyler' AND (password_hash IS NOT NULL OR email IS NOT NULL OR unclaimed != 1 OR EXISTS (SELECT 1 FROM oauth_accounts o WHERE o.user_id = users.id))").all();
  assert.deepEqual(bad, []);
});
await t('NO migrated account got elevated permissions: every role is "user" except the owner-adopted Tyler', async () => {
  const roles = env.DB.raw.prepare("SELECT username, role FROM users WHERE id LIKE 'legacy-%' AND role != 'user'").all();
  assert.deepEqual(roles.map((r) => `${r.username}:${r.role}`), ['Tyler:owner']);
});
await t('each account keeps exactly the badges its page showed (Guest none; Ban is banned)', async () => {
  for (const [name, expected] of Object.entries(LEGACY)) {
    const got = env.DB.raw.prepare('SELECT badge FROM badge_grants WHERE user_id = ? ORDER BY badge').all('legacy-' + name.toLowerCase()).map((r) => r.badge);
    assert.deepEqual(got, [...expected].sort(), name);
  }
  assert.equal(env.DB.raw.prepare("SELECT banned FROM users WHERE id='legacy-ban'").get().banned, 1);
});
await t('bio / display name / avatar carried over', () => {
  const f = env.DB.raw.prepare("SELECT display_name, bio, avatar_emoji FROM users WHERE id='legacy-fish'").get();
  assert.equal(f.display_name, 'Fish'); assert.match(f.bio, /Official tester of tyler\.fun/); assert.equal(f.avatar_emoji, '🐟');
  assert.equal(env.DB.raw.prepare("SELECT display_name FROM users WHERE id='legacy-yoiashley'").get().display_name, 'Ashley');
});
await t('nobody can log in as them; their names (even dotted/underscored variants) cannot be registered', async () => {
  const c = client();
  for (const id of ['Fish', 'admin', 'tyler.fun', 'Support']) assert.equal((await c(login, 'POST', { identifier: id, password: 'whatever-password' }, { headers: { 'CF-Connecting-IP': '192.0.2.77' } })).status, 401);
  for (const name of ['Fish', 'tyler.fun', 'TYLER.FUN', 'ty.ler_fun', 'a.d.m.i.n', 'Guest']) {
    const r = await c(register, 'POST', { username: name, email: `x${Math.random().toString(36).slice(2)}@example.com`, password: 'a-fine-passphrase' }, { headers: { 'CF-Connecting-IP': '198.51.100.' + Math.floor(Math.random() * 200) } });
    assert.ok([400, 409].includes(r.status), name + ' -> ' + r.status);
  }
  const ok = await c(register, 'POST', { username: 'cool.person', email: 'cool@example.com', password: 'a-fine-passphrase' }, { headers: { 'CF-Connecting-IP': '198.51.100.250' } });
  assert.equal(ok.status, 202);   // dots are fine for normal names
});
await t('public profile works for migrated names incl. dots; joined date hidden; avatar present', async () => {
  const c = client();
  const r = await c(profile, 'GET', undefined, { params: { username: 'tyler.fun' } });
  assert.equal(r.status, 200); assert.equal(r.body.user.createdAt, null); assert.equal(r.body.user.avatarEmoji, 't.fun');
  assert.deepEqual(r.body.user.badges.map((b) => b.id), ['staff', 'verified']);
  assert.equal((await c(profile, 'GET', undefined, { params: { username: 'Guest' } })).body.user.badges.length, 0);
});

console.log('\ncentral management (no logging in as the accounts)');
const ownerC = client(), adminC = client(), staffC = client();
const mk2 = (id, username, role) => { env.DB.raw.prepare('INSERT INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, created_at, updated_at) VALUES (?,?,?,?,?,?,1,?,?,1,1)').run(id, username, username.toLowerCase(), username, `${username}@ex.com`, `${username}@ex.com`, ph, role); };
mk2('m-owner', 'OwnerTwo', 'owner'); mk2('m-admin', 'AdminTwo', 'admin'); mk2('m-staff', 'StaffTwo', 'staff');
for (const [c, n, ip] of [[ownerC, 'ownertwo', '192.0.2.11'], [adminC, 'admintwo', '192.0.2.12'], [staffC, 'stafftwo', '192.0.2.13']]) assert.equal((await c(login, 'POST', { identifier: n, password: 'owner-passphrase-1' }, { headers: { 'CF-Connecting-IP': ip } })).status, 200);
import * as adminUsers from '../functions/api/admin/users.js';
import * as adminClaim from '../functions/api/admin/claim.js';
import * as claimPeek from '../functions/api/auth/claim.js';
await t('owner/admin can edit migrated profiles centrally; staff cannot; audited', async () => {
  assert.equal((await ownerC(adminUsers, 'POST', { username: 'Fish', bio: 'New bio from the owner', avatarEmoji: '🐠' })).status, 200);
  assert.equal(env.DB.raw.prepare("SELECT bio, avatar_emoji FROM users WHERE id='legacy-fish'").get().bio, 'New bio from the owner');
  assert.equal((await adminC(adminUsers, 'POST', { username: 'Aaban', displayName: 'Aaban!' })).status, 200);
  assert.equal((await staffC(adminUsers, 'POST', { username: 'Aaban', displayName: 'nope' })).status, 403);
  assert.equal((await adminC(adminUsers, 'POST', { username: 'OwnerTwo', bio: 'hax' })).status, 403);
  assert.ok(env.DB.raw.prepare("SELECT COUNT(*) n FROM audit_log WHERE action='admin_edit_profile'").get().n >= 2);
});
await t('owner can grant extra badges / roles to migrated accounts through the normal admin routes', async () => {
  assert.equal((await ownerC(adminBadges, 'POST', { username: 'tawsif', badge: 'contributor', action: 'grant' })).status, 200);
  assert.equal((await ownerC(adminRole, 'POST', { username: 'staff', role: 'staff' })).status, 200);   // opt-in only
  assert.equal(env.DB.raw.prepare("SELECT role FROM users WHERE id='legacy-staff'").get().role, 'staff');
});

console.log('\nclaim links (handing an account to a real person)');
const claimUrlToken = (u) => new URL(u).searchParams.get('token');
let fishToken;
await t('only admin+ can create claim links; staff-role accounts need the owner; banned/claimed accounts refused', async () => {
  assert.equal((await staffC(adminClaim, 'POST', { username: 'yoiashley', action: 'create' })).status, 403);
  assert.equal((await adminC(adminClaim, 'POST', { username: 'staff', action: 'create' })).body.error.code, 'owner_only_for_staff_accounts');
  assert.equal((await ownerC(adminClaim, 'POST', { username: 'Ban', action: 'create' })).body.error.code, 'target_banned');
  assert.equal((await ownerC(adminClaim, 'POST', { username: 'Tyler', action: 'create' })).body.error.code, 'not_an_unclaimed_account');
  const r = await adminC(adminClaim, 'POST', { username: 'Fish', action: 'create' });
  assert.equal(r.status, 200); assert.match(r.body.claimUrl, /^https:\/\/tyler-fun\.pages\.dev\/claim\/\?token=/);
  fishToken = claimUrlToken(r.body.claimUrl);
  const stored = env.DB.raw.prepare("SELECT token_hash FROM claim_tokens WHERE user_id='legacy-fish'").get().token_hash;
  assert.notEqual(stored, fishToken); assert.equal(stored.length, 64);                                   // only the hash is stored
});
await t('claim page can preview which account a link is for; bad tokens are rejected', async () => {
  const c = client();
  const ok = await c(claimPeek, 'POST', { token: fishToken });
  assert.equal(ok.status, 200); assert.equal(ok.body.account.username, 'Fish');
  assert.equal((await c(claimPeek, 'POST', { token: 'x'.repeat(40) })).status, 404);
});
await t('claiming via GitHub links the identity, keeps role/badges/profile, logs the claimant in, and the link is single-use', async () => {
  const before = env.DB.raw.prepare("SELECT role, bio FROM users WHERE id='legacy-fish'").get();
  const badgesBefore = env.DB.raw.prepare("SELECT badge FROM badge_grants WHERE user_id='legacy-fish' ORDER BY badge").all();
  const { cb } = await ghLogin({ id: 5001, login: 'real-fish', emails: [{ email: 'fish@example.com', primary: true, verified: true }] }, fishToken);
  assert.equal(cb.headers.get('Location'), 'https://tyler-fun.pages.dev/settings/');
  assert.ok(cb.headers.getSetCookie().some((c) => c.startsWith('__Host-tfsid=')));
  const after = env.DB.raw.prepare("SELECT role, bio, unclaimed, email, email_verified FROM users WHERE id='legacy-fish'").get();
  assert.equal(after.role, before.role); assert.equal(after.bio, before.bio); assert.equal(after.unclaimed, 0);
  assert.equal(after.email, 'fish@example.com'); assert.equal(after.email_verified, 1);                  // verified GitHub email attached
  const badgesAfter = env.DB.raw.prepare("SELECT badge FROM badge_grants WHERE user_id='legacy-fish' ORDER BY badge").all().map((r) => r.badge);
  assert.deepEqual(badgesAfter, [...badgesBefore.map((r) => r.badge), 'email_verified'].sort());
  assert.equal(env.DB.raw.prepare("SELECT user_id FROM oauth_accounts WHERE provider_id='5001'").get().user_id, 'legacy-fish');
  // same link again (even from another GitHub user) fails
  const again = await ghLogin({ id: 5002, login: 'thief', emails: [] }, fishToken);
  assert.match(again.cb.headers.get('Location'), /error=claim_invalid/);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM oauth_accounts WHERE user_id='legacy-fish'").get().n, 1);
});
await t('a GitHub identity that already has an account is refused (and the link is NOT burned)', async () => {
  const r = await ownerC(adminClaim, 'POST', { username: 'Aaban', action: 'create' });
  const tok = claimUrlToken(r.body.claimUrl);
  const { cb } = await ghLogin({ id: 5001, login: 'real-fish', emails: [] }, tok);       // 5001 already owns Fish
  assert.match(cb.headers.get('Location'), /error=claim_conflict/);
  assert.equal(env.DB.raw.prepare("SELECT unclaimed FROM users WHERE id='legacy-aaban'").get().unclaimed, 1);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) n FROM claim_tokens WHERE used_at IS NULL AND user_id = ?').get('legacy-aaban').n, 1);
});
await t('expired and revoked links stop working', async () => {
  const r = await ownerC(adminClaim, 'POST', { username: 'angle', action: 'create' });
  const tok = claimUrlToken(r.body.claimUrl);
  env.DB.raw.prepare("UPDATE claim_tokens SET expires_at = 1 WHERE user_id='legacy-angle'").run();
  assert.match((await ghLogin({ id: 5003, login: 'late', emails: [] }, tok)).cb.headers.get('Location'), /error=claim_invalid/);
  const r2 = await ownerC(adminClaim, 'POST', { username: 'yoiashley', action: 'create' });
  await ownerC(adminClaim, 'POST', { username: 'yoiashley', action: 'revoke' });
  assert.match((await ghLogin({ id: 5004, login: 'x', emails: [] }, claimUrlToken(r2.body.claimUrl))).cb.headers.get('Location'), /error=claim_invalid/);
});
await t('a claimed account can change the letter-case of its reserved name but not rename to another reserved one', async () => {
  const fishSession = client();
  env.DB.raw.prepare("UPDATE users SET password_hash = ? WHERE id = 'legacy-fish'").run(ph);
  assert.equal((await fishSession(login, 'POST', { identifier: 'fish', password: 'owner-passphrase-1' }, { headers: { 'CF-Connecting-IP': '192.0.2.14' } })).status, 200);
  assert.equal((await fishSession(me, 'PATCH', { username: 'FISH' })).status, 200);
  assert.equal((await fishSession(me, 'PATCH', { username: 'Admin' })).status, 400);
});

globalThis.fetch = realFetch;

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures above)' : ''}`);
