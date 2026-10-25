import { randomToken, setCookie, OAUTH_COOKIE, fail, sha256Hex, now } from '../../../_lib/util.js';

// GET /api/auth/github/start            → normal sign-in / sign-up
// GET /api/auth/github/start?claim=TOKEN → sign in with GitHub AND take over a migrated account (one-time link from the owner)
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.SITE_URL) return fail(500, 'misconfigured', 'GitHub login is not configured: set GITHUB_CLIENT_ID and SITE_URL.');
  const claim = new URL(request.url).searchParams.get('claim');
  let cookieValue;
  const state = randomToken(24);
  if (claim) {
    const ok = /^[A-Za-z0-9_-]{20,100}$/.test(claim) && await env.DB
      .prepare('SELECT 1 FROM claim_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(await sha256Hex(claim), now()).first();
    if (!ok) return new Response(null, { status: 302, headers: { Location: `${env.SITE_URL}/login/?error=claim_invalid`, 'Cache-Control': 'no-store' } });
    cookieValue = `${state}.${claim}`;                     // base64url has no '.', so the split is unambiguous
  } else cookieValue = state;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${env.SITE_URL}/api/auth/github/callback`);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  url.searchParams.set('allow_signup', 'true');
  return new Response(null, { status: 302, headers: { Location: url.toString(), 'Set-Cookie': setCookie(OAUTH_COOKIE, cookieValue, 600), 'Cache-Control': 'no-store' } });
}
