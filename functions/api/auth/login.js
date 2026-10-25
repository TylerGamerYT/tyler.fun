import { json, fail, readJson, clientIp, rateLimit, checkTurnstile, verifyPassword, burnPasswordTime } from '../../_lib/util.js';
import { createSession, selfView, findUserById } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return fail(400, 'bad_json', 'Invalid request body.');
  const { identifier, password } = body;
  if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier || !password || identifier.length > 254 || password.length > 128)
    return fail(400, 'invalid_input', 'Enter your email/username and password.');

  const ip = clientIp(request);
  const idLc = identifier.trim().toLowerCase();
  if (!(await rateLimit(env, `login-ip:${ip}`, 20, 600)) || !(await rateLimit(env, `login-id:${idLc}`, 8, 600)))
    return fail(429, 'rate_limited', 'Too many attempts. Please wait a few minutes.');
  if (!(await checkTurnstile(env, body.turnstile, ip))) return fail(400, 'captcha_failed', 'Captcha failed. Please try again.');

  const col = idLc.includes('@') ? 'email_lc' : 'username_lc';
  const user = await env.DB.prepare(`SELECT id, password_hash, banned FROM users WHERE ${col} = ?`).bind(idLc).first();

  const ok = user?.password_hash ? await verifyPassword(password, user.password_hash) : (await burnPasswordTime(password), false);
  if (!ok) return fail(401, 'invalid_credentials', 'Incorrect email/username or password.');
  if (user.banned) return fail(403, 'account_banned', 'This account has been banned.');

  const cookie = await createSession(env, user.id);
  const me = await findUserById(env, user.id);
  return json({ ok: true, user: await selfView(env, me) }, 200, { 'Set-Cookie': cookie });
}
