import { json, fail, readJson, clientIp, rateLimit, checkTurnstile, sendEmail, emailEnabled } from '../../_lib/util.js';
import { issueEmailToken } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!emailEnabled(env)) return fail(503, 'email_disabled', 'Password reset by email isn’t available yet. Sign in with GitHub instead, or ask the site owner for help.');
  const body = await readJson(request);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254) return fail(400, 'invalid_input', 'Enter your email address.');
  const ip = clientIp(request);
  if (!(await rateLimit(env, `forgot-ip:${ip}`, 5, 3600)) || !(await rateLimit(env, `forgot-em:${email}`, 3, 3600)))
    return fail(429, 'rate_limited', 'Too many requests. Try again later.');
  if (!(await checkTurnstile(env, body.turnstile, ip))) return fail(400, 'captcha_failed', 'Captcha failed. Please try again.');

  // Only VERIFIED addresses can be used for reset, otherwise whoever registered first with someone else's email could be reset into.
  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email_lc = ? AND email_verified = 1 AND banned = 0').bind(email).first();
  if (user) {
    const token = await issueEmailToken(env, user.id, 'reset', email, 3600);
    await sendEmail(env, { to: user.email, subject: 'Reset your tyler.fun password',
      text: `Reset your password: ${env.SITE_URL}/reset-password/?token=${token}\n\nThis link expires in 1 hour. If you didn't ask for this, ignore this email – your password is unchanged.` });
  }
  return json({ ok: true, message: 'If that email has a verified account, a reset link is on its way.' }, 202);
}
