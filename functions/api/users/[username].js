// Public profile. Never returns email or role-sensitive internals.
import { json, fail, USERNAME_RE } from '../../_lib/util.js';
import { findUserByUsername, publicBadges } from '../../_lib/auth.js';

export async function onRequestGet({ params, env }) {
  const name = String(params.username || '');
  if (!USERNAME_RE.test(name)) return fail(404, 'not_found', 'User not found.');
  const u = await findUserByUsername(env, name);
  if (!u) return fail(404, 'not_found', 'User not found.');
  return json({ ok: true, user: { username: u.username, displayName: u.display_name, bio: u.bio, avatarEmoji: u.avatar_emoji || null, createdAt: u.unclaimed ? null : u.created_at, banned: !!u.banned, badges: await publicBadges(env, u.id) } },
    200, { 'Cache-Control': 'public, max-age=30' });
}
