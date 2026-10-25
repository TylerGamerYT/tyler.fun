// POST { username, displayName?, bio?, avatarEmoji? } – edit any account you outrank (owner: everyone) without logging in as them.
import { json, fail, readJson, now, cleanText, audit } from '../../_lib/util.js';
import { canManageUser } from '../../_lib/badges.js';
import { requireAuth, findUserByUsername } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx, { minRole: 'admin' });
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || typeof body.username !== 'string') return fail(400, 'invalid_input', 'Send { username, displayName?, bio?, avatarEmoji? }.');
  const target = await findUserByUsername(env, body.username);
  if (!target) return fail(404, 'not_found', 'User not found.');
  const verdict = canManageUser(a.user, target);
  if (!verdict.ok) return fail(403, verdict.reason, 'You are not allowed to do that.');

  const sets = [], vals = [], changed = [];
  if ('displayName' in body) { const v = cleanText(body.displayName, 40); if (!v) return fail(400, 'invalid_input', 'Display name must be 1–40 characters.'); sets.push('display_name = ?'); vals.push(v); changed.push('displayName'); }
  if ('bio' in body) { const v = cleanText(body.bio, 300); if (v === null) return fail(400, 'invalid_input', 'Bio must be 300 characters or fewer.'); sets.push('bio = ?'); vals.push(v); changed.push('bio'); }
  if ('avatarEmoji' in body) { const v = cleanText(String(body.avatarEmoji ?? ''), 8); if (v === null) return fail(400, 'invalid_input', 'Avatar must be a short emoji.'); sets.push('avatar_emoji = ?'); vals.push(v || null); changed.push('avatarEmoji'); }
  if (!sets.length) return fail(400, 'nothing_to_change', 'No changes provided.');
  await env.DB.prepare(`UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(...vals, now(), target.id).run();
  await audit(env, a.user.id, 'admin_edit_profile', target.id, { fields: changed });
  return json({ ok: true });
}
