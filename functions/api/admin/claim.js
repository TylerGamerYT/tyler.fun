// POST { username, action: "create" | "revoke" }   (admin+; staff-or-higher accounts: owner only)
// "create" returns a one-time link (valid 72h). The token is shown ONCE and only its hash is stored.
import { json, fail, readJson, now, randomToken, sha256Hex, audit } from '../../_lib/util.js';
import { canIssueClaim } from '../../_lib/badges.js';
import { requireAuth, findUserByUsername } from '../../_lib/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const a = await requireAuth(ctx, { minRole: 'admin' });
  if (a instanceof Response) return a;
  const body = await readJson(request);
  if (!body || typeof body.username !== 'string' || !['create', 'revoke'].includes(body.action)) return fail(400, 'invalid_input', 'Send { username, action: "create" | "revoke" }.');
  const target = await findUserByUsername(env, body.username);
  if (!target) return fail(404, 'not_found', 'User not found.');
  const verdict = canIssueClaim(a.user, target);
  if (!verdict.ok) return fail(403, verdict.reason, 'You are not allowed to do that.');

  await env.DB.prepare('DELETE FROM claim_tokens WHERE user_id = ?').bind(target.id).run();   // at most one live link per account
  if (body.action === 'revoke') { await audit(env, a.user.id, 'claim_revoke', target.id, null); return json({ ok: true }); }

  const token = randomToken(32);
  const expiresAt = now() + 72 * 3600;
  await env.DB.prepare('INSERT INTO claim_tokens (token_hash, user_id, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), target.id, a.user.id, now(), expiresAt).run();
  await audit(env, a.user.id, 'claim_create', target.id, { expiresAt });
  return json({ ok: true, claimUrl: `${env.SITE_URL}/claim/?token=${token}`, expiresAt });
}
