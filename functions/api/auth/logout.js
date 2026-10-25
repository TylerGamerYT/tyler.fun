import { json } from '../../_lib/util.js';
import { getSession, logoutCookie } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const s = await getSession(request, env);
  if (s) await env.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(s.idHash).run();
  return json({ ok: true }, 200, { 'Set-Cookie': logoutCookie() });
}
