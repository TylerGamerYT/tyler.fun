// POST {token}. (A static page /verify-email/ posts here, so mail scanners that prefetch links can't burn the token.)
import { json, fail, readJson, now } from '../../_lib/util.js';
import { consumeEmailToken, grantBadge } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const row = await consumeEmailToken(env, body?.token, 'verify');
  if (!row) return fail(400, 'invalid_token', 'This verification link is invalid or has expired.');
  // The token is tied to the address it was sent to; if the user has since changed email, it no longer applies.
  const res = await env.DB.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ? AND email_lc = ?').bind(now(), row.user_id, row.email_lc).run();
  if (!res.meta?.changes) return fail(400, 'invalid_token', 'This verification link is invalid or has expired.');
  await env.DB.batch([grantBadge(env, row.user_id, 'email_verified')]);
  return json({ ok: true });
}
