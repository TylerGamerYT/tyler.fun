// Runs before every /api/* route.
// CSRF defence for cookie auth: unsafe methods must come from our own origin and carry JSON.
import { fail } from '../_lib/util.js';

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const origin = request.headers.get('Origin');
    const site = new URL(request.url).origin;
    if (origin) {
      if (origin !== site) return fail(403, 'bad_origin', 'Cross-site requests are not allowed.');
    } else {
      const sfs = request.headers.get('Sec-Fetch-Site');
      if (sfs !== 'same-origin' && sfs !== 'none' && env.ALLOW_NO_ORIGIN !== '1') {
        return fail(403, 'bad_origin', 'Missing Origin header.');
      }
    }
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.toLowerCase().startsWith('application/json')) return fail(415, 'json_required', 'Send application/json.');
  }
  const res = await ctx.next();
  const out = new Response(res.body, res);
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Cache-Control', 'no-store');
  return out;
}
