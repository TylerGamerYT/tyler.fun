// POST { username, banned: true|false, reason? }
import { json, fail, readJson, now, cleanText, audit } from '../../_lib/util.js';
import { canBan } from '../../_lib/badges.js';
import { requireAuth, findUserByUsername, grantBadge, revokeBadge, destroyAllSessions } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx, { minRole: 'staff' });
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || typeof body.username !== 'string' || typeof body.banned !== 'boolean') return fail(400, 'invalid_input', 'Send { username, banned, reason? }.');
  const target = await findUserByUsername(env, body.username);
  if (!target) return fail(404, 'not_found', 'User not found.');
  const verdict = canBan(a.user, target);
  if (!verdict.ok) return fail(403, verdict.reason, 'You are not allowed to do that.');

  const reason = body.banned ? (cleanText(body.reason ?? '', 200) ?? '') : null;
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET banned = ?, ban_reason = ?, updated_at = ? WHERE id = ?').bind(body.banned ? 1 : 0, reason, now(), target.id),
    body.banned ? grantBadge(env, target.id, 'banned', a.user.id) : revokeBadge(env, target.id, 'banned'),
  ]);
  if (body.banned) await destroyAllSessions(env, target.id);
  await audit(env, a.user.id, body.banned ? 'ban' : 'unban', target.id, { reason });
  return json({ ok: true });
}
