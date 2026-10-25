// POST { username, badge, action: "grant" | "revoke" }
import { json, fail, readJson, audit } from '../../_lib/util.js';
import { canGrantBadge, canRevokeBadge } from '../../_lib/badges.js';
import { requireAuth, findUserByUsername, grantBadge, revokeBadge } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx, { minRole: 'staff' });
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || typeof body.username !== 'string' || typeof body.badge !== 'string' || !['grant', 'revoke'].includes(body.action)) return fail(400, 'invalid_input', 'Send { username, badge, action }.');
  const target = await findUserByUsername(env, body.username);
  if (!target) return fail(404, 'not_found', 'User not found.');

  const verdict = (body.action === 'grant' ? canGrantBadge : canRevokeBadge)(a.user, target, body.badge);
  if (!verdict.ok) return fail(403, verdict.reason, 'You are not allowed to do that.');

  await env.DB.batch([body.action === 'grant' ? grantBadge(env, target.id, body.badge, a.user.id) : revokeBadge(env, target.id, body.badge)]);
  await audit(env, a.user.id, `badge_${body.action}`, target.id, { badge: body.badge });
  return json({ ok: true });
}
