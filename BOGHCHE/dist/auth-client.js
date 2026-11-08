/* No authentication backend exists in this static demo.
 * Enable only after a server implements the documented cookie/CSRF contract.
 * Credentials are passed directly to fetch; never persist passwords or tokens.
 */
const BOGHCHE_AUTH_ENABLED = false;
const AuthClient = Object.freeze({
  enabled: BOGHCHE_AUTH_ENABLED,
  async request(action, payload = {}) {
    if (!this.enabled) throw new Error('AUTH_NOT_CONFIGURED');
    const paths = {login:'login',signup:'signup',forgot:'password-reset',session:'session'};
    if (!Object.hasOwn(paths, action)) throw new Error('INVALID_ACTION');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const options = {method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}};
      if (action !== 'session') {
        const csrfResponse = await fetch('/api/auth/csrf', options);
        if (!csrfResponse.ok) throw new Error('REQUEST_FAILED');
        const csrf = await csrfResponse.json();
        if (typeof csrf.token !== 'string' || !csrf.token) throw new Error('INVALID_RESPONSE');
        Object.assign(options, {method:'POST',headers:{...options.headers,'Content-Type':'application/json','X-CSRF-Token':csrf.token},body:JSON.stringify(payload)});
      }
      const response = await fetch('/api/auth/'+paths[action], options);
      if (!response.ok) {
        const error = new Error(response.status === 429 ? 'RATE_LIMITED' : 'REQUEST_FAILED');
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      if (action !== 'forgot' && (!data.user || typeof data.user.name !== 'string' || typeof data.user.email !== 'string')) throw new Error('INVALID_RESPONSE');
      return data;
    } finally { clearTimeout(timeout); }
  }
});
// A shared theme and a non-sensitive session-change signal only; never a session token.
function followStoredTheme(event) {
  if (event && event.key !== 'boghche-theme' && event.key !== null) return;
  try { const id=location.protocol==='file:'?(new URLSearchParams(location.search).get('theme')||localStorage.getItem('boghche-theme')):localStorage.getItem('boghche-theme');document.documentElement.dataset.theme=Object.hasOwn(palettes,id)?id:'olive'; } catch {}
}
window.addEventListener('storage',followStoredTheme);
window.addEventListener('pageshow',()=>followStoredTheme());

window.addEventListener('focus',()=>followStoredTheme());
