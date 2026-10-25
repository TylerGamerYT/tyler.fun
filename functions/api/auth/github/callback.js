import { now, parseCookies, timingSafeEqual, clearCookie, OAUTH_COOKIE, isReserved, sha256Hex, audit } from '../../../_lib/util.js';
import { createSession, grantBadge, syncRoleBadges } from '../../../_lib/auth.js';

const back = (env, err, cookies = []) => {
  const h = new Headers({ Location: err ? `${env.SITE_URL}/login/?error=${err}` : `${env.SITE_URL}/settings/`, 'Cache-Control': 'no-store' });
  for (const c of cookies) h.append('Set-Cookie', c);
  return new Response(null, { status: 302, headers: h });
};

function makeUsername(login, taken, allowReserved = false) {
  let base = String(login).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 20);
  if (base.length < 3) base = (base + 'user').slice(0, 20);
  const ok = (n) => (allowReserved || !isReserved(n)) && !taken.has(n.toLowerCase());
  if (ok(base)) return base;
  for (let i = 0; i < 20; i++) {
    const cand = base.slice(0, 15) + '_' + String(Math.floor(Math.random() * 9000) + 1000);
    if (ok(cand)) return cand;
  }
  return 'user_' + crypto.randomUUID().slice(0, 8);
}

/**
 * Attach a GitHub identity to a migrated, unclaimed account. The account keeps EVERYTHING it already has
 * (username, bio, badges, role) – nothing is created or upgraded here. Only a verified GitHub email is added.
 */
async function linkGithubToUnclaimed(env, userId, ghId, ghEmail) {
  const t = now();
  const target = await env.DB.prepare('SELECT email_lc FROM users WHERE id = ? AND unclaimed = 1').bind(userId).first();
  if (!target) return false;
  const stmts = [
    env.DB.prepare("INSERT INTO oauth_accounts (provider, provider_id, user_id, created_at) VALUES ('github', ?, ?, ?)").bind(ghId, userId, t),
    env.DB.prepare('UPDATE users SET unclaimed = 0, updated_at = ? WHERE id = ? AND unclaimed = 1').bind(t, userId),
  ];
  if (ghEmail && !target.email_lc && !(await env.DB.prepare('SELECT 1 FROM users WHERE email_lc = ?').bind(ghEmail.toLowerCase()).first())) {
    stmts.push(env.DB.prepare('UPDATE users SET email = ?, email_lc = ?, email_verified = 1 WHERE id = ?').bind(ghEmail, ghEmail.toLowerCase(), userId), grantBadge(env, userId, 'email_verified', null));
  }
  await env.DB.batch(stmts);
  return true;
}

async function completeClaim(env, claimToken, ghId, ghEmail) {
  const hash = await sha256Hex(claimToken);
  const tok = await env.DB.prepare('SELECT user_id FROM claim_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(hash, now()).first();
  if (!tok) return { error: 'claim_invalid' };
  const target = await env.DB.prepare('SELECT id, unclaimed, banned FROM users WHERE id = ?').bind(tok.user_id).first();
  if (!target || !target.unclaimed || target.banned) return { error: 'claim_invalid' };
  // A GitHub identity can only own ONE account; refuse rather than silently merging two accounts.
  if (await env.DB.prepare("SELECT 1 FROM oauth_accounts WHERE provider = 'github' AND provider_id = ?").bind(ghId).first()) return { error: 'claim_conflict' };
  const used = await env.DB.prepare('UPDATE claim_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING user_id').bind(now(), hash, now()).first();
  if (!used) return { error: 'claim_invalid' };
  if (!(await linkGithubToUnclaimed(env, target.id, ghId, ghEmail))) return { error: 'claim_invalid' };
  await audit(env, target.id, 'claim_complete', target.id, { github: ghId });
  return { userId: target.id };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  const [expected = '', claim = ''] = (parseCookies(request)[OAUTH_COOKIE] || '').split('.');
  const clear = [clearCookie(OAUTH_COOKIE)];

  if (!code || !expected || !timingSafeEqual(state, expected)) return back(env, 'oauth_state', clear);

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'tyler-fun' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${env.SITE_URL}/api/auth/github/callback` }),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) return back(env, 'oauth_token', clear);

    const gh = { Authorization: `Bearer ${access_token}`, 'User-Agent': 'tyler-fun', Accept: 'application/vnd.github+json' };
    const profile = await (await fetch('https://api.github.com/user', { headers: gh })).json();
    if (!profile?.id || !profile?.login) return back(env, 'oauth_user', clear);
    const emails = await (await fetch('https://api.github.com/user/emails', { headers: gh })).json().catch(() => []);
    const verified = Array.isArray(emails) ? emails.filter((e) => e.verified) : [];
    const ghEmail = (verified.find((e) => e.primary) || verified[0])?.email || null;   // ONLY verified addresses are trusted
    const ghId = String(profile.id);
    const isOwner = !!env.OWNER_GITHUB_ID && ghId === String(env.OWNER_GITHUB_ID);

    let userId, user;
    if (claim) {                                                  // owner-issued, one-time claim of a migrated account
      const r = await completeClaim(env, claim, ghId, ghEmail);
      if (r.error) return back(env, r.error, clear);
      userId = r.userId; user = { id: userId, banned: 0 };
    } else {
      const link = await env.DB.prepare("SELECT user_id FROM oauth_accounts WHERE provider = 'github' AND provider_id = ?").bind(ghId).first();
      userId = link?.user_id;
      if (userId) {
        user = await env.DB.prepare('SELECT id, banned, email_verified FROM users WHERE id = ?').bind(userId).first();
      } else {
        const t = now();
        // 1) Owner's first login adopts the migrated personal account (default "Tyler") instead of creating a new one.
        const legacyName = (env.OWNER_LEGACY_USERNAME ?? 'Tyler').toLowerCase();
        const ownerLegacy = isOwner && legacyName ? await env.DB.prepare('SELECT id FROM users WHERE username_lc = ? AND unclaimed = 1').bind(legacyName).first() : null;
        if (ownerLegacy && await linkGithubToUnclaimed(env, ownerLegacy.id, ghId, ghEmail)) {
          userId = ownerLegacy.id; user = { id: userId, banned: 0 };
        } else {
          // 2) Link to an existing account only if BOTH sides have a verified email – otherwise anyone could pre-register a victim's email and inherit their GitHub login.
          const existing = ghEmail ? await env.DB.prepare('SELECT id, banned, email_verified FROM users WHERE email_lc = ? AND unclaimed = 0').bind(ghEmail.toLowerCase()).first() : null;
          if (existing && existing.email_verified) {
            userId = existing.id; user = existing;
            await env.DB.prepare("INSERT INTO oauth_accounts (provider, provider_id, user_id, created_at) VALUES ('github', ?, ?, ?)").bind(ghId, userId, t).run();
          } else {
            // 3) Brand-new account.
            userId = crypto.randomUUID();
            const { results } = await env.DB.prepare('SELECT username_lc FROM users WHERE username_lc LIKE ?').bind(String(profile.login).slice(0, 15).toLowerCase() + '%').all();
            const username = makeUsername(profile.login, new Set(results.map((r) => r.username_lc)), isOwner);
            const emailTaken = ghEmail && await env.DB.prepare('SELECT 1 FROM users WHERE email_lc = ?').bind(ghEmail.toLowerCase()).first();
            const emailFree = !!ghEmail && !emailTaken;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(userId, username, username.toLowerCase(), (profile.name || username).slice(0, 40), emailFree ? ghEmail : null, emailFree ? ghEmail.toLowerCase() : null, emailFree ? 1 : 0, t, t),
              env.DB.prepare("INSERT INTO oauth_accounts (provider, provider_id, user_id, created_at) VALUES ('github', ?, ?, ?)").bind(ghId, userId, t),
              grantBadge(env, userId, 'member'),
              ...(emailFree ? [grantBadge(env, userId, 'email_verified')] : []),
            ]);
            user = { id: userId, banned: 0 };
          }
        }
      }
    }
    if (user.banned) return back(env, 'banned', clear);

    // Bootstrap the site owner: set OWNER_GITHUB_ID (numeric GitHub user id) as a Cloudflare variable.
    if (isOwner) {
      await env.DB.prepare("UPDATE users SET role = 'owner', updated_at = ? WHERE id = ? AND role != 'owner'").bind(now(), userId).run();
      await syncRoleBadges(env, userId, 'owner');
      await env.DB.batch([grantBadge(env, userId, 'tyler')]);
      await audit(env, null, 'owner_bootstrap', userId, { github: ghId });
    }

    const session = await createSession(env, userId);
    return back(env, null, [...clear, session]);
  } catch (e) {
    console.error('github callback failed', e);
    return back(env, 'server_error', clear);
  }
}
