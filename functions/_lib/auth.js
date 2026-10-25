// Sessions, current-user lookup, badge persistence. All badge WRITES live here, server-side only.
import { BADGES, BADGE_IDS, roleBadgesFor, roleRank } from './badges.js';
import { SESSION_COOKIE, SESSION_TTL, now, parseCookies, randomToken, sha256Hex, setCookie, clearCookie, fail } from './util.js';

const USER_COLS = `u.id, u.username, u.display_name, u.email, u.email_verified, u.role, u.banned, u.ban_reason,
  u.bio, u.avatar_emoji, u.unclaimed, u.username_changed_at, u.created_at, (u.password_hash IS NOT NULL) AS has_password`;

/* ---------- sessions ---------- */
export async function createSession(env, userId) {
  const token = randomToken(32);
  const t = now();
  await env.DB.prepare('INSERT INTO sessions (id_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, t, t + SESSION_TTL).run();
  return setCookie(SESSION_COOKIE, token, SESSION_TTL);
}

export async function getSession(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const idHash = await sha256Hex(token);
  const t = now();
  const row = await env.DB
    .prepare(`SELECT s.expires_at AS session_expires, ${USER_COLS} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ? AND s.expires_at > ?`)
    .bind(idHash, t).first();
  if (!row) return null;
  if (row.banned) { await env.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(idHash).run(); return null; }
  let refreshCookie = null;
  if (row.session_expires - t < SESSION_TTL / 2) {            // sliding expiry
    await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE id_hash = ?').bind(t + SESSION_TTL, idHash).run();
    refreshCookie = setCookie(SESSION_COOKIE, token, SESSION_TTL);
  }
  return { user: row, idHash, refreshCookie };
}

export const destroyOtherSessions = (env, userId, keepHash) =>
  env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id_hash != ?').bind(userId, keepHash ?? '').run();
export const destroyAllSessions = (env, userId) =>
  env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
export const logoutCookie = () => clearCookie(SESSION_COOKIE);

/** Returns {user, idHash, refreshCookie} or a 401/403 Response. Usage: if (a instanceof Response) return a; */
export async function requireAuth({ request, env }, { minRole } = {}) {
  const s = await getSession(request, env);
  if (!s) return fail(401, 'not_authenticated', 'Please log in.');
  if (minRole) {
    if (roleRank(s.user.role) < roleRank(minRole)) return fail(403, 'forbidden', 'You do not have permission to do that.');
  }
  return s;
}

/* ---------- users ---------- */
export const findUserById = (env, id) =>
  env.DB.prepare(`SELECT ${USER_COLS} FROM users u WHERE u.id = ?`).bind(id).first();
export const findUserByUsername = (env, username) =>
  env.DB.prepare(`SELECT ${USER_COLS} FROM users u WHERE u.username_lc = ?`).bind(String(username).toLowerCase()).first();

/* ---------- badges (server-side only) ---------- */
export async function heldBadges(env, userId) {
  const { results } = await env.DB.prepare('SELECT badge, displayed, granted_at FROM badge_grants WHERE user_id = ?').bind(userId).all();
  return results.filter((r) => BADGES[r.badge]);
}

export const grantBadge = (env, userId, badge, grantedBy = null, displayed = 1) =>
  env.DB.prepare('INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, badge, grantedBy, now(), displayed);
export const revokeBadge = (env, userId, badge) =>
  env.DB.prepare('DELETE FROM badge_grants WHERE user_id = ? AND badge = ?').bind(userId, badge);

/** Make staff/admin badges match the user's role (adds missing, removes stale). */
export async function syncRoleBadges(env, userId, role, grantedBy = null) {
  const want = new Set(roleBadgesFor(role));
  const stmts = BADGE_IDS.filter((id) => BADGES[id].kind === 'role')
    .map((id) => (want.has(id) ? grantBadge(env, userId, id, grantedBy) : revokeBadge(env, userId, id)));
  if (stmts.length) await env.DB.batch(stmts);
}

/** What the outside world may see: only badges the user holds AND chose to show (banned is always shown). */
export async function publicBadges(env, userId) {
  const held = await heldBadges(env, userId);
  return held
    .filter((b) => b.displayed || BADGES[b.badge].alwaysShown)
    .sort((a, b) => BADGE_IDS.indexOf(a.badge) - BADGE_IDS.indexOf(b.badge))
    .map((b) => ({ id: b.badge, label: BADGES[b.badge].label }));
}

export async function selfView(env, user) {
  const held = await heldBadges(env, user.id);
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    emailVerified: !!user.email_verified,
    hasPassword: !!user.has_password,
    role: user.role,
    bio: user.bio,
    avatarEmoji: user.avatar_emoji || null,
    createdAt: user.created_at,
    badges: held
      .sort((a, b) => BADGE_IDS.indexOf(a.badge) - BADGE_IDS.indexOf(b.badge))
      .map((b) => ({ id: b.badge, label: BADGES[b.badge].label, displayed: !!b.displayed, locked: !!BADGES[b.badge].alwaysShown })),
  };
}

/* ---------- email tokens ---------- */
export async function issueEmailToken(env, userId, purpose, emailLc, ttlSec) {
  const token = randomToken(32);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?').bind(userId, purpose),
    env.DB.prepare('INSERT INTO email_tokens (token_hash, user_id, purpose, email_lc, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(await sha256Hex(token), userId, purpose, emailLc, now() + ttlSec),
  ]);
  return token;
}
export async function consumeEmailToken(env, token, purpose) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const hash = await sha256Hex(token);
  // Atomic "use once": only one request can flip used_at from NULL.
  const row = await env.DB
    .prepare('UPDATE email_tokens SET used_at = ? WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ? RETURNING user_id, email_lc')
    .bind(now(), hash, purpose, now()).first();
  return row || null;
}
