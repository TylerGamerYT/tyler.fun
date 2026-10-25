// POST { username, role }
import { json, fail, readJson, now, audit } from '../../_lib/util.js';
import { canSetRole } from '../../_lib/badges.js';
import { requireAuth, findUserByUsername, syncRoleBadges, destroyAllSessions } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx, { minRole: 'admin' });
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || typeof body.username !== 'string' || typeof body.role !== 'string') return fail(400, 'invalid_input', 'Send { username, role }.');
  const target = await findUserByUsername(env, body.username);
  if (!target) return fail(404, 'not_found', 'User not found.');
  const verdict = canSetRole(a.user, target, body.role);
  if (!verdict.ok) return fail(403, verdict.reason, 'You are not allowed to do that.');
  if (target.role === 'owner' && body.role !== 'owner') {
    const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner'").first();
    if (n <= 1) return fail(409, 'last_owner', 'There must always be at least one owner.');
  }
  await env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').bind(body.role, now(), target.id).run();
  await syncRoleBadges(env, target.id, body.role, a.user.id);
  await audit(env, a.user.id, 'role_change', target.id, { from: target.role, to: body.role });
  return json({ ok: true });
}
