// Tiny client for the tyler.fun account API. No tokens are ever visible to JS – the session lives in an HttpOnly cookie.
(function () {
  async function api(path, { method = 'GET', body } = {}) {
    const init = { method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET') { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body || {}); }
    let res, data = null;
    try { res = await fetch('/api' + path, init); data = await res.json(); } catch (e) { /* network or non-JSON */ }
    return { ok: !!(res && res.ok && data && data.ok), status: res ? res.status : 0, data, error: (data && data.error) || { message: 'Network error. Please try again.' } };
  }

  // ---- Cloudflare Turnstile (only active when a site key is configured) ----
  let tsWidget = null;
  function initTurnstile(el) {
    const key = window.TF_CONFIG && window.TF_CONFIG.turnstileSiteKey;
    if (!key || !el) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => { tsWidget = window.turnstile.render(el, { sitekey: key, theme: 'dark' }); };
    document.head.appendChild(s);
  }
  const turnstileToken = () => (tsWidget !== null && window.turnstile ? window.turnstile.getResponse(tsWidget) : undefined);
  const turnstileReset = () => { if (tsWidget !== null && window.turnstile) window.turnstile.reset(tsWidget); };

  function setMsg(el, text, kind) {         // textContent only – never innerHTML
    if (!el) return;
    el.textContent = text || '';
    el.className = 'msg ' + (kind || '');
    el.style.display = text ? 'block' : 'none';
  }

  const ERRORS = { oauth_state: 'GitHub sign-in expired. Please try again.', oauth_token: 'GitHub sign-in failed. Please try again.', oauth_user: 'Couldn’t read your GitHub profile.', banned: 'This account has been banned.', claim_invalid: 'That claim link is invalid, expired or already used. Ask the owner for a new one.', claim_conflict: 'That GitHub account already has a tyler-fun account. Delete it in Settings first (or use a different GitHub account), then use the claim link again.', server_error: 'Something went wrong. Please try again.' };
  const urlError = () => ERRORS[new URLSearchParams(location.search).get('error')] || '';

  window.TF = {
    api, setMsg, initTurnstile, turnstileToken, turnstileReset, urlError,
    me: async () => { const r = await api('/me'); return r.ok ? r.data.user : null; },
    logout: async () => { await api('/auth/logout', { method: 'POST' }); location.href = '/'; },
    ICONS: { tyler: 'tylerpfp.png', fish: 'fish-badge.png', tawsif: 'tawsif-badge.png', admin: 'admin-badge.png', staff: 'staff-badge.png', verified: 'verified-badge.png', email_verified: 'email-verified-badge.png', member: 'member-badge.png', banned: 'banned-badge.png' },
  };
})();
