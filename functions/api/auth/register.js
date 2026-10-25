import { json, fail, readJson, now, clientIp, rateLimit, checkTurnstile, hashPassword, validateUsername, validateEmail, validatePassword, sendEmail, emailEnabled } from '../../_lib/util.js';
import { grantBadge, issueEmailToken } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return fail(400, 'bad_json', 'Invalid request body.');
  const ip = clientIp(request);

  if (!(await rateLimit(env, `reg:${ip}`, 5, 3600))) return fail(429, 'rate_limited', 'Too many sign-ups from your network. Try again later.');
  if (!(await checkTurnstile(env, body.turnstile, ip))) return fail(400, 'captcha_failed', 'Captcha failed. Please try again.');

  const { username, email, password } = body;
  const problem = validateUsername(username) || validateEmail(email) || validatePassword(password, { username, email });
  if (problem) return fail(400, 'invalid_input', problem);

  const usernameLc = username.toLowerCase();
  const emailLc = email.toLowerCase();

  if (await env.DB.prepare('SELECT 1 FROM users WHERE username_lc = ?').bind(usernameLc).first())
    return fail(409, 'username_taken', 'That username is already taken.');

  // Same response whether or not the email is already registered, so this endpoint can't be used to probe emails.
  const mail = emailEnabled(env);
  const generic = json({ ok: true, emailSent: mail, message: mail
    ? 'Account created. Check your email to verify your address, then log in.'
    : 'Account created. You can log in now. (Email verification isn’t available yet – sign in with GitHub to get the Email Verified badge.)' }, 202);
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email_lc = ?').bind(emailLc).first();
  if (existing) {
    if (mail) await sendEmail(env, { to: email, subject: 'You already have a tyler.fun account',
      text: `Someone tried to sign up to tyler.fun with this email address, but it already has an account.\n\nIf that was you, log in at ${env.SITE_URL}/login/ (or use "Forgot password").\nIf it wasn't you, you can ignore this email.` });
    return generic;
  }

  const id = crypto.randomUUID();
  const t = now();
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO users (id, username, username_lc, display_name, email, email_lc, password_hash, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, username, usernameLc, username, email, emailLc, await hashPassword(password), t, t),
      grantBadge(env, id, 'member'),
    ]);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return fail(409, 'username_taken', 'That username is already taken.');
    throw e;
  }

  if (!mail) return generic;
  const token = await issueEmailToken(env, id, 'verify', emailLc, 24 * 3600);
  await sendEmail(env, { to: email, subject: 'Verify your tyler.fun email',
    text: `Welcome to tyler.fun, ${username}!\n\nVerify your email: ${env.SITE_URL}/verify-email/?token=${token}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.` });
  return generic;
}
