// POST { token } → tells the claim page WHICH account the link is for (without using it up).
import { json, fail, readJson, now, clientIp, rateLimit, sha256Hex } from '../../_lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!(await rateLimit(env, `claim-peek:${clientIp(request)}`, 20, 600))) return fail(429, 'rate_limited', 'Too many attempts.');
  const body = await readJson(request);
  const token = body?.token;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return fail(404, 'claim_invalid', 'This claim link is invalid or has expired.');
  const row = await env.DB.prepare(`SELECT u.username, u.display_name, u.avatar_emoji FROM claim_tokens c JOIN users u ON u.id = c.user_id
                                    WHERE c.token_hash = ? AND c.used_at IS NULL AND c.expires_at > ? AND u.unclaimed = 1 AND u.banned = 0`).bind(await sha256Hex(token), now()).first();
  if (!row) return fail(404, 'claim_invalid', 'This claim link is invalid or has expired.');
  return json({ ok: true, account: { username: row.username, displayName: row.display_name, avatarEmoji: row.avatar_emoji || null } });
}
