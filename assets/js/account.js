// Settings-page glue: when logged in, profile + badges are saved to the SERVER instead of localStorage.
// Cosmetic prefs (theme, accent, animations) intentionally stay in localStorage via settings.js.
(async function () {
  const $ = (id) => document.getElementById(id);
  const user = await TF.me();
  const box = document.querySelector('.notice-box');

  if (!user) {                               // guests keep the old local-preview behaviour, with an honest notice
    if (box) box.querySelector('span:last-child').textContent = 'You’re not logged in. These profile settings only preview on this device – log in to save them to your account.';
    return;
  }
  if (box) box.style.display = 'none';

  // swap controls for clones so the old localStorage listeners are dropped
  const fresh = (id) => { const old = $(id); if (!old) return null; const c = old.cloneNode(true); old.replaceWith(c); return c; };
  const fields = { displayName: fresh('displayNameInput'), username: fresh('usernameInput'), bio: fresh('bioInput') };
  const BADGE_TOGGLES = { tyler: 'tylerBadgeToggle', fish: 'fishBadgeToggle', tawsif: 'tawsifBadgeToggle', admin: 'adminBadgeToggle', staff: 'staffBadgeToggle', verified: 'verifiedBadgeToggle', email_verified: 'emailBadgeToggle', member: 'memberBadgeToggle', banned: 'bannedBadgeToggle' };
  const toggles = {}; for (const [id, el] of Object.entries(BADGE_TOGGLES)) toggles[id] = fresh(el);

  const status = document.createElement('div');
  status.className = 'msg'; status.setAttribute('role', 'status');
  document.querySelector('.container').insertBefore(status, document.querySelector('.section'));
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/assets/css/auth.css'; document.head.appendChild(link);

  function render(u) {
    fields.displayName.value = u.displayName; fields.username.value = u.username; fields.bio.value = u.bio || '';
    const held = new Map(u.badges.map((b) => [b.id, b]));
    for (const [id, el] of Object.entries(toggles)) {
      if (!el) continue;
      const row = el.closest('.setting'); const b = held.get(id);
      row.style.display = b ? '' : 'none';                 // badges you don't hold aren't offered at all
      el.checked = !!(b && b.displayed); el.disabled = !!(b && b.locked);
    }
  }
  render(user);

  const save = async (patch, okText) => {
    const r = await TF.api('/me', { method: 'PATCH', body: patch });
    if (r.ok) { render(r.data.user); TF.setMsg(status, okText || 'Saved.', 'ok'); } else { TF.setMsg(status, r.error.message, 'error'); render(await TF.me() || user); }
  };
  let t; const debounced = (fn) => { clearTimeout(t); t = setTimeout(fn, 600); };
  fields.displayName.addEventListener('input', () => debounced(() => save({ displayName: fields.displayName.value })));
  fields.bio.addEventListener('input', () => debounced(() => save({ bio: fields.bio.value })));
  fields.username.addEventListener('change', () => save({ username: fields.username.value.trim().replace(/^@/, '') }, 'Username updated.'));

  for (const el of Object.values(toggles)) el && el.addEventListener('change', async () => {
    const displayed = Object.entries(toggles).filter(([, e]) => e && e.checked).map(([id]) => id);
    const r = await TF.api('/me/badges', { method: 'PUT', body: { displayed } });
    if (r.ok) { render(r.data.user); TF.setMsg(status, 'Badges updated.', 'ok'); } else { TF.setMsg(status, r.error.message, 'error'); render(await TF.me() || user); }
  });

  // ---- Account section (email, password, sessions, delete) ----
  const sec = document.createElement('div'); sec.className = 'section';
  const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Account';
  const panel = document.createElement('div'); panel.className = 'panel'; panel.style.padding = '16px';
  sec.append(title, panel);
  const row = (label, ...els) => { const d = document.createElement('div'); d.className = 'setting'; const l = document.createElement('div'); l.className = 'setting-name'; l.textContent = label; const w = document.createElement('div'); w.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center'; w.append(...els); d.append(l, w); panel.append(d); return d; };
  const input = (type, ph, ac) => { const i = document.createElement('input'); i.type = type; i.placeholder = ph; i.autocomplete = ac || 'off'; return i; };
  const btn = (text, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.style.cssText = 'padding:8px 14px;border-radius:8px;cursor:pointer'; b.addEventListener('click', fn); return b; };

  const email = input('email', 'new@example.com', 'email'); email.value = user.email || '';
  const curPw = input('password', user.hasPassword ? 'Current password' : 'Not needed', 'current-password'); curPw.disabled = !user.hasPassword;
  row('Email' + (user.emailVerified ? ' (verified ✓)' : user.email ? ' (not verified)' : ''), email,
    btn('Change', () => save({ email: email.value.trim(), currentPassword: curPw.value }, 'Check your inbox to verify the new address.')));
  if (user.email && !user.emailVerified)
    row('Verification', btn('Resend verification email', async () => { const r = await TF.api('/auth/resend-verification', { method: 'POST' }); TF.setMsg(status, r.ok ? r.data.message : r.error.message, r.ok ? 'ok' : 'error'); }));
  const newPw = input('password', user.hasPassword ? 'New password' : 'Create a password', 'new-password');
  row('Password', curPw, newPw, btn(user.hasPassword ? 'Change' : 'Set password', async () => {
    const r = await TF.api('/me/password', { method: 'POST', body: { currentPassword: curPw.value, newPassword: newPw.value } });
    TF.setMsg(status, r.ok ? 'Password updated. Other devices were logged out.' : r.error.message, r.ok ? 'ok' : 'error'); if (r.ok) { curPw.value = newPw.value = ''; }
  }));
  const pub = document.createElement('a'); pub.href = '/u/' + encodeURIComponent(user.username); pub.textContent = 'View public profile'; pub.style.color = '#60a5fa';
  row('Profile', pub, btn('Log out', () => TF.logout()));
  const delPw = input('password', user.hasPassword ? 'Password to confirm' : 'Type DELETE', 'current-password');
  row('Delete account', delPw, btn('Delete forever', async () => {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    if (!user.hasPassword && delPw.value !== 'DELETE') return TF.setMsg(status, 'Type DELETE to confirm.', 'error');
    const r = await TF.api('/me', { method: 'DELETE', body: { currentPassword: delPw.value } });
    if (r.ok) location.href = '/'; else TF.setMsg(status, r.error.message, 'error');
  }));
  const anchor = document.querySelector('.container .section:last-of-type');
  anchor.parentNode.insertBefore(sec, anchor.nextSibling);
})();
