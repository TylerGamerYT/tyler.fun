import { json, fail, readJson, now, rateLimit, verifyPassword, hashPassword, validatePassword } from '../../_lib/util.js';
import { requireAuth, destroyOtherSessions } from '../../_lib/auth.js';

// POST { currentPassword?, newPassword }  (currentPassword not needed for GitHub-only accounts setting a first password)
export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  const u = a.user;
  const body = await readJson(request);
  if (!body) return fail(400, 'bad_json', 'Invalid request body.');
  if (!(await rateLimit(env, `pw:${u.id}`, 5, 900))) return fail(429, 'rate_limited', 'Too many attempts. Try again later.');
  const problem = validatePassword(body.newPassword, { username: u.username, email: u.email || '' });
  if (problem) return fail(400, 'invalid_input', problem);
  if (u.has_password) {
    const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(u.id).first();
    if (typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, row.password_hash))) return fail(403, 'bad_password', 'Current password is incorrect.');
  } else if (!u.email_verified) {
    return fail(403, 'verify_email_first', 'Verify your email before adding a password.');
  }
  await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await hashPassword(body.newPassword), now(), u.id).run();
  await destroyOtherSessions(env, u.id, a.idHash);
  return json({ ok: true });
}
