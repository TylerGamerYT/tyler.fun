import { json, fail, rateLimit, sendEmail, emailEnabled } from '../../_lib/util.js';
import { requireAuth, issueEmailToken } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const a = await requireAuth(ctx);
  if (a instanceof Response) return a;
  const { env } = ctx, u = a.user;
  if (!emailEnabled(env)) return fail(503, 'email_disabled', 'Email verification isn’t available yet.');
  if (u.email_verified) return json({ ok: true, message: 'Already verified.' });
  if (!u.email) return fail(400, 'no_email', 'Add an email address first.');
  if (!(await rateLimit(env, `resend:${u.id}`, 3, 3600))) return fail(429, 'rate_limited', 'Please wait before requesting another email.');
  const token = await issueEmailToken(env, u.id, 'verify', u.email.toLowerCase(), 24 * 3600);
  await sendEmail(env, { to: u.email, subject: 'Verify your tyler.fun email', text: `Verify your email: ${env.SITE_URL}/verify-email/?token=${token}\n\nThis link expires in 24 hours.` });
  return json({ ok: true, message: 'Verification email sent.' });
}
