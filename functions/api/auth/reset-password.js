import { json, fail, readJson, now, hashPassword, validatePassword } from '../../_lib/util.js';
import { consumeEmailToken, destroyAllSessions } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return fail(400, 'bad_json', 'Invalid request body.');
  const problem = validatePassword(body.password);
  if (problem) return fail(400, 'invalid_input', problem);
  const row = await consumeEmailToken(env, body.token, 'reset');
  if (!row) return fail(400, 'invalid_token', 'This reset link is invalid or has expired.');
  await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? AND email_lc = ?')
    .bind(await hashPassword(body.password), now(), row.user_id, row.email_lc).run();
  await destroyAllSessions(env, row.user_id);   // everyone signed in with the old password is logged out
  return json({ ok: true });
}
