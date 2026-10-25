// Shared helpers for Pages Functions. Web-standard APIs only.

const enc = new TextEncoder();

export const SESSION_COOKIE = '__Host-tfsid';
export const OAUTH_COOKIE = '__Host-tfoauth';
export const SESSION_TTL = 30 * 24 * 3600;
export const now = () => Math.floor(Date.now() / 1000);

/* ---------- responses ---------- */
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
export const fail = (status, code, message, extra = {}) =>
  json({ ok: false, error: { code, message, ...extra } }, status);

export async function readJson(request, maxBytes = 16 * 1024) {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch { return null; }
}

/* ---------- crypto ---------- */
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const randomToken = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));
export async function sha256Hex(str) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function timingSafeEqual(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// Workers' WebCrypto caps PBKDF2 at 100,000 iterations, so that's what we use.
const PBKDF2_ITERS = 100_000;
async function pbkdf2(password, salt, iters) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iters }, key, 256);
  return new Uint8Array(bits);
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERS);
  return `pbkdf2$${PBKDF2_ITERS}$${b64url(salt)}$${b64url(hash)}`;
}
export async function verifyPassword(password, stored) {
  const [scheme, iters, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || !iters || !salt || !hash) return false;
  const got = await pbkdf2(password, unb64url(salt), Number(iters));
  return timingSafeEqual(b64url(got), hash);
}
// Burned when the account doesn't exist so "no such user" and "wrong password" take the same time.
let dummy;
export async function burnPasswordTime(password) {
  dummy ??= await hashPassword('dummy-password-for-timing');
  await verifyPassword(password, dummy);
}

/* ---------- validation ---------- */
export const USERNAME_RE = /^(?!.*\.\.)[A-Za-z0-9_][A-Za-z0-9_.]{1,18}[A-Za-z0-9_]$/;   // 3–20 chars, dots allowed inside (not first/last, not doubled)
export const RESERVED_USERNAMES = new Set([
  'aaban', 'admin', 'administrator', 'angle', 'api', 'apps', 'ban', 'banned', 'changelog', 'events', 'fish', 'games',
  'guest', 'help', 'login', 'logout', 'me', 'mod', 'moderator', 'null', 'official', 'owner', 'privacy', 'root',
  'security', 'settings', 'signup', 'socials', 'staff', 'support', 'system', 'tawsif', 'terms', 'tyler', 'tylerfun',
  'tylergameryt', 'tyler.fun', 'u', 'undefined', 'users', 'yoiashley',
]);
// Compare with dots/underscores stripped too, so "ad.min" or "t_y_l_e_r" can't dodge the list.
const squash = (n) => n.toLowerCase().replace(/[._]/g, '');
const RESERVED_SQUASHED = new Set([...RESERVED_USERNAMES].map(squash));
export const isReserved = (name) => RESERVED_USERNAMES.has(name.toLowerCase()) || RESERVED_SQUASHED.has(squash(name));
const COMMON_PASSWORDS = new Set(['password', 'password1', '12345678', '123456789', 'qwertyui', 'iloveyou', 'letmein1', 'tyler.fun', 'tylerfun1']);

export function validateUsername(v, { allowReserved = false } = {}) {
  if (typeof v !== 'string' || !USERNAME_RE.test(v)) return 'Username must be 3–20 characters: letters, numbers, underscore or dot (dots not at the start or end).';
  if (!allowReserved && isReserved(v)) return 'That username is reserved.';
  return null;
}
export function validateEmail(v) {
  if (typeof v !== 'string' || v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address.';
  return null;
}
export function validatePassword(v, { username = '', email = '' } = {}) {
  if (typeof v !== 'string' || v.length < 8) return 'Password must be at least 8 characters.';
  if (v.length > 128) return 'Password must be 128 characters or fewer.';
  const lc = v.toLowerCase();
  if (COMMON_PASSWORDS.has(lc)) return 'That password is too common.';
  if (username && lc.includes(username.toLowerCase())) return 'Password must not contain your username.';
  if (email && lc === email.toLowerCase()) return 'Password must not be your email.';
  return null;
}
export function cleanText(v, max) {
  if (typeof v !== 'string') return null;
  // strip control characters; collapse nothing else – output is always rendered with textContent
  const t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return t.length <= max ? t : null;
}

/* ---------- cookies ---------- */
export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
export const setCookie = (name, value, maxAge) =>
  `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
export const clearCookie = (name) => setCookie(name, '', 0);

/* ---------- request metadata ---------- */
export const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';

/* ---------- rate limiting (fixed window in D1) ---------- */
export async function rateLimit(env, key, limit, windowSec) {
  const t = now();
  const bucket = Math.floor(t / windowSec);
  const row = await env.DB
    .prepare('INSERT INTO rate_limits (k, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(`${key}:${bucket}`, (bucket + 1) * windowSec)
    .first();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(t).run();
  return row.count <= limit;
}

/* ---------- Turnstile (optional: enforced only when TURNSTILE_SECRET is set) ---------- */
export async function checkTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== 'string' || !token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const d = await r.json().catch(() => ({}));
  return d.success === true;
}

/* ---------- email (Resend) ---------- */
// Email only counts as "on" when a provider key exists (or in local dev). Without a domain you own,
// there is nothing that can deliver to arbitrary users, so the app degrades gracefully instead of promising emails.
export const emailEnabled = (env) => !!env.RESEND_API_KEY || env.DEV_LOG_EMAILS === '1';

export async function sendEmail(env, { to, subject, text }) {
  if (env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text }),
    });
    if (!r.ok) console.error('Resend error', r.status, await r.text().catch(() => ''));
    return r.ok;
  }
  if (env.DEV_LOG_EMAILS === '1') {            // local development only
    console.log(`[dev email] to=${to}\n${subject}\n${text}`);
    env.__outbox?.push({ to, subject, text });
    return true;
  }
  console.error('RESEND_API_KEY is not set – email not sent');
  return false;
}

export const audit = (env, actorId, action, targetId, detail) =>
  env.DB.prepare('INSERT INTO audit_log (at, actor_id, action, target_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(now(), actorId ?? null, action, targetId ?? null, detail ? JSON.stringify(detail) : null).run();
