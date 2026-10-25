import { json, fail, readJson, now, cleanText, validateUsername, validateEmail, rateLimit, verifyPassword, sendEmail, emailEnabled, audit } from '../../_lib/util.js';
import { requireAuth, selfView, issueEmailToken, destroyAllSessions, logoutCookie, findUserById } from '../../_lib/auth.js';

const withRefresh = (a, res) => { if (a.refreshCookie) res.headers.append('Set-Cookie', a.refreshCookie); return res; };

export async function onRequestGet(ctx) {
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  return withRefresh(a, json({ ok: true, user: await selfView(ctx.env, a.user) }));
}

// PATCH { displayName?, bio?, username?, email?, currentPassword? }
export async function onRequestPatch(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  const u = a.user;
  const body = await readJson(request);
  if (!body) return fail(400, 'bad_json', 'Invalid request body.');
  if (!(await rateLimit(env, `patch-me:${u.id}`, 30, 600))) return fail(429, 'rate_limited', 'Slow down a little.');

  const sets = [], vals = [];
  if ('displayName' in body) {
    const v = cleanText(body.displayName, 40);
    if (!v) return fail(400, 'invalid_input', 'Display name must be 1–40 characters.');
    sets.push('display_name = ?'); vals.push(v);
  }
  if ('bio' in body) {
    const v = cleanText(body.bio, 300);
    if (v === null) return fail(400, 'invalid_input', 'Bio must be 300 characters or fewer.');
    sets.push('bio = ?'); vals.push(v);
  }
  if ('avatarEmoji' in body) {
    const v = cleanText(String(body.avatarEmoji ?? ''), 8);
    if (v === null) return fail(400, 'invalid_input', 'Avatar must be a short emoji or a few characters.');
    sets.push('avatar_emoji = ?'); vals.push(v || null);
  }
  if ('username' in body && body.username !== u.username) {
    // Changing only letter-case is always allowed (even for migrated reserved names); real renames are limited to once per 30 days.
    const caseOnly = body.username.toLowerCase() === u.username.toLowerCase();
    const problem = validateUsername(body.username, { allowReserved: caseOnly });
    if (problem) return fail(400, 'invalid_input', problem);
    if (!caseOnly) {
      if (u.username_changed_at && now() - u.username_changed_at < 30 * 86400) return fail(429, 'username_cooldown', 'You can change your username once every 30 days.');
      if (await env.DB.prepare('SELECT 1 FROM users WHERE username_lc = ?').bind(body.username.toLowerCase()).first()) return fail(409, 'username_taken', 'That username is already taken.');
      sets.push('username_changed_at = ?'); vals.push(now());
    }
    sets.push('username = ?', 'username_lc = ?'); vals.push(body.username, body.username.toLowerCase());
  }

  let verifyMail = null;
  if ('email' in body && String(body.email).toLowerCase() !== (u.email || '').toLowerCase()) {
    const problem = validateEmail(body.email);
    if (problem) return fail(400, 'invalid_input', problem);
    if (u.has_password) {   // re-authenticate before changing the address that controls password resets
      const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(u.id).first();
      if (typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, row.password_hash))) return fail(403, 'bad_password', 'Current password is incorrect.');
    }
    const emailLc = body.email.toLowerCase();
    if (await env.DB.prepare('SELECT 1 FROM users WHERE email_lc = ? AND id != ?').bind(emailLc, u.id).first()) return fail(409, 'email_taken', 'That email can’t be used.');
    sets.push('email = ?', 'email_lc = ?', 'email_verified = 0'); vals.push(body.email, emailLc);
    verifyMail = { to: body.email, emailLc };
  }

  if (!sets.length) return fail(400, 'nothing_to_change', 'No changes provided.');
  sets.push('updated_at = ?'); vals.push(now());
  try {
    await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, u.id).run();
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return fail(409, 'conflict', 'That username or email is already taken.');
    throw e;
  }
  if (verifyMail) {
    // new, unverified address => the Email Verified badge must go until it is verified again
    await env.DB.prepare("DELETE FROM badge_grants WHERE user_id = ? AND badge = 'email_verified'").bind(u.id).run();
    if (emailEnabled(env)) {
    const token = await issueEmailToken(env, u.id, 'verify', verifyMail.emailLc, 24 * 3600);
    await sendEmail(env, { to: verifyMail.to, subject: 'Verify your new tyler.fun email', text: `Verify your email: ${env.SITE_URL}/verify-email/?token=${token}` });
    }
  }
  const fresh = await findUserById(env, u.id);
  return withRefresh(a, json({ ok: true, user: await selfView(env, fresh) }));
}

// DELETE { currentPassword? }  – permanently deletes the account
export async function onRequestDelete(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  const u = a.user;
  const body = (await readJson(request)) || {};
  if (u.role === 'owner') return fail(403, 'forbidden', 'Owner accounts can’t be self-deleted.');
  if (u.has_password) {
    const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(u.id).first();
    if (typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, row.password_hash))) return fail(403, 'bad_password', 'Current password is incorrect.');
  }
  await destroyAllSessions(env, u.id);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM badge_grants WHERE user_id = ?').bind(u.id),
    env.DB.prepare('DELETE FROM oauth_accounts WHERE user_id = ?').bind(u.id),
    env.DB.prepare('DELETE FROM email_tokens WHERE user_id = ?').bind(u.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id),
  ]);
  await audit(env, u.id, 'account_deleted', u.id, null);
  return json({ ok: true }, 200, { 'Set-Cookie': logoutCookie() });
}
