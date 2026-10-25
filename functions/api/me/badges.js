// Users can only choose which of THEIR OWN badges to show.
import { json, fail, readJson } from '../../_lib/util.js';
import { BADGES, BADGE_IDS, validateDisplaySelection } from '../../_lib/badges.js';
import { requireAuth, heldBadges, selfView } from '../../_lib/auth.js';

export async function onRequestPut(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || !Array.isArray(body.displayed) || body.displayed.length > BADGE_IDS.length || !body.displayed.every((x) => typeof x === 'string'))
    return fail(400, 'invalid_input', 'Send { "displayed": ["badge_id", ...] }.');

  const held = await heldBadges(env, a.user.id);
  const heldIds = held.map((b) => b.badge);
  const requested = [...new Set(body.displayed)];
  const check = validateDisplaySelection(heldIds, requested);
  if (!check.ok) return fail(403, 'badge_not_held', 'You can only display badges you have earned.', { rejected: check.rejected });

  const show = new Set(requested);
  for (const id of heldIds) if (BADGES[id].alwaysShown) show.add(id);       // ban badge can't be hidden
  await env.DB.batch(heldIds.map((id) =>
    env.DB.prepare('UPDATE badge_grants SET displayed = ? WHERE user_id = ? AND badge = ?').bind(show.has(id) ? 1 : 0, a.user.id, id)));
  return json({ ok: true, user: await selfView(env, a.user) });
}
